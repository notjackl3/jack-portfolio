// Mapbox 3D Map Integration
// Note: You'll need to replace 'YOUR_MAPBOX_ACCESS_TOKEN' with your actual Mapbox access token
// Get one at: https://account.mapbox.com/access-tokens/

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-74.006, 40.7128], // New York City coordinates
    zoom: 10,
    pitch: 45, // 3D tilt
    bearing: -17.6, // 3D rotation
    antialias: true
});

// Add 3D buildings layer
map.on('load', function() {
    // Add a custom 3D buildings layer
    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',
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
            'fill-extrusion-opacity': 0.6
        }
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());

    // Add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl());

    // Add a marker at the center
    const marker = new mapboxgl.Marker({
        color: '#4A90E2'
    })
    .setLngLat([-74.006, 40.7128])
    .addTo(map);
});

// Add smooth transitions and interactions
map.on('style.load', function() {
    // Enable 3D terrain if available
    map.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 1.5
    });

    // Add sky layer for better 3D effect
    map.setFog({
        'color': 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
    });
});

// Handle window resize
window.addEventListener('resize', function() {
    map.resize();
});

// Optional: Add click interaction to fly to different locations
map.on('click', function(e) {
    // You can add custom click interactions here
    console.log('Map clicked at:', e.lngLat);
});
