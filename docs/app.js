const state = {
  cars: [],
  maintenance: [],
  tireMeasurements: [],
};

function appendListItem(listId, text) {
  const list = document.getElementById(listId);
  const item = document.createElement("li");
  item.textContent = text;
  list.appendChild(item);
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

document.getElementById("add-car").addEventListener("click", () => {
  const name = getValue("car-name");
  if (!name) {
    return;
  }

  state.cars.push({ name });
  appendListItem("cars-list", name);
  document.getElementById("car-name").value = "";
});

document.getElementById("add-maintenance").addEventListener("click", () => {
  const entry = {
    date: getValue("maintenance-date"),
    mileage: getValue("maintenance-mileage"),
    type: document.getElementById("maintenance-type").value,
    notes: getValue("maintenance-notes"),
  };

  if (!entry.date || !entry.mileage) {
    return;
  }

  state.maintenance.push(entry);
  appendListItem(
    "maintenance-list",
    `${entry.date} - ${entry.type} @ ${entry.mileage}${entry.notes ? ` (${entry.notes})` : ""}`
  );
});

document.getElementById("add-measurement").addEventListener("click", () => {
  const event = {
    tireSet: getValue("tire-set"),
    location: document.getElementById("tire-location").value,
    date: getValue("measurement-date"),
    values: "placeholder for 8 tread measurements",
  };

  if (!event.tireSet || !event.date) {
    return;
  }

  state.tireMeasurements.push(event);
  appendListItem("measurement-list", `${event.date} - ${event.tireSet} (${event.location})`);
});

function exportDraftJson() {
  return JSON.stringify(state, null, 2);
}

document.getElementById("load-gist").addEventListener("click", () => {
  const gistId = getValue("gist-id");
  alert(`Placeholder: load JSON from gist ${gistId || "<missing gist id>"}.`);
});

document.getElementById("save-gist").addEventListener("click", () => {
  const gistId = getValue("gist-id");
  const payload = exportDraftJson();
  alert(
    `Placeholder: save JSON to gist ${gistId || "<missing gist id>"}.\n\nCurrent draft:\n${payload}`
  );
});
