
let map;
let geocoder;
let markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 34.0522, lng: -118.2437 }, // Default: Los Angeles
        zoom: 10,
    });
    geocoder = new google.maps.Geocoder();
    console.log('Google Map initialized.');
}

function addMarker(location, title, animation = google.maps.Animation.DROP) {
    const marker = new google.maps.Marker({
        map: map,
        position: location,
        title: title,
        animation: animation,
    });
    markers.push(marker);
    return marker;
}

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

document.getElementById('currentLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                clearMarkers();
                addMarker(pos, 'Your Current Location');
                map.setCenter(pos);
                map.setZoom(15);
                console.log('Current location resolved:', pos);
            },
            () => {
                alert('Error: The Geolocation service failed. Please enable location services and try again.');
            }
        );
    } else {
        alert('Error: Your browser doesn't support Geolocation.');
    }
});

document.getElementById('resolveBulkBtn').addEventListener('click', () => {
    const addressesInput = document.getElementById('bulkAddressInput').value;
    const addresses = addressesInput.split(/[
;]/).map(addr => addr.trim()).filter(addr => addr !== '');

    if (addresses.length === 0) {
        alert('Please enter at least one address.');
        return;
    }

    clearMarkers();
    let bounds = new google.maps.LatLngBounds();
    let geocodeCount = 0;
    let successfulGeocodes = 0;

    addresses.forEach((address, index) => {
        geocoder.geocode({ address: address }, (results, status) => {
            geocodeCount++;
            if (status === 'OK') {
                successfulGeocodes++;
                const location = results[0].geometry.location;
                addMarker(location, address);
                bounds.extend(location);
                console.log(`Address resolved: ${address}`, location);
            } else {
                console.error(`Geocode failed for address: ${address} - Status: ${status}`);
                // Optionally, add an indicator for failed addresses
            }

            if (geocodeCount === addresses.length) {
                if (successfulGeocodes > 0) {
                    map.fitBounds(bounds); // Zoom to fit all markers
                } else {
                    alert('No addresses could be resolved.');
                }
            }
        });
    });
});

console.log('ColabMapsApp frontend script loaded.');
