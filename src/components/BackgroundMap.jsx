import React, { useEffect, useMemo, useRef, useState } from 'react';
import initialDetails from '../data/locationDetails.json';
import { buildLocationDetails } from '../data/locationDetails';
import markerPngUrl from '../assets/marker.png';

const TORONTO_CENTER = [-79.3832, 43.6532];
const SPIN_DEG_PER_SEC = 4;
const DEFAULT_DETAIL = { title: '', subtitle: '', description: '', images: [] };

const isAdminHost = () => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
};

const featureId = (f) => f?.id ?? f?.properties?.id ?? f?.properties?.name;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BackgroundMap = ({ isFocused, focusRequest }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const rafRef = useRef(null);
  const spinPausedRef = useRef(false);
  const detailsSaveTimerRef = useRef(null);
  const geojsonSaveTimerRef = useRef(null);
  const customHandlerCleanupRef = useRef(null);

  const [locations, setLocations] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  // The base entries (sans static-image merging) — what we persist to disk.
  const [detailsRaw, setDetailsRaw] = useState(() => initialDetails || {});
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState('move'); // 'move' | 'rotate' | 'zoom'
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > 768;
  });
  const [addressQuery, setAddressQuery] = useState('');
  const [addressStatus, setAddressStatus] = useState(null);
  const [previewAsVisitor, setPreviewAsVisitor] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState('');

  const isAdmin = useMemo(isAdminHost, []);
  const mergedDetails = useMemo(() => buildLocationDetails(detailsRaw), [detailsRaw]);

  // Stable random rank per feature id, computed once per mount. Used to
  // shuffle the sidebar list while still keeping a consistent order as
  // the user types in the search box or edits titles. Re-shuffles only
  // when the underlying feature set actually changes (pin add/remove).
  const randomRank = useMemo(() => {
    const ids = (locations?.features || [])
      .map((f) => featureId(f))
      .filter(Boolean);
    const ranks = new Map();
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.forEach((id, idx) => ranks.set(id, idx));
    return ranks;
  }, [locations]);

  // Bake the edited title into each feature's properties so the on-map
  // label expression (`get title`) reflects sidebar edits in real time
  // instead of staying pinned to the GeoJSON's `name`.
  const labeledLocations = useMemo(() => {
    if (!locations) return locations;
    const features = (locations.features || []).map((f) => {
      const id = featureId(f);
      const title = id ? mergedDetails?.[id]?.title : null;
      if (!title) return f;
      return {
        ...f,
        properties: { ...(f.properties || {}), title }
      };
    });
    return { ...locations, features };
  }, [locations, mergedDetails]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/my-locations.geojson', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) setLocations(json);
      } catch {
        if (!cancelled) setLocations({ type: 'FeatureCollection', features: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) return;
    if (!containerRef.current) return;
    if (!locations) return;
    if (typeof window === 'undefined' || !window.mapboxgl) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;
    window.mapboxgl.accessToken = token;

    const map = new window.mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: TORONTO_CENTER,
      zoom: 15.2,
      pitch: 60,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      antialias: true,
      config: {
        basemap: {
          showPointOfInterestLabels: false,
          showTransitLabels: false
        }
      }
    });
    mapRef.current = map;

    map.on('load', () => {
      try {
        const layers = map.getStyle().layers || [];
        const labelLayer = layers.find(
          (l) => l.type === 'symbol' && l.layout?.['text-field']
        );
        const beforeId = labelLayer?.id;

        // streets-v12 ignores the basemap.showPointOfInterestLabels config,
        // so hide POI / transit symbol layers ourselves to declutter the map.
        const isClutterLayer = (l) => {
          if (l.type !== 'symbol') return false;
          const id = (l.id || '').toLowerCase();
          const src = (l['source-layer'] || '').toLowerCase();
          return (
            id.includes('poi') ||
            id.includes('transit') ||
            id.includes('airport') ||
            src.includes('poi') ||
            src.includes('transit')
          );
        };
        for (const l of layers) {
          if (!isClutterLayer(l)) continue;
          try {
            map.setLayoutProperty(l.id, 'visibility', 'none');
          } catch {
            // ignore
          }
        }

        map.addLayer(
          {
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            type: 'fill-extrusion',
            paint: {
              'fill-extrusion-color': '#fff',
              'fill-extrusion-height': ['coalesce', ['get', 'height'], 12],
              'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
              'fill-extrusion-opacity': 0.9
            }
          },
          beforeId
        );

        if (!map.getSource('my-locations')) {
          map.addSource('my-locations', { type: 'geojson', data: labeledLocations });
        }

        // Pill-shaped light-red background, rendered to canvas with hard
        // edges then registered as a stretchable image so icon-text-fit
        // can scale the middle of the pill around each label without
        // distorting the rounded ends.
        if (!map.hasImage?.('label-bg')) {
          try {
            const radius = 16;
            const w = radius * 2 + 4;
            const h = radius * 2;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fddce0';
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(w - radius, 0);
            ctx.arcTo(w, 0, w, radius, radius);
            ctx.lineTo(w, h - radius);
            ctx.arcTo(w, h, w - radius, h, radius);
            ctx.lineTo(radius, h);
            ctx.arcTo(0, h, 0, h - radius, radius);
            ctx.lineTo(0, radius);
            ctx.arcTo(0, 0, radius, 0, radius);
            ctx.closePath();
            ctx.fill();
            const pixels = ctx.getImageData(0, 0, w, h);
            map.addImage(
              'label-bg',
              { width: w, height: h, data: new Uint8Array(pixels.data.buffer) },
              {
                stretchX: [[radius, w - radius]],
                stretchY: [[radius - 1, h - radius + 1]],
                content: [radius / 2, 2, w - radius / 2, h - 2],
                pixelRatio: 2
              }
            );
          } catch {
            // ignore
          }
        }

        const ensureMarkerImage = () =>
          new Promise((resolve) => {
            if (map.hasImage?.('memory-marker')) return resolve();
            map.loadImage(markerPngUrl, (err, image) => {
              if (!err && image && !map.hasImage('memory-marker')) {
                try {
                  map.addImage('memory-marker', image);
                } catch {
                  // ignore
                }
              }
              resolve();
            });
          });

        if (!mapRef.current.getLayer('my-locations-highlight')) {
          mapRef.current.addLayer({
            id: 'my-locations-highlight',
            type: 'circle',
            source: 'my-locations',
            filter: ['==', ['id'], '__none__'],
            paint: {
              'circle-radius': 18,
              'circle-color': 'rgba(229, 57, 70, 0.12)',
              'circle-stroke-color': '#e53946',
              'circle-stroke-width': 2
            }
          });
        }

        // Labels go in their own layer so they render even if the marker
        // PNG hasn't loaded yet (the icon layer is added inside the
        // loadImage callback below; coupling text to it meant a slow or
        // failed image load left the map label-less).
        if (!mapRef.current.getLayer('my-locations-labels')) {
          mapRef.current.addLayer({
            id: 'my-locations-labels',
            type: 'symbol',
            source: 'my-locations',
            layout: {
              'text-field': ['coalesce', ['get', 'title'], ['get', 'name'], ''],
              'text-size': 13,
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-anchor': 'bottom',
              'text-offset': [
                'interpolate', ['linear'], ['zoom'],
                6, ['literal', [0, -1.6]],
                10, ['literal', [0, -2.2]],
                14, ['literal', [0, -3.6]],
                18, ['literal', [0, -5]]
              ],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'icon-image': 'label-bg',
              'icon-text-fit': 'both',
              'icon-text-fit-padding': [1, 5, 1, 5],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true
            },
            paint: {
              'text-color': '#7a0d18'
            }
          });
        }

        ensureMarkerImage().then(() => {
          if (!mapRef.current) return;
          if (!mapRef.current.getLayer('my-locations-points')) {
            mapRef.current.addLayer({
              id: 'my-locations-points',
              type: 'symbol',
              source: 'my-locations',
              layout: {
                'icon-image': 'memory-marker',
                'icon-size': [
                  'interpolate', ['linear'], ['zoom'],
                  3, 0.018,
                  8, 0.028,
                  14, 0.04,
                  18, 0.06
                ],
                'icon-anchor': 'bottom',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
              }
            });
          }
        });

        // Hit-test the actual rendered pin + label pixels first (gives
        // a perfect hover/click target whether the cursor is on the
        // pin head, the label, or the bottom tip). Fall back to a
        // nearest-pin lookup whose center is shifted upward — the
        // lngLat sits at the pin tip (icon-anchor: 'bottom') so the
        // visual center of the pin is ~24 px above it.
        const HIT_LAYERS = ['my-locations-points', 'my-locations-labels'];
        const resolveIdAt = (point) => {
          const layers = HIT_LAYERS.filter((l) => mapRef.current?.getLayer(l));
          if (layers.length) {
            const hits = map.queryRenderedFeatures(point, { layers });
            const hitName = hits?.[0]?.properties?.name;
            if (hitName) {
              const match = (locations?.features || []).find(
                (f) => f.properties?.name === hitName
              );
              if (match) return featureId(match);
            }
          }
          let id = null;
          let bestDist = 40 * 40;
          for (const feat of locations?.features || []) {
            const coords = feat.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length !== 2) continue;
            const p = map.project(coords);
            const dx = p.x - point.x;
            const dy = p.y - 24 - point.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) {
              bestDist = d2;
              id = featureId(feat);
            }
          }
          return id;
        };

        let hovered = false;
        map.on('mousemove', (e) => {
          const overPin = !!resolveIdAt(e.point);
          if (overPin !== hovered) {
            hovered = overPin;
            map.getCanvas().style.cursor = overPin ? 'pointer' : '';
          }
        });
        map.on('mouseout', () => {
          hovered = false;
          map.getCanvas().style.cursor = '';
        });

        map.on('click', (e) => {
          setSelectedId(resolveIdAt(e.point));
        });

        (async () => {
          const pinCoords = (locations?.features || [])
            .map((f) => f.geometry?.coordinates)
            .filter((c) => Array.isArray(c) && c.length === 2);
          if (pinCoords.length === 0) return;

          const query = `[out:json][timeout:25];(${pinCoords
            .map(([lng, lat]) => `way(around:25,${lat},${lng})["building"];`)
            .join('')});out body;>;out skel qt;`;

          let data;
          try {
            const resp = await fetch(
              'https://overpass-api.de/api/interpreter?data=' +
                encodeURIComponent(query)
            );
            if (!resp.ok) throw new Error(`Overpass ${resp.status}`);
            data = await resp.json();
          } catch (e) {
            console.warn('Pinned-building footprints unavailable on background map:', e);
            return;
          }

          const nodeCoords = new Map();
          for (const el of data.elements) {
            if (el.type === 'node') nodeCoords.set(el.id, [el.lon, el.lat]);
          }

          const features = [];
          for (const el of data.elements) {
            if (el.type !== 'way' || !el.tags?.building) continue;
            const ring = el.nodes
              .map((id) => nodeCoords.get(id))
              .filter((c) => Array.isArray(c));
            if (ring.length < 3) continue;
            const [fx, fy] = ring[0];
            const [lx, ly] = ring[ring.length - 1];
            if (fx !== lx || fy !== ly) ring.push(ring[0]);

            let height = parseFloat(el.tags.height);
            if (!Number.isFinite(height) && el.tags['building:levels']) {
              const levels = parseFloat(el.tags['building:levels']);
              if (Number.isFinite(levels) && levels > 0) height = levels * 3.5;
            }
            if (!Number.isFinite(height) || height <= 0) height = 12;
            const minHeight = parseFloat(el.tags.min_height) || 0;

            features.push({
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [ring] },
              properties: { height, min_height: minHeight }
            });
          }

          if (!mapRef.current || features.length === 0) return;

          if (!mapRef.current.getSource('pinned-buildings')) {
            mapRef.current.addSource('pinned-buildings', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features }
            });
          }
          if (!mapRef.current.getLayer('pinned-buildings-3d')) {
            mapRef.current.addLayer(
              {
                id: 'pinned-buildings-3d',
                type: 'fill-extrusion',
                source: 'pinned-buildings',
                paint: {
                  'fill-extrusion-color': '#fff',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14, ['get', 'height'],
                    10, ['*', ['get', 'height'], 6],
                    6, ['*', ['get', 'height'], 20]
                  ],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': 1
                }
              },
              beforeId
            );
          }
        })();
      } catch {
        // ignore
      }

      setMapReady(true);

      let last = performance.now();
      const tick = (t) => {
        const dt = t - last;
        last = t;
        const m = mapRef.current;
        if (m && !spinPausedRef.current) {
          const next = (m.getBearing() + (SPIN_DEG_PER_SEC * dt) / 1000) % 360;
          m.setBearing(next);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    });

    // No cleanup tied to [locations]: editing a pin's coordinates calls
    // setLocations, which would otherwise trigger this effect's cleanup,
    // remove the map, then re-create it at TORONTO_CENTER — that's the
    // "everything resets and freezes" the user was hitting. Live
    // geojson updates flow through the source-sync effect below instead.
    // True unmount cleanup lives in the empty-deps effect underneath.
  }, [locations]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (customHandlerCleanupRef.current) {
        customHandlerCleanupRef.current();
        customHandlerCleanupRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    },
    []
  );

  // Keep the live mapbox source in sync with the React-side geojson so
  // moving a pin or renaming a memory (admin edit) shows up immediately.
  // Uses labeledLocations so the on-map text-field picks up edited titles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !labeledLocations) return;
    try {
      const src = map.getSource('my-locations');
      if (src && typeof src.setData === 'function') {
        src.setData(labeledLocations);
      }
    } catch {
      // ignore
    }
  }, [labeledLocations, mapReady]);

  // Focus on/off toggles which handlers are live. Mode (move/rotate/zoom)
  // then layers on top — see the next effect.
  useEffect(() => {
    spinPausedRef.current = isFocused;
    const map = mapRef.current;
    if (!map) return;
    const handlers = [
      'boxZoom',
      'dragRotate',
      'dragPan',
      'scrollZoom',
      'touchZoomRotate',
      'keyboard',
      'doubleClickZoom'
    ];
    for (const h of handlers) {
      const ctrl = map[h];
      if (!ctrl) continue;
      try {
        if (isFocused) ctrl.enable();
        else ctrl.disable();
      } catch {
        // ignore
      }
    }
  }, [isFocused]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isFocused) {
      if (customHandlerCleanupRef.current) {
        customHandlerCleanupRef.current();
        customHandlerCleanupRef.current = null;
      }
      return;
    }

    if (customHandlerCleanupRef.current) {
      customHandlerCleanupRef.current();
      customHandlerCleanupRef.current = null;
    }

    try {
      map.scrollZoom?.enable();
      map.touchZoomRotate?.enable();
    } catch {
      // ignore
    }

    if (mode === 'move') {
      try {
        map.dragPan?.enable();
      } catch {
        // ignore
      }
      return;
    }

    try {
      map.dragPan?.disable();
    } catch {
      // ignore
    }

    const canvas = map.getCanvasContainer();
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startBearing = 0;
    let startZoom = 0;

    const onDown = (e) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startBearing = map.getBearing();
      startZoom = map.getZoom();
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      if (mode === 'rotate') {
        const dx = e.clientX - startX;
        map.setBearing(startBearing + dx * 0.45);
      } else if (mode === 'zoom') {
        const dy = e.clientY - startY;
        map.setZoom(Math.max(0, Math.min(22, startZoom - dy * 0.01)));
      }
    };
    const onUp = () => {
      dragging = false;
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    customHandlerCleanupRef.current = () => {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isFocused, mode]);

  useEffect(() => {
    if (!isFocused) setMode('move');
  }, [isFocused]);

  // React to an explicit focus request from the parent (e.g. clicking a
  // memory in the side panel). Fly to it + open its modal.
  useEffect(() => {
    if (!mapReady || !focusRequest) return;
    const map = mapRef.current;
    if (!map) return;
    const feat = locations?.features?.find(
      (f) => featureId(f) === focusRequest.id
    );
    const coords = feat?.geometry?.coordinates;
    if (!Array.isArray(coords)) return;
    try {
      map.flyTo({
        center: coords,
        zoom: 17,
        pitch: 60,
        duration: 1600,
        essential: true
      });
    } catch {
      // ignore
    }
    setSelectedId(focusRequest.id);
  }, [focusRequest, mapReady, locations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      if (!map.getLayer('my-locations-highlight')) return;
      map.setFilter(
        'my-locations-highlight',
        selectedId ? ['==', ['id'], selectedId] : ['==', ['id'], '__none__']
      );
    } catch {
      // ignore
    }
  }, [selectedId, mapReady]);

  useEffect(() => {
    if (!selectedId) return;
    setAddressQuery('');
    setAddressStatus(null);
    setPreviewAsVisitor(false);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [selectedId]);

  const persistDetails = (next) => {
    if (!isAdmin) return;
    clearTimeout(detailsSaveTimerRef.current);
    detailsSaveTimerRef.current = setTimeout(() => {
      fetch('/__location-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      }).catch(() => {});
    }, 400);
  };

  const persistGeojson = (next) => {
    if (!isAdmin) return;
    clearTimeout(geojsonSaveTimerRef.current);
    geojsonSaveTimerRef.current = setTimeout(() => {
      fetch('/__locations-geojson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      }).catch(() => {});
    }, 400);
  };

  const updateDetailField = (id, field, value) => {
    setDetailsRaw((prev) => {
      const current = prev[id] || DEFAULT_DETAIL;
      const next = {
        ...prev,
        [id]: { ...DEFAULT_DETAIL, ...current, [field]: value }
      };
      persistDetails(next);
      return next;
    });
  };

  const addImageToDetails = (id, src) => {
    setDetailsRaw((prev) => {
      const current = prev[id] || DEFAULT_DETAIL;
      const images = Array.isArray(current.images) ? current.images : [];
      const next = {
        ...prev,
        [id]: { ...DEFAULT_DETAIL, ...current, images: [...images, src] }
      };
      persistDetails(next);
      return next;
    });
  };

  const removeImageFromDetails = (id, src) => {
    setDetailsRaw((prev) => {
      const current = prev[id] || DEFAULT_DETAIL;
      const images = Array.isArray(current.images) ? current.images : [];
      const next = {
        ...prev,
        [id]: {
          ...DEFAULT_DETAIL,
          ...current,
          images: images.filter((s) => s !== src)
        }
      };
      persistDetails(next);
      return next;
    });
  };

  const handleImageUpload = async (id, files) => {
    if (!isAdmin || !files?.length) return;
    for (const file of Array.from(files)) {
      try {
        const data = await fileToBase64(file);
        const res = await fetch('/__location-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, data })
        });
        if (!res.ok) continue;
        const json = await res.json();
        if (json?.src) addImageToDetails(id, json.src);
      } catch {
        // skip failed upload
      }
    }
  };

  const deleteLocation = (id) => {
    if (!isAdmin || !id) return;
    const name =
      detailsRaw[id]?.title ||
      locations?.features?.find((f) => featureId(f) === id)?.properties?.name ||
      id;
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        `Delete “${name}”? This removes the marker from the map and clears its content. This change is saved to disk.`
      );
      if (!ok) return;
    }
    setLocations((prev) => {
      if (!prev) return prev;
      const features = (prev.features || []).filter((f) => featureId(f) !== id);
      const next = { ...prev, features };
      persistGeojson(next);
      return next;
    });
    setDetailsRaw((prev) => {
      if (!(id in (prev || {}))) return prev;
      const next = { ...prev };
      delete next[id];
      persistDetails(next);
      return next;
    });
    setSelectedId(null);
  };

  const updateCoordinates = (id, lng, lat) => {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    setLocations((prev) => {
      if (!prev) return prev;
      const features = (prev.features || []).map((f) => {
        if (featureId(f) !== id) return f;
        return {
          ...f,
          geometry: { ...(f.geometry || {}), type: 'Point', coordinates: [lng, lat] }
        };
      });
      const next = { ...prev, features };
      persistGeojson(next);
      return next;
    });
  };

  const lookupAddress = async (id, query) => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const q = query?.trim();
    if (!token || !q) {
      setAddressStatus({ kind: 'error', message: 'Enter an address to search.' });
      return;
    }
    setAddressStatus({ kind: 'loading', message: 'Searching…' });
    try {
      const url =
        'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
        encodeURIComponent(q) +
        '.json?limit=1&access_token=' +
        encodeURIComponent(token);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const feature = json?.features?.[0];
      const coords = feature?.center;
      if (!Array.isArray(coords) || coords.length < 2) {
        setAddressStatus({ kind: 'error', message: 'No match found.' });
        return;
      }
      const [lng, lat] = coords;
      updateCoordinates(id, lng, lat);
      const map = mapRef.current;
      if (map) {
        try {
          map.flyTo({ center: [lng, lat], zoom: 17, pitch: 60, duration: 1200, essential: true });
        } catch {
          // ignore
        }
      }
      setAddressStatus({
        kind: 'success',
        message: feature.place_name || 'Marker moved.'
      });
    } catch (err) {
      setAddressStatus({ kind: 'error', message: `Lookup failed: ${err.message}` });
    }
  };

  const selectedFeature = locations?.features?.find(
    (f) => featureId(f) === selectedId
  );
  const selectedDetails = selectedId ? mergedDetails?.[selectedId] : null;
  const selectedRawDetails = selectedId
    ? detailsRaw[selectedId] || DEFAULT_DETAIL
    : null;
  const selectedCoords = selectedFeature?.geometry?.coordinates;
  const shouldShowModal = isFocused && selectedId && selectedFeature;

  const focusOnLocationLocal = (id) => {
    const map = mapRef.current;
    if (!map) return;
    const feat = locations?.features?.find((f) => featureId(f) === id);
    const coords = feat?.geometry?.coordinates;
    if (!Array.isArray(coords)) return;
    try {
      map.flyTo({ center: coords, zoom: 17, pitch: 60, duration: 1600, essential: true });
    } catch {
      // ignore
    }
    setSelectedId(id);
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const modeOptions = [
    { id: 'move', label: 'Move' },
    { id: 'rotate', label: 'Rotate' },
    { id: 'zoom', label: 'Zoom' }
  ];

  return (
    <div
      className={`background-map background-map--mode-${mode}${
        isFocused ? ' background-map--focused' : ''
      }`}
      aria-hidden={!isFocused}
    >
      <div ref={containerRef} className="background-map__canvas" />
      {isFocused ? (
        <div className="map-mode-toolbar" role="toolbar" aria-label="Map interaction mode">
          {modeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`map-mode-toolbar__btn${
                mode === opt.id ? ' is-active' : ''
              }`}
              onClick={() => setMode(opt.id)}
              aria-pressed={mode === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
      {isFocused ? (
        <aside
          className={`map-locations-sidebar${isSidebarOpen ? ' is-open' : ''}`}
          aria-label="All memories"
        >
          <button
            type="button"
            className="map-locations-sidebar__toggle"
            onClick={() => setIsSidebarOpen((v) => !v)}
            aria-expanded={isSidebarOpen}
            aria-label={isSidebarOpen ? 'Collapse memories list' : 'Open memories list'}
          >
            <span className="map-locations-sidebar__toggle-icon" aria-hidden="true">
              {isSidebarOpen ? '×' : '☰'}
            </span>
            {!isSidebarOpen ? (
              <span className="map-locations-sidebar__toggle-label">Memories</span>
            ) : null}
          </button>
          {isSidebarOpen ? (
            <>
              <div className="map-locations-sidebar__title">Memories</div>
              <div className="map-locations-sidebar__search">
                <input
                  type="search"
                  className="map-locations-sidebar__search-input"
                  value={sidebarQuery}
                  onChange={(e) => setSidebarQuery(e.target.value)}
                  placeholder="Search memories…"
                  aria-label="Search memories"
                />
                {sidebarQuery ? (
                  <button
                    type="button"
                    className="map-locations-sidebar__search-clear"
                    onClick={() => setSidebarQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="map-locations-sidebar__list">
                {(() => {
                  const needle = sidebarQuery.trim().toLowerCase();
                  const items = (locations?.features || [])
                    .map((feat) => {
                      const id = featureId(feat);
                      if (!id) return null;
                      const title =
                        mergedDetails?.[id]?.title || feat.properties?.name || id;
                      const subtitle =
                        mergedDetails?.[id]?.subtitle || feat.properties?.name;
                      const pinned = `${title || ''} ${subtitle || ''}`.includes(
                        '👍'
                      );
                      return { id, title, subtitle, feat, pinned };
                    })
                    .filter(Boolean)
                    .filter(({ title, subtitle }) => {
                      if (!needle) return true;
                      const hay = `${title || ''} ${subtitle || ''}`.toLowerCase();
                      return hay.includes(needle);
                    })
                    .sort((a, b) => {
                      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                      return (
                        (randomRank.get(a.id) ?? 0) - (randomRank.get(b.id) ?? 0)
                      );
                    });

                  if (items.length === 0) {
                    return (
                      <div className="map-locations-sidebar__empty">
                        No memories match “{sidebarQuery}”.
                      </div>
                    );
                  }

                  return items.map(({ id, title, subtitle }) => {
                    const isActive = selectedId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`map-locations-sidebar__item${
                          isActive ? ' is-active' : ''
                        }`}
                        onClick={() => focusOnLocationLocal(id)}
                      >
                        <span className="map-locations-sidebar__item-title">{title}</span>
                        {subtitle && subtitle !== title ? (
                          <span className="map-locations-sidebar__item-subtitle">
                            {subtitle}
                          </span>
                        ) : null}
                      </button>
                    );
                  });
                })()}
              </div>
            </>
          ) : null}
        </aside>
      ) : null}
      {shouldShowModal ? (
        <div
          className="location-note-modal-backdrop"
          onClick={() => setSelectedId(null)}
          role="presentation"
        >
          <div
            className={`location-note-modal${isAdmin ? ' is-admin' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              selectedDetails?.title ||
              selectedFeature.properties?.name ||
              'Memory'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="location-note-modal__close"
              onClick={() => setSelectedId(null)}
              aria-label="Close"
            >
              ×
            </button>
            {isAdmin ? (
              <button
                type="button"
                className="location-preview-toggle"
                onClick={() => setPreviewAsVisitor((v) => !v)}
                aria-pressed={previewAsVisitor}
                title={
                  previewAsVisitor
                    ? 'Switch back to the edit form'
                    : 'See what a visitor sees'
                }
              >
                {previewAsVisitor ? '✎ Back to edit' : '👁 Preview as visitor'}
              </button>
            ) : null}

            {isAdmin && !previewAsVisitor ? (
              <div className="location-edit">
                <label className="location-edit__label">
                  <span className="location-edit__label-text">Title</span>
                  <input
                    type="text"
                    className="location-edit__input"
                    value={selectedRawDetails?.title || ''}
                    onChange={(e) =>
                      updateDetailField(selectedId, 'title', e.target.value)
                    }
                    placeholder={selectedFeature.properties?.name || 'Title'}
                  />
                </label>
                <label className="location-edit__label">
                  <span className="location-edit__label-text">Subtitle</span>
                  <input
                    type="text"
                    className="location-edit__input"
                    value={selectedRawDetails?.subtitle || ''}
                    onChange={(e) =>
                      updateDetailField(selectedId, 'subtitle', e.target.value)
                    }
                    placeholder="Subtitle"
                  />
                </label>
                <label className="location-edit__label">
                  <span className="location-edit__label-text">Description</span>
                  <textarea
                    className="location-edit__textarea"
                    value={selectedRawDetails?.description || ''}
                    onChange={(e) =>
                      updateDetailField(selectedId, 'description', e.target.value)
                    }
                    rows={5}
                    placeholder="Tell the story of this memory…"
                  />
                </label>

                <div className="location-edit__section-title">Address</div>
                <div className="location-edit__address-row">
                  <input
                    type="text"
                    className="location-edit__input"
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        lookupAddress(selectedId, addressQuery);
                      }
                    }}
                    placeholder="Search an address to move the marker…"
                  />
                  <button
                    type="button"
                    className="location-edit__btn"
                    onClick={() => lookupAddress(selectedId, addressQuery)}
                  >
                    Find
                  </button>
                </div>
                {addressStatus ? (
                  <div
                    className={`location-edit__hint location-edit__hint--${addressStatus.kind}`}
                  >
                    {addressStatus.message}
                  </div>
                ) : null}
                <div className="location-edit__coords">
                  <label className="location-edit__label">
                    <span className="location-edit__label-text">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      className="location-edit__input"
                      value={Array.isArray(selectedCoords) ? selectedCoords[0] : ''}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        const lat = Array.isArray(selectedCoords)
                          ? selectedCoords[1]
                          : 0;
                        if (Number.isFinite(lng))
                          updateCoordinates(selectedId, lng, lat);
                      }}
                    />
                  </label>
                  <label className="location-edit__label">
                    <span className="location-edit__label-text">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      className="location-edit__input"
                      value={Array.isArray(selectedCoords) ? selectedCoords[1] : ''}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        const lng = Array.isArray(selectedCoords)
                          ? selectedCoords[0]
                          : 0;
                        if (Number.isFinite(lat))
                          updateCoordinates(selectedId, lng, lat);
                      }}
                    />
                  </label>
                </div>

                <div className="location-edit__section-title">Images</div>
                {Array.isArray(selectedDetails?.images) &&
                selectedDetails.images.length > 0 ? (
                  <div className="location-edit__image-grid">
                    {selectedDetails.images.map((src, idx) => {
                      const removable =
                        Array.isArray(selectedRawDetails?.images) &&
                        selectedRawDetails.images.includes(src);
                      return (
                        <div key={`${src}-${idx}`} className="location-edit__image-tile">
                          <img src={src} alt={`Memory ${idx + 1}`} />
                          {removable ? (
                            <button
                              type="button"
                              className="location-edit__image-remove"
                              onClick={() =>
                                removeImageFromDetails(selectedId, src)
                              }
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          ) : (
                            <span
                              className="location-edit__image-tag"
                              title="Bundled with the app — edit src/assets to change."
                            >
                              static
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <label className="location-edit__upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleImageUpload(selectedId, e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <span>+ Add images</span>
                </label>

                <div className="location-edit__danger">
                  <button
                    type="button"
                    className="location-edit__delete"
                    onClick={() => deleteLocation(selectedId)}
                  >
                    Delete this location
                  </button>
                </div>
                <div className="location-edit__id">id: {selectedId}</div>
              </div>
            ) : (
              <>
                <h2 className="location-note-modal__title">
                  {selectedDetails?.title ||
                    selectedFeature.properties?.name ||
                    'Memory'}
                </h2>
                {selectedDetails?.subtitle ? (
                  <div className="location-selected-subtitle">
                    {selectedDetails.subtitle}
                  </div>
                ) : null}
                {selectedDetails?.description ? (
                  <p className="location-selected-description">
                    {selectedDetails.description}
                  </p>
                ) : null}
                {Array.isArray(selectedDetails?.images) &&
                selectedDetails.images.length > 0 ? (
                  <div className="location-images">
                    {selectedDetails.images.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`${selectedDetails?.title || 'Memory'} ${idx + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BackgroundMap;
