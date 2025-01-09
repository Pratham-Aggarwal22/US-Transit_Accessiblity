// Map Initialization
let map = L.map("map").setView([37.8, -96], 4);

// Add OpenStreetMap Tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
}).addTo(map);

// Force map to refresh its layout
setTimeout(() => {
    map.invalidateSize();
}, 500);

// Load GeoJSON for State Boundaries
let geojsonUrl = "data/us-states.json";
let geojsonLayer;

// Dropdown Data
const metricFiles = [
    { name: "Sample Size", file: "data/Sample Size.csv" }
];
const frequencyFile = "data/Frequency_Distribution.csv";

// Populate Metric Dropdown
const metricSelect = document.getElementById("metric-select");
metricFiles.forEach((metric) => {
    let option = document.createElement("option");
    option.value = metric.file;
    option.textContent = metric.name;
    metricSelect.appendChild(option);
});

// Update Map Based on Selected Metric
// Update Map Based on Selected Metric
function updateMap() {
    const metricFile = metricSelect.value;

    fetch(metricFile)
        .then((response) => response.text())
        .then((data) => {
            const rows = data.split("\n").slice(1); // Skip header
            const metricData = {};

            rows.forEach((row) => {
                const [state, value] = row.split(",");
                metricData[state.trim()] = parseFloat(value.trim());
            });

            console.log("Loaded Metric Data:", metricData); // Debugging: Check data parsing

            if (geojsonLayer) map.removeLayer(geojsonLayer);

            geojsonLayer = L.geoJson(null, {
                style: (feature) => {
                    const value = metricData[feature.properties.name];
                    return {
                        fillColor: getColor(value),
                        weight: 2,
                        opacity: 1,
                        color: "white",
                        dashArray: "3",
                        fillOpacity: 0.7,
                    };
                },
                onEachFeature: (feature, layer) => {
                    const value = metricData[feature.properties.name];
                    layer.bindPopup(
                        `<b>${feature.properties.name}</b><br>Value: ${value || "No Data"}`
                    );
                },
            });

            fetch(geojsonUrl)
                .then((response) => response.json())
                .then((geojson) => {
                    console.log("GeoJSON Data:", geojson); // Debugging: Check GeoJSON structure
                    geojsonLayer.addData(geojson).addTo(map);
                });
        });
}


// Get Color for Choropleth
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

// Populate State and Frequency Dropdowns
const stateSelect = document.getElementById("state-select");
const frequencySelect = document.getElementById("frequency-select");

fetch(frequencyFile)
    .then((response) => response.text())
    .then((data) => {
        const rows = data.split("\n");
        const header = rows[0].split(","); // First row
        const states = rows.slice(1).map((row) => row.split(",")[0]);
        const frequencies = header.slice(1).map((col) => col.split(":")[0]); // Extract frequencies

        // Populate State Dropdown
        states.forEach((state) => {
            let option = document.createElement("option");
            option.value = state.trim();
            option.textContent = state.trim();
            stateSelect.appendChild(option);
        });

        // Populate Frequency Dropdown
        [...new Set(frequencies)].forEach((frequency) => {
            let option = document.createElement("option");
            option.value = frequency.trim();
            option.textContent = frequency.trim();
            frequencySelect.appendChild(option);
        });
    });

// Update Bar Chart Based on Selections
function updateBarChart() {
    const state = stateSelect.value;
    const frequency = frequencySelect.value;

    fetch(frequencyFile)
        .then((response) => response.text())
        .then((data) => {
            const rows = data.split("\n");
            const header = rows[0].split(",");
            const stateRow = rows.find((row) => row.startsWith(state));
            if (!stateRow) return;

            const stateData = stateRow.split(",");
            const binLabels = header
                .slice(1)
                .filter((col) => col.startsWith(`${frequency}:`))
                .map((col) => col.split(": ")[1]); // Extract bin labels
            const binValues = stateData
                .slice(1)
                .filter((_, index) => header[index + 1].startsWith(`${frequency}:`))
                .map((value) => parseFloat(value));

            // Render Bar Chart
            const chartDiv = document.getElementById("bar-chart");
            Plotly.newPlot(chartDiv, [
                {
                    x: binLabels,
                    y: binValues,
                    type: "bar",
                },
            ]);
        });
}
