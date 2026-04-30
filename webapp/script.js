
    // map, geocoder, markers are now global, defined in index.html,
    // and initialized by initMap which is also defined in index.html

    // Helper functions (addMarker, clearMarkers) remain in script.js
    function addMarker(location, title, animation) {
        const marker = new google.maps.Marker({
            map: map, // Use the global map
            position: location,
            title: title,
            animation: animation || google.maps.Animation.DROP, // Apply default inside the function
        });
        markers.push(marker); // Use the global markers array
        return marker;
    }

    function clearMarkers() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }

    // Event listeners should be set up only after the DOM is fully loaded and map is initialized
    document.addEventListener('mapinit', () => {
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
                alert('Error: Your browser does not support Geolocation.');
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
                        }
                    } else {
                        alert('No addresses could be resolved.');
                    }
                });
            });
        });
    });

    console.log('ColabMapsApp frontend script loaded.');
