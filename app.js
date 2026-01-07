const canvas = document.getElementById("canvas");
const linesSvg = document.getElementById("relationship-lines");
const statusText = document.getElementById("status");
const exportOutput = document.getElementById("export-output");
const modelModal = document.getElementById("model-modal");
const legendModal = document.getElementById("legend-modal");
const colorsModal = document.getElementById("colors-modal");
const colorsForm = document.getElementById("colors-form");
const colorsError = document.getElementById("colors-error");

const addClassButton = document.getElementById("add-class");
const addRelationshipButton = document.getElementById("add-relationship");
const addSubclassButton = document.getElementById("add-subclass");
const exportJsonButton = document.getElementById("export-json");
const openModelButton = document.getElementById("open-model");
const openLegendButton = document.getElementById("open-legend");
const openColorsButton = document.getElementById("open-colors");
const relationshipTypeSelect = document.getElementById("relationship-type");

let modelState = {
  classes: [],
  relationships: [],
};

let dragState = null;
let selectionMode = null;
let firstSelectionId = null;
let nextId = 1;
let activeModalDrag = null;
let modalZIndex = 5;

const modalDefaults = {
  "model-modal": { x: window.innerWidth - 420, y: 90 },
  "legend-modal": { x: 40, y: 90 },
  "colors-modal": { x: window.innerWidth - 420, y: 200 },
};

const relationshipLabels = {
  "one-to-many": "1 → *",
  "many-to-many": "* ↔ *",
  "parent-child": "parent/child",
  inherits: "inherits",
};

const defaultAttributes = ["id"];
const getSchemaRelationshipColor = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--schema-relationship")
    .trim() || "#f96e5b";
