
    // map, geocoder, directionsService, directionsRenderer, markers, currentLocationMarkerId, nextMarkerId are global, defined in index.html

    // Helper function to add a marker to the map and track it
    function addMarker(location, title, type) {
        // Clear existing directions when a new marker is added
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
        }

        const marker = new google.maps.Marker({
            map: map, // Use the global map
            position: location,
            title: title,
            animation: google.maps.Animation.DROP,
        });
        marker.id = nextMarkerId++;
        marker.type = type; // 'currentLocation', 'bulkAddress', 'origin', 'destination'
        markers.push(marker);
        return marker;
    }

    // Helper function to remove markers of a specific type
    function clearMarkersByType(type) {
        markers = markers.filter(marker => {
            if (marker.type === type) {
                marker.setMap(null);
                return false; // Remove from array
            }
            return true; // Keep in array
        });
    }

    // Helper function to remove a specific marker by ID
    function removeMarkerById(markerId) {
        markers = markers.filter(marker => {
            if (marker.id === markerId) {
                marker.setMap(null);
                return false; // Remove from array
            }
            return true; // Keep in array
        });
    }

    function calculateAndDisplayRoute() {
        const origin = document.getElementById('originAddress').value;
        const destination = document.getElementById('destinationAddress').value;
        const avoidHighways = document.getElementById('avoidHighways').checked;
        const avoidTolls = document.getElementById('avoidTolls').checked;
        const avoidFerries = document.getElementById('avoidFerries').checked;

        if (!origin) {
            alert('Please enter an Origin Address.');
            return;
        }

        // Clear all markers from the map before displaying a route
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        currentLocationMarkerId = null;

        // Clear previous bulk addresses output
        document.getElementById('resolvedAddressesOutput').value = '';

        const request = {
            origin: origin,
            destination: destination,
            travelMode: 'DRIVING',
            avoidHighways: avoidHighways,
            avoidTolls: avoidTolls,
            avoidFerries: avoidFerries,
        };

        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
                const directionsPanel = document.getElementById('directionsPanel');
                directionsPanel.innerHTML = ''; // Clear previous directions
                const route = result.routes[0];

                if (route) {
                    const summary = document.createElement('h3');
                    summary.textContent = 'Route Summary: ' + route.summary;
                    directionsPanel.appendChild(summary);

                    const legs = route.legs;
                    legs.forEach((leg, index) => {
                        const legDiv = document.createElement('div');
                        legDiv.innerHTML = `<h4>Leg ${index + 1}: ${leg.start_address} to ${leg.end_address} (${leg.distance.text}, ${leg.duration.text})</h4>`;
                        const stepsList = document.createElement('ol');
                        leg.steps.forEach(step => {
                            const stepItem = document.createElement('li');
                            stepItem.innerHTML = step.instructions + ` (${step.distance.text})`;
                            stepsList.appendChild(stepItem);
                        });
                        legDiv.appendChild(stepsList);
                        directionsPanel.appendChild(legDiv);
                    });
                }
            } else {
                window.alert('Directions request failed due to ' + status);
                directionsRenderer.setDirections({ routes: [] }); // Clear any previous route
                document.getElementById('directionsPanel').innerHTML = ''; // Clear panel
            }
        });
    }

    // Event listeners should be set up only after the DOM is fully loaded and map is initialized
    document.addEventListener('mapinit', () => {
        const resolvedAddressesOutput = document.getElementById('resolvedAddressesOutput');
        const originAddressInput = document.getElementById('originAddress');

        document.getElementById('currentLocationBtn').addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // Clear any previous directions
                        if (directionsRenderer) {
                            directionsRenderer.setDirections({ routes: [] });
                        }
                        // Clear existing bulk markers
                        clearMarkersByType('bulkAddress');
                        // Clear previous resolved addresses output
                        resolvedAddressesOutput.value = '';

                        if (currentLocationMarkerId !== null) {
                            removeMarkerById(currentLocationMarkerId);
                            currentLocationMarkerId = null;
                        }

                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        const marker = addMarker(pos, 'Your Current Location', 'currentLocation');
                        currentLocationMarkerId = marker.id;
                        map.setCenter(pos);
                        map.setZoom(15);
                        console.log('Current location resolved:', pos);

                        // Geocode the current position to get a human-readable address for the origin input
                        geocoder.geocode({ 'location': pos }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                originAddressInput.value = results[0].formatted_address;
                                console.log('Origin address set to:', results[0].formatted_address);
                            } else {
                                console.error('Geocoder failed for current location:', status);
                                originAddressInput.value = `Lat: ${pos.lat}, Lng: ${pos.lng}`; // Fallback
                            }
                        });

                        // Ensure map bounds include current location and any bulk markers
                        let bounds = new google.maps.LatLngBounds();
                        markers.filter(m => m.type === 'currentLocation' || m.type === 'bulkAddress').forEach(m => bounds.extend(m.getPosition()));
                        map.fitBounds(bounds);
                    },
                    () => {
                        alert('Error: The Geolocation service failed. Please enable location services and try again.');
                    }
                );
            } else {
                alert('Error: Your browser does not support Geolocation.');
            }
        });

        document.getElementById('getDirectionsBtn').addEventListener('click', calculateAndDisplayRoute);

        document.getElementById('resolveBulkBtn').addEventListener('click', () => {
            const addressesInput = document.getElementById('bulkAddressInput').value;
            const addresses = addressesInput.split(new RegExp('\n|;')).map(addr => addr.trim()).filter(addr => addr !== '');
            if (addresses.length === 0) {
                alert('Please enter at least one address for bulk resolution.');
                return;
            }

            // Clear existing bulk address markers and any current directions
            clearMarkersByType('bulkAddress');
            if (directionsRenderer) {
                directionsRenderer.setDirections({ routes: [] });
            }
            document.getElementById('directionsPanel').innerHTML = '';

            resolvedAddressesOutput.value = ''; // Clear previous resolved addresses output

            let bounds = new google.maps.LatLngBounds();
            let geocodeCount = 0;
            let successfulGeocodes = 0;

            // Add current location marker to bounds if it exists
            markers.filter(m => m.type === 'currentLocation').forEach(m => bounds.extend(m.getPosition()));

            addresses.forEach((address) => {
                geocoder.geocode({ address: address }, (results, status) => {
                    geocodeCount++;
                    if (status === 'OK') {
                        successfulGeocodes++;
                        const location = results[0].geometry.location;
                        const formattedAddress = results[0].formatted_address; // Use formatted address for completeness
                        addMarker(location, formattedAddress, 'bulkAddress');
                        bounds.extend(location);
                        resolvedAddressesOutput.value += formattedAddress + '\n'; // Append to output
                        console.log(`Address resolved: ${address} -> ${formattedAddress}`, location);
                    } else {
                        console.error(`Geocode failed for address: ${address} - Status: ${status}`);
                        resolvedAddressesOutput.value += `Failed to resolve: ${address} (Status: ${status})\n`;
                    }

                    if (geocodeCount === addresses.length) {
                        if (successfulGeocodes > 0) {
                            map.fitBounds(bounds); // Zoom to fit all active markers
                        }
                        // If there are no successful geocodes but currentLocationMarker is present, still fit to it
                        else if (currentLocationMarkerId !== null) {
                            map.fitBounds(bounds);
                        } else {
                            // If there were no successful geocodes AND no current location marker
                            alert('No addresses could be resolved.');
                        }
                    }
                });
            });
        });
    });

    console.log('ColabMapsApp frontend script loaded.');
