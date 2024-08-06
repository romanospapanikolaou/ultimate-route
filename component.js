class RouteCalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
          <div id="map"></div>
          <div id="controls">
              <button id="generateLocations">Generate Random Locations</button>
              <button id="startNavigation" disabled>START</button>
          </div>
          <div id="directions"></div>
      `;
    this.randomLocations = [];
  }

  connectedCallback() {
    this.initMap();
    this.shadowRoot
      .getElementById("generateLocations")
      .addEventListener("click", () => this.generateRandomLocations());
    this.shadowRoot
      .getElementById("startNavigation")
      .addEventListener("click", () => this.calculateAndStartNavigation());
  }

  initMap() {
    this.map = new google.maps.Map(this.shadowRoot.getElementById("map"), {
      center: { lat: 59.3293, lng: 18.0686 }, // Stockholm coordinates
      zoom: 14, // Adjust zoom level to better view the central area
    });
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
    this.directionsRenderer.setPanel(
      this.shadowRoot.getElementById("directions")
    );
  }

  generateRandomLocations() {
    const numberOfLocations = 40;
    const bounds = {
      north: 59.383524,
      south: 59.287392,
      east: 18.176392,
      west: 18.007272,
    };

    this.randomLocations = [];
    for (let i = 0; i < numberOfLocations; i++) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
      this.randomLocations.push({ lat, lng });
    }

    console.log("Random Locations: ", this.randomLocations);

    // Enable the START button
    this.shadowRoot.getElementById("startNavigation").disabled = false;
  }

  calculateAndStartNavigation() {
    if (this.randomLocations.length < 2) {
      alert("Please generate at least two locations.");
      return;
    }

    const startLocation = this.randomLocations[0];
    const endLocation = this.randomLocations[this.randomLocations.length - 1];
    const waypoints = this.randomLocations.slice(1, -1).map((location) => ({
      location: new google.maps.LatLng(location.lat, location.lng),
      stopover: true,
    }));

    const chunks = this.chunkArray(waypoints, 23); // Google Maps allows up to 23 waypoints

    this.calculateRouteChunks(startLocation, endLocation, chunks);
  }

  chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  calculateRouteChunks(startLocation, endLocation, chunks) {
    let currentStart = new google.maps.LatLng(
      startLocation.lat,
      startLocation.lng
    );
    let totalRoute = [];
    const chunkPromises = chunks.map((chunk, index) => {
      const nextEnd =
        index === chunks.length - 1
          ? new google.maps.LatLng(endLocation.lat, endLocation.lng)
          : undefined;
      return new Promise((resolve, reject) => {
        this.directionsService.route(
          {
            origin: currentStart,
            destination: nextEnd || currentStart, // Use nextEnd only if it's not the last chunk
            waypoints: chunk,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (response, status) => {
            if (status === "OK") {
              totalRoute = totalRoute.concat(response.routes[0].overview_path);
              currentStart =
                response.routes[0].legs[response.routes[0].legs.length - 1]
                  .end_location;
              resolve(response);
            } else {
              reject("Directions request failed due to " + status);
            }
          }
        );
      });
    });

    Promise.all(chunkPromises)
      .then(() => {
        // Render the combined route
        this.renderCombinedRoute(totalRoute);
        this.startNavigation(startLocation, endLocation);
      })
      .catch((error) => {
        window.alert(error);
      });
  }

  renderCombinedRoute(routePath) {
    const path = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    path.setMap(this.map);
  }

  startNavigation(startLocation, endLocation) {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      startLocation.lat + "," + startLocation.lng
    )}&destination=${encodeURIComponent(
      endLocation.lat + "," + endLocation.lng
    )}`;

    if (this.randomLocations.length > 2) {
      const waypoints = this.randomLocations.slice(1, -1);
      url += `&waypoints=${waypoints
        .map((location) =>
          encodeURIComponent(location.lat + "," + location.lng)
        )
        .join("|")}`;
    }

    window.open(url, "_blank");
  }
}

customElements.define("route-calculator", RouteCalculator);
