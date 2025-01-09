document.addEventListener("DOMContentLoaded", () => {
    // Map Initialization
    let map = L.map("map").setView([37.8, -96], 4);

    // Add OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "Map data © OpenStreetMap contributors",
    }).addTo(map);

    // GeoJSON URL
    let geojsonUrl = "data/us-states.json";
    let geojsonLayer;

    // Dropdown Data
    const metricFiles = [
        { name: "Sample Size", file: "data/Sample Size.csv" }
    ];

    // Dropdown Element
    const metricSelect = document.getElementById("metric-select");

    // Populate Metric Dropdown
    function populateDropdown() {
        if (!metricSelect) {
            console.error("Dropdown element 'metricSelect' not found.");
            return;
        }

        metricFiles.forEach((metric) => {
            let option = document.createElement("option");
            option.value = metric.file;
            option.textContent = metric.name;
            metricSelect.appendChild(option);
        });
    }

    // Update Map Based on Selected Metric
    function updateMap() {
        if (!metricSelect) {
            console.error("Dropdown element 'metricSelect' not found.");
            return;
        }

        const metricFile = metricSelect.value;
        console.log("Selected Metric File:", metricFile);

        // Fetch Metric File
        fetch(metricFile)
            .then((response) => {
                if (!response.ok) throw new Error(`Failed to load ${metricFile}: ${response.status}`);
                return response.text();
            })
            .then((data) => {
                console.log("Raw Metric Data:", data);

                // Parse CSV
                const rows = data.split("\n").slice(1); // Skip header
                const metricData = {};
                rows.forEach((row) => {
                    const [state, value] = row.split(",");
                    if (state && value) {
                        metricData[state.trim()] = parseFloat(value.trim());
                    } else {
                        console.error("Invalid row:", row); // Log invalid rows
                    }
                });

                console.log("Parsed Metric Data:", metricData);

                // Fetch GeoJSON
                return fetch(geojsonUrl)
                    .then((response) => {
                        if (!response.ok) throw new Error(`Failed to load GeoJSON: ${response.status}`);
                        return response.json();
                    })
                    .then((geojson) => {
                        console.log("GeoJSON Data:", geojson);

                        // Update Map Layer
                        if (geojsonLayer) map.removeLayer(geojsonLayer);

                        geojsonLayer = L.geoJson(geojson, {
                            style: (feature) => {
                                const value = metricData[feature.properties.name];
                                return {
                                    fillColor: value ? getColor(value) : "#FFFFFF",
                                    weight: 2,
                                    opacity: 1,
                                    color: "white",
                                    dashArray: "3",
                                    fillOpacity: value ? 0.7 : 0.2,
                                };
                            },
                            onEachFeature: (feature, layer) => {
                                const value = metricData[feature.properties.name];
                                layer.bindPopup(
                                    `<b>${feature.properties.name}</b><br>Value: ${value || "No Data"}`
                                );
                            },
                        }).addTo(map);
                    });
            })
            .catch((error) => {
                console.error("Error loading data:", error);
            });
    }

    // Helper Function: Get Color for Choropleth
    function getColor(value) {
        return value > 1000
            ? "#800026"
            : value > 500
            ? "#BD0026"
            : value > 200
            ? "#E31A1C"
            : value > 100
            ? "#FC4E2A"
            : value > 50
            ? "#FD8D3C"
            : value > 20
            ? "#FEB24C"
            : value > 10
            ? "#FED976"
            : "#FFEDA0";
    }

    // Initialize Dropdown and Map
    populateDropdown();
    metricSelect.addEventListener("change", updateMap);
    updateMap();
});
