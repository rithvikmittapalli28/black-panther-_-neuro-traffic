// -----------------------------
// PATIENT DATA
// -----------------------------
const patient = {
  condition: localStorage.getItem("condition") || "cardiac",
  lat: 12.9710,
  lng: 77.5950
};

document.getElementById("condition").innerText = patient.condition;


// -----------------------------
// GLOBAL VARIABLES
// -----------------------------
let map, ambulanceMarker, path = [], step = 0;
let heartRate = 80, oxygen = 98;
let currentHospital;

let trafficSignals = [];
let signalMarkers = [];


// -----------------------------
// 🚑 AMBULANCE ICON
// -----------------------------
const ambulanceIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [40, 40]
});


// -----------------------------
// HOSPITAL SELECTION
// -----------------------------
function selectHospital() {
  // 🔥 STEP 1: FILTER BY CONDITION
  let eligible = hospitals.filter(h =>
    h.specialties.includes(patient.condition)
  );

  // ⚠️ fallback if nothing found
  if (eligible.length === 0) {
    eligible = hospitals;
  }

  // 🔥 STEP 2: PICK BEST FROM FILTERED
  return eligible.reduce((best, h) => {
    let distance = getDistance(h);
    let score = distance + h.waitTime - h.beds;

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
// 🛣️ REAL ROUTE (OSRM)
// -----------------------------
async function getRoute(start, end) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  const data = await response.json();

  return data.routes[0].geometry.coordinates.map(coord => ({
    lat: coord[1],
    lng: coord[0]
  }));
}


// -----------------------------
// TRAFFIC SIGNAL SYSTEM
// -----------------------------
function createTrafficSignals(path) {
  for (let i = 20; i < path.length; i += 40) {
    trafficSignals.push({
      position: path[i],
      status: "RED"
    });
  }
}

function displaySignals() {
  trafficSignals.forEach(signal => {
    let marker = L.circleMarker(
      [signal.position.lat, signal.position.lng],
      {
        radius: 8,
        color: "red",
        fillColor: "red",
        fillOpacity: 1
      }
    ).addTo(map);

    signalMarkers.push(marker);
  });
}

function updateSignals(currentPosition) {
  trafficSignals.forEach((signal, index) => {
    let distance = Math.sqrt(
      Math.pow(signal.position.lat - currentPosition.lat, 2) +
      Math.pow(signal.position.lng - currentPosition.lng, 2)
    );

    if (distance < 0.001) {
      signalMarkers[index].setStyle({ color: "green", fillColor: "green" });
    } else {
      signalMarkers[index].setStyle({ color: "red", fillColor: "red" });
    }
  });
}


// -----------------------------
// ETA
// -----------------------------
function updateETA() {
  let remaining = path.length - step;
  let eta = (remaining * 0.05).toFixed(1);

  document.getElementById("hospital").innerText =
    currentHospital.name + " | ETA: " + eta + " sec";
}


// -----------------------------
// MAP INIT (UPDATED 🔥)
// -----------------------------
function initMap() {
  map = L.map('map').setView([patient.lat, patient.lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  currentHospital = selectHospital();

  document.getElementById("hospital").innerText = currentHospital.name;

  // 🚀 GET REAL ROUTE
  getRoute(patient, currentHospital).then(route => {
    path = route;

    L.polyline(path, { color: 'blue', weight: 5 }).addTo(map);

    ambulanceMarker = L.marker([path[0].lat, path[0].lng], {
      icon: ambulanceIcon
    }).addTo(map);

    L.marker([currentHospital.lat, currentHospital.lng])
      .addTo(map)
      .bindPopup("🏥 " + currentHospital.name);

    createTrafficSignals(path);
    displaySignals();

    animate();
    simulateVitals();
  });
}


// -----------------------------
// ANIMATION
// -----------------------------
function animate() {
  let i = 0;
  let subStep = 0;
  const stepsPerSegment = 5; // smoothness

  setInterval(() => {
    if (i >= path.length - 1) return;

    let start = path[i];
    let end = path[i + 1];

    // interpolate between points
    let lat = start.lat + (end.lat - start.lat) * (subStep / stepsPerSegment);
    let lng = start.lng + (end.lng - start.lng) * (subStep / stepsPerSegment);

    ambulanceMarker.setLatLng([lat, lng]);

    // smoother camera (less jumpy)
    map.panTo([lat, lng], { animate: true, duration: 0.5 });

    updateSignals({ lat, lng });
    updateETA();

    // 🚑 tracking text
    if (i < path.length * 0.3) {
      document.getElementById("trackingText").innerText = "🚑 Ambulance Dispatched";
    } else if (i < path.length * 0.7) {
      document.getElementById("trackingText").innerText = "🚦 Creating Green Corridor";
    } else {
      document.getElementById("trackingText").innerText = "🏥 Approaching Hospital";
    }

    subStep++;

    if (subStep >= stepsPerSegment) {
      subStep = 0;
      i++;
      step = i; // keep ETA working
    }

  }, 150); // speed control (increase for slower)
}


// -----------------------------
// VITALS
// -----------------------------
function simulateVitals() {
  setInterval(() => {
    heartRate = Math.floor(60 + Math.random() * 60);
    oxygen = Math.floor(85 + Math.random() * 15);

    document.getElementById("heartRate").innerText = heartRate;
    document.getElementById("oxygen").innerText = oxygen;

    if (heartRate > 110 || oxygen < 90) {
      document.getElementById("status").innerText = "CRITICAL 🔴";
      document.getElementById("status").style.color = "red";
    } else {
      document.getElementById("status").innerText = "Stable 🟢";
      document.getElementById("status").style.color = "green";
    }
  }, 2000);
}


// -----------------------------
// START
// -----------------------------
initMap();