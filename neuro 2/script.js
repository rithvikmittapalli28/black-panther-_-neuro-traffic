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
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40]
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
