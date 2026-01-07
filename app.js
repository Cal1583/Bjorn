const canvas = document.getElementById("canvas");
const linesSvg = document.getElementById("relationship-lines");
const statusText = document.getElementById("status");
const exportOutput = document.getElementById("export-output");
const modelModal = document.getElementById("model-modal");
const legendModal = document.getElementById("legend-modal");
const colorsModal = document.getElementById("colors-modal");
const colorsForm = document.getElementById("colors-form");
const colorsError = document.getElementById("colors-error");
const classModal = document.getElementById("class-modal");
const classForm = document.getElementById("class-form");
const classNameInput = document.getElementById("class-name");
const classError = document.getElementById("class-error");
const classCancelButton = document.getElementById("class-cancel");

const addClassButton = document.getElementById("add-class");
const addSubclassButton = document.getElementById("add-subclass");
const openLegendButton = document.getElementById("open-legend");
const openColorsButton = document.getElementById("open-colors");
const relationshipButtons = document.getElementById("relationship-buttons");
const newProjectButton = document.getElementById("new-project");
const openProjectButton = document.getElementById("open-project");
const saveProjectButton = document.getElementById("save-project");
const saveProjectAsButton = document.getElementById("save-project-as");
const openProjectInput = document.getElementById("open-project-input");

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
let relationshipType = "one-to-many";
let currentFileName = "";

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

const systemAttributes = ["id"];
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

const setRelationshipType = (type) => {
  relationshipType = type;
  if (!relationshipButtons) {
    return;
  }
  relationshipButtons
    .querySelectorAll("button")
    .forEach((button) =>
      button.classList.toggle("is-active", button.dataset.relationshipType === type)
    );
};

const addClass = (position = { x: 120, y: 120 }, options = {}) => {
  const classId = `class-${nextId++}`;
  const newClass = {
    id: classId,
    name: options.name || "Untitled",
    attributes: options.attributes || [],
    systemAttributes: options.systemAttributes || [...systemAttributes],
    inheritableAttributes: options.inheritableAttributes || [],
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
  const removedAttribute = target.attributes[index];
  target.attributes.splice(index, 1);
  if (removedAttribute && Array.isArray(target.inheritableAttributes)) {
    target.inheritableAttributes = target.inheritableAttributes.filter(
      (attribute) => attribute !== removedAttribute
    );
  }
  render();
};

const mergeUniqueAttributes = (attributes) =>
  Array.from(new Set(attributes.filter(Boolean)));

const getInheritedAttributes = (classModel) => {
  const inheritable = new Set(classModel.inheritableAttributes || []);
  return classModel.attributes.filter((attribute) => inheritable.has(attribute));
};

const createSubclass = (parentClass) => {
  if (!parentClass) {
    return;
  }
  const inheritedAttributes = getInheritedAttributes(parentClass);
  const newClass = addClass(
    { x: parentClass.position.x + 40, y: parentClass.position.y + 140 },
    {
      attributes: inheritedAttributes,
      extends: parentClass.id,
    }
  );
  createRelationship(parentClass.id, newClass.id, "inherits");
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
    createRelationship(firstSelectionId, classId, relationshipType);
  }

  if (selectionMode === "subclass") {
    const parentClass = modelState.classes.find(
      (item) => item.id === firstSelectionId
    );
    const childClass = modelState.classes.find((item) => item.id === classId);
    const inheritedAttributes = parentClass
      ? getInheritedAttributes(parentClass)
      : [];
    const nextAttributes = childClass
      ? mergeUniqueAttributes([...inheritedAttributes, ...childClass.attributes])
      : inheritedAttributes;
    updateClass(
      classId,
      { extends: firstSelectionId, attributes: nextAttributes },
      { silent: true }
    );
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
    collapseButton.textContent = classModel.collapsed ? "+" : "−";
    collapseButton.setAttribute(
      "aria-label",
      classModel.collapsed ? "Expand class" : "Collapse class"
    );
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
      if (
        Array.isArray(classModel.inheritableAttributes) &&
        classModel.inheritableAttributes.includes(attribute)
      ) {
        attributeItem.dataset.inherited = "true";
      }

      const inheritToggle = document.createElement("input");
      inheritToggle.type = "checkbox";
      inheritToggle.className = "attribute__toggle";
      inheritToggle.title = "Mark as inherited for new subclasses";
      inheritToggle.checked = Boolean(
        classModel.inheritableAttributes?.includes(attribute)
      );
      inheritToggle.setAttribute("data-no-drag", "true");
      inheritToggle.addEventListener("pointerdown", (event) =>
        event.stopPropagation()
      );
      inheritToggle.addEventListener("click", (event) => event.stopPropagation());
      inheritToggle.addEventListener("change", (event) => {
        const nextInheritable = new Set(classModel.inheritableAttributes || []);
        if (event.target.checked) {
          nextInheritable.add(attribute);
          attributeItem.dataset.inherited = "true";
        } else {
          nextInheritable.delete(attribute);
          delete attributeItem.dataset.inherited;
        }
        updateClass(
          classModel.id,
          { inheritableAttributes: Array.from(nextInheritable) },
          { silent: true }
        );
      });

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
        const nextInheritable = [...(classModel.inheritableAttributes || [])];
        const wasInheritable = nextInheritable.includes(attribute);
        const updatedInheritable = wasInheritable
          ? mergeUniqueAttributes(
              nextInheritable
                .filter((entry) => entry !== attribute)
                .concat(nextValue)
            )
          : nextInheritable;
        if (isIdAttribute(nextValue)) {
          attributeItem.dataset.attributeType = "id";
        } else {
          delete attributeItem.dataset.attributeType;
        }
        updateClass(
          classModel.id,
          { attributes: nextAttributes, inheritableAttributes: updatedInheritable },
          { silent: true }
        );
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeAttribute(classModel.id, index);
      });

      attributeItem.appendChild(attributeMarker);
      attributeItem.appendChild(inheritToggle);
      attributeItem.appendChild(attributeText);
      attributeItem.appendChild(deleteButton);
      attributeList.appendChild(attributeItem);
    });

    const systemAttributeNote = document.createElement("p");
    systemAttributeNote.className = "system-attributes";
    systemAttributeNote.textContent =
      "System attribute: id (hidden, generated automatically)";

    const addAttributeButton = document.createElement("button");
    addAttributeButton.className = "add-attribute";
    addAttributeButton.textContent = "Add attribute";
    addAttributeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      addAttribute(classModel.id);
    });

    const addSubclassInlineButton = document.createElement("button");
    addSubclassInlineButton.className = "add-subclass";
    addSubclassInlineButton.type = "button";
    addSubclassInlineButton.textContent = "Add subclass";
    addSubclassInlineButton.addEventListener("click", (event) => {
      event.stopPropagation();
      createSubclass(classModel);
    });

    node.appendChild(header);
    node.appendChild(meta);
    node.appendChild(attributeList);
    node.appendChild(systemAttributeNote);
    node.appendChild(addAttributeButton);
    node.appendChild(addSubclassInlineButton);

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
  if (!modal.dataset.positioned && !modal.classList.contains("modal--centered")) {
    const fallback = modalDefaults[modal.id] || { x: 60, y: 80 };
    setModalPosition(modal, fallback);
    modal.dataset.positioned = "true";
  }
  bringModalToFront(modal);
};

