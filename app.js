const canvas = document.getElementById("canvas");
const canvasContent = document.getElementById("canvas-content");
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
const createInstanceButton = document.getElementById("create-instance");
const createCoreInstanceButton = document.getElementById("create-core-instance");
const createHalfCoreButton = document.getElementById("create-half-core");
const openLegendButton = document.getElementById("open-legend");
const openModelButton = document.getElementById("open-model");
const openColorsButton = document.getElementById("open-colors");
const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const zoomResetButton = document.getElementById("zoom-reset");
const zoomDisplay = document.getElementById("zoom-display");
const relationshipButtons = document.getElementById("relationship-buttons");
const newProjectButton = document.getElementById("new-project");
const openProjectButton = document.getElementById("open-project");
const saveProjectButton = document.getElementById("save-project");
const saveProjectAsButton = document.getElementById("save-project-as");
const openProjectInput = document.getElementById("open-project-input");
const searchInput = document.getElementById("search-input");
const undoButton = document.getElementById("undo-action");
const redoButton = document.getElementById("redo-action");
const viewOptionsToggle = document.getElementById("view-options-toggle");
const viewOptionsPanel = document.getElementById("view-options");
const fitToScreenButton = document.getElementById("fit-to-screen");
const gridToggleButton = document.getElementById("grid-toggle");
const snapToggleButton = document.getElementById("snap-toggle");
const viewDefinitionsButton = document.getElementById("view-definitions");
const themeToggleButtons = document.querySelectorAll("[data-theme-toggle]");
const templateList = document.getElementById("template-list");
const templateEmpty = document.getElementById("template-empty");
const openBudgetButton = document.getElementById("open-budget");
const budgetView = document.getElementById("budget-view");
const mainMenu = document.getElementById("main-menu");
const openClassBuilderButton = document.getElementById("open-class-builder");
const openBudgetBuilderButton = document.getElementById("open-budget-builder");
const budgetModal = document.getElementById("budget-modal");
const budgetNewButton = document.getElementById("budget-new");
const budgetSelectorList = document.getElementById("budget-selector-list");
const budgetSelectorEmpty = document.getElementById("budget-selector-empty");
const budgetTotals = document.getElementById("budget-totals");
const budgetBillsTable = document.getElementById("budget-bills-table");
const budgetCategoriesTable = document.getElementById("budget-categories-table");
const budgetUnintentional = document.getElementById("budget-unintentional");
const budgetTransactions = document.getElementById("budget-transactions");
const budgetFilter = document.getElementById("budget-filter");
const budgetImportCsvButton = document.getElementById("budget-import-csv");
const budgetExportJsonButton = document.getElementById("budget-export-json");
const budgetImportJsonButton = document.getElementById("budget-import-json");
const budgetCsvInput = document.getElementById("budget-csv-input");
const budgetJsonInput = document.getElementById("budget-json-input");
const budgetAddBillForm = document.getElementById("budget-add-bill");
const budgetAddCategoryForm = document.getElementById("budget-add-category");

let modelState = {
  classes: [],
  relationships: [],
  templates: [],
};

let dragState = null;
let panState = null;
let selectionMode = null;
let firstSelectionId = null;
let nextId = 1;
let nextAttributeId = 1;
let activeModalDrag = null;
let modalZIndex = 5;
let relationshipType = "one-to-many";
let currentFileName = "";
let zoomLevel = 1;
let pendingAttributeFocusId = null;
let activePopover = null;
let activeClassId = null;
let searchQuery = "";
let isGridVisible = false;
let isSnapEnabled = false;
let isViewOptionsOpen = false;
let isDarkMode = false;
let activeTemplateMenu = null;
let activeRelationshipId = null;
let multiGrabState = null;
let lastPointerPosition = null;
let activeModule = "vefa";
let budgetState = null;
let budgetFilterMode = "all";
let budgetSearchQuery = "";

const zoomSettings = {
  min: 0.1,
  max: 2,
  step: 0.1,
};

const gridSize = 20;
const classNodeWidthEstimate = 260;
const canvasDefaultSize = { width: 2400, height: 1800 };
const canvasPadding = 200;
const canvasOriginOffset = 360;

const historyState = {
  undoStack: [],
  redoStack: [],
};

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
const unitLibrary = [
  "in/week",
  "mm/week",
  "L/week",
  "gal/week",
  "in",
  "cm",
  "ft",
  "m",
  "F",
  "C",
  "days",
  "weeks",
  "months",
  "ppm",
  "dS/m",
];
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

const generateAttributeId = () => `attr-${nextAttributeId++}`;

const createAttribute = (name, options = {}) => ({
  id: generateAttributeId(),
  name: name || "unnamed_attribute",
  value: options.value || "",
  unit: options.unit || "",
});

const cloneAttribute = (attribute) => ({
  ...attribute,
  id: generateAttributeId(),
});

const cloneAttributeWithoutValue = (attribute) => ({
  ...attribute,
  id: generateAttributeId(),
  value: "",
});

const normalizeAttribute = (attribute) => {
  if (typeof attribute === "string") {
    return createAttribute(attribute);
  }
  if (attribute && typeof attribute === "object") {
    return {
      id: attribute.id || generateAttributeId(),
      name: attribute.name || "unnamed_attribute",
      value: attribute.value || "",
      unit: attribute.unit || "",
    };
  }
  return null;
};

const focusContentEditableEnd = (element) => {
  if (!element) {
    return;
  }
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const captureSnapshot = () => ({
  modelState: deepClone(modelState),
  nextId,
  nextAttributeId,
  activeClassId,
});

const restoreSnapshot = (snapshot) => {
  modelState = deepClone(snapshot.modelState);
  nextId = snapshot.nextId;
  nextAttributeId = snapshot.nextAttributeId;
  activeClassId = snapshot.activeClassId || null;
  render();
};

const updateHistoryButtons = () => {
  if (undoButton) {
    undoButton.disabled = historyState.undoStack.length === 0;
  }
  if (redoButton) {
    redoButton.disabled = historyState.redoStack.length === 0;
  }
};

const recordHistory = () => {
  historyState.undoStack.push(captureSnapshot());
  historyState.redoStack = [];
  updateHistoryButtons();
};

const resetHistory = () => {
  historyState.undoStack = [];
  historyState.redoStack = [];
  updateHistoryButtons();
};

const undo = () => {
  if (!historyState.undoStack.length) {
    return;
  }
  historyState.redoStack.push(captureSnapshot());
  const snapshot = historyState.undoStack.pop();
  if (snapshot) {
    restoreSnapshot(snapshot);
  }
  updateHistoryButtons();
};

const redo = () => {
  if (!historyState.redoStack.length) {
    return;
  }
  historyState.undoStack.push(captureSnapshot());
  const snapshot = historyState.redoStack.pop();
  if (snapshot) {
    restoreSnapshot(snapshot);
  }
  updateHistoryButtons();
};

const normalizeSearchValue = (value) => value.trim().toLowerCase();

const classMatchesSearch = (classModel, query) => {
  if (!query) {
    return false;
  }
  const tokens = [
    classModel.name,
    classModel.kind,
    classModel.extends,
    ...(classModel.attributes || []).flatMap((attribute) => [
      attribute.name,
      attribute.value,
      attribute.unit,
    ]),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return tokens.some((token) => token.includes(query));
};

const updateSearchHighlights = () => {
  const normalized = normalizeSearchValue(searchQuery);
  const classMap = new Map(
    modelState.classes.map((classModel) => [classModel.id, classModel])
  );
  document.querySelectorAll(".class-node").forEach((node) => {
    const classModel = classMap.get(node.dataset.classId);
    if (!normalized || !classModel) {
      node.classList.remove("class-node--match");
      return;
    }
    if (classMatchesSearch(classModel, normalized)) {
      node.classList.add("class-node--match");
    } else {
      node.classList.remove("class-node--match");
    }
  });
};

const setViewOptionsOpen = (open) => {
  isViewOptionsOpen = open;
  if (viewOptionsPanel) {
    viewOptionsPanel.hidden = !open;
  }
  if (viewOptionsToggle) {
    viewOptionsToggle.setAttribute("aria-expanded", String(open));
  }
};

const setGridVisibility = (visible) => {
  isGridVisible = visible;
  canvas.classList.toggle("canvas--grid", isGridVisible);
  if (gridToggleButton) {
    gridToggleButton.classList.toggle("is-active", isGridVisible);
    gridToggleButton.setAttribute("aria-pressed", String(isGridVisible));
  }
};

const setSnapEnabled = (enabled) => {
  isSnapEnabled = enabled;
  if (snapToggleButton) {
    snapToggleButton.classList.toggle("is-active", isSnapEnabled);
    snapToggleButton.setAttribute("aria-pressed", String(isSnapEnabled));
  }
};

const closeActivePopover = () => {
  if (!activePopover) {
    return;
  }
  activePopover.cleanup();
  activePopover = null;
  setActiveRelationship(null);
};

const positionPopover = (popover, anchor) => {
  const rect = anchor.getBoundingClientRect();
  popover.style.left = `${rect.left + window.scrollX}px`;
  popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
};

const openPopover = (anchor, contentBuilder) => {
  closeActivePopover();
  const popover = document.createElement("div");
  popover.className = "attribute-popover";
  popover.setAttribute("data-no-drag", "true");
  contentBuilder(popover);
  document.body.appendChild(popover);
  positionPopover(popover, anchor);

  const handlePointerDown = (event) => {
    if (popover.contains(event.target) || event.target === anchor) {
      return;
    }
    closeActivePopover();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      closeActivePopover();
    }
  };
  const handleResize = () => positionPopover(popover, anchor);

  popover.addEventListener("pointerdown", (event) => event.stopPropagation());
  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);

  activePopover = {
    cleanup: () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      popover.remove();
    },
  };
};

