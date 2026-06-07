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
          map.addSource('my-locations', { type: 'geojson', data: locations });
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

        ensureMarkerImage().then(() => {
          if (!mapRef.current) return;
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

        // Anchor 'bottom' keeps the label sitting above the lngLat
        // (which is the marker's tip, since icon-anchor is 'bottom').
        // A small offset lets the label overlap the upper half of the pin
        // head by ~50% — feels like a sticker on the marker rather than a
        // separate floating callout.
        const hoverPopup = new window.mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          anchor: 'bottom',
          offset: 22,
          className: 'location-hover-popup'
        });

        // Hover tooltip driven by nearest-pin lookup instead of mapbox's
        // mouseenter on the layer — the layer event reports the topmost
        // feature and never re-fires when the cursor slides onto another
        // pin that's overlapping or sitting a few pixels away. Re-resolving
        // every mousemove keeps the popup label in sync with whichever pin
        // is actually closest to the cursor.
        let hoveredId = null;
        map.on('mousemove', (e) => {
          let nearestId = null;
          let nearestCoords = null;
          let bestDist = 22 * 22;
          for (const feat of locations?.features || []) {
            const coords = feat.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length !== 2) continue;
            const p = map.project(coords);
            const dx = p.x - e.point.x;
            const dy = p.y - e.point.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) {
              bestDist = d2;
              nearestId = featureId(feat);
              nearestCoords = coords;
            }
          }

          if (nearestId !== hoveredId) {
            hoveredId = nearestId;
            if (nearestId) {
              const feat = (locations?.features || []).find(
                (f) => featureId(f) === nearestId
              );
              const name = feat?.properties?.name || 'Memory';
              map.getCanvas().style.cursor = 'pointer';
              hoverPopup.setLngLat(nearestCoords).setText(name).addTo(map);
            } else {
              map.getCanvas().style.cursor = '';
              hoverPopup.remove();
            }
          } else if (nearestCoords) {
            // Same pin still nearest — keep popup anchored to its lngLat
            // (cheap; setLngLat just updates a transform).
            hoverPopup.setLngLat(nearestCoords);
          }
        });
        map.on('mouseout', () => {
          hoveredId = null;
          hoverPopup.remove();
          map.getCanvas().style.cursor = '';
        });

        // Resolve clicks against locations.features directly. mapbox does
        // not always preserve string GeoJSON ids on queryRenderedFeatures
        // results, which made the modal silently no-op when the resolved
        // id didn't match featureId() in the React tree. Picking the
        // nearest pin within 30 px guarantees the id we set is the same
        // id selectedFeature looks up by.
        map.on('click', (e) => {
          let id = null;
          let bestDist = 30 * 30;
          for (const feat of locations?.features || []) {
            const coords = feat.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length !== 2) continue;
            const p = map.project(coords);
            const dx = p.x - e.point.x;
            const dy = p.y - e.point.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist) {
              bestDist = d2;
              id = featureId(feat);
            }
          }
          hoverPopup.remove();
          setSelectedId(id);
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

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (customHandlerCleanupRef.current) {
        customHandlerCleanupRef.current();
        customHandlerCleanupRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations]);

  // Keep the live mapbox source in sync with the React-side geojson so
  // moving a pin (admin edit) shows up immediately.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !locations) return;
    try {
      const src = map.getSource('my-locations');
      if (src && typeof src.setData === 'function') {
        src.setData(locations);
      }
    } catch {
      // ignore
    }
  }, [locations, mapReady]);

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
                      return { id, title, subtitle, feat };
                    })
                    .filter(Boolean)
                    .filter(({ title, subtitle }) => {
                      if (!needle) return true;
                      const hay = `${title || ''} ${subtitle || ''}`.toLowerCase();
                      return hay.includes(needle);
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