const closeModal = (modal) => {
  modal.hidden = true;
};

const toggleModal = (modal) => {
  if (modal.hidden) {
    openModal(modal);
  } else {
    closeModal(modal);
  }
};

const initializeModal = (modal) => {
  const header = modal.querySelector("[data-drag-handle]");
  const closeButton = modal.querySelector('[data-modal-action="close"]');

  if (closeButton) {
    closeButton.addEventListener("click", () => closeModal(modal));
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
    attributes: [...(item.systemAttributes || systemAttributes), ...item.attributes],
    extends: item.extends,
    position: item.position,
    inheritableAttributes: item.inheritableAttributes || [],
  })),
    relationships: modelState.relationships,
  };

  return JSON.stringify(payload, null, 2);
};

const resetProject = () => {
  modelState = { classes: [], relationships: [] };
  nextId = 1;
  currentFileName = "";
  resetSelectionMode();
  render();
};

const updateNextId = () => {
  const maxId = modelState.classes.reduce((maxValue, item) => {
    const match = item.id.match(/class-(\d+)/);
    if (match) {
      return Math.max(maxValue, Number(match[1]));
    }
    return maxValue;
  }, 0);
  nextId = maxId + 1;
};

const normalizeClass = (rawClass) => {
  const attributes = Array.isArray(rawClass.attributes) ? rawClass.attributes : [];
  const inheritableAttributes = Array.isArray(rawClass.inheritableAttributes)
    ? rawClass.inheritableAttributes.filter((attribute) =>
        attributes.includes(attribute)
      )
    : [];
  const normalizedSystem = new Set(systemAttributes);
  const userAttributes = [];
  attributes.forEach((attribute) => {
    if (typeof attribute !== "string") {
      return;
    }
    if (systemAttributes.includes(attribute)) {
      normalizedSystem.add(attribute);
    } else {
      userAttributes.push(attribute);
    }
  });

  return {
    id: rawClass.id,
    name: rawClass.name || "Untitled",
    attributes: userAttributes,
    systemAttributes: Array.from(normalizedSystem),
    inheritableAttributes,
    position: rawClass.position || { x: 120, y: 120 },
    collapsed: Boolean(rawClass.collapsed),
    extends: rawClass.extends || null,
  };
};

