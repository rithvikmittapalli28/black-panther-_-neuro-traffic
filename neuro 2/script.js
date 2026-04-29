// -----------------------------
// PATIENT DATA
// -----------------------------
const patient = {
  condition: localStorage.getItem("condition") || "cardiac",
  lat: 12.9710,
  lng: 77.5950
};

document.getElementById("condition") && (document.getElementById("condition").innerText = patient.condition);

// -----------------------------
// GLOBALS
// -----------------------------
let map, ambulanceMarker;
let path = [], step = 0;

let heartRate = 80, oxygen = 98;
let currentHospital;

let trafficSignals = [];
let signalMarkers = [];
let hospitalMarkers = [];

// -----------------------------
// 🚑 ICON
// -----------------------------
const ambulanceIcon = L.icon({
  iconUrl: "data:image/png;base64,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",
  iconSize: [30, 30],        // adjust size if needed
  iconAnchor: [25, 25]       // center of icon
});

// -----------------------------
// 🏥 FETCH REAL HOSPITALS (OSM)
// -----------------------------
async function fetchHospitals() {
  const query = `
    [out:json];
    node["amenity"="hospital"](12.90,77.55,13.05,77.75);
    out;
  `;

  const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
  const res = await fetch(url);
  const data = await res.json();

  const types = ["cardiac","neuro","trauma","maternity","general","pulmonology","urology","pediatric"];

  return data.elements.map(h => ({
    name: h.tags.name || "Hospital",
    lat: h.lat,
    lng: h.lon,
    specialties: [types[Math.floor(Math.random() * types.length)]],
    beds: Math.floor(Math.random() * 10) + 1,
    waitTime: Math.floor(Math.random() * 10) + 5
  }));
}

// -----------------------------
// 🧠 SELECT HOSPITAL
// -----------------------------
function selectHospital() {
  let specialists = hospitals.filter(h =>
    h.specialties.includes(patient.condition)
  );

  let multis = hospitals.filter(h =>
    h.specialties.includes("multispeciality")
  );

  let eligible = specialists.length > 0
    ? [...specialists, ...multis]
    : hospitals;

  return eligible.reduce((best, h) => {
    let dist = getDistance(h);
    let score = (dist * 2) + (h.waitTime * 1.5) - (h.beds * 2);

    return (!best || score < best.score) ? { ...h, score } : best;
  }, null);
}

// -----------------------------
// DISTANCE
// -----------------------------
function getDistance(h) {
  return Math.sqrt(
    Math.pow(h.lat - patient.lat, 2) +
    Math.pow(h.lng - patient.lng, 2)
  );
}

// -----------------------------
// 🛣️ ROUTE (OSRM)
// -----------------------------
async function getRoute(start, end) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  return data.routes[0].geometry.coordinates.map(c => ({
    lat: c[1],
    lng: c[0]
  }));
}

// -----------------------------
// 🚦 TRAFFIC SIGNALS
// -----------------------------
function createTrafficSignals(path) {
  for (let i = 20; i < path.length; i += 40) {
    trafficSignals.push({ position: path[i] });
  }
}

function displaySignals() {
  trafficSignals.forEach(signal => {
    let marker = L.circleMarker(
      [signal.position.lat, signal.position.lng],
      { radius: 8, color: "red", fillColor: "red", fillOpacity: 1 }
    ).addTo(map);

    signalMarkers.push(marker);
  });
}

function updateSignals(pos) {
  trafficSignals.forEach((signal, i) => {
    let d = Math.sqrt(
      Math.pow(signal.position.lat - pos.lat, 2) +
      Math.pow(signal.position.lng - pos.lng, 2)
    );

    signalMarkers[i].setStyle({
      color: d < 0.001 ? "green" : "red",
      fillColor: d < 0.001 ? "green" : "red"
    });
  });
}

// -----------------------------
// 🏥 SHOW ALL HOSPITALS
// -----------------------------
function showHospitals() {
  hospitals.forEach(h => {
    let m = L.marker([h.lat, h.lng])
      .addTo(map)
      .bindPopup(`${h.name}<br>${h.specialties}`);

    hospitalMarkers.push(m);
  });
}

// -----------------------------
// ETA
// -----------------------------
function updateETA() {
  let eta = ((path.length - step) * 0.05).toFixed(1);
  document.getElementById("hospital") &&
    (document.getElementById("hospital").innerText =
      currentHospital.name + " | ETA: " + eta + " sec");
}

// -----------------------------
// MAP INIT
// -----------------------------
function initMap() {
  map = L.map('map').setView([patient.lat, patient.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // 🔥 Fetch real hospitals
  fetchHospitals().then(data => {
    hospitals = data;

    showHospitals();

    currentHospital = selectHospital();

    getRoute(patient, currentHospital).then(route => {
      path = route;

      L.polyline(path, { color: 'blue', weight: 5 }).addTo(map);

      ambulanceMarker = L.marker([path[0].lat, path[0].lng], {
        icon: ambulanceIcon
      }).addTo(map);

      createTrafficSignals(path);
      displaySignals();

      animate();
      simulateVitals();
    });
  });
}

// -----------------------------
// 🚑 ANIMATION (SMOOTH)
// -----------------------------
function animate() {
  let i = 0, sub = 0, steps = 5;

  setInterval(() => {
    if (i >= path.length - 1) return;

    let s = path[i], e = path[i + 1];

    let lat = s.lat + (e.lat - s.lat) * (sub / steps);
    let lng = s.lng + (e.lng - s.lng) * (sub / steps);

    ambulanceMarker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);

    updateSignals({ lat, lng });
    updateETA();

    // tracking text
    const t = document.getElementById("trackingText");
    if (t) {
      if (i < path.length * 0.3) t.innerText = "🚑 Dispatched";
      else if (i < path.length * 0.7) t.innerText = "🚦 Green Corridor";
      else t.innerText = "🏥 Arriving";
    }

    sub++;
    if (sub >= steps) {
      sub = 0;
      i++;
      step = i;
    }
  }, 50);
}

// -----------------------------
// ❤️ VITALS
// -----------------------------
function simulateVitals() {
  setInterval(() => {
    heartRate = Math.floor(60 + Math.random() * 60);
    oxygen = Math.floor(85 + Math.random() * 15);

    document.getElementById("heartRate") && (document.getElementById("heartRate").innerText = heartRate);
    document.getElementById("oxygen") && (document.getElementById("oxygen").innerText = oxygen);

    const status = document.getElementById("status");
    if (status) {
      if (heartRate > 110 || oxygen < 90) {
        status.innerText = "CRITICAL 🔴";
        status.style.color = "red";
      } else {
        status.innerText = "Stable 🟢";
        status.style.color = "green";
      }
    }
  }, 2000);
}

// -----------------------------
// START
// -----------------------------
initMap();
