const floors = {
  ground: {
    title: "Ground Floor",
    image: "assets/ground-floor.png",
    locations: [
      { id: "main-entry", name: "Main Entrance", x: 22, y: 94 },
      { id: "reception", name: "Reception Block", x: 28, y: 78 },
      { id: "dining-entry-2", name: "Dining Hall Entry 2", x: 42, y: 34 },
      { id: "amphitheatre", name: "Amphitheater", x: 42, y: 58 },
      { id: "corridor-1", name: "Corridor 1", x: 55, y: 69 },
      { id: "central-stairs-g", name: "Central Stairs", x: 24, y: 68 }
    ],
    paths: {
      "main-entry|reception": [[22, 94], [22, 84], [28, 78]],
      "reception|central-stairs-g": [[28, 78], [24, 72], [24, 68]],
      "central-stairs-g|amphitheatre": [[24, 68], [34, 65], [42, 58]],
      "amphitheatre|corridor-1": [[42, 58], [49, 66], [55, 69]],
      "central-stairs-g|dining-entry-2": [[24, 68], [25, 50], [42, 34]],
      "dining-entry-2|amphitheatre": [[42, 34], [42, 47], [42, 58]],
      "corridor-1|reception": [[55, 69], [40, 72], [28, 78]]
    }
  },
  second: {
    title: "Second Floor",
    image: "assets/second-floor.png",
    locations: [
      { id: "second-entry", name: "Second Floor Entry", x: 24, y: 62 },
      { id: "north-classrooms-2", name: "North Classroom Wing", x: 25, y: 16 },
      { id: "mp-hall", name: "MPH", x: 51, y: 32 },
      { id: "south-classrooms-2", name: "South Classroom Wing", x: 27, y: 76 },
      { id: "east-classrooms-2", name: "East Classroom Wing", x: 70, y: 66 },
      { id: "second-stairs", name: "Second Floor Stairs", x: 25, y: 61 }
    ],
    paths: {
      "second-entry|second-stairs": [[24, 62], [25, 61]],
      "second-stairs|north-classrooms-2": [[25, 61], [25, 40], [25, 16]],
      "second-stairs|mp-hall": [[25, 61], [36, 46], [51, 32]],
      "second-stairs|south-classrooms-2": [[25, 61], [26, 70], [27, 76]],
      "second-stairs|east-classrooms-2": [[25, 61], [44, 61], [60, 66], [70, 66]],
      "mp-hall|east-classrooms-2": [[51, 32], [51, 52], [60, 66], [70, 66]]
    }
  },
  third: {
    title: "Third Floor",
    image: "assets/third-floor.png",
    locations: [
      { id: "third-entry", name: "Third Floor Entry", x: 24, y: 58 },
      { id: "girls-washroom", name: "Girls Washroom", x: 15, y: 25 },
      { id: "boys-washroom", name: "Boys Washroom", x: 17, y: 44 },
      { id: "audi", name: "Audi", x: 39, y: 35 },
      { id: "third-lobby", name: "Lobby", x: 68, y: 35 },
      { id: "ladies-washroom", name: "Ladies Washroom", x: 86, y: 65 },
      { id: "ramps", name: "Ramps", x: 24, y: 75 },
      { id: "av-room", name: "AV Room", x: 27, y: 93 }
    ],
    paths: {
      "third-entry|ramps": [[24, 58], [24, 68], [24, 75]],
      "third-entry|boys-washroom": [[24, 58], [20, 50], [17, 44]],
      "boys-washroom|girls-washroom": [[17, 44], [16, 34], [15, 25]],
      "third-entry|audi": [[24, 58], [29, 47], [39, 35]],
      "audi|third-lobby": [[39, 35], [54, 35], [68, 35]],
      "third-entry|ladies-washroom": [[24, 58], [45, 61], [66, 64], [86, 65]],
      "ramps|av-room": [[24, 75], [25, 84], [27, 93]]
    }
  }
};

const floorAccessLocations = {
  ground: "central-stairs-g",
  second: "second-stairs",
  third: "third-entry"
};

