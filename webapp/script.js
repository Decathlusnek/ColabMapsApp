/**
 * ColabMapsApp v2.0 - Google Maps Clone Logic
 */

let map;
let directionsService;
let directionsRenderer;
let originAutocomplete;
let destinationAutocomplete;
let debounceTimers = {};

// Custom Map Style: Silver
const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

async function initApp() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (!config.mapsApiKey) {
            console.error('Maps API Key not found.');
            document.getElementById('route-info').innerHTML = '<p style="color: red;">Error: Maps API Key not found.</p>';
            return;
        }

        loadGoogleMapsScript(config.mapsApiKey);
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

function loadGoogleMapsScript(apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -23.5505, lng: -46.6333 }, // Default to São Paulo
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: mapStyle
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false, // Set to true if we want fully custom markers for all points
        polylineOptions: {
            strokeColor: "#4285F4",
            strokeOpacity: 0.8,
            strokeWeight: 5
        }
    });

    setupSearch('origin-input');
    setupSearch('destination-input');

    // UI Listeners
    document.getElementById('route-btn').addEventListener('click', calculateRoute);
    document.getElementById('close-sidebar').addEventListener('click', () => {
        document.getElementById('info-sidebar').classList.add('hidden');
    });
    document.getElementById('locate-btn').addEventListener('click', locateUser);
}

function setupSearch(inputId) {
    const input = document.getElementById(inputId);
    input.addEventListener('input', (e) => {
        const query = e.target.value;
        if (debounceTimers[inputId]) clearTimeout(debounceTimers[inputId]);
        if (query.length < 3) return;

        debounceTimers[inputId] = setTimeout(() => {
            if (inputId === 'origin-input' && !originAutocomplete) {
                originAutocomplete = new google.maps.places.Autocomplete(input);
                originAutocomplete.bindTo('bounds', map);
            } else if (inputId === 'destination-input' && !destinationAutocomplete) {
                destinationAutocomplete = new google.maps.places.Autocomplete(input);
                destinationAutocomplete.bindTo('bounds', map);
            }
        }, 3000);
    });
}

function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                map.setCenter(pos);
                map.setZoom(15);
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: "Your Location",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    }
                });
            },
            () => {
                alert("Error: The Geolocation service failed.");
            }
        );
    } else {
        alert("Error: Your browser doesn't support geolocation.");
    }
}

function calculateRoute() {
    const origin = document.getElementById('origin-input').value;
    const destination = document.getElementById('destination-input').value;
    const bulkText = document.getElementById('bulkInput').value;

    if (!origin || !destination) {
        alert('Please enter both origin and destination.');
        return;
    }

    // Parse Waypoints from bulkInput
    const waypoints = bulkText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(address => ({ location: address, stopover: true }));

    directionsService.route(
        {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                showRouteDetails(response.routes[0]);
            } else {
                window.alert("Directions request failed due to " + status);
            }
        }
    );
}

function showRouteDetails(route) {
    const sidebar = document.getElementById('info-sidebar');
    const routeInfo = document.getElementById('route-info');
    
    let totalDistance = 0;
    let totalDuration = 0;
    let stepsHtml = '';

    route.legs.forEach((leg, index) => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
        stepsHtml += `
            <div class="leg-info">
                <h3>Leg ${index + 1}: ${leg.start_address.split(',')[0]} to ${leg.end_address.split(',')[0]}</h3>
                <p>Distance: ${leg.distance.text} | Duration: ${leg.duration.text}</p>
            </div>
        `;
    });

    const distText = (totalDistance / 1000).toFixed(1) + " km";
    const durText = Math.floor(totalDuration / 60) + " mins";

    routeInfo.innerHTML = `
        <div class="route-summary">
            <div class="stat"><strong>Total Distance:</strong> ${distText}</div>
            <div class="stat"><strong>Total Duration:</strong> ${durText}</div>
        </div>
        <div class="route-details-list">
            ${stepsHtml}
        </div>
    `;
    
    sidebar.classList.remove('hidden');
}

initApp();
