import React, { useEffect, useMemo, useRef, useState } from 'react';
import { locationDetails } from '../data/locationDetails';
import me from '../assets/me.jpeg';
import markerPngUrl from '../assets/marker.png';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

// markerPngUrl comes from Vite import above

const zoomBasedReveal = (maxVal) => [
  'interpolate',
  ['linear'],
  ['zoom'],
  11,
  0,
  13,
  maxVal
];

const HeroSection = ({ onMapEnter, onMemorySelect }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isResumeMenuOpen, setIsResumeMenuOpen] = useState(false);
  const resumeMenuRef = useRef(null);
  const [locations, setLocations] = useState(null);

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

  const locationList = useMemo(() => {
    return (locations?.features || [])
      .map((f) => ({
        id: f.id ?? f.properties?.id ?? f.properties?.name,
        name: f.properties?.name ?? 'Untitled',
        coordinates: f.geometry?.coordinates
      }))
      .filter((x) => x.id && Array.isArray(x.coordinates) && x.coordinates.length === 2);
  }, [locations]);

  const randomizedLocationList = useMemo(() => {
    // Randomize once per component mount (so it changes on refresh, but stays stable while browsing)
    const arr = [...locationList];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [locationList]);

  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;
    if (!locations) return;

    if (typeof window === 'undefined' || !window.mapboxgl) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      console.error(
        'Missing Mapbox token. Add VITE_MAPBOX_ACCESS_TOKEN to your .env / Vercel env vars.'
      );
      return;
    }
    window.mapboxgl.accessToken = token;

    const map = new window.mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.3958, 43.6635],
      zoom: 16,
      pitch: 45,
      antialias: true,
      config: {
        basemap: {
          showPointOfInterestLabels: false // Hides all POI icons and text
        }
      }
    });

    mapRef.current = map;

    // Keep the map visible when layout changes (e.g., mobile column layout / panel toggles)
    const containerEl = mapContainerRef.current;
    let ro;
    if (containerEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        try {
          map.resize();
        } catch {
          // ignore
        }
      });
      ro.observe(containerEl);
    }

    map.on('load', () => {
      // Basemap configs (run once; some Mapbox versions throw if unsupported)
      try {
        map.setConfigProperty('basemap', 'showTransitLabels', false);
      } catch {
        // ignore
      }

      const layers = mapRef.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      ).id;

      mapRef.current.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          paint: {
            'fill-extrusion-color': '#fff',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 1
          }
        },
        labelLayerId
      );

      map.setSnow({
        density: zoomBasedReveal(0.85),
        intensity: 1.0,
        'center-thinning': 0.1,
        direction: [0, 50],
        opacity: 1.0,
        color: `#ffffff`,
        'flake-size': 0.85,
        vignette: zoomBasedReveal(0.3),
        'vignette-color': `#ffffff`
      });

      // Load locations from GeoJSON 
      map.addSource('my-locations', {
        type: 'geojson',
        data: locations
      });

      const ensureRedMarker = (cb) => {
        if (map.hasImage && map.hasImage('red-marker')) return cb();

        map.loadImage(markerPngUrl, (err, image) => {
          if (!err && image) {
            try {
              map.addImage('red-marker', image);
            } catch {
              // ignore
            }
          }
          cb();
        });
      };

      ensureRedMarker(() => {
        // Marker icons
        map.addLayer({
          id: 'my-locations-points',
          type: 'symbol',
          source: 'my-locations',
          layout: {
            'icon-image': 'red-marker',
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 0.02,
              8, 0.035,
              12, 0.03,
              15.5, 0.04,
              18, 0.05
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
      });

      map.addLayer({
        id: 'my-locations-labels',
        type: 'symbol',
        source: 'my-locations',
        minzoom: 8,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 13,
          'text-anchor': 'top',
          'text-justify': 'center',
          'text-padding': 0.5,
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#1a1a1a',
          'text-halo-color': '#fff',
          'text-halo-width': 1.5
        }
      });

      map.addLayer({
        id: 'my-locations-highlight',
        type: 'circle',
        source: 'my-locations',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            10,
            0
          ],
          'circle-color': 'rgba(0, 0, 0, 0.1)',
          'circle-stroke-color': '#1a1a1a',
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2,
            0
          ]
        }
      });

      // Always-on 3D extrusions for the buildings at each pin (no zoom floor).
      // One Overpass call covers every pin; result is a small GeoJSON layer
      // that renders at any zoom, independent of Mapbox's vector tiles.
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
            'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query)
          );
          if (!resp.ok) throw new Error(`Overpass ${resp.status}`);
          data = await resp.json();
        } catch (e) {
          console.warn('Pinned-building footprints unavailable:', e);
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

        mapRef.current.addSource('pinned-buildings', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        });
        mapRef.current.addLayer(
          {
            id: 'pinned-buildings-3d',
            type: 'fill-extrusion',
            source: 'pinned-buildings',
            paint: {
              'fill-extrusion-color': '#fff',
              // Real height at z14+, then ramp the height up as you zoom out
              // so the building stays visibly tall when the camera pulls back.
              // Geometrically inaccurate by design — readability over realism.
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
          labelLayerId
        );
      })();
    });

    return () => {
      try {
        if (ro) ro.disconnect();
        map.remove();
      } finally {
        mapRef.current = null;
      }
    };
  }, [locations]);

  useEffect(() => {
    if (!isResumeMenuOpen) return;

    const onPointerDown = (e) => {
      const menuEl = resumeMenuRef.current;
      if (menuEl && !menuEl.contains(e.target)) setIsResumeMenuOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsResumeMenuOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isResumeMenuOpen]);

  return (
    <section className="hero-section tab-content">
      <div className="profile-section">
        <img src={me} alt="Jack Le" className="avatar" />
        <div className="profile-intro">
          <h1 className="profile-name">
            <span style={{ color: 'var(--primary-accent)' }}>Hey, I'm Jack Le</span>
          </h1>
          <h2 className="profile-role">I am a fullstack engineer ☺️</h2>
          <p className="profile-desc">
            - I am currently on a hackathon streak, competed in 12 hackathons in a row in 2026, won 7 of them. I also founded, organized, and judged at hackathons.
          </p>
          <div className="profile-contact">
            <button
              type="button"
              className="outline-button resume resume-trigger"
              aria-haspopup="dialog"
              aria-expanded={isResumeMenuOpen}
              onClick={() => setIsResumeMenuOpen((v) => !v)}
            >
              resume.pdf
            </button>
            <a href="https://github.com/notjackl3" target="_blank" rel="noopener noreferrer" title="GitHub" className="outline-button">
              <FaGithub size={24} />
            </a>
            <a href="https://www.linkedin.com/in/huu-an-duc-le/" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="outline-button">
              <FaLinkedin size={24} />
            </a>
          </div>
        </div>
      </div>

      {isResumeMenuOpen ? (
        <div className="resume-overlay" role="presentation">
          <div className="resume-menu" role="dialog" aria-label="Choose a resume" ref={resumeMenuRef}>
            <div className="resume-menu-options">
              <a className="resume-option" href="/jack-le-fullstack-resume.pdf" target="_blank" rel="noopener noreferrer">
                fullstack
              </a>
              {/* <a className="resume-option" href="/jack-le-backend-resume.pdf" target="_blank" rel="noopener noreferrer">
                backend
              </a>
              <a className="resume-option" href="/jack-le-mobile-resume.pdf" target="_blank" rel="noopener noreferrer">
                mobile
              </a>
              <a className="resume-option" href="/jack-le-cloud-resume.pdf" target="_blank" rel="noopener noreferrer">
                cloud
              </a>
              <a className="resume-option" href="/jack-le-data-resume.pdf" target="_blank" rel="noopener noreferrer">
                analyst
              </a> */}
            </div>
          </div>
        </div>
      ) : null}

      <div className="map-row">
        <div className="map-container map-container--preview">
          <div ref={mapContainerRef} id="map" />
          <button
            type="button"
            className="map-enter-overlay"
            onClick={() => onMapEnter?.()}
            aria-label="Open the fullscreen map view"
          >
            <span className="map-enter-label">Click to view</span>
          </button>
        </div>
        <aside className="location-details-panel" aria-label="Memory list">
          <div className="panel-content-fade">
            <div className="panel-view list-view">
              <div className="location-details-header">
                <div />
              </div>
              <div className="locations-list">
                {randomizedLocationList.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className={`location-item ${selectedLocationId === loc.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedLocationId(loc.id);
                      onMemorySelect?.(loc.id);
                    }}
                  >
                    {locationDetails?.[loc.id]?.title || loc.name || 'Untitled'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>
        Feel free to select one of my memories
      </p>
    </section>
  );
};

export default HeroSection;