const closeTemplateMenu = () => {
  if (!activeTemplateMenu) {
    return;
  }
  activeTemplateMenu.cleanup();
  activeTemplateMenu = null;
};

const openTemplateMenu = (position, classModel) => {
  closeTemplateMenu();
  const menu = document.createElement("div");
  menu.className = "template-menu";
  menu.style.left = `${position.x}px`;
  menu.style.top = `${position.y}px`;
  menu.setAttribute("data-no-drag", "true");

  const hasChildren = getChildRelationshipIds(classModel.id).length > 0;
  const collapseButton = document.createElement("button");
  collapseButton.type = "button";
  collapseButton.textContent = "Collapse children to the right";
  collapseButton.disabled = !hasChildren;
  collapseButton.addEventListener("click", () => {
    organizeChildRelationships(classModel);
    closeTemplateMenu();
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "Save to templates";
  addButton.addEventListener("click", () => {
    addTemplateForClass(classModel.id);
    closeTemplateMenu();
  });

  menu.appendChild(collapseButton);
  menu.appendChild(addButton);
  document.body.appendChild(menu);

  const handlePointerDown = (event) => {
    if (menu.contains(event.target)) {
      return;
    }
    closeTemplateMenu();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      closeTemplateMenu();
    }
  };

  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("keydown", handleKeyDown);

  activeTemplateMenu = {
    cleanup: () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      menu.remove();
    },
  };
};

const renderTemplateList = () => {
  if (!templateList) {
    return;
  }
  templateList.innerHTML = "";
  const entries = Array.isArray(modelState.templates)
    ? modelState.templates
    : [];
  const templates = entries
    .map((classId) => modelState.classes.find((item) => item.id === classId))
    .filter(Boolean);
  modelState.templates = templates.map((template) => template.id);

  if (!templates.length) {
    if (templateEmpty) {
      templateEmpty.hidden = false;
    }
    return;
  }
  if (templateEmpty) {
    templateEmpty.hidden = true;
  }

  templates.forEach((templateClass) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = templateClass.name;
    button.addEventListener("click", () => {
      resetSelectionMode();
      if (templateClass.kind !== "template") {
        setStatus("Templates must be base classes.");
        return;
      }
      const instance = createCoreInstanceGraph(templateClass);
      setActiveClass(instance.id);
    });
    templateList.appendChild(button);
  });
};

const addTemplateForClass = (classId) => {
  const classModel = modelState.classes.find((item) => item.id === classId);
  if (!classModel) {
    return;
  }
  if (classModel.kind !== "template") {
    setStatus("Only template classes can be saved as templates.");
    return;
  }
  if (!Array.isArray(modelState.templates)) {
    modelState.templates = [];
  }
  if (modelState.templates.includes(classId)) {
    setStatus(`Template "${classModel.name}" is already saved.`);
    return;
  }
  modelState.templates.push(classId);
  renderTemplateList();
  setStatus(`Template "${classModel.name}" saved.`);
};

const getProjectUnits = () => {
  const units = new Set();
  modelState.classes.forEach((classModel) => {
    classModel.attributes.forEach((attribute) => {
      if (attribute.unit) {
        units.add(attribute.unit);
      }
    });
  });
  return units;
};

const getUnitSuggestions = (query) => {
  const search = query.trim().toLowerCase();
  const suggestions = new Set(unitLibrary);
  getProjectUnits().forEach((unit) => suggestions.add(unit));
  return Array.from(suggestions)
    .filter((unit) => (search ? unit.toLowerCase().includes(search) : true))
    .sort((a, b) => a.localeCompare(b));
};

const updateAttributeDraft = (classModel, attributeId, updates) => {
  const target = classModel.attributes.find((item) => item.id === attributeId);
  if (!target) {
    return;
  }
  Object.assign(target, updates);
};

const mergeUniqueAttributesByName = (attributes) => {
  const seen = new Map();
  attributes.forEach((attribute) => {
    const key = attribute.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, attribute);
    }
  });
  return Array.from(seen.values());
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

const clearMultiGrabSelection = () => {
  document
    .querySelectorAll(".class-node--multi-selected")
    .forEach((node) => node.classList.remove("class-node--multi-selected"));
};

const setActiveRelationship = (relationshipId) => {
  activeRelationshipId = relationshipId;
  document
    .querySelectorAll("[data-relationship-id]")
    .forEach((element) => {
      if (element.dataset.relationshipId === relationshipId) {
        element.classList.add("is-active");
      } else {
        element.classList.remove("is-active");
      }
    });
};

const updateMultiGrabBox = () => {
  if (!multiGrabState) {
    return;
  }
  const { start, current, box } = multiGrabState;
  const left = Math.min(start.x, current.x) + canvasOriginOffset;
  const top = Math.min(start.y, current.y) + canvasOriginOffset;
  const width = Math.abs(start.x - current.x);
  const height = Math.abs(start.y - current.y);
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
};

const exitMultiGrab = () => {
  if (!multiGrabState) {
    return;
  }
  multiGrabState.box.remove();
  multiGrabState = null;
  canvas.classList.remove("canvas--multi-grab");
};

const startMultiGrab = (startPoint) => {
  if (multiGrabState) {
    return;
  }
  resetSelectionMode();
  const box = document.createElement("div");
  box.className = "multi-grab-box";
  canvasContent.appendChild(box);
  multiGrabState = {
    start: startPoint,
    current: startPoint,
    box,
  };
  canvas.classList.add("canvas--multi-grab");
  updateMultiGrabBox();
};