const getSchemaColor = (name) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--schema-${name}`)
    .trim();
const isIdAttribute = (attributeName) => {
  const normalized = attributeName.trim().toLowerCase();
  return normalized === "id" || normalized.endsWith("id");
};

const setStatus = (message) => {
  statusText.textContent = message || "";
};

const resetSelectionMode = () => {
  selectionMode = null;
  firstSelectionId = null;
  setStatus("");
  canvas.classList.remove("canvas--linking");
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

const updateClass = (id, updates, options = {}) => {
  const target = modelState.classes.find((item) => item.id === id);
  if (!target) {
    return;
  }
  Object.assign(target, updates);
  if (!options.silent) {
    render();
  }
};

const isNoDragTarget = (event) =>
  event.target.closest(
    'input, textarea, [contenteditable="true"], [data-no-drag="true"]'
  );

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
    line.setAttribute("stroke", getSchemaRelationshipColor());
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
    if (dragState && dragState.id === classModel.id) {
      node.classList.add("is-dragging");
    }
    node.style.left = `${classModel.position.x}px`;
    node.style.top = `${classModel.position.y}px`;
    node.dataset.classId = classModel.id;

    const header = document.createElement("div");
    header.className = "class-node__header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "class-node__title-wrap";

    const typeDot = document.createElement("span");
    typeDot.className = "type-dot";
    typeDot.setAttribute("aria-hidden", "true");

    const title = document.createElement("input");
    title.value = classModel.name;
    title.className = "class-node__title";
    title.setAttribute("data-no-drag", "true");
    title.addEventListener("pointerdown", (event) => event.stopPropagation());
    title.addEventListener("click", (event) => event.stopPropagation());
    title.addEventListener("input", (event) => {
      updateClass(
        classModel.id,
        { name: event.target.value.trim() || "Untitled" },
        { silent: true }
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

    titleWrap.appendChild(typeDot);
    titleWrap.appendChild(title);

    header.appendChild(titleWrap);
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
      if (isIdAttribute(attribute)) {
        attributeItem.dataset.attributeType = "id";
      }

      const attributeMarker = document.createElement("span");
      attributeMarker.className = "attribute__marker";
      attributeMarker.setAttribute("aria-hidden", "true");

      const attributeText = document.createElement("span");
      attributeText.textContent = attribute;
      attributeText.contentEditable = true;
      attributeText.setAttribute("data-no-drag", "true");
      attributeText.addEventListener("pointerdown", (event) =>
        event.stopPropagation()
      );
      attributeText.addEventListener("click", (event) =>
        event.stopPropagation()
      );
      attributeText.addEventListener("input", (event) => {
        const nextValue = event.target.textContent.trim() || "unnamed_attribute";
        const nextAttributes = [...classModel.attributes];
        nextAttributes[index] = nextValue;
        if (isIdAttribute(nextValue)) {
          attributeItem.dataset.attributeType = "id";
        } else {
          delete attributeItem.dataset.attributeType;
        }
        updateClass(classModel.id, { attributes: nextAttributes }, { silent: true });
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeAttribute(classModel.id, index);
      });

      attributeItem.appendChild(attributeMarker);
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
      if (event.target.closest("button") || isNoDragTarget(event)) {
        return;
      }
      dragState = {
        id: classModel.id,
        offsetX: event.clientX - classModel.position.x,
        offsetY: event.clientY - classModel.position.y,
      };
      node.classList.add("is-dragging");
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
      node.classList.remove("is-dragging");
      dragState = null;
    });

    node.addEventListener("pointercancel", () => {
      node.classList.remove("is-dragging");
      dragState = null;
    });

    node.addEventListener("click", (event) => {
      if (isNoDragTarget(event) || event.target.closest("button")) {
        return;
      }
      handleSelection(classModel.id);
    });

    canvas.appendChild(node);
  });

  renderLines();
};

const setModalPosition = (modal, position) => {
  modal.style.left = `${position.x}px`;
  modal.style.top = `${position.y}px`;
  modal.style.right = "auto";
};

const bringModalToFront = (modal) => {
  modalZIndex += 1;
  modal.style.zIndex = modalZIndex;
};

const openModal = (modal) => {
  modal.hidden = false;
  if (!modal.dataset.positioned) {
    const fallback = modalDefaults[modal.id] || { x: 60, y: 80 };
    setModalPosition(modal, fallback);
    modal.dataset.positioned = "true";
  }
  bringModalToFront(modal);
};

const closeModal = (modal) => {
  modal.hidden = true;
};

const toggleModalSize = (modal, button) => {
  const isCompact = modal.classList.toggle("modal--compact");
  button.textContent = isCompact ? "Grow" : "Shrink";
};

const initializeModal = (modal) => {
  const header = modal.querySelector("[data-drag-handle]");
  const closeButton = modal.querySelector('[data-modal-action="close"]');
  const sizeButton = modal.querySelector('[data-modal-action="size"]');

  if (closeButton) {
    closeButton.addEventListener("click", () => closeModal(modal));
  }
  if (sizeButton) {
    sizeButton.addEventListener("click", () => toggleModalSize(modal, sizeButton));
  }
  if (header) {
    header.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      bringModalToFront(modal);
      const rect = modal.getBoundingClientRect();
      activeModalDrag = {
        modal,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      header.setPointerCapture(event.pointerId);
    });

    header.addEventListener("pointermove", (event) => {
      if (!activeModalDrag || activeModalDrag.modal !== modal) {
        return;
      }
      const nextPosition = {
        x: event.clientX - activeModalDrag.offsetX,
        y: event.clientY - activeModalDrag.offsetY,
      };
      setModalPosition(modal, nextPosition);
    });

    header.addEventListener("pointerup", () => {
      activeModalDrag = null;
    });

    header.addEventListener("pointercancel", () => {
      activeModalDrag = null;
    });
  }

  modal.addEventListener("pointerdown", () => bringModalToFront(modal));
};

const hydrateColorForm = () => {
  const fields = ["class", "attribute", "id", "relationship"];
  fields.forEach((field) => {
    const input = colorsForm.elements[field];
    if (!input) {
      return;
    }
    const value = getSchemaColor(field);
    input.value = value;
    const preview = colorsForm.querySelector(
      `[data-color-preview="${field}"]`
    );
    if (preview) {
      preview.style.background = value;
    }
  });
  colorsError.textContent = "";
};

const isValidHex = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

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
  openModal(modelModal);
};

const initialize = () => {
  addClass({ x: 120, y: 140 }, { name: "Category", attributes: ["id", "name"] });
  addClass({ x: 420, y: 260 }, { name: "ItemType", attributes: ["id", "label"] });
  createRelationship("class-1", "class-2", "one-to-many");
  [modelModal, legendModal, colorsModal].forEach((modal) => {
    if (modal) {
      initializeModal(modal);
    }
  });
};

addClassButton.addEventListener("click", () => {
  addClass({ x: 120 + modelState.classes.length * 40, y: 120 });
});

addRelationshipButton.addEventListener("click", () => {
  selectionMode = "relationship";
  firstSelectionId = null;
  setStatus("Select the first class for the relationship.");
  canvas.classList.add("canvas--linking");
});

addSubclassButton.addEventListener("click", () => {
  selectionMode = "subclass";
  firstSelectionId = null;
  setStatus("Select the parent class, then the subclass.");
  canvas.classList.add("canvas--linking");
});

exportJsonButton.addEventListener("click", exportJson);
openModelButton.addEventListener("click", () => openModal(modelModal));
openLegendButton.addEventListener("click", () => openModal(legendModal));
openColorsButton.addEventListener("click", () => {
  hydrateColorForm();
  openModal(colorsModal);
});

colorsForm.addEventListener("input", (event) => {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }
  const preview = colorsForm.querySelector(
    `[data-color-preview="${event.target.name}"]`
  );
  if (preview) {
    preview.style.background = event.target.value.trim();
  }
});

colorsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(colorsForm);
  const entries = Object.fromEntries(formData.entries());
  const invalidFields = Object.entries(entries).filter(
    ([, value]) => !isValidHex(String(value).trim())
  );

  if (invalidFields.length) {
    colorsError.textContent =
      "Enter a valid hex color for every field (example: #1a2b3c).";
    return;
  }

  Object.entries(entries).forEach(([key, value]) => {
    document.documentElement.style.setProperty(
      `--schema-${key}`,
      String(value).trim()
    );
  });
  colorsError.textContent = "";
  renderLines();
});

window.addEventListener("resize", renderLines);

initialize();
