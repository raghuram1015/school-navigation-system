const floors = {
  ground: {
    title: "Ground Floor",
    image: "assets/ground-floor.png",
    locations: [
      { id: "main-entry", name: "Main Entrance", x: 42, y: 91 },
      { id: "reception", name: "Reception Block", x: 42, y: 78 },
      { id: "dining", name: "Dining Hall", x: 48, y: 40 },
      { id: "amphitheatre", name: "Amphitheatre", x: 56, y: 63 },
      { id: "north-stairs-g", name: "North Stairs", x: 36, y: 30 },
      { id: "central-stairs-g", name: "Central Stairs", x: 38, y: 70 }
    ],
    paths: {
      "main-entry|reception": [[42, 91], [42, 82], [42, 78]],
      "main-entry|dining": [[42, 91], [42, 78], [38, 70], [39, 56], [48, 40]],
      "main-entry|amphitheatre": [[42, 91], [42, 78], [48, 70], [56, 63]],
      "main-entry|north-stairs-g": [[42, 91], [42, 78], [38, 70], [39, 56], [36, 30]],
      "reception|dining": [[42, 78], [38, 70], [39, 56], [48, 40]],
      "reception|amphitheatre": [[42, 78], [48, 70], [56, 63]],
      "dining|north-stairs-g": [[48, 40], [39, 35], [36, 30]],
      "dining|central-stairs-g": [[48, 40], [39, 56], [38, 70]],
      "amphitheatre|central-stairs-g": [[56, 63], [48, 70], [38, 70]]
    }
  },
  second: {
    title: "Second Floor",
    image: "assets/second-floor.png",
    locations: [
      { id: "second-west", name: "West Classroom Wing", x: 12, y: 70 },
      { id: "second-lobby", name: "Second Floor Lobby", x: 34, y: 61 },
      { id: "second-bridge", name: "Connecting Corridor", x: 50, y: 66 },
      { id: "second-north", name: "North Classroom Wing", x: 65, y: 43 },
      { id: "second-east", name: "East Curved Block", x: 85, y: 71 },
      { id: "second-stairs", name: "Second Floor Stairs", x: 62, y: 62 }
    ],
    paths: {
      "second-west|second-lobby": [[12, 70], [24, 70], [34, 61]],
      "second-lobby|second-bridge": [[34, 61], [42, 64], [50, 66]],
      "second-bridge|second-stairs": [[50, 66], [58, 66], [62, 62]],
      "second-stairs|second-north": [[62, 62], [63, 54], [65, 43]],
      "second-bridge|second-east": [[50, 66], [66, 66], [76, 70], [85, 71]],
      "second-west|second-east": [[12, 70], [24, 70], [34, 61], [50, 66], [66, 66], [76, 70], [85, 71]]
    }
  },
  third: {
    title: "Third Floor",
    image: "assets/third-floor.png",
    locations: [
      { id: "third-entry", name: "Third Floor Entry", x: 39, y: 75 },
      { id: "third-classrooms", name: "Classroom Corridor", x: 55, y: 72 },
      { id: "mp-hall", name: "MP Hall", x: 45, y: 35 },
      { id: "stage", name: "Stage", x: 32, y: 36 },
      { id: "third-lobby", name: "Lobby", x: 62, y: 36 },
      { id: "north-wing", name: "North Classroom Wing", x: 34, y: 15 }
    ],
    paths: {
      "third-entry|third-classrooms": [[39, 75], [48, 75], [55, 72]],
      "third-entry|mp-hall": [[39, 75], [39, 56], [45, 35]],
      "mp-hall|stage": [[45, 35], [36, 35], [32, 36]],
      "mp-hall|third-lobby": [[45, 35], [54, 35], [62, 36]],
      "mp-hall|north-wing": [[45, 35], [36, 28], [34, 15]],
      "third-classrooms|north-wing": [[55, 72], [39, 56], [36, 28], [34, 15]]
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
  return Object.entries(floors).flatMap(([floorId, floor]) =>
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
  destinationSelect.value = "ground:dining";
}

function setFloor(floorId) {
  activeFloor = floorId;
  const floor = floors[floorId];
  floorImage.src = floor.image;
  floorImage.alt = `${floor.title} plan`;
  floorTitle.textContent = floor.title;

  document.querySelectorAll(".floor-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.floor === floorId);
  });

  renderMarkers();
  if (!isChangingFloor) {
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
  button.addEventListener("click", () => setFloor(button.dataset.floor));
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
