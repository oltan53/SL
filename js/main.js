const stops = [
  { id: 4101, name: "Sickla Västra", type: "default" },
  { id: 9192, name: "Slussen (Metro)", type: "metro" },
  { id: 9192, name: "Slussen (Bus to Sickla)", type: "busToSickla" }
];

let currentStopId = stops[0].id;
let currentStopType = stops[0].type;

async function fetchDepartures() {
  const url = `https://transport.integration.sl.se/v1/sites/${currentStopId}/departures?t=${Date.now()}`;

  const sicklaLinesFromSlussen = ["409", "410", "413", "414", "420", "422", "492", "496"];

  try {
    const res = await fetch(url);
    const data = await res.json();

    const filtered = data.departures.filter(dep => {
      const mode = dep.line?.transport_mode?.toLowerCase();
      const direction = dep.direction?.toLowerCase() || "";
      const line = dep.line?.designation;
      const isBus = mode === "bus";
      const isMetro = mode === "metro" || dep.line?.group_of_lines?.toLowerCase().includes("tunnelbanans");

      const expectedTime = new Date(dep.expected);
      const now = new Date();
      const minutesUntil = (expectedTime - now) / 60000;
      const inNext30Mins = minutesUntil >= 0 && minutesUntil <= 30;

      if (currentStopType === "default") {
        return isBus && direction.includes("slussen") && inNext30Mins;
      } else if (currentStopType === "busToSickla") {
        return isBus && sicklaLinesFromSlussen.includes(line) && inNext30Mins;
      } else if (currentStopType === "metro") {
        return isMetro && inNext30Mins;
      }

      return false;
    });

    displayDepartures(filtered);
  } catch (err) {
    console.error("Failed to fetch departures:", err);
  }
}


function displayDepartures(departures) {
  const container = document.getElementById("departures");
  container.innerHTML = "";

  if (!departures.length) {
    container.innerHTML = "<p>No upcoming departures in the next 30 minutes.</p>";
    return;
  }

  departures.forEach(dep => {
    const line = dep.line?.designation || "Unknown Line";
    const destination = dep.direction || "Unknown Destination";

    const expectedTime = new Date(dep.expected);
    const now = new Date();
    const displayTime = expectedTime.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const minutesUntil = Math.round((expectedTime - now) / 60000);

    const div = document.createElement("div");
    div.className = "departure";
    div.innerHTML = `<strong>${line}</strong> to ${destination} at ${displayTime} <span style="color: gray;">(in ${minutesUntil} min)</span>`;
    container.appendChild(div);
  });
}

function populateStopSelector() {
  const selector = document.getElementById("stopSelector");
  stops.forEach(stop => {
    const opt = document.createElement("option");
    opt.value = `${stop.id}-${stop.type}`;
    opt.textContent = stop.name;
    selector.appendChild(opt);
  });

  selector.addEventListener("change", (e) => {
    const selected = stops.find(s => `${s.id}-${s.type}` === e.target.value);
    currentStopId = selected.id;
    currentStopType = selected.type;
    fetchDepartures();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateStopSelector();
  fetchDepartures();
  setInterval(fetchDepartures, 30000);
});


function displayDepartures(departures) {
  const container = document.getElementById("departures");
  container.innerHTML = "";

  if (!departures.length) {
    container.innerHTML = "<p>No upcoming buses in the next 30 minutes.</p>";
    return;
  }

  departures.forEach(dep => {
    const line = dep.line?.designation || "Unknown Line";
    const destination = dep.direction || "Unknown Destination";

    const expected = new Date(dep.expected);
    const now = new Date();

    const displayTime = new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Stockholm'
    }).format(expected);

    const minutesUntil = Math.round((expected - now) / 60000);

    const div = document.createElement("div");
    div.className = "departure";
    div.innerHTML = `<strong>${line}</strong> to ${destination} at ${displayTime} <span style="color: gray;">(in ${minutesUntil} min)</span>`;
    container.appendChild(div);
  });
}

