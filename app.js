const canvas = document.getElementById("canvas");
const linesSvg = document.getElementById("relationship-lines");
const statusText = document.getElementById("status");
const exportPanel = document.getElementById("export-panel");
const exportOutput = document.getElementById("export-output");

const addClassButton = document.getElementById("add-class");
const addRelationshipButton = document.getElementById("add-relationship");
const addSubclassButton = document.getElementById("add-subclass");
const exportJsonButton = document.getElementById("export-json");
const closeExportButton = document.getElementById("close-export");
const relationshipTypeSelect = document.getElementById("relationship-type");

let modelState = {
  classes: [],
  relationships: [],
};

let dragState = null;
let selectionMode = null;
let firstSelectionId = null;
let nextId = 1;

const relationshipLabels = {
  "one-to-many": "1 → *",
  "many-to-many": "* ↔ *",
  "parent-child": "parent/child",
  inherits: "inherits",
};

const defaultAttributes = ["id"];

const setStatus = (message) => {
  statusText.textContent = message || "";
};

const isInteractiveTarget = (target) =>
  Boolean(
    target.closest(
      'input, textarea, [contenteditable="true"], [data-no-drag="true"]'
    )
  );

const applySelectionMode = (mode) => {
  selectionMode = mode;
  firstSelectionId = null;
  canvas.classList.toggle("mode-linking", Boolean(selectionMode));
};

const resetSelectionMode = () => {
  applySelectionMode(null);
  setStatus("");
  document
    .querySelectorAll(".class-node")
    .forEach((node) => node.removeAttribute("data-selected"));
};

const addClass = (position = { x: 120, y: 120 }, options = {}) => {
  const classId = `class-${nextId++}`;
  const newClass = {
    id: classId,
    name: options.name || "NewClass",
    attributes: options.attributes || [...defaultAttributes],
    position,
    collapsed: false,
    extends: options.extends || null,
  };
  modelState.classes.push(newClass);
  render();
  return newClass;
};

const updateClass = (id, updates, options = { render: true }) => {
  const target = modelState.classes.find((item) => item.id === id);
  if (!target) {
    return;
  }
  Object.assign(target, updates);
  if (options.render) {
    render();
  }
};

const addAttribute = (id) => {
  const target = modelState.classes.find((item) => item.id === id);
  if (!target) {
    return;
  }
  target.attributes.push("new_attribute");
  render();
};

const removeAttribute = (id, index) => {
  const target = modelState.classes.find((item) => item.id === id);
  if (!target) {
    return;
  }
  target.attributes.splice(index, 1);
  render();
};

