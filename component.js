class RouteCalculator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
          <div id="map"></div>
          <div id="controls">
              <input id="start" type="text" placeholder="Start Location">
              <div id="waypoints"></div>
              <button id="addWaypoint">Add Waypoint</button>
              <input id="end" type="text" placeholder="End Location">
              <button id="startNavigation">START</button>
          </div>
          <div id="directions"></div>
      `;
  }

  connectedCallback() {
    this.initMap();
    this.shadowRoot
      .getElementById("addWaypoint")
      .addEventListener("click", () => this.addWaypoint());
    this.shadowRoot
      .getElementById("startNavigation")
      .addEventListener("click", () => this.calculateAndStartNavigation());
  }

  initMap() {
    this.map = new google.maps.Map(this.shadowRoot.getElementById("map"), {
      center: { lat: 59.3293, lng: 18.0686 }, // Stockholm coordinates
      zoom: 10,
    });
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
    this.directionsRenderer.setPanel(
      this.shadowRoot.getElementById("directions")
    );

    const startInput = this.shadowRoot.getElementById("start");
    const endInput = this.shadowRoot.getElementById("end");
    const options = {
      fields: ["place_id", "geometry", "name"],
      strictBounds: false,
    };
    new google.maps.places.Autocomplete(startInput, options);
    new google.maps.places.Autocomplete(endInput, options);
  }

  addWaypoint() {
    const waypointsContainer = this.shadowRoot.getElementById("waypoints");
    const waypointDiv = document.createElement("div");
    waypointDiv.className = "waypoint-container";

    const waypointInput = document.createElement("input");
    waypointInput.className = "waypoint";
    waypointInput.type = "text";
    waypointInput.placeholder = "Waypoint Location";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-waypoint";
    deleteButton.addEventListener("click", () => waypointDiv.remove());

    waypointDiv.appendChild(waypointInput);
    waypointDiv.appendChild(deleteButton);
    waypointsContainer.appendChild(waypointDiv);

    new google.maps.places.Autocomplete(waypointInput, {
      fields: ["place_id", "geometry", "name"],
      strictBounds: false,
    });
  }

  calculateAndStartNavigation() {
    const start = this.shadowRoot.getElementById("start").value;
    const end = this.shadowRoot.getElementById("end").value;
    const waypointsElements = this.shadowRoot.querySelectorAll(".waypoint");
    const waypoints = Array.from(waypointsElements).map((input) => ({
      location: input.value,
      stopover: true,
    }));

    this.directionsService.route(
      {
        origin: start,
        destination: end,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          this.directionsRenderer.setDirections(response);
          this.startNavigation(start, end, waypoints);
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );
  }

  startNavigation(start, end, waypoints) {
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      start
    )}&destination=${encodeURIComponent(end)}`;

    if (waypoints.length > 0) {
      url += `&waypoints=${waypoints
        .map((waypoint) => encodeURIComponent(waypoint.location))
        .join("|")}`;
    }

    window.open(url, "_blank");
  }
}

customElements.define("route-calculator", RouteCalculator);