const startSelect = document.querySelector("#start");
const destinationSelect = document.querySelector("#destination");
const routeButton = document.querySelector("#routeButton");
const floorImage = document.querySelector("#floorImage");
const floorTitle = document.querySelector("#floorTitle");
const markerLayer = document.querySelector("#markerLayer");
const routeLayer = document.querySelector("#routeLayer");
const steps = document.querySelector("#steps");
const routeTitle = document.querySelector("#routeTitle");
const mapCanvas = document.querySelector("#mapCanvas");
const resetView = document.querySelector("#resetView");

let activeFloor = "ground";
let zoom = 1;
let isChangingFloor = false;

function allLocations() {
  return Object.entries(floors)
    .filter(([floorId, floor]) => floorId !== "first" && !floor.title.toLowerCase().includes("first"))
    .flatMap(([floorId, floor]) =>
      floor.locations.map((location) => ({ ...location, floorId, floorTitle: floor.title }))
    );
}

function fillSelects() {
  const options = allLocations()
    .map((location) => `<option value="${location.floorId}:${location.id}">${location.name} - ${location.floorTitle}</option>`)
    .join("");

  startSelect.innerHTML = options;
  destinationSelect.innerHTML = options;
  startSelect.value = "ground:main-entry";
  destinationSelect.value = "ground:dining-entry-2";
}

function setFloor(floorId, shouldDrawRoute = true) {
  activeFloor = floorId;
  const floor = floors[floorId];
  floorImage.src = floor.image;
  floorImage.alt = `${floor.title} plan`;
  floorTitle.textContent = floor.title;

  document.querySelectorAll(".floor-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.floor === floorId);
  });

  renderMarkers();
  if (shouldDrawRoute && !isChangingFloor) {
    drawRoute();
  }
}

function locationFromValue(value) {
  const [floorId, locationId] = value.split(":");
  return floors[floorId].locations.find((location) => location.id === locationId);
}

function renderMarkers() {
  const selectedStart = startSelect.value;
  const selectedDestination = destinationSelect.value;

  markerLayer.innerHTML = floors[activeFloor].locations
    .map((location) => {
      const value = `${activeFloor}:${location.id}`;
      const classes = [
        "marker",
        value === selectedStart ? "start" : "",
        value === selectedDestination ? "destination is-selected" : ""
      ].filter(Boolean).join(" ");

      return `<button class="${classes}" style="left:${location.x}%;top:${location.y}%;" data-value="${value}" data-label="${location.name}" aria-label="${location.name}"></button>`;
    })
    .join("");

  markerLayer.querySelectorAll(".marker").forEach((marker) => {
    marker.addEventListener("click", () => {
      destinationSelect.value = marker.dataset.value;
      drawRoute();
      renderMarkers();
    });
  });
}

function pathKey(startId, destinationId) {
  return `${startId}|${destinationId}`;
}

function directPath(floor, startId, destinationId) {
  const forward = floor.paths[pathKey(startId, destinationId)];
  const reverse = floor.paths[pathKey(destinationId, startId)];
  return forward || (reverse ? [...reverse].reverse() : null);
}

function appendPath(basePath, nextPath) {
  if (!basePath.length) {
    return [...nextPath];
  }

  return [...basePath, ...nextPath.slice(1)];
}

function findPath(floor, startId, destinationId) {
  if (startId === destinationId) {
    const location = floor.locations.find((item) => item.id === startId);
    return location ? [[location.x, location.y]] : null;
  }

  const direct = directPath(floor, startId, destinationId);
  if (direct) {
    return direct;
  }

  const locationIds = floor.locations.map((location) => location.id);
  const queue = [{ id: startId, route: [startId] }];
  const visited = new Set([startId]);

  while (queue.length) {
    const current = queue.shift();

    for (const nextId of locationIds) {
      if (visited.has(nextId) || !directPath(floor, current.id, nextId)) {
        continue;
      }

      const nextRoute = [...current.route, nextId];
      if (nextId === destinationId) {
        return nextRoute.slice(1).reduce((routePath, id, index) => {
          const previousId = nextRoute[index];
          return appendPath(routePath, directPath(floor, previousId, id));
        }, []);
      }

      visited.add(nextId);
      queue.push({ id: nextId, route: nextRoute });
    }
  }

  return null;
}

function locationName(floorId, locationId) {
  return floors[floorId].locations.find((location) => location.id === locationId)?.name || "floor access";
}