const createRelationship = (fromId, toId, type) => {
  modelState.relationships.push({
    id: `rel-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from: fromId,
    to: toId,
    type,
  });
  render();
};

const handleSelection = (classId) => {
  if (!selectionMode) {
    return;
  }

  if (!firstSelectionId) {
    firstSelectionId = classId;
    setStatus("Now select the second class.");
    markSelected(classId, true);
    return;
  }

  if (firstSelectionId === classId) {
    return;
  }

  if (selectionMode === "relationship") {
    createRelationship(firstSelectionId, classId, relationshipTypeSelect.value);
  }

  if (selectionMode === "subclass") {
    updateClass(classId, { extends: firstSelectionId });
    createRelationship(firstSelectionId, classId, "inherits");
  }

  resetSelectionMode();
};

const markSelected = (classId, selected) => {
  const node = document.querySelector(`[data-class-id="${classId}"]`);
  if (node) {
    if (selected) {
      node.setAttribute("data-selected", "true");
    } else {
      node.removeAttribute("data-selected");
    }
  }
};

const renderLines = () => {
  linesSvg.innerHTML = "";

  modelState.relationships.forEach((relationship) => {
    const fromNode = document.querySelector(
      `[data-class-id="${relationship.from}"]`
    );
    const toNode = document.querySelector(
      `[data-class-id="${relationship.to}"]`
    );
    if (!fromNode || !toNode) {
      return;
    }

    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const x1 = fromRect.left + fromRect.width / 2 - canvasRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const x2 = toRect.left + toRect.width / 2 - canvasRect.left;
    const y2 = toRect.top + toRect.height / 2 - canvasRect.top;

    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", relationship.type === "inherits" ? "#8d5adf" : "#5d76d3");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");
    linesSvg.appendChild(line);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", (x1 + x2) / 2);
    label.setAttribute("y", (y1 + y2) / 2 - 6);
    label.setAttribute("class", "relationship-label");
    label.textContent = relationshipLabels[relationship.type] || relationship.type;
    linesSvg.appendChild(label);
  });
};

const render = () => {
  canvas.querySelectorAll(".class-node").forEach((node) => node.remove());

  modelState.classes.forEach((classModel) => {
    const node = document.createElement("section");
    node.className = `class-node${classModel.collapsed ? " collapsed" : ""}`;
    node.style.left = `${classModel.position.x}px`;
    node.style.top = `${classModel.position.y}px`;
    node.dataset.classId = classModel.id;

    const header = document.createElement("div");
    header.className = "class-node__header";

    const title = document.createElement("input");
    title.value = classModel.name;
    title.className = "class-node__title";
    title.dataset.noDrag = "true";
    title.addEventListener("pointerdown", (event) => event.stopPropagation());
    title.addEventListener("click", (event) => event.stopPropagation());
    title.addEventListener("input", (event) => {
      updateClass(
        classModel.id,
        { name: event.target.value.trim() || "Untitled" },
        { render: false }
      );
    });

    const actions = document.createElement("div");
    actions.className = "class-node__actions";

    const collapseButton = document.createElement("button");
    collapseButton.textContent = classModel.collapsed ? "Expand" : "Collapse";
    collapseButton.addEventListener("click", (event) => {
      event.stopPropagation();
      updateClass(classModel.id, { collapsed: !classModel.collapsed });
    });

    const removeButton = document.createElement("button");
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      modelState.classes = modelState.classes.filter(
        (item) => item.id !== classModel.id
      );
      modelState.relationships = modelState.relationships.filter(
        (rel) => rel.from !== classModel.id && rel.to !== classModel.id
      );
      render();
    });

    actions.appendChild(collapseButton);
    actions.appendChild(removeButton);

    header.appendChild(title);
    header.appendChild(actions);

    const meta = document.createElement("div");
    meta.className = "class-node__meta";
    if (classModel.extends) {
      const parent = modelState.classes.find(
        (item) => item.id === classModel.extends
      );
      meta.textContent = parent
        ? `Inherits from ${parent.name}`
        : "Inherits from (missing)";
    } else {
      meta.textContent = "No inheritance";
    }

    const attributeList = document.createElement("ul");
    attributeList.className = "attributes";

    classModel.attributes.forEach((attribute, index) => {
      const attributeItem = document.createElement("li");
      attributeItem.className = "attribute";

      const attributeText = document.createElement("span");
      attributeText.textContent = attribute;
      attributeText.contentEditable = true;
      attributeText.dataset.noDrag = "true";
      attributeText.addEventListener("pointerdown", (event) =>
        event.stopPropagation()
      );
      attributeText.addEventListener("click", (event) => event.stopPropagation());
      attributeText.addEventListener("input", (event) => {
        const nextAttributes = [...classModel.attributes];
        nextAttributes[index] =
          event.target.textContent.trim() || "unnamed_attribute";
        updateClass(classModel.id, { attributes: nextAttributes }, { render: false });
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeAttribute(classModel.id, index);
      });

      attributeItem.appendChild(attributeText);
      attributeItem.appendChild(deleteButton);
      attributeList.appendChild(attributeItem);
    });

    const addAttributeButton = document.createElement("button");
    addAttributeButton.className = "add-attribute";
    addAttributeButton.textContent = "Add attribute";
    addAttributeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      addAttribute(classModel.id);
    });

    node.appendChild(header);
    node.appendChild(meta);
    node.appendChild(attributeList);
    node.appendChild(addAttributeButton);

    node.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || isInteractiveTarget(event.target)) {
        return;
      }
      dragState = {
        id: classModel.id,
        offsetX: event.clientX - classModel.position.x,
        offsetY: event.clientY - classModel.position.y,
      };
      node.classList.add("dragging");
      node.setPointerCapture(event.pointerId);
    });

    node.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.id !== classModel.id) {
        return;
      }
      const nextPosition = {
        x: event.clientX - dragState.offsetX,
        y: event.clientY - dragState.offsetY,
      };
      updateClass(classModel.id, { position: nextPosition });
    });

    node.addEventListener("pointerup", () => {
      dragState = null;
      node.classList.remove("dragging");
    });

    node.addEventListener("click", (event) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }
      handleSelection(classModel.id);
    });

    canvas.appendChild(node);
  });

  renderLines();
};

const exportJson = () => {
  const payload = {
    version: "1.0",
    classes: modelState.classes.map((item) => ({
      id: item.id,
      name: item.name,
      attributes: item.attributes,
      extends: item.extends,
      position: item.position,
    })),
    relationships: modelState.relationships,
  };

  exportOutput.value = JSON.stringify(payload, null, 2);
  exportPanel.hidden = false;
};

const initialize = () => {
  addClass({ x: 120, y: 140 }, { name: "Category", attributes: ["id", "name"] });
  addClass({ x: 420, y: 260 }, { name: "ItemType", attributes: ["id", "label"] });
  createRelationship("class-1", "class-2", "one-to-many");
};

addClassButton.addEventListener("click", () => {
  addClass({ x: 120 + modelState.classes.length * 40, y: 120 });
});

addRelationshipButton.addEventListener("click", () => {
  applySelectionMode("relationship");
  setStatus("Select the first class for the relationship.");
});

addSubclassButton.addEventListener("click", () => {
  applySelectionMode("subclass");
  setStatus("Select the parent class, then the subclass.");
});

exportJsonButton.addEventListener("click", exportJson);
closeExportButton.addEventListener("click", () => {
  exportPanel.hidden = true;
});

window.addEventListener("resize", renderLines);

initialize();