const selectMultiGrabNodes = () => {
  if (!multiGrabState) {
    return;
  }
  const { start, current } = multiGrabState;
  const left = Math.min(start.x, current.x) + canvasOriginOffset;
  const top = Math.min(start.y, current.y) + canvasOriginOffset;
  const right = left + Math.abs(start.x - current.x);
  const bottom = top + Math.abs(start.y - current.y);
  clearMultiGrabSelection();
  document.querySelectorAll(".class-node").forEach((node) => {
    const nodeLeft = node.offsetLeft;
    const nodeTop = node.offsetTop;
    const nodeRight = nodeLeft + node.offsetWidth;
    const nodeBottom = nodeTop + node.offsetHeight;
    const intersects =
      nodeRight >= left &&
      nodeLeft <= right &&
      nodeBottom >= top &&
      nodeTop <= bottom;
    if (intersects) {
      node.classList.add("class-node--multi-selected");
    }
  });
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

const setActiveClass = (classId) => {
  activeClassId = classId;
  document.querySelectorAll(".class-node").forEach((node) => {
    if (node.dataset.classId === classId) {
      node.setAttribute("data-active", "true");
    } else {
      node.removeAttribute("data-active");
    }
  });
};

const clearActiveClass = () => {
  activeClassId = null;
  document.querySelectorAll(".class-node").forEach((node) => {
    node.removeAttribute("data-active");
  });
};

const setZoomLevel = (value) => {
  const clamped = Math.min(zoomSettings.max, Math.max(zoomSettings.min, value));
  zoomLevel = Number(clamped.toFixed(2));
  canvasContent.style.transform = `scale(${zoomLevel})`;
  if (zoomDisplay) {
    zoomDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
  if (zoomResetButton) {
    zoomResetButton.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
  renderLines();
};

const adjustZoom = (direction) => {
  const delta = direction * zoomSettings.step;
  setZoomLevel(zoomLevel + delta);
};

const snapPositionToGrid = (position) => ({
  x: Math.round(position.x / gridSize) * gridSize,
  y: Math.round(position.y / gridSize) * gridSize,
});

const getCanvasPoint = (event) => {
  const rect = canvasContent.getBoundingClientRect();
  const x = (event.clientX - rect.left) / zoomLevel - canvasOriginOffset;
  const y = (event.clientY - rect.top) / zoomLevel - canvasOriginOffset;
  return { x, y };
};

const getCanvasPointFromClient = (clientX, clientY) => {
  const rect = canvasContent.getBoundingClientRect();
  const x = (clientX - rect.left) / zoomLevel - canvasOriginOffset;
  const y = (clientY - rect.top) / zoomLevel - canvasOriginOffset;
  return { x, y };
};

const getRightmostEdge = () =>
  modelState.classes.reduce(
    (maxEdge, classModel) =>
      Math.max(maxEdge, classModel.position.x + classNodeWidthEstimate),
    0
  );

const setThemeMode = (darkMode) => {
  isDarkMode = darkMode;
  if (isDarkMode) {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  if (themeToggleButtons.length) {
    themeToggleButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(isDarkMode));
      button.textContent = isDarkMode ? "Light mode" : "Dark mode";
    });
  }
};

const fitToScreen = () => {
  const nodes = Array.from(document.querySelectorAll(".class-node"));
  if (!nodes.length) {
    return;
  }
  const bounds = nodes.reduce(
    (acc, node) => {
      const minX = Math.min(acc.minX, node.offsetLeft);
      const minY = Math.min(acc.minY, node.offsetTop);
      const maxX = Math.max(acc.maxX, node.offsetLeft + node.offsetWidth);
      const maxY = Math.max(acc.maxY, node.offsetTop + node.offsetHeight);
      return { minX, minY, maxX, maxY };
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  );
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  if (contentWidth <= 0 || contentHeight <= 0) {
    return;
  }
  const padding = 80;
  const availableWidth = canvas.clientWidth - padding * 2;
  const availableHeight = canvas.clientHeight - padding * 2;
  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }
  const nextZoom = Math.min(
    zoomSettings.max,
    Math.max(
      zoomSettings.min,
      Math.min(availableWidth / contentWidth, availableHeight / contentHeight)
    )
  );
  setZoomLevel(nextZoom);

  const centerX = bounds.minX + contentWidth / 2;
  const centerY = bounds.minY + contentHeight / 2;
  const nextScrollLeft = Math.max(
    0,
    centerX - canvas.clientWidth / (2 * zoomLevel)
  );
  const nextScrollTop = Math.max(
    0,
    centerY - canvas.clientHeight / (2 * zoomLevel)
  );
  canvas.scrollLeft = nextScrollLeft;
  canvas.scrollTop = nextScrollTop;
};

const addClass = (position = { x: 120, y: 120 }, options = {}) => {
  if (options.recordHistory !== false) {
    recordHistory();
  }
  const classId = `class-${nextId++}`;
  const attributes = Array.isArray(options.attributes)
    ? options.attributes
        .map((attribute) => normalizeAttribute(attribute))
        .filter(Boolean)
    : [];
  const newClass = {
    id: classId,
    name: options.name || "Untitled",
    attributes,
    systemAttributes: options.systemAttributes || [...systemAttributes],
    inheritableAttributes: options.inheritableAttributes || [],
    position,
    collapsed: false,
    extends: options.extends || null,
    kind: options.kind === "instance" ? "instance" : "template",
    templateId: options.templateId || null,
    instanceKind: options.instanceKind || null,
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
  if (options.recordHistory !== false) {
    recordHistory();
  }
  Object.assign(target, updates);
  if (!options.silent) {
    render();
  }
};

const isNoDragTarget = (event) =>
  event.target.closest(
    'input, textarea, button, select, option, [contenteditable="true"], [data-no-drag="true"]'
  );

const isTextInputTarget = (event) =>
  event.target.closest('input, textarea, [contenteditable="true"]');

const isCanvasPanTarget = (event) =>
  !event.target.closest(
    ".class-node, .mini-toolbar, .view-toolbar, .sidebar, .modal, .budget-view"
  );

const addAttribute = (id) => {
  const target = modelState.classes.find((item) => item.id === id);
  if (!target) {
    return;
  }
  recordHistory();
  const newAttribute = createAttribute("new_attribute");
  target.attributes.push(newAttribute);
  pendingAttributeFocusId = newAttribute.id;
  render();
};

const removeAttribute = (id, attributeId) => {
  const target = modelState.classes.find((item) => item.id === id);
  if (!target) {
    return;
  }
  recordHistory();
  const nextAttributes = target.attributes.filter(
    (attribute) => attribute.id !== attributeId
  );
  const removedAttribute = target.attributes.find(
    (attribute) => attribute.id === attributeId
  );
  target.attributes = nextAttributes;
  if (removedAttribute?.id && Array.isArray(target.inheritableAttributes)) {
    target.inheritableAttributes = target.inheritableAttributes.filter(
      (attribute) => attribute !== removedAttribute.id
    );
  }
  render();
};

const getInheritedAttributes = (classModel) => {
  const inheritable = new Set(classModel.inheritableAttributes || []);
  return classModel.attributes
    .filter((attribute) => inheritable.has(attribute.id))
    .map((attribute) => cloneAttribute(attribute));
};

const createSubclass = (parentClass) => {
  if (!parentClass) {
    return;
  }
  recordHistory();
  const inheritedAttributes = getInheritedAttributes(parentClass);
  const newClass = addClass(
    { x: parentClass.position.x + 40, y: parentClass.position.y + 140 },
    {
      attributes: inheritedAttributes,
      extends: parentClass.id,
      recordHistory: false,
    }
  );
  createRelationship(parentClass.id, newClass.id, "inherits", {
    recordHistory: false,
  });
};

const createRelationship = (fromId, toId, type, options = {}) => {
  const { recordHistory: shouldRecord = true } = options;
  if (shouldRecord) {
    recordHistory();
  }
  modelState.relationships.push({
    id: `rel-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from: fromId,
    to: toId,
    type,
    generateOnInstantiate: Boolean(options.generateOnInstantiate),
    cardinalityHint:
      options.cardinalityHint === "many" ? "many" : "one",
  });
  render();
};

const getChildRelationshipIds = (parentId) =>
  modelState.relationships
    .filter(
      (relationship) =>
        relationship.from === parentId &&
        (relationship.type === "parent-child" ||
          relationship.type === "inherits")
    )
    .map((relationship) => relationship.to);

const organizeChildRelationships = (parentClass) => {
  if (!parentClass) {
    return;
  }
  const levels = new Map();
  const visited = new Set([parentClass.id]);
  const queue = [{ id: parentClass.id, depth: 0 }];
  while (queue.length) {
    const { id, depth } = queue.shift();
    const children = getChildRelationshipIds(id);
    children.forEach((childId) => {
      if (visited.has(childId)) {
        return;
      }
      visited.add(childId);
      const nextDepth = depth + 1;
      if (!levels.has(nextDepth)) {
        levels.set(nextDepth, []);
      }
      levels.get(nextDepth).push(childId);
      queue.push({ id: childId, depth: nextDepth });
    });
  }

  if (!levels.size) {
    return;
  }
  recordHistory();
  const spacingX = classNodeWidthEstimate + 80;
  const spacingY = 140;
  levels.forEach((childIds, depth) => {
    const childModels = childIds
      .map((childId) => modelState.classes.find((item) => item.id === childId))
      .filter(Boolean)
      .sort((a, b) => a.position.y - b.position.y);
    childModels.forEach((childModel, index) => {
      childModel.collapsed = true;
      childModel.position = {
        x: parentClass.position.x + depth * spacingX,
        y: parentClass.position.y + index * spacingY,
      };
    });
  });
  render();
};

const handleSelection = (classId) => {
  if (!selectionMode) {
    return;
  }

  if (selectionMode === "instance") {
    recordHistory();
    const templateClass = modelState.classes.find((item) => item.id === classId);
    if (!templateClass || templateClass.kind !== "template") {
      setStatus("Select a template class to create an instance.");
      return;
    }
    const instance = createInstanceFromTemplate(templateClass, {
      recordHistory: false,
    });
    scaffoldRelationshipsForInstance(templateClass, instance);
    setActiveClass(instance.id);
    resetSelectionMode();
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
    recordHistory();
    const parentClass = modelState.classes.find(
      (item) => item.id === firstSelectionId
    );
    const childClass = modelState.classes.find((item) => item.id === classId);
    const inheritedAttributes = parentClass
      ? getInheritedAttributes(parentClass)
      : [];
    const nextAttributes = childClass
      ? mergeUniqueAttributesByName([
          ...inheritedAttributes,
          ...childClass.attributes.map((attribute) => cloneAttribute(attribute)),
        ])
      : inheritedAttributes;
    updateClass(
      classId,
      { extends: firstSelectionId, attributes: nextAttributes },
      { silent: true, recordHistory: false }
    );
    createRelationship(firstSelectionId, classId, "inherits", {
      recordHistory: false,
    });
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

const updateRelationship = (relationshipId, updates) => {
  const target = modelState.relationships.find(
    (relationship) => relationship.id === relationshipId
  );
  if (!target) {
    return;
  }
  recordHistory();
  Object.assign(target, updates);
};

const openRelationshipPopover = (anchor, relationship) => {
  setActiveRelationship(relationship.id);
  openPopover(anchor, (popover) => {
    popover.classList.add("relationship-popover");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "relationship-popover__remove";
    removeButton.textContent = "Remove link";
    removeButton.addEventListener("click", () => {
      recordHistory();
      modelState.relationships = modelState.relationships.filter(
        (item) => item.id !== relationship.id
      );
      closeActivePopover();
      render();
    });

    popover.appendChild(removeButton);
  });
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

    const x1 = fromNode.offsetLeft + fromNode.offsetWidth / 2;
    const y1 = fromNode.offsetTop + fromNode.offsetHeight / 2;
    const x2 = toNode.offsetLeft + toNode.offsetWidth / 2;
    const y2 = toNode.offsetTop + toNode.offsetHeight / 2;

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
    line.setAttribute("class", "relationship-line");
    line.dataset.relationshipId = relationship.id;
    line.addEventListener("pointerdown", (event) => event.stopPropagation());
    line.addEventListener("click", (event) => {
      event.stopPropagation();
      if (selectionMode) {
        return;
      }
      openRelationshipPopover(line, relationship);
    });
    linesSvg.appendChild(line);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", (x1 + x2) / 2);
    label.setAttribute("y", (y1 + y2) / 2 - 6);
    label.setAttribute("class", "relationship-label");
    label.dataset.relationshipId = relationship.id;
    label.textContent = relationshipLabels[relationship.type] || relationship.type;
    label.addEventListener("pointerdown", (event) => event.stopPropagation());
    label.addEventListener("click", (event) => {
      event.stopPropagation();
      if (selectionMode) {
        return;
      }
      openRelationshipPopover(label, relationship);
    });
    linesSvg.appendChild(label);
  });
  setActiveRelationship(activeRelationshipId);
};

const updateCanvasBounds = () => {
  const nodes = Array.from(canvasContent.querySelectorAll(".class-node"));
  if (!nodes.length) {
    canvasContent.style.width = `${
      canvasDefaultSize.width + canvasOriginOffset * 2
    }px`;
    canvasContent.style.height = `${
      canvasDefaultSize.height + canvasOriginOffset * 2
    }px`;
    return;
  }
  const bounds = nodes.reduce(
    (acc, node) => {
      acc.minLeft = Math.min(acc.minLeft, node.offsetLeft);
      acc.minTop = Math.min(acc.minTop, node.offsetTop);
      acc.maxRight = Math.max(acc.maxRight, node.offsetLeft + node.offsetWidth);
      acc.maxBottom = Math.max(
        acc.maxBottom,
        node.offsetTop + node.offsetHeight
      );
      return acc;
    },
    {
      minLeft: Number.POSITIVE_INFINITY,
      minTop: Number.POSITIVE_INFINITY,
      maxRight: 0,
      maxBottom: 0,
    }
  );
  const nextWidth = Math.max(
    canvasDefaultSize.width + canvasOriginOffset * 2,
    bounds.maxRight + canvasPadding,
    bounds.maxRight + canvasOriginOffset
  );
  const nextHeight = Math.max(
    canvasDefaultSize.height + canvasOriginOffset * 2,
    bounds.maxBottom + canvasPadding,
    bounds.maxBottom + canvasOriginOffset
  );
  canvasContent.style.width = `${nextWidth}px`;
  canvasContent.style.height = `${nextHeight}px`;
};

const render = () => {
  closeActivePopover();
  closeTemplateMenu();
  canvasContent.querySelectorAll(".class-node").forEach((node) => node.remove());

  modelState.classes.forEach((classModel) => {
    const node = document.createElement("section");
    node.className = `class-node${classModel.collapsed ? " collapsed" : ""}`;
    if (classModel.kind === "instance") {
      node.classList.add("class-node--instance");
      if (classModel.instanceKind === "core") {
        node.classList.add("class-node--core-instance");
      }
    }
    if (classModel.extends) {
      node.classList.add("class-node--subclass");
    }
    if (dragState && dragState.id === classModel.id) {
      node.classList.add("is-dragging");
    }
    node.style.left = `${classModel.position.x + canvasOriginOffset}px`;
    node.style.top = `${classModel.position.y + canvasOriginOffset}px`;
    node.dataset.classId = classModel.id;
    if (activeClassId === classModel.id) {
      node.dataset.active = "true";
    }

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
      recordHistory();
      modelState.classes = modelState.classes.filter(
        (item) => item.id !== classModel.id
      );
      modelState.relationships = modelState.relationships.filter(
        (rel) => rel.from !== classModel.id && rel.to !== classModel.id
      );
      if (Array.isArray(modelState.templates)) {
        modelState.templates = modelState.templates.filter(
          (templateId) => templateId !== classModel.id
        );
      }
      if (activeClassId === classModel.id) {
        clearActiveClass();
      }
      render();
    });

    actions.appendChild(collapseButton);
    actions.appendChild(removeButton);

    titleWrap.appendChild(typeDot);
    titleWrap.appendChild(title);
    if (classModel.kind === "instance") {
      const badge = document.createElement("span");
      badge.className = "class-node__badge";
      badge.textContent = "Instance";
      badge.setAttribute("aria-label", "Instance node");
      titleWrap.appendChild(badge);
    }

    header.appendChild(titleWrap);
    header.appendChild(actions);

    const meta = document.createElement("div");
    meta.className = "class-node__meta";
    if (classModel.kind === "instance" && classModel.templateId) {
      const template = modelState.classes.find(
        (item) => item.id === classModel.templateId
      );
      meta.textContent = template
        ? `Instance of ${template.name}`
        : "Instance of (missing)";
    } else if (classModel.extends) {
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

    classModel.attributes.forEach((attribute) => {
      const attributeItem = document.createElement("li");
      attributeItem.className = "attribute";
      attributeItem.dataset.attributeId = attribute.id;
      if (isIdAttribute(attribute.name)) {
        attributeItem.dataset.attributeType = "id";
      }
      if (
        Array.isArray(classModel.inheritableAttributes) &&
        classModel.inheritableAttributes.includes(attribute.id)
      ) {
        attributeItem.dataset.inherited = "true";
      }

      const inheritToggle = document.createElement("input");
      inheritToggle.type = "checkbox";
      inheritToggle.className = "attribute__toggle";
      inheritToggle.title = "Mark as inherited for new subclasses";
      inheritToggle.checked = Boolean(
        classModel.inheritableAttributes?.includes(attribute.id)
      );
      inheritToggle.setAttribute("data-no-drag", "true");
      inheritToggle.addEventListener("pointerdown", (event) =>
        event.stopPropagation()
      );
      inheritToggle.addEventListener("click", (event) => event.stopPropagation());
      inheritToggle.addEventListener("change", (event) => {
        const nextInheritable = new Set(classModel.inheritableAttributes || []);
        if (event.target.checked) {
          nextInheritable.add(attribute.id);
          attributeItem.dataset.inherited = "true";
        } else {
          nextInheritable.delete(attribute.id);
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
      attributeText.className = "attribute__name";
      attributeText.textContent = attribute.name;
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
        updateAttributeDraft(classModel, attribute.id, { name: nextValue });
        if (isIdAttribute(nextValue)) {
          attributeItem.dataset.attributeType = "id";
        } else {
          delete attributeItem.dataset.attributeType;
        }
      });
      attributeText.addEventListener("blur", (event) => {
        const nextValue = event.target.textContent.trim() || "unnamed_attribute";
        updateAttributeDraft(classModel, attribute.id, { name: nextValue });
        if (event.target.textContent.trim() === "") {
          event.target.textContent = nextValue;
        }
      });

      const valueText = document.createElement("span");
      valueText.className = "attribute__value";
      valueText.textContent = attribute.value || "";
      valueText.contentEditable = true;
      valueText.setAttribute("data-no-drag", "true");
      valueText.setAttribute("data-placeholder", "value");
      valueText.addEventListener("pointerdown", (event) =>
        event.stopPropagation()
      );
      valueText.addEventListener("click", (event) => event.stopPropagation());
      valueText.addEventListener("input", (event) => {
        const nextValue = event.target.textContent.trim();
        updateAttributeDraft(classModel, attribute.id, { value: nextValue });
      });
      valueText.addEventListener("blur", (event) => {
        const nextValue = event.target.textContent.trim();
        updateAttributeDraft(classModel, attribute.id, { value: nextValue });
        if (event.target.textContent.trim() === "") {
          event.target.textContent = "";
        }
      });

      const unitPill = document.createElement("button");
      unitPill.type = "button";
      unitPill.className = "attribute__pill attribute__pill--unit";
      unitPill.textContent = attribute.unit || "unit";
      if (!attribute.unit) {
        unitPill.classList.add("is-placeholder");
      }
      unitPill.setAttribute("data-no-drag", "true");
      unitPill.addEventListener("pointerdown", (event) =>
        event.stopPropagation()
      );
      unitPill.addEventListener("click", (event) => {
        event.stopPropagation();
        openPopover(unitPill, (popover) => {
          const input = document.createElement("input");
          input.type = "text";
          input.placeholder = "Search or add unit";
          input.className = "attribute-popover__input";
          input.value = attribute.unit;
          input.addEventListener("pointerdown", (innerEvent) =>
            innerEvent.stopPropagation()
          );

          const list = document.createElement("div");
          list.className = "attribute-popover__list";

          const renderSuggestions = () => {
            list.innerHTML = "";
            const suggestions = getUnitSuggestions(input.value);
            if (!suggestions.length) {
              const empty = document.createElement("div");
              empty.className = "attribute-popover__empty";
              empty.textContent = "No matches. Press Enter to add.";
              list.appendChild(empty);
              return;
            }
            suggestions.forEach((unit) => {
              const option = document.createElement("button");
              option.type = "button";
              option.className = "attribute-popover__option";
              option.textContent = unit;
              option.addEventListener("click", () => {
                updateAttributeDraft(classModel, attribute.id, { unit });
                unitPill.textContent = unit;
                unitPill.classList.remove("is-placeholder");
                closeActivePopover();
              });
              list.appendChild(option);
            });
          };

          input.addEventListener("input", () => renderSuggestions());
          input.addEventListener("keydown", (innerEvent) => {
            if (innerEvent.key === "Enter") {
              innerEvent.preventDefault();
              const nextUnit = input.value.trim();
              updateAttributeDraft(classModel, attribute.id, { unit: nextUnit });
              if (nextUnit) {
                unitPill.textContent = nextUnit;
                unitPill.classList.remove("is-placeholder");
              } else {
                unitPill.textContent = "unit";
                unitPill.classList.add("is-placeholder");
              }
              closeActivePopover();
            }
          });

          popover.appendChild(input);
          popover.appendChild(list);
          renderSuggestions();
          input.focus();
        });
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "attribute__delete";
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeAttribute(classModel.id, attribute.id);
      });

      attributeItem.appendChild(attributeMarker);
      attributeItem.appendChild(inheritToggle);
      attributeItem.appendChild(attributeText);
      attributeItem.appendChild(valueText);
      attributeItem.appendChild(unitPill);
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
      if (multiGrabState) {
        event.preventDefault();
        if (event.button === 2) {
          exitMultiGrab();
        }
        if (event.button === 0) {
          selectMultiGrabNodes();
          exitMultiGrab();
        }
        return;
      }
      if (event.target.closest("button") || isNoDragTarget(event)) {
        return;
      }
      const point = getCanvasPoint(event);
      dragState = {
        id: classModel.id,
        offsetX: point.x - classModel.position.x,
        offsetY: point.y - classModel.position.y,
        hasRecorded: false,
        pointerId: event.pointerId,
      };
      node.classList.add("is-dragging");
      node.setPointerCapture(event.pointerId);
    });

    node.addEventListener("click", (event) => {
      if (isNoDragTarget(event) || event.target.closest("button")) {
        return;
      }
      if (!selectionMode) {
        setActiveClass(classModel.id);
        return;
      }
      handleSelection(classModel.id);
    });

    node.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (selectionMode || multiGrabState) {
        return;
      }
      openTemplateMenu({ x: event.clientX, y: event.clientY }, classModel);
    });

    canvasContent.appendChild(node);
  });

  updateCanvasBounds();
  renderLines();
  updateSearchHighlights();
  renderTemplateList();

  if (pendingAttributeFocusId) {
    const target = document.querySelector(
      `[data-attribute-id="${pendingAttributeFocusId}"] .attribute__name`
    );
    focusContentEditableEnd(target);
    pendingAttributeFocusId = null;
  }
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
  const fields = [
    "class",
    "subclass",
    "instance",
    "core-instance",
    "attribute",
    "id",
    "relationship",
  ];
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
      attributes: item.attributes.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        value: attribute.value,
        unit: attribute.unit,
      })),
      systemAttributes: item.systemAttributes || systemAttributes,
      extends: item.extends,
      kind: item.kind || "template",
      templateId: item.templateId || null,
      position: item.position,
      inheritableAttributes: item.inheritableAttributes || [],
      collapsed: item.collapsed,
      instanceKind: item.instanceKind || null,
    })),
    relationships: modelState.relationships,
    templates: Array.isArray(modelState.templates) ? modelState.templates : [],
  };

  return JSON.stringify(payload, null, 2);
};

const resetProject = () => {
  modelState = { classes: [], relationships: [], templates: [] };
  nextId = 1;
  nextAttributeId = 1;
  currentFileName = "";
  activeClassId = null;
  resetSelectionMode();
  resetHistory();
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
  const maxAttributeId = modelState.classes.reduce((maxValue, item) => {
    item.attributes.forEach((attribute) => {
      const match = String(attribute.id || "").match(/attr-(\d+)/);
      if (match) {
        maxValue = Math.max(maxValue, Number(match[1]));
      }
    });
    return maxValue;
  }, 0);
  nextAttributeId = maxAttributeId + 1;
};

const normalizeClass = (rawClass) => {
  const rawAttributes = Array.isArray(rawClass.attributes)
    ? rawClass.attributes
    : [];
  const normalizedSystem = new Set(
    Array.isArray(rawClass.systemAttributes)
      ? rawClass.systemAttributes
      : systemAttributes
  );
  const userAttributes = [];
  rawAttributes.forEach((attribute) => {
    const normalized = normalizeAttribute(attribute);
    if (!normalized) {
      return;
    }
    if (systemAttributes.includes(normalized.name)) {
      normalizedSystem.add(normalized.name);
      return;
    }
    userAttributes.push(normalized);
  });

  const inheritableAttributes = Array.isArray(rawClass.inheritableAttributes)
    ? rawClass.inheritableAttributes
        .map((entry) => {
          if (userAttributes.some((attribute) => attribute.id === entry)) {
            return entry;
          }
          const match = userAttributes.find(
            (attribute) => attribute.name === entry
          );
          return match ? match.id : null;
        })
        .filter(Boolean)
    : [];

  return {
    id: rawClass.id,
    name: rawClass.name || "Untitled",
    attributes: userAttributes,
    systemAttributes: Array.from(normalizedSystem),
    inheritableAttributes,
    position: rawClass.position || { x: 120, y: 120 },
    collapsed: Boolean(rawClass.collapsed),
    extends: rawClass.extends || null,
    kind: rawClass.kind === "instance" ? "instance" : "template",
    templateId: rawClass.templateId || null,
    instanceKind: rawClass.instanceKind || null,
  };
};

const normalizeRelationship = (relationship) => ({
  id:
    relationship.id ||
    `rel-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  from: relationship.from,
  to: relationship.to,
  type: relationship.type,
  generateOnInstantiate: Boolean(relationship.generateOnInstantiate),
  cardinalityHint:
    relationship.cardinalityHint === "many" ? "many" : "one",
});

const applyOrderValue = (classModel, value) => {
  const target = classModel.attributes.find(
    (attribute) => attribute.name.trim().toLowerCase() === "order"
  );
  if (target) {
    target.value = String(value);
  }
};

const createInstanceFromTemplate = (templateClass, options = {}) => {
  const attributes = templateClass.attributes.map((attribute) =>
    options.clearValues
      ? cloneAttributeWithoutValue(attribute)
      : cloneAttribute(attribute)
  );
  const instanceName =
    options.name || `${templateClass.name} Instance`;
  const position =
    options.position || {
      x: templateClass.position.x + 60,
      y: templateClass.position.y + 60,
    };
  return addClass(position, {
    name: instanceName,
    attributes,
    systemAttributes: templateClass.systemAttributes || systemAttributes,
    inheritableAttributes: [],
    kind: "instance",
    templateId: templateClass.id,
    instanceKind: options.instanceKind || "standard",
    recordHistory: options.recordHistory,
  });
};

const createCoreInstanceGraph = (templateClass) => {
  const related = modelState.relationships.filter(
    (relationship) => relationship.from === templateClass.id
  );
  const templates = [
    templateClass,
    ...related
      .map((relationship) =>
        modelState.classes.find((item) => item.id === relationship.to)
      )
      .filter(Boolean),
  ];
  const minTemplateX = templates.reduce(
    (minX, item) => Math.min(minX, item.position.x),
    Number.POSITIVE_INFINITY
  );
  const offsetX = getRightmostEdge() + 120 - minTemplateX;
  const instance = createInstanceFromTemplate(templateClass, {
    position: {
      x: templateClass.position.x + offsetX,
      y: templateClass.position.y,
    },
    instanceKind: "core",
  });
  if (!related.length) {
    return instance;
  }

  related.forEach((relationship) => {
    const targetTemplate = modelState.classes.find(
      (item) => item.id === relationship.to
    );
    if (!targetTemplate) {
      return;
    }
    const position = {
      x: targetTemplate.position.x + offsetX,
      y: targetTemplate.position.y,
    };
    const relatedInstance = createInstanceFromTemplate(targetTemplate, {
      name: `${instance.name} — ${targetTemplate.name}`,
      position,
      instanceKind: "core",
    });
    createRelationship(instance.id, relatedInstance.id, relationship.type, {
      generateOnInstantiate: false,
      cardinalityHint: relationship.cardinalityHint,
    });
  });
  return instance;
};

const createHalfCoreInstanceGraph = (templateClass) => {
  const related = modelState.relationships.filter(
    (relationship) => relationship.from === templateClass.id
  );
  const templates = [
    templateClass,
    ...related
      .map((relationship) =>
        modelState.classes.find((item) => item.id === relationship.to)
      )
      .filter(Boolean),
  ];
  const minTemplateX = templates.reduce(
    (minX, item) => Math.min(minX, item.position.x),
    Number.POSITIVE_INFINITY
  );
  const offsetX = getRightmostEdge() + 120 - minTemplateX;
  const instance = createInstanceFromTemplate(templateClass, {
    position: {
      x: templateClass.position.x + offsetX,
      y: templateClass.position.y,
    },
    instanceKind: "core",
    clearValues: true,
  });
  if (!related.length) {
    return instance;
  }

  related.forEach((relationship) => {
    const targetTemplate = modelState.classes.find(
      (item) => item.id === relationship.to
    );
    if (!targetTemplate) {
      return;
    }
    const position = {
      x: targetTemplate.position.x + offsetX,
      y: targetTemplate.position.y,
    };
    const relatedInstance = createInstanceFromTemplate(targetTemplate, {
      name: `${instance.name} — ${targetTemplate.name}`,
      position,
      instanceKind: "core",
      clearValues: true,
    });
    createRelationship(instance.id, relatedInstance.id, relationship.type, {
      generateOnInstantiate: false,
      cardinalityHint: relationship.cardinalityHint,
    });
  });
  return instance;
};

const scaffoldRelationshipsForInstance = (templateClass, instanceClass) => {
  const scaffolds = modelState.relationships.filter(
    (relationship) =>
      relationship.from === templateClass.id &&
      relationship.generateOnInstantiate
  );
  if (!scaffolds.length) {
    return;
  }
  const totalInstances = scaffolds.reduce((count, relationship) => {
    return (
      count + (relationship.cardinalityHint === "many" ? 3 : 1)
    );
  }, 0);
  let instanceIndex = 0;
  const radius = 220;

  scaffolds.forEach((relationship) => {
    const targetTemplate = modelState.classes.find(
      (item) => item.id === relationship.to
    );
    if (!targetTemplate) {
      return;
    }
    const count = relationship.cardinalityHint === "many" ? 3 : 1;
    for (let i = 0; i < count; i += 1) {
      const angle =
        (Math.PI * 2 * instanceIndex) / Math.max(totalInstances, 1);
      const position = {
        x: instanceClass.position.x + Math.cos(angle) * radius,
        y: instanceClass.position.y + Math.sin(angle) * radius,
      };
      const baseName = `${instanceClass.name} — ${targetTemplate.name}`;
      const relatedName = count > 1 ? `${baseName} ${i + 1}` : baseName;
      const relatedInstance = createInstanceFromTemplate(targetTemplate, {
        name: relatedName,
        position,
        recordHistory: false,
      });
      if (count > 1) {
        applyOrderValue(relatedInstance, i + 1);
      }
      createRelationship(
        instanceClass.id,
        relatedInstance.id,
        relationship.type,
        {
          generateOnInstantiate: false,
          cardinalityHint: relationship.cardinalityHint,
          recordHistory: false,
        }
      );
      instanceIndex += 1;
    }
  });
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
      ? payload.relationships.map(normalizeRelationship)
      : [],
    templates: Array.isArray(payload.templates)
      ? payload.templates.filter((templateId) =>
          payload.classes.some((entry) => entry.id === templateId)
        )
      : [],
  };
  currentFileName = fileName;
  activeClassId = null;
  updateNextId();
  resetSelectionMode();
  closeModal(modelModal);
  closeModal(legendModal);
  closeModal(colorsModal);
  resetHistory();
  render();
  setStatus(fileName ? `Opened ${fileName}.` : "Project loaded.");
};

const handlePointerMove = (event) => {
  lastPointerPosition = { x: event.clientX, y: event.clientY };
  if (multiGrabState) {
    multiGrabState.current = getCanvasPoint(event);
    updateMultiGrabBox();
  }
  if (dragState && dragState.pointerId === event.pointerId) {
    if (!dragState.hasRecorded) {
      recordHistory();
      dragState.hasRecorded = true;
    }
    const point = getCanvasPoint(event);
    let nextPosition = {
      x: point.x - dragState.offsetX,
      y: point.y - dragState.offsetY,
    };
    nextPosition.x = Math.max(-canvasOriginOffset, nextPosition.x);
    nextPosition.y = Math.max(-canvasOriginOffset, nextPosition.y);
    if (isSnapEnabled) {
      nextPosition = snapPositionToGrid(nextPosition);
    }
    updateClass(dragState.id, { position: nextPosition }, { recordHistory: false });
    return;
  }

  if (panState && panState.pointerId === event.pointerId) {
    const deltaX = event.clientX - panState.startX;
    const deltaY = event.clientY - panState.startY;
    canvas.scrollLeft = panState.scrollLeft - deltaX;
    canvas.scrollTop = panState.scrollTop - deltaY;
  }
};

const handlePointerUp = (event) => {
  if (dragState && dragState.pointerId === event.pointerId) {
    const node = document.querySelector(`[data-class-id="${dragState.id}"]`);
    if (node) {
      node.classList.remove("is-dragging");
    }
    dragState = null;
  }

  if (panState && panState.pointerId === event.pointerId) {
    panState = null;
  }
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
  [modelModal, legendModal, colorsModal, budgetModal].forEach((modal) => {
    if (modal) {
      initializeModal(modal);
    }
  });
  setRelationshipType(relationshipType);
  setZoomLevel(1);
  setGridVisibility(false);
  setSnapEnabled(false);
  setViewOptionsOpen(false);
  setThemeMode(false);
  resetHistory();
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

createInstanceButton.addEventListener("click", () => {
  resetSelectionMode();
  const selectedTemplate = modelState.classes.find(
    (item) => item.id === activeClassId
  );
  if (selectedTemplate && selectedTemplate.kind === "template") {
    recordHistory();
    const instance = createInstanceFromTemplate(selectedTemplate, {
      recordHistory: false,
    });
    scaffoldRelationshipsForInstance(selectedTemplate, instance);
    setActiveClass(instance.id);
    return;
  }
  selectionMode = "instance";
  firstSelectionId = null;
  setStatus("Select a template to create an instance.");
});

createCoreInstanceButton.addEventListener("click", () => {
  resetSelectionMode();
  const selectedTemplate = modelState.classes.find(
    (item) => item.id === activeClassId
  );
  if (!selectedTemplate || selectedTemplate.kind !== "template") {
    setStatus("Select a template to create a core.");
    return;
  }
  const instance = createCoreInstanceGraph(selectedTemplate);
  setActiveClass(instance.id);
});

if (createHalfCoreButton) {
  createHalfCoreButton.addEventListener("click", () => {
    resetSelectionMode();
    const selectedTemplate = modelState.classes.find(
      (item) => item.id === activeClassId
    );
    if (!selectedTemplate || selectedTemplate.kind !== "template") {
      setStatus("Select a template to create a half-core.");
      return;
    }
    const instance = createHalfCoreInstanceGraph(selectedTemplate);
    setActiveClass(instance.id);
  });
}

const budgetStorageKey = "vefa-budget-data-v1";

const createBudgetId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const formatCurrency = (value) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const normalized = Number.isFinite(value) ? value : 0;
  return formatter.format(normalized);
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalized = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(normalized) ? null : normalized;
};

const getBudgetDefaults = () => ({
  bills: [],
  categories: [],
  rules: [],
  transactions: [],
});

const sanitizeBudgetState = (state) => ({
  bills: Array.isArray(state?.bills) ? state.bills : [],
  categories: Array.isArray(state?.categories) ? state.categories : [],
  rules: Array.isArray(state?.rules) ? state.rules : [],
  transactions: Array.isArray(state?.transactions) ? state.transactions : [],
});

const loadBudgetState = () => {
  if (!window.localStorage) {
    return getBudgetDefaults();
  }
  const stored = localStorage.getItem(budgetStorageKey);
  if (!stored) {
    return getBudgetDefaults();
  }
  try {
    return sanitizeBudgetState(JSON.parse(stored));
  } catch (error) {
    return getBudgetDefaults();
  }
};

const saveBudgetState = () => {
  if (!window.localStorage) {
    return;
  }
  localStorage.setItem(budgetStorageKey, JSON.stringify(budgetState));
};

const ensureBudgetState = () => {
  if (!budgetState) {
    budgetState = loadBudgetState();
  }
};

const getExistingBudgets = () => {
  if (!window.localStorage) {
    return [];
  }
  const stored = localStorage.getItem(budgetStorageKey);
  if (!stored) {
    return [];
  }
  return [{ id: "saved-budget", name: "Saved budget" }];
};

const renderBudgetSelector = () => {
  if (!budgetSelectorList || !budgetSelectorEmpty) {
    return;
  }
  budgetSelectorList.innerHTML = "";
  const budgets = getExistingBudgets();
  if (!budgets.length) {
    budgetSelectorEmpty.hidden = false;
    return;
  }
  budgetSelectorEmpty.hidden = true;
  budgets.forEach((budget) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = budget.name;
    button.addEventListener("click", () => {
      ensureBudgetState();
      navigateToPath("/budget");
      if (budgetModal) {
        closeModal(budgetModal);
      }
    });
    budgetSelectorList.appendChild(button);
  });
};

const openBudgetSelector = () => {
  if (!budgetModal) {
    return;
  }
  renderBudgetSelector();
  openModal(budgetModal);
};

const setActiveModule = (moduleName) => {
  activeModule = moduleName;
  document.body.dataset.view =
    moduleName === "budget" ? "budget" : moduleName === "menu" ? "menu" : "vefa";
  if (mainMenu) {
    mainMenu.hidden = moduleName !== "menu";
  }
  if (openBudgetButton) {
    openBudgetButton.setAttribute(
      "aria-pressed",
      moduleName === "budget" ? "true" : "false"
    );
  }
  if (budgetView) {
    budgetView.hidden = moduleName !== "budget";
  }
  if (searchInput) {
    searchInput.placeholder =
      moduleName === "budget" ? "Search transactions..." : "Search classes...";
    searchInput.value =
      moduleName === "budget" ? budgetSearchQuery : searchQuery;
  }
  if (moduleName === "budget") {
    ensureBudgetState();
    renderBudget();
  }
};

const normalizePathname = (pathname) => {
  if (!pathname || pathname === "/index.html") {
    return "/";
  }
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const getPathFromHash = (hash) => {
  if (!hash) {
    return "";
  }
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed) {
    return "/";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const getPathFromLocation = () => {
  const hashPath = getPathFromHash(window.location.hash);
  if (hashPath) {
    return hashPath;
  }
  if (window.location.protocol === "file:") {
    return "/";
  }
  return window.location.pathname;
};

const getModuleFromPath = (pathname) => {
  const normalized = normalizePathname(pathname);
  if (normalized === "/budget") {
    return "budget";
  }
  if (normalized === "/class-builder") {
    return "vefa";
  }
  return "menu";
};

const navigateToPath = (path) => {
  const normalized = normalizePathname(path);
  if (window.location.protocol === "file:") {
    const nextHash = `#${normalized}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setActiveModule(getModuleFromPath(normalized));
    return;
  }
  if (window.location.pathname !== normalized) {
    window.history.pushState({}, "", normalized);
  }
  setActiveModule(getModuleFromPath(normalized));
};

const getBillActual = (bill) => {
  const actualFromTransactions = budgetState.transactions
    .filter(
      (transaction) =>
        transaction.tag?.type === "bill" &&
        transaction.tag?.targetId === bill.id
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount || 0), 0);
  if (bill.actual === null || bill.actual === undefined) {
    return actualFromTransactions;
  }
  return bill.actual;
};

const getCategorySpent = (category) =>
  budgetState.transactions
    .filter(
      (transaction) =>
        transaction.tag?.type === "category" &&
        transaction.tag?.targetId === category.id
    )
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount || 0), 0);

const getMatchFromList = (list, description) => {
  const normalizedDescription = description.toLowerCase();
  const matches = list
    .filter((item) => item.name && normalizedDescription.includes(item.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length);
  return matches[0] || null;
};

const getTagLabel = (tag) => {
  if (!tag || tag.type === "unintentional") {
    return "Unintentional";
  }
  if (tag.type === "bill") {
    return (
      budgetState.bills.find((bill) => bill.id === tag.targetId)?.name ||
      "Bill"
    );
  }
  if (tag.type === "category") {
    return (
      budgetState.categories.find((category) => category.id === tag.targetId)
        ?.name || "Category"
    );
  }
  return "Unintentional";
};

const renderBudgetTotals = () => {
  if (!budgetTotals) {
    return;
  }
  const totalTransactions = budgetState.transactions.length;
  const billsRemaining = budgetState.bills.filter((bill) => !bill.paid).length;
  const totalBudget =
    budgetState.bills.reduce((sum, bill) => sum + (bill.budget || 0), 0) +
    budgetState.categories.reduce(
      (sum, category) => sum + (category.cap || 0),
      0
    );
  const totalSpent = budgetState.transactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount || 0),
    0
  );
  const remainingBalance = totalBudget - totalSpent;
  const totalOverBudget = budgetState.bills.reduce((sum, bill) => {
    const actual = getBillActual(bill);
    const budget = bill.budget || 0;
    if (actual === null || actual === undefined) {
      return sum;
    }
    return actual > budget ? sum + (actual - budget) : sum;
  }, 0);
  budgetTotals.innerHTML = [
    {
      label: "Loaded Transactions",
      value: totalTransactions.toString(),
    },
    {
      label: "Bills Remaining",
      value: billsRemaining.toString(),
    },
    {
      label: "Over Budget Bills",
      value: formatCurrency(totalOverBudget),
    },
    {
      label: "Remaining Balance",
      value: formatCurrency(remainingBalance),
    },
  ]
    .map(
      (item) => `<div class="budget-total-card">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
      </div>`
    )
    .join("");
};

const renderBudgetBills = () => {
  if (!budgetBillsTable) {
    return;
  }
  budgetBillsTable.innerHTML = "";
  const headerRow = document.createElement("div");
  headerRow.className = "budget-row budget-row--header";
  headerRow.innerHTML = `
    <div>Bill</div>
    <div>Budget</div>
    <div>Actual</div>
    <div>Paid/Unpaid</div>
  `;
  budgetBillsTable.appendChild(headerRow);
  budgetState.bills.forEach((bill) => {
    const row = document.createElement("div");
    row.className = "budget-row";
    const actualValue = getBillActual(bill);
    row.innerHTML = `
      <input type="text" value="${bill.name}" />
      <input type="number" step="0.01" min="0" value="${bill.budget ?? ""}" />
      <input type="number" step="0.01" min="0" value="${
        actualValue ?? ""
      }" />
      <label class="budget-row__toggle">
        <input type="checkbox" ${bill.paid ? "checked" : ""} />
        <span>${bill.paid ? "Paid" : "Unpaid"}</span>
      </label>
    `;
    const inputs = row.querySelectorAll("input");
    const nameInput = inputs[0];
    const budgetInput = inputs[1];
    const actualInput = inputs[2];
    const paidInput = inputs[3];
    nameInput.addEventListener("input", (event) => {
      bill.name = event.target.value;
      saveBudgetState();
      renderBudget();
    });
    nameInput.addEventListener("change", () => {
      applyAutoTagsToTransactions({ onlyUnintentional: true });
      saveBudgetState();
      renderBudget();
    });
    budgetInput.addEventListener("input", (event) => {
      const next = parseNumber(event.target.value);
      bill.budget = next ?? 0;
      saveBudgetState();
      renderBudgetTotals();
    });
    actualInput.addEventListener("input", (event) => {
      const next = parseNumber(event.target.value);
      bill.actual = next;
      saveBudgetState();
      renderBudgetTotals();
    });
    actualInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      const next = parseNumber(event.target.value);
      const budget = bill.budget ?? 0;
      if (next !== null && next >= budget) {
        bill.actual = next;
        bill.paid = true;
        saveBudgetState();
        renderBudget();
      }
    });
    paidInput.addEventListener("change", () => {
      bill.paid = paidInput.checked;
      saveBudgetState();
      renderBudgetTotals();
      renderBudgetBills();
    });
    budgetBillsTable.appendChild(row);
  });
};

const renderBudgetCategories = () => {
  if (!budgetCategoriesTable) {
    return;
  }
  budgetCategoriesTable.innerHTML = "";
  const headerRow = document.createElement("div");
  headerRow.className = "budget-row budget-row--header budget-row--categories";
  headerRow.innerHTML = `
    <div>Category</div>
    <div>Cap</div>
    <div>Spent</div>
  `;
  budgetCategoriesTable.appendChild(headerRow);
  budgetState.categories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "budget-row budget-row--categories";
    const spent = getCategorySpent(category);
    row.innerHTML = `
      <input type="text" value="${category.name}" />
      <input type="number" step="0.01" min="0" value="${
        category.cap ?? ""
      }" />
      <div>${formatCurrency(spent)}</div>
    `;
    const [nameInput, capInput] = row.querySelectorAll("input");
    nameInput.addEventListener("input", (event) => {
      category.name = event.target.value;
      saveBudgetState();
      renderBudget();
    });
    nameInput.addEventListener("change", () => {
      applyAutoTagsToTransactions({ onlyUnintentional: true });
      saveBudgetState();
      renderBudget();
    });
    capInput.addEventListener("input", (event) => {
      const next = parseNumber(event.target.value);
      category.cap = next ?? 0;
      saveBudgetState();
      renderBudgetTotals();
    });
    budgetCategoriesTable.appendChild(row);
  });
};

const renderBudgetUnintentional = () => {
  if (!budgetUnintentional) {
    return;
  }
  const unintentionalTransactions = budgetState.transactions.filter(
    (transaction) => transaction.tag?.type === "unintentional"
  );
  const total = unintentionalTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount || 0),
    0
  );
  const list = unintentionalTransactions.slice(0, 5);
  budgetUnintentional.innerHTML = `
    <div class="budget-unintentional__summary">
      <strong>${formatCurrency(total)}</strong>
      <span>${unintentionalTransactions.length} transactions</span>
    </div>
    <div class="budget-unintentional__list">
      ${list
        .map(
          (transaction) => `
            <div class="budget-unintentional__item">
              <span>${transaction.description}</span>
              <span>${formatCurrency(Math.abs(transaction.amount || 0))}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
};

const renderBudgetTransactions = () => {
  if (!budgetTransactions) {
    return;
  }
  const filteredTransactions = budgetState.transactions.filter((transaction) => {
    if (budgetFilterMode === "reviewed" && !transaction.reviewed) {
      return false;
    }
    if (budgetFilterMode === "unreviewed" && transaction.reviewed) {
      return false;
    }
    if (budgetSearchQuery) {
      return transaction.description
        .toLowerCase()
        .includes(budgetSearchQuery.toLowerCase());
    }
    return true;
  });
  if (filteredTransactions.length === 0) {
    budgetTransactions.innerHTML = `<p class="template-empty">No transactions loaded.</p>`;
    return;
  }
  budgetTransactions.innerHTML = "";
  filteredTransactions.forEach((transaction) => {
    const row = document.createElement("div");
    row.className = `budget-transaction ${
      transaction.reviewed ? "is-reviewed" : ""
    }`;
    const assignmentType = transaction.tag?.type || "unintentional";
    const assignmentTarget = transaction.tag?.targetId || "";
    row.innerHTML = `
      <div class="budget-transaction__meta">
        <strong>${transaction.description}</strong>
        <span>${transaction.date || "No date"}</span>
      </div>
      <div class="budget-transaction__assign">
        <label>
          <span>Type</span>
          <select data-role="assign-type">
            <option value="bill" ${
              assignmentType === "bill" ? "selected" : ""
            }>Bill</option>
            <option value="category" ${
              assignmentType === "category" ? "selected" : ""
            }>Category</option>
            <option value="unintentional" ${
              assignmentType === "unintentional" ? "selected" : ""
            }>Unintentional</option>
          </select>
        </label>
        <label>
          <span>Target</span>
          <select data-role="assign-target"></select>
        </label>
        <button type="button" data-action="assign">Assign</button>
      </div>
      <div class="budget-transaction__amount">
        ${formatCurrency(transaction.amount || 0)}
      </div>
      <div class="budget-transaction__meta">
        <span>Status</span>
        <strong>${transaction.reviewed ? "Reviewed" : "Unreviewed"}</strong>
      </div>
      <div class="budget-transaction__actions">
        <button type="button" data-action="review">
          ${transaction.reviewed ? "Unreview" : "Reviewed"}
        </button>
      </div>
    `;
    const assignTypeSelect = row.querySelector('[data-role="assign-type"]');
    const assignTargetSelect = row.querySelector('[data-role="assign-target"]');
    const assignButton = row.querySelector('[data-action="assign"]');
    const updateTargetOptions = (type) => {
      const targets = type === "category" ? budgetState.categories : budgetState.bills;
      if (type === "unintentional") {
        assignTargetSelect.innerHTML = `<option value="">None</option>`;
        assignTargetSelect.disabled = true;
        return;
      }
      assignTargetSelect.disabled = false;
      if (!targets.length) {
        assignTargetSelect.innerHTML = `<option value="">None</option>`;
        return;
      }
      assignTargetSelect.innerHTML = targets
        .map((item) => `<option value="${item.id}">${item.name}</option>`)
        .join("");
    };
    updateTargetOptions(assignmentType);
    if (assignmentType !== "unintentional" && assignmentTarget) {
      assignTargetSelect.value = assignmentTarget;
    }
    assignTypeSelect.addEventListener("change", (event) => {
      updateTargetOptions(event.target.value);
    });
    assignButton.addEventListener("click", () => {
      const type = assignTypeSelect.value;
      const targetId = assignTargetSelect.value || null;
      transaction.tag =
        type === "unintentional" ? { type } : { type, targetId };
      saveBudgetState();
      renderBudget();
    });
    row.querySelector('[data-action="review"]').addEventListener("click", () => {
      transaction.reviewed = !transaction.reviewed;
      saveBudgetState();
      renderBudgetTransactions();
      renderBudgetTotals();
    });
    budgetTransactions.appendChild(row);
  });
};

const getAutoTagForTransaction = ({ description }) => {
  const billMatch = getMatchFromList(budgetState.bills, description);
  if (billMatch) {
    return { type: "bill", targetId: billMatch.id };
  }
  const categoryMatch = getMatchFromList(budgetState.categories, description);
  if (categoryMatch) {
    return { type: "category", targetId: categoryMatch.id };
  }
  return { type: "unintentional" };
};

const applyAutoTagsToTransactions = ({ onlyUnintentional = false } = {}) => {
  budgetState.transactions.forEach((transaction) => {
    if (!transaction.description) {
      return;
    }
    if (onlyUnintentional && transaction.tag?.type !== "unintentional") {
      return;
    }
    const nextTag = getAutoTagForTransaction({
      description: transaction.description,
    });
    if (
      transaction.tag?.type === nextTag.type &&
      transaction.tag?.targetId === nextTag.targetId
    ) {
      return;
    }
    transaction.tag = nextTag;
    if (nextTag.type !== "unintentional") {
      transaction.reviewed = true;
    }
  });
};

const parseCsv = (text) => {
  const rows = [];
  let current = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      current.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (cell !== "" || current.length) {
        current.push(cell);
        rows.push(current);
        current = [];
        cell = "";
      }
      continue;
    }
    cell += char;
  }
  if (cell !== "" || current.length) {
    current.push(cell);
    rows.push(current);
  }
  return rows;
};

const importTransactionsFromCsv = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const rows = parseCsv(text);
    if (!rows.length) {
      setStatus("No transactions found in CSV.");
      return;
    }
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const getIndex = (matches) =>
      headers.findIndex((header) =>
        matches.some((match) => header.includes(match))
      );
    const dateIndex = getIndex(["date", "posted"]);
    const descriptionIndex = getIndex(["description", "memo", "payee"]);
    const amountIndex = getIndex(["amount"]);
    const debitIndex = getIndex(["debit", "withdrawal"]);
    const creditIndex = getIndex(["credit", "deposit"]);
    const existingKeys = new Set(
      budgetState.transactions.map(
        (transaction) =>
          `${transaction.date}-${transaction.description}-${transaction.amount}`
      )
    );
    const newTransactions = rows.slice(1).reduce((acc, row) => {
      const description = row[descriptionIndex] || "Transaction";
      const date = row[dateIndex] || "";
      let amount = parseNumber(row[amountIndex]);
      if (amount === null) {
        const debit = parseNumber(row[debitIndex]) || 0;
        const credit = parseNumber(row[creditIndex]) || 0;
        amount = credit - debit;
      }
      if (amount === null) {
        return acc;
      }
      const key = `${date}-${description}-${amount}`;
      if (existingKeys.has(key)) {
        return acc;
      }
      const autoTag = getAutoTagForTransaction({ description });
      const transaction = {
        id: createBudgetId("txn"),
        date,
        description,
        amount,
        reviewed: autoTag.type !== "unintentional",
        tag: autoTag,
      };
      acc.push(transaction);
      existingKeys.add(key);
      return acc;
    }, []);
    budgetState.transactions = [...newTransactions, ...budgetState.transactions];
    applyAutoTagsToTransactions({ onlyUnintentional: true });
    saveBudgetState();
    renderBudget();
    if (newTransactions.length) {
      setStatus(`Imported ${newTransactions.length} transactions.`);
    } else {
      setStatus("No new transactions found.");
    }
  };
  reader.readAsText(file);
};

const exportBudgetJson = () => {
  const blob = new Blob([JSON.stringify(budgetState, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget.json";
  link.click();
  URL.revokeObjectURL(url);
};

const importBudgetJson = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      budgetState = sanitizeBudgetState(JSON.parse(event.target.result));
      saveBudgetState();
      renderBudget();
    } catch (error) {
      setStatus("Invalid budget JSON.");
    }
  };
  reader.readAsText(file);
};

const renderBudget = () => {
  if (activeModule !== "budget") {
    return;
  }
  renderBudgetTotals();
  renderBudgetBills();
  renderBudgetCategories();
  renderBudgetUnintentional();
  renderBudgetTransactions();
};

openLegendButton.addEventListener("click", () => toggleModal(legendModal));
openModelButton.addEventListener("click", () => {
  exportOutput.value = exportJson();
  toggleModal(modelModal);
});
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

if (zoomInButton) {
  zoomInButton.addEventListener("click", () => adjustZoom(1));
}

if (zoomOutButton) {
  zoomOutButton.addEventListener("click", () => adjustZoom(-1));
}

if (zoomResetButton) {
  zoomResetButton.addEventListener("click", () => setZoomLevel(1));
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    if (activeModule === "budget") {
      budgetSearchQuery = event.target.value;
      renderBudgetTransactions();
      return;
    }
    searchQuery = event.target.value;
    updateSearchHighlights();
  });
}

if (undoButton) {
  undoButton.addEventListener("click", () => undo());
}

if (redoButton) {
  redoButton.addEventListener("click", () => redo());
}

if (viewOptionsToggle) {
  viewOptionsToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setViewOptionsOpen(!isViewOptionsOpen);
  });
}

if (fitToScreenButton) {
  fitToScreenButton.addEventListener("click", () => fitToScreen());
}

if (gridToggleButton) {
  gridToggleButton.addEventListener("click", () =>
    setGridVisibility(!isGridVisible)
  );
}

if (snapToggleButton) {
  snapToggleButton.addEventListener("click", () =>
    setSnapEnabled(!isSnapEnabled)
  );
}

if (viewDefinitionsButton) {
  viewDefinitionsButton.addEventListener("click", () =>
    toggleModal(legendModal)
  );
}

if (themeToggleButtons.length) {
  themeToggleButtons.forEach((button) => {
    button.addEventListener("click", () => setThemeMode(!isDarkMode));
  });
}

const syncModuleWithLocation = () => {
  setActiveModule(getModuleFromPath(getPathFromLocation()));
};

syncModuleWithLocation();
window.addEventListener("popstate", () => {
  syncModuleWithLocation();
});
window.addEventListener("hashchange", () => {
  syncModuleWithLocation();
});

if (openBudgetButton) {
  openBudgetButton.addEventListener("click", () => openBudgetSelector());
}

if (openClassBuilderButton) {
  openClassBuilderButton.addEventListener("click", () =>
    navigateToPath("/class-builder")
  );
}

if (openBudgetBuilderButton) {
  openBudgetBuilderButton.addEventListener("click", () => {
    openBudgetSelector();
  });
}

if (budgetNewButton) {
  budgetNewButton.addEventListener("click", () => {
    budgetState = getBudgetDefaults();
    saveBudgetState();
    navigateToPath("/budget");
    if (budgetModal) {
      closeModal(budgetModal);
    }
  });
}

if (budgetImportCsvButton) {
  budgetImportCsvButton.addEventListener("click", () => {
    if (budgetCsvInput) {
      budgetCsvInput.value = "";
      budgetCsvInput.click();
    }
  });
}

if (budgetCsvInput) {
  budgetCsvInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      importTransactionsFromCsv(file);
    }
  });
}

if (budgetExportJsonButton) {
  budgetExportJsonButton.addEventListener("click", () => exportBudgetJson());
}

if (budgetImportJsonButton) {
  budgetImportJsonButton.addEventListener("click", () => {
    if (budgetJsonInput) {
      budgetJsonInput.value = "";
      budgetJsonInput.click();
    }
  });
}

if (budgetJsonInput) {
  budgetJsonInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      importBudgetJson(file);
    }
  });
}

if (budgetAddBillForm) {
  budgetAddBillForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = event.target.billName.value.trim();
    const budget = parseNumber(event.target.billBudget.value) ?? 0;
    const actual = parseNumber(event.target.billActual.value);
    const paid = event.target.billStatus.value === "paid";
    if (!name) {
      return;
    }
    budgetState.bills.push({
      id: createBudgetId("bill"),
      name,
      budget,
      actual,
      paid,
    });
    applyAutoTagsToTransactions({ onlyUnintentional: true });
    event.target.reset();
    saveBudgetState();
    renderBudget();
  });
}

if (budgetAddCategoryForm) {
  budgetAddCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = event.target.categoryName.value.trim();
    const cap = parseNumber(event.target.categoryCap.value) ?? 0;
    if (!name) {
      return;
    }
    budgetState.categories.push({
      id: createBudgetId("cat"),
      name,
      cap,
    });
    applyAutoTagsToTransactions({ onlyUnintentional: true });
    event.target.reset();
    saveBudgetState();
    renderBudget();
  });
}

if (budgetFilter) {
  budgetFilter.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    budgetFilterMode = button.dataset.filter;
    budgetFilter.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderBudgetTransactions();
  });
}

document.addEventListener("pointerdown", (event) => {
  if (!isViewOptionsOpen) {
    return;
  }
  if (
    (viewOptionsPanel && viewOptionsPanel.contains(event.target)) ||
    (viewOptionsToggle && viewOptionsToggle.contains(event.target))
  ) {
    return;
  }
  setViewOptionsOpen(false);
});

document.addEventListener("contextmenu", (event) => {
  if (!multiGrabState) {
    return;
  }
  event.preventDefault();
  exitMultiGrab();
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

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "g") {
    return;
  }
  if (event.repeat || isTextInputTarget(event)) {
    return;
  }
  if (multiGrabState) {
    return;
  }
  const fallbackPoint = (() => {
    const rect = canvasContent.getBoundingClientRect();
    return getCanvasPointFromClient(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  })();
  const startPoint = lastPointerPosition
    ? getCanvasPointFromClient(lastPointerPosition.x, lastPointerPosition.y)
    : fallbackPoint;
  startMultiGrab(startPoint);
});

canvas.addEventListener("pointerdown", (event) => {
  if (multiGrabState) {
    event.preventDefault();
    if (event.button === 2) {
      exitMultiGrab();
      return;
    }
    if (event.button === 0) {
      selectMultiGrabNodes();
      exitMultiGrab();
    }
    return;
  }
  if (!isCanvasPanTarget(event) || isNoDragTarget(event)) {
    return;
  }
  if (event.button !== 0) {
    return;
  }
  panState = {
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: canvas.scrollLeft,
    scrollTop: canvas.scrollTop,
    pointerId: event.pointerId,
  };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("scroll", renderLines);
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const direction = event.deltaY > 0 ? -1 : 1;
  adjustZoom(direction);
});

canvas.addEventListener("click", (event) => {
  if (selectionMode) {
    return;
  }
  if (event.target.closest(".class-node")) {
    return;
  }
  clearActiveClass();
});

window.addEventListener("resize", renderLines);
document.addEventListener("pointermove", handlePointerMove);
document.addEventListener("pointerup", handlePointerUp);
document.addEventListener("pointercancel", handlePointerUp);

initialize();