function drawPath(path) {
  routeLayer.innerHTML = "";

  if (!path || path.length < 2) {
    return;
  }

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", path.map(([x, y]) => `${x},${y}`).join(" "));
  polyline.setAttribute("class", "route-line");
  routeLayer.appendChild(polyline);

  [path[0], path[path.length - 1]].forEach(([x, y]) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 1.25);
    dot.setAttribute("class", "route-dot");
    routeLayer.appendChild(dot);
  });
}

function drawRoute() {
  const [startFloor, startId] = startSelect.value.split(":");
  const [destinationFloor, destinationId] = destinationSelect.value.split(":");
  const start = locationFromValue(startSelect.value);
  const destination = locationFromValue(destinationSelect.value);

  routeLayer.innerHTML = "";
  steps.innerHTML = "";
  routeTitle.textContent = `${start.name} to ${destination.name}`;

  if (startFloor !== destinationFloor) {
    const startAccessId = floorAccessLocations[startFloor];
    const destinationAccessId = floorAccessLocations[destinationFloor];
    const visibleAccessId = floorAccessLocations[activeFloor];
    const startFloorPath = findPath(floors[startFloor], startId, startAccessId);
    const destinationFloorPath = findPath(floors[destinationFloor], destinationAccessId, destinationId);

    routeTitle.textContent = `${start.name} to ${destination.name}`;
    steps.innerHTML = `
      <li>On ${floors[startFloor].title}, follow the highlighted route from ${start.name} to ${locationName(startFloor, startAccessId)}.</li>
      <li>Use the stairs to go to ${floors[destinationFloor].title}.</li>
      <li>On ${floors[destinationFloor].title}, follow the highlighted route from ${locationName(destinationFloor, destinationAccessId)} to ${destination.name}.</li>
    `;

    if (activeFloor === startFloor) {
      drawPath(startFloorPath);
    } else if (activeFloor === destinationFloor) {
      drawPath(destinationFloorPath);
    } else if (visibleAccessId) {
      routeLayer.innerHTML = "";
    } else {
      isChangingFloor = true;
      setFloor(startFloor);
      isChangingFloor = false;
      drawPath(startFloorPath);
    }

    return;
  }

  if (activeFloor !== startFloor) {
    isChangingFloor = true;
    setFloor(startFloor);
    isChangingFloor = false;
    drawRoute();
    return;
  }

  const floor = floors[activeFloor];
  const path = findPath(floor, startId, destinationId);

  if (!path || startId === destinationId) {
    steps.innerHTML = "<li>You are already at the selected location.</li>";
    return;
  }

  drawPath(path);

  steps.innerHTML = `
    <li>Start at ${start.name} on ${floor.title}.</li>
    <li>Follow the highlighted corridor route across ${path.length - 1} segment${path.length > 2 ? "s" : ""}.</li>
    <li>Arrive at ${destination.name}.</li>
  `;
}

function setZoom(nextZoom) {
  zoom = Math.min(1.8, Math.max(0.75, nextZoom));
  mapCanvas.style.transform = `scale(${zoom})`;
  mapCanvas.style.marginBottom = `${(zoom - 1) * mapCanvas.offsetHeight}px`;
  resetView.textContent = `${Math.round(zoom * 100)}%`;
}

document.querySelectorAll(".floor-tab").forEach((button) => {
  button.addEventListener("click", () => setFloor(button.dataset.floor, false));
});

document.querySelector("#zoomIn").addEventListener("click", () => setZoom(zoom + 0.1));
document.querySelector("#zoomOut").addEventListener("click", () => setZoom(zoom - 0.1));
resetView.addEventListener("click", () => setZoom(1));
routeButton.addEventListener("click", () => {
  const [startFloor] = startSelect.value.split(":");

  if (activeFloor !== startFloor) {
    setFloor(startFloor);
    return;
  }

  drawRoute();
});
startSelect.addEventListener("change", () => {
  const [floorId] = startSelect.value.split(":");
  setFloor(floorId);
});
destinationSelect.addEventListener("change", () => {
  const [floorId] = destinationSelect.value.split(":");
  setFloor(floorId);
});

fillSelects();
setFloor(activeFloor);
setZoom(1);
