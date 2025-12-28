import React, { useEffect, useMemo, useRef, useState } from 'react';
import locationsRaw from '../data/my-locations.geojson?raw';
import { locationDetails } from '../data/locationDetails';

const markerPngUrl = new URL('../data/assets/marker.png', import.meta.url).href;

const HeroSection = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [panelMode, setPanelMode] = useState('list'); // 'list' | 'details'
  const prevSelectedIdRef = useRef(null);

  const locations = useMemo(() => {
    try {
      return JSON.parse(locationsRaw);
    } catch {
      return { type: 'FeatureCollection', features: [] };
    }
  }, []);

  const locationList = (locations?.features || [])
    .map((f) => ({
      id: f.id ?? f.properties?.id ?? f.properties?.name,
      name: f.properties?.name ?? 'Untitled',
      coordinates: f.geometry?.coordinates
    }))
    .filter((x) => x.id && Array.isArray(x.coordinates) && x.coordinates.length === 2);

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return locationList.find((l) => l.id === selectedLocationId) || null;
  }, [locationList, selectedLocationId]);

  const selectedDetails = useMemo(() => {
    if (!selectedLocationId) return null;
    return locationDetails?.[selectedLocationId] || null;
  }, [selectedLocationId]);

  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    if (typeof window === 'undefined' || !window.mapboxgl) return;

    window.mapboxgl.accessToken =
      'pk.eyJ1Ijoibm90amFja2wzIiwiYSI6ImNtY3NxOWlkaDE1YXQyanEwYWI0MjZicWYifQ.TmrkcNK6jBFrQ37uJucAAg';

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
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 1
          }
        },
        labelLayerId
      );

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
          'text-color': '#D70040',
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
          'circle-color': 'rgba(74, 144, 226, 0.25)',
          'circle-stroke-color': '#4A90E2',
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2,
            0
          ]
        }
      });
    });

    return () => {
      try {
        if (ro) ro.disconnect();
        map.remove();
      } finally {
        mapRef.current = null;
      }
    };
  }, []);

  const flyToLocation = (loc) => {
    const map = mapRef.current;
    if (!map) return;

    const prevId = prevSelectedIdRef.current;
    if (prevId != null) {
      try {
        map.setFeatureState({ source: 'my-locations', id: prevId }, { selected: false });
      } catch {
        // ignore
      }
    }

    try {
      map.setFeatureState({ source: 'my-locations', id: loc.id }, { selected: true });
      prevSelectedIdRef.current = loc.id;
      setSelectedLocationId(loc.id);
    } catch {
      // ignore
      setSelectedLocationId(loc.id);
    }

    map.flyTo({
      center: loc.coordinates,
      zoom: Math.max(map.getZoom(), 15.5),
      pitch: 45,
      duration: 1200,
      essential: true
    });
  };

  return (
    <section className="hero-section tab-content">
      <div className="map-row">
        <div className="map-container">
          <div ref={mapContainerRef} id="map" />
        </div>
        <aside className={`location-details-panel ${panelMode === 'details' ? 'expanded' : ''}`} aria-label="Location details">
          <div key={panelMode} className="panel-content-fade">
            {panelMode === 'list' ? (
              <div className="panel-view list-view">
                <div className="location-details-header">
                  <div />
                </div>
                <div className="locations-list">
                  {locationList.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      className={`location-item ${selectedLocationId === loc.id ? 'active' : ''}`}
                      onClick={() => {
                        flyToLocation(loc);
                        setPanelMode('details');
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="panel-view details-view">
                <div className="location-details-header">
                  <div>
                    <button
                      type="button"
                      className="location-back"
                      onClick={() => setPanelMode('list')}
                    >
                      back
                    </button>
                  </div>
                </div>

                <div className="location-details-body">
                  {selectedLocation ? (
                    <>
                      {selectedDetails?.subtitle ? (
                        <div className="location-selected-subtitle">{selectedDetails.subtitle}</div>
                      ) : null}

                      {selectedDetails?.description ? (
                        <p className="location-selected-description">{selectedDetails.description}</p>
                      ) : (
                        <p className="location-selected-description location-muted">
                          Add details for this location in <code>src/data/locationDetails.js</code>.
                        </p>
                      )}

                      {Array.isArray(selectedDetails?.images) && selectedDetails.images.length > 0 ? (
                        <div className="location-images">
                          {selectedDetails.images.map((src, idx) => (
                            <img
                              key={idx}
                              src={src}
                              alt={`${selectedDetails?.title || selectedLocation.name} ${idx + 1}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="location-muted" style={{ fontSize: 12 }}>
                          No images yet. Add an array of image URLs in <code>src/data/locationDetails.js</code>.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="location-muted">Select a location to see details.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="profile-section">
        <div className="avatar-container">
          <img src="https://via.placeholder.com/120x120/4A90E2/FFFFFF?text=JD" alt="Jack's Avatar" className="avatar" />
        </div>

        <h2 className="name">Jack Doe</h2>

        <p className="description">
          Full-stack developer passionate about creating innovative web solutions.
          I specialize in modern technologies and clean, efficient code.
        </p>

        <div className="skills-section">
          <h3>Skills</h3>
          <div className="skills-grid">
            <span className="skill-tag">JavaScript</span>
            <span className="skill-tag">React</span>
            <span className="skill-tag">Node.js</span>
            <span className="skill-tag">Python</span>
            <span className="skill-tag">TypeScript</span>
            <span className="skill-tag">CSS</span>
            <span className="skill-tag">HTML</span>
            <span className="skill-tag">MongoDB</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