const importJson = (jsonText, fileName = "") => {
  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch (error) {
    setStatus("Could not open file: invalid JSON.");
    return;
  }

  if (!payload || !Array.isArray(payload.classes)) {
    setStatus("Could not open file: missing class data.");
    return;
  }

  modelState = {
    classes: payload.classes.map(normalizeClass),
    relationships: Array.isArray(payload.relationships)
      ? payload.relationships
      : [],
  };
  currentFileName = fileName;
  updateNextId();
  resetSelectionMode();
  closeModal(modelModal);
  closeModal(legendModal);
  closeModal(colorsModal);
  render();
  setStatus(fileName ? `Opened ${fileName}.` : "Project loaded.");
};

const downloadJson = (fileName, jsonText) => {
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const saveProjectAs = () => {
  const suggested = currentFileName || "classbuilder.json";
  const fileName =
    window.prompt("Save project as...", suggested) || "";
  if (!fileName) {
    return;
  }
  const normalized = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
  const jsonText = exportJson();
  downloadJson(normalized, jsonText);
  currentFileName = normalized;
  exportOutput.value = jsonText;
  openModal(modelModal);
  setStatus(`Saved as ${normalized}.`);
};

const saveProject = () => {
  if (!currentFileName) {
    saveProjectAs();
    return;
  }
  const jsonText = exportJson();
  downloadJson(currentFileName, jsonText);
  exportOutput.value = jsonText;
  openModal(modelModal);
  setStatus(`Saved ${currentFileName}.`);
};

const initialize = () => {
  addClass({ x: 120, y: 140 }, { name: "Category", attributes: ["name"] });
  addClass({ x: 420, y: 260 }, { name: "ItemType", attributes: ["label"] });
  createRelationship("class-1", "class-2", "one-to-many");
  [modelModal, legendModal, colorsModal].forEach((modal) => {
    if (modal) {
      initializeModal(modal);
    }
  });
  setRelationshipType(relationshipType);
};

addClassButton.addEventListener("click", () => {
  classError.textContent = "";
  classForm.reset();
  openModal(classModal);
  classNameInput.focus();
});

addSubclassButton.addEventListener("click", () => {
  selectionMode = "subclass";
  firstSelectionId = null;
  setStatus("Select the parent class, then the subclass.");
  canvas.classList.add("canvas--linking");
});

openLegendButton.addEventListener("click", () => toggleModal(legendModal));
openColorsButton.addEventListener("click", () => {
  hydrateColorForm();
  toggleModal(colorsModal);
});
saveProjectButton.addEventListener("click", () => {
  saveProject();
});
saveProjectAsButton.addEventListener("click", () => {
  saveProjectAs();
});
openProjectButton.addEventListener("click", () => {
  if (openProjectInput) {
    openProjectInput.value = "";
    openProjectInput.click();
  }
});
newProjectButton.addEventListener("click", () => {
  resetProject();
  closeModal(modelModal);
  closeModal(legendModal);
  closeModal(colorsModal);
});

if (openProjectInput) {
  openProjectInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      importJson(String(reader.result), file.name);
    });
    reader.addEventListener("error", () => {
      setStatus("Could not open file.");
    });
    reader.readAsText(file);
  });
}

relationshipButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-relationship-type]");
  if (!button) {
    return;
  }
  relationshipType = button.dataset.relationshipType || "one-to-many";
  selectionMode = "relationship";
  firstSelectionId = null;
  setStatus("Select the first class for the relationship.");
  canvas.classList.add("canvas--linking");
  setRelationshipType(relationshipType);
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

classForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = classNameInput.value.trim();
  if (!value) {
    classError.textContent = "Enter a class title before adding.";
    classNameInput.focus();
    return;
  }
  addClass({ x: 120 + modelState.classes.length * 40, y: 120 }, { name: value });
  classError.textContent = "";
  closeModal(classModal);
});

classCancelButton.addEventListener("click", () => {
  closeModal(classModal);
});

window.addEventListener("resize", renderLines);

initialize();
