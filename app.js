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
const primaryToolbar = document.getElementById("primary-toolbar");
const budgetTools = document.getElementById("budget-tools");
const miniToolbar = document.querySelector(".mini-toolbar");
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
const workspaceNameInput = document.getElementById("workspace-name");
const workspaceSaveButton = document.getElementById("workspace-save");
const workspaceImportButton = document.getElementById("workspace-import");
const workspaceExportButton = document.getElementById("workspace-export");
const budgetSelectorList = document.getElementById("budget-selector-list");
const budgetSelectorEmpty = document.getElementById("budget-selector-empty");
const budgetTotals = document.getElementById("budget-totals");
const budgetBillsTable = document.getElementById("budget-bills-table");
const budgetCategoriesTable = document.getElementById("budget-categories-table");
const budgetUnintentional = document.getElementById("budget-unintentional");
const budgetTransactions = document.getElementById("budget-transactions");
const budgetTransactionsSummary = document.getElementById(
  "budget-transactions-summary"
);
const budgetFilter = document.getElementById("budget-filter");
const budgetImportCsvButton = document.getElementById("budget-import-csv");
const budgetExportJsonButton = document.getElementById("budget-export-json");
const budgetImportJsonButton = document.getElementById("budget-import-json");
const budgetNewSidebarButton = document.getElementById("budget-new-sidebar");
const workspaceSaveSidebarButton = document.getElementById("workspace-save-sidebar");
const workspaceExportSidebarButton = document.getElementById(
  "workspace-export-sidebar"
);
const workspaceOpenButton = document.getElementById("workspace-open");
const budgetMainMenuButton = document.getElementById("budget-main-menu");
const budgetCsvInput = document.getElementById("budget-csv-input");
const budgetJsonInput = document.getElementById("budget-json-input");
const workspaceJsonInput = document.getElementById("workspace-json-input");
const budgetAddBillForm = document.getElementById("budget-add-bill");
const budgetAddCategoryForm = document.getElementById("budget-add-category");
const budgetAddTransactionForm = document.getElementById("budget-add-transaction");
const toggleTooltipsButton = document.getElementById("toggle-tooltips");
const budgetNetBalance = document.getElementById("budget-net-balance");
const budgetCollapseCategoriesButton = document.getElementById(
  "budget-collapse-categories"
);
const budgetExpandCategoriesButton = document.getElementById(
  "budget-expand-categories"
);

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
let activeWorkspaceId = null;
let activeWorkspace = null;
let budgetFilterMode = "all";
let budgetSearchQuery = "";
let tooltipsEnabled = true;
let collapsedCategoryIds = new Set();
let budgetDerivedState = null;

const assignmentFeedback = new Map();

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

const setTooltipsEnabled = (enabled) => {
  tooltipsEnabled = enabled;
  document.body.dataset.tooltips = tooltipsEnabled ? "true" : "false";
  if (toggleTooltipsButton) {
    toggleTooltipsButton.textContent = tooltipsEnabled
      ? "Hide Tool Tips"
      : "Show Tool Tips";
    toggleTooltipsButton.setAttribute(
      "aria-pressed",
      String(tooltipsEnabled)
    );
  }
  if (window.localStorage) {
    localStorage.setItem(tooltipsStorageKey, String(tooltipsEnabled));
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
  const storedTooltips = window.localStorage
    ? localStorage.getItem(tooltipsStorageKey)
    : null;
  setTooltipsEnabled(storedTooltips === "true");
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
const workspaceIndexKey = "bjorn.workspaces.index.v1";
const workspaceItemKey = (id) => `bjorn.workspaces.item.v1.${id}`;
const workspaceSchemaVersion = 1;
const workspaceType = "bjorn-workspace";
const tooltipsStorageKey = "vefa-tooltips-enabled";

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

const normalizeTransactionType = (transactionType) => {
  if (!transactionType) {
    return "";
  }
  return transactionType.trim().toLowerCase();
};

const formatTransactionTypeLabel = (transactionType) => {
  const normalized = normalizeTransactionType(transactionType);
  if (!normalized) {
    return "";
  }
  if (normalized === "credit") {
    return "Credit";
  }
  if (normalized === "transfer") {
    return "Transfer";
  }
  if (normalized === "payment") {
    return "Payment";
  }
  return transactionType.trim();
};

const transactionTypeIncludes = (transactionType, matchers) =>
  matchers.some((matcher) => transactionType.includes(matcher));

const getTransactionKind = (transaction) => {
  if (transaction?.tag?.type === "bill" || transaction?.tag?.type === "category") {
    return "payment";
  }
  const normalized = normalizeTransactionType(transaction?.transactionType);
  if (transactionTypeIncludes(normalized, ["credit", "deposit", "refund"])) {
    return "credit";
  }
  if (transactionTypeIncludes(normalized, ["transfer"])) {
    return "transfer";
  }
  if (transactionTypeIncludes(normalized, ["payment", "pos", "debit"])) {
    return "payment";
  }
  const amount = transaction?.amount ?? 0;
  return amount >= 0 ? "credit" : "payment";
};

const isCreditOrTransferTransaction = (transaction) =>
  ["credit", "transfer"].includes(getTransactionKind(transaction));

const isSpendTransaction = (transaction) =>
  getTransactionKind(transaction) === "payment";

const getNormalizedTransactionAmount = (transaction) =>
  Math.abs(transaction?.amount || 0);

const getTransactionImpact = (transaction) => {
  const amount = getNormalizedTransactionAmount(transaction);
  const kind = getTransactionKind(transaction);
  if (kind === "credit" || kind === "transfer") {
    return -amount;
  }
  return amount;
};

const getNetBalanceImpact = (transaction) => {
  const amount = getNormalizedTransactionAmount(transaction);
  const kind = getTransactionKind(transaction);
  if (kind === "credit") {
    return amount;
  }
  if (kind === "payment") {
    return -amount;
  }
  return 0;
};

const getSpendAmount = (transaction) =>
  isSpendTransaction(transaction) ? getNormalizedTransactionAmount(transaction) : 0;

const formatTransactionAmount = (transaction) =>
  formatCurrency(getTransactionImpact(transaction));

const getTransactionTypeLabel = (transaction) => {
  const label = formatTransactionTypeLabel(transaction?.transactionType);
  if (label) {
    return label;
  }
  const kind = getTransactionKind(transaction);
  return kind === "credit" ? "Credit" : kind === "transfer" ? "Transfer" : "Payment";
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

const createWorkspaceId = () =>
  `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeWorkspaceBudget = (budget, transactions) =>
  sanitizeBudgetState({
    bills: budget?.bills,
    categories: budget?.categories,
    rules: budget?.rules,
    transactions: Array.isArray(transactions) ? transactions : [],
  });

const createWorkspace = ({
  id,
  name,
  savedAt,
  budget,
  transactions,
  ui,
} = {}) => {
  const normalized = normalizeWorkspaceBudget(budget, transactions);
  return {
    schemaVersion: workspaceSchemaVersion,
    type: workspaceType,
    id: id || createWorkspaceId(),
    name: name || "Untitled workspace",
    savedAt: savedAt || new Date().toISOString(),
    budget: {
      bills: normalized.bills,
      categories: normalized.categories,
      rules: normalized.rules,
    },
    transactions: normalized.transactions,
    ui: {
      budgetFilterMode: ui?.budgetFilterMode || "all",
      budgetSearchQuery: ui?.budgetSearchQuery || "",
      collapsedCategoryIds: Array.isArray(ui?.collapsedCategoryIds)
        ? ui.collapsedCategoryIds
        : [],
    },
  };
};

const normalizeWorkspace = (workspace) => {
  if (!workspace) {
    return null;
  }
  if (
    workspace.type !== workspaceType ||
    workspace.schemaVersion !== workspaceSchemaVersion
  ) {
    return null;
  }
  return createWorkspace({
    id: workspace.id,
    name: workspace.name,
    savedAt: workspace.savedAt,
    budget: workspace.budget,
    transactions: workspace.transactions,
    ui: workspace.ui,
  });
};

const getWorkspaceIndex = () => {
  if (!window.localStorage) {
    return [];
  }
  const stored = localStorage.getItem(workspaceIndexKey);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry) => entry && entry.id && entry.name && entry.savedAt
    );
  } catch (error) {
    return [];
  }
};

const saveWorkspaceIndex = (index) => {
  if (!window.localStorage) {
    return;
  }
  localStorage.setItem(workspaceIndexKey, JSON.stringify(index));
};

const listWorkspaces = () => {
  const index = getWorkspaceIndex();
  return index.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
};

const readWorkspaceItem = (id) => {
  if (!window.localStorage) {
    return null;
  }
  const stored = localStorage.getItem(workspaceItemKey(id));
  if (!stored) {
    return null;
  }
  try {
    return normalizeWorkspace(JSON.parse(stored));
  } catch (error) {
    return null;
  }
};

const persistWorkspaceItem = (workspace) => {
  if (!window.localStorage || !workspace?.id) {
    return;
  }
  localStorage.setItem(workspaceItemKey(workspace.id), JSON.stringify(workspace));
};

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

const normalizeBudgetTransactions = (state) => {
  state.transactions.forEach((transaction) => {
    if (!transaction.id) {
      transaction.id = createBudgetId("txn");
    }
    if (!transaction.tag) {
      transaction.tag = { type: "unintentional" };
    }
    if (typeof transaction.reviewed !== "boolean") {
      transaction.reviewed = false;
    }
    if (typeof transaction.autoAssigned !== "boolean") {
      transaction.autoAssigned = false;
    }
    syncTransactionAssignmentFields(transaction);
  });
};

const updateActiveWorkspaceFromBudgetState = () => {
  if (!activeWorkspace || !budgetState) {
    return;
  }
  activeWorkspace.budget = {
    bills: budgetState.bills,
    categories: budgetState.categories,
    rules: budgetState.rules,
  };
  activeWorkspace.transactions = budgetState.transactions;
  activeWorkspace.ui = {
    budgetFilterMode,
    budgetSearchQuery,
    collapsedCategoryIds: Array.from(collapsedCategoryIds),
  };
};

const hydrateBudgetStateFromWorkspace = (workspace) => {
  const normalized = sanitizeBudgetState({
    bills: workspace?.budget?.bills,
    categories: workspace?.budget?.categories,
    rules: workspace?.budget?.rules,
    transactions: workspace?.transactions,
  });
  budgetState = normalized;
  if (workspace?.budget) {
    workspace.budget.bills = normalized.bills;
    workspace.budget.categories = normalized.categories;
    workspace.budget.rules = normalized.rules;
  }
  if (workspace) {
    workspace.transactions = normalized.transactions;
  }
};

const syncBudgetFilterButtons = () => {
  if (!budgetFilter) {
    return;
  }
  budgetFilter.querySelectorAll("button").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.filter === budgetFilterMode);
  });
};

const applyWorkspaceState = (workspace) => {
  activeWorkspace = workspace;
  activeWorkspaceId = workspace.id;
  hydrateBudgetStateFromWorkspace(workspace);
  budgetFilterMode = workspace.ui?.budgetFilterMode || "all";
  budgetSearchQuery = workspace.ui?.budgetSearchQuery || "";
  collapsedCategoryIds = new Set(workspace.ui?.collapsedCategoryIds || []);
  normalizeBudgetTransactions(budgetState);
  syncBudgetFilterButtons();
  if (searchInput && activeModule === "budget") {
    searchInput.value = budgetSearchQuery;
  }
};

const migrateLegacyBudgetStateIfNeeded = () => {
  if (!window.localStorage) {
    return null;
  }
  if (getWorkspaceIndex().length) {
    return null;
  }
  const stored = localStorage.getItem(budgetStorageKey);
  if (!stored) {
    return null;
  }
  try {
    const legacy = sanitizeBudgetState(JSON.parse(stored));
    const workspace = createWorkspace({
      name: "Migrated workspace",
      savedAt: new Date().toISOString(),
      budget: legacy,
      transactions: legacy.transactions,
      ui: {
        budgetFilterMode: "all",
        budgetSearchQuery: "",
        collapsedCategoryIds: [],
      },
    });
    saveWorkspaceIndex([
      { id: workspace.id, name: workspace.name, savedAt: workspace.savedAt },
    ]);
    persistWorkspaceItem(workspace);
    return workspace;
  } catch (error) {
    return null;
  }
};

const loadMostRecentWorkspace = () => {
  const index = listWorkspaces();
  for (const entry of index) {
    const workspace = readWorkspaceItem(entry.id);
    if (workspace) {
      return workspace;
    }
  }
  return null;
};

const ensureActiveWorkspace = () => {
  if (activeWorkspace) {
    return;
  }
  const migrated = migrateLegacyBudgetStateIfNeeded();
  if (migrated) {
    applyWorkspaceState(migrated);
    return;
  }
  const existing = loadMostRecentWorkspace();
  if (existing) {
    applyWorkspaceState(existing);
    return;
  }
  applyWorkspaceState(createWorkspace());
};

const saveBudgetState = () => {
  if (!activeWorkspace || !budgetState) {
    return;
  }
  updateActiveWorkspaceFromBudgetState();
  if (!window.localStorage) {
    return;
  }
  const index = getWorkspaceIndex();
  const existing = index.find((entry) => entry.id === activeWorkspace.id);
  if (!existing) {
    return;
  }
  persistWorkspaceItem(activeWorkspace);
};

const ensureBudgetState = () => {
  if (!budgetState) {
    budgetState = getBudgetDefaults();
  }
  normalizeBudgetTransactions(budgetState);
};

const renderWorkspaceSelector = () => {
  if (!budgetSelectorList || !budgetSelectorEmpty) {
    return;
  }
  budgetSelectorList.innerHTML = "";
  const workspaces = listWorkspaces();
  if (!workspaces.length) {
    budgetSelectorEmpty.hidden = false;
    return;
  }
  budgetSelectorEmpty.hidden = true;
  workspaces.forEach((workspace) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = workspace.name;
    button.addEventListener("click", () => {
      const loaded = loadWorkspace(workspace.id);
      if (!loaded) {
        return;
      }
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
  renderWorkspaceSelector();
  if (workspaceNameInput) {
    workspaceNameInput.value = activeWorkspace?.name || "";
  }
  openModal(budgetModal);
};

const createNewWorkspace = (name) => {
  const workspace = createWorkspace({
    name: name || "Untitled workspace",
    budget: getBudgetDefaults(),
    transactions: [],
    ui: {
      budgetFilterMode: "all",
      budgetSearchQuery: "",
      collapsedCategoryIds: [],
    },
  });
  applyWorkspaceState(workspace);
  renderBudget();
};

const saveActiveWorkspace = (name) => {
  if (!budgetState) {
    budgetState = getBudgetDefaults();
  }
  if (!activeWorkspace) {
    activeWorkspace = createWorkspace({
      name: name || "Untitled workspace",
      budget: budgetState,
      transactions: budgetState.transactions,
      ui: {
        budgetFilterMode,
        budgetSearchQuery,
        collapsedCategoryIds: Array.from(collapsedCategoryIds),
      },
    });
    activeWorkspaceId = activeWorkspace.id;
  }
  if (name) {
    activeWorkspace.name = name;
  }
  updateActiveWorkspaceFromBudgetState();
  activeWorkspace.savedAt = new Date().toISOString();
  const index = getWorkspaceIndex();
  const existing = index.find((entry) => entry.id === activeWorkspace.id);
  if (existing) {
    existing.name = activeWorkspace.name;
    existing.savedAt = activeWorkspace.savedAt;
  } else {
    index.push({
      id: activeWorkspace.id,
      name: activeWorkspace.name,
      savedAt: activeWorkspace.savedAt,
    });
  }
  saveWorkspaceIndex(index);
  persistWorkspaceItem(activeWorkspace);
  renderWorkspaceSelector();
  setStatus("Workspace saved.");
};

const loadWorkspace = (id) => {
  const workspace = readWorkspaceItem(id);
  if (!workspace) {
    setStatus("Workspace not found.");
    return null;
  }
  applyWorkspaceState(workspace);
  renderBudget();
  return workspace;
};

const exportWorkspace = () => {
  if (!activeWorkspace) {
    setStatus("No active workspace to export.");
    return;
  }
  updateActiveWorkspaceFromBudgetState();
  const blob = new Blob([JSON.stringify(activeWorkspace, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = activeWorkspace.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  link.href = url;
  link.download = `${safeName || "workspace"}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importWorkspace = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      const normalized = normalizeWorkspace(parsed);
      if (!normalized) {
        setStatus("Invalid workspace JSON.");
        return;
      }
      const index = getWorkspaceIndex();
      if (index.some((entry) => entry.id === normalized.id)) {
        normalized.id = createWorkspaceId();
      }
      normalized.savedAt = new Date().toISOString();
      persistWorkspaceItem(normalized);
      index.push({
        id: normalized.id,
        name: normalized.name,
        savedAt: normalized.savedAt,
      });
      saveWorkspaceIndex(index);
      renderWorkspaceSelector();
      setStatus(`Imported workspace "${normalized.name}".`);
    } catch (error) {
      setStatus("Invalid workspace JSON.");
    }
  };
  reader.readAsText(file);
};

const setActiveModule = (moduleName) => {
  activeModule = moduleName;
  document.body.dataset.view =
    moduleName === "budget" ? "budget" : moduleName === "menu" ? "menu" : "vefa";
  if (primaryToolbar && budgetTools && miniToolbar) {
    if (moduleName === "budget") {
      if (!budgetTools.contains(primaryToolbar)) {
        budgetTools.appendChild(primaryToolbar);
      }
    } else if (!miniToolbar.contains(primaryToolbar)) {
      miniToolbar.appendChild(primaryToolbar);
    }
  }
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
    ensureActiveWorkspace();
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

const normalizeMatchText = (value) => {
  if (!value) {
    return "";
  }
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const getMatchRuleForDescription = (description) => {
  const normalizedDescription = normalizeMatchText(description);
  if (!normalizedDescription || !budgetState?.rules?.length) {
    return null;
  }
  const candidates = budgetState.rules
    .filter((rule) => rule?.targetType && rule?.targetId)
    .filter((rule) => !rule.matchType || rule.matchType === "contains")
    .map((rule) => ({
      ...rule,
      normalizedMatch: normalizeMatchText(rule.pattern ?? rule.match),
    }))
    .filter((rule) => rule.normalizedMatch)
    .filter((rule) => normalizedDescription.includes(rule.normalizedMatch))
    .sort((a, b) => b.normalizedMatch.length - a.normalizedMatch.length);
  if (!candidates.length) {
    return null;
  }
  const top = candidates[0];
  const tied = candidates.filter(
    (candidate) =>
      candidate.normalizedMatch.length === top.normalizedMatch.length &&
      candidate.targetId !== top.targetId
  );
  if (tied.length) {
    return null;
  }
  if (top.targetType === "bill") {
    const exists = budgetState.bills.some((bill) => bill.id === top.targetId);
    return exists ? top : null;
  }
  if (top.targetType === "category") {
    const exists = budgetState.categories.some(
      (category) => category.id === top.targetId
    );
    return exists ? top : null;
  }
  return null;
};

const getBestMatchFromList = (list, normalizedDescription) => {
  let best = null;
  let bestLength = 0;
  list.forEach((item) => {
    const normalizedName = normalizeMatchText(item.name);
    if (!normalizedName) {
      return;
    }
    if (!normalizedDescription.includes(normalizedName)) {
      return;
    }
    if (normalizedName.length > bestLength) {
      best = item;
      bestLength = normalizedName.length;
    }
  });
  return best;
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

const syncTransactionAssignmentFields = (transaction) => {
  const tag = transaction.tag || { type: "unintentional" };
  const type = tag.type || "unintentional";
  transaction.assignedTargetType = type;
  transaction.assignedTargetId =
    type === "unintentional" ? null : tag.targetId || null;
  transaction.assignedTargetName = getTagLabel(tag);
};

const setTransactionAssignment = (transaction, { type, targetId }) => {
  const normalizedType = type || "unintentional";
  if (normalizedType === "bill" || normalizedType === "category") {
    transaction.tag = { type: normalizedType, targetId };
  } else {
    transaction.tag = { type: "unintentional" };
  }
  syncTransactionAssignmentFields(transaction);
};

const upsertMatchRule = (description, { type, targetId }) => {
  const normalizedMatch = normalizeMatchText(description);
  if (!normalizedMatch || !type || !targetId) {
    return;
  }
  const existing = budgetState.rules.find((rule) => {
    const pattern = normalizeMatchText(rule.pattern ?? rule.match);
    return pattern === normalizedMatch && rule.targetId === targetId;
  });
  if (existing) {
    existing.lastMatched = getTodayIsoDate();
    return;
  }
  budgetState.rules.push({
    id: createBudgetId("rule"),
    matchType: "contains",
    pattern: normalizedMatch,
    targetType: type,
    targetId,
    createdFrom: "manual_assign",
    lastMatched: getTodayIsoDate(),
  });
};

const setCategoryCollapsed = (categoryId, isCollapsed) => {
  if (isCollapsed) {
    collapsedCategoryIds.add(categoryId);
  } else {
    collapsedCategoryIds.delete(categoryId);
  }
};

const recomputeBudgetDerivedState = () => {
  if (!budgetState) {
    budgetDerivedState = null;
    return null;
  }
  const billTransactionTotals = new Map();
  const billTransactionCounts = new Map();
  const categorySpentTotals = new Map();
  const billBudgetsTotal = budgetState.bills.reduce(
    (sum, bill) => sum + (bill.budget || 0),
    0
  );
  const categoryCapsTotal = budgetState.categories.reduce(
    (sum, category) => sum + (category.cap || 0),
    0
  );
  const totalTransactions = budgetState.transactions.length;
  const billsRemaining = budgetState.bills.filter((bill) => !bill.paid).length;
  const unintentionalTransactions = [];
  let totalSpent = 0;
  let netBalance = 0;

  budgetState.categories.forEach((category) => {
    categorySpentTotals.set(category.id, 0);
  });
  budgetState.bills.forEach((bill) => {
    billTransactionTotals.set(bill.id, 0);
    billTransactionCounts.set(bill.id, 0);
  });

  budgetState.transactions.forEach((transaction) => {
    const kind = getTransactionKind(transaction);
    totalSpent += getSpendAmount(transaction);
    netBalance += getNetBalanceImpact(transaction);
    if (
      transaction.tag?.type === "bill" &&
      transaction.tag?.targetId &&
      kind === "payment"
    ) {
      const current = billTransactionTotals.get(transaction.tag.targetId) || 0;
      billTransactionTotals.set(
        transaction.tag.targetId,
        current + getSpendAmount(transaction)
      );
      const count = billTransactionCounts.get(transaction.tag.targetId) || 0;
      billTransactionCounts.set(transaction.tag.targetId, count + 1);
    }
    if (
      transaction.tag?.type === "category" &&
      transaction.tag?.targetId &&
      kind === "payment"
    ) {
      const current =
        categorySpentTotals.get(transaction.tag.targetId) || 0;
      categorySpentTotals.set(
        transaction.tag.targetId,
        current + getSpendAmount(transaction)
      );
    }
    if (
      transaction.tag?.type === "unintentional" &&
      kind === "payment"
    ) {
      unintentionalTransactions.push(transaction);
    }
  });

  const billActuals = new Map();
  let billActualsTotal = 0;
  let totalOverBudget = 0;
  let paidBills = 0;

  budgetState.bills.forEach((bill) => {
    const transactionTotal = billTransactionTotals.get(bill.id) || 0;
    const transactionCount = billTransactionCounts.get(bill.id) || 0;
    const manualActual =
      bill.actual === null || bill.actual === undefined
        ? null
        : Math.abs(bill.actual);
    const actual =
      transactionCount > 0 ? transactionTotal : manualActual;
    billActuals.set(bill.id, actual);
    if (actual !== null && actual !== undefined) {
      billActualsTotal += actual;
      const budget = bill.budget || 0;
      if (actual > budget) {
        totalOverBudget += actual - budget;
      }
    }
    if (bill.paid) {
      paidBills += 1;
    }
  });

  let categorySpentTotal = 0;
  budgetState.categories.forEach((category) => {
    const spent = categorySpentTotals.get(category.id) || 0;
    categorySpentTotal += spent;
  });

  const totalBudget = billBudgetsTotal + categoryCapsTotal;
  const budgetRemaining =
    totalBudget - (billActualsTotal + categorySpentTotal);
  const remainingBalance = totalBudget - totalSpent;

  budgetDerivedState = {
    billActuals,
    categorySpentTotals,
    totalTransactions,
    billsRemaining,
    totalBudget,
    budgetRemaining,
    totalSpent,
    remainingBalance,
    netBalance,
    totalOverBudget,
    billTotals: {
      budget: billBudgetsTotal,
      actual: billActualsTotal,
      paid: paidBills,
      count: budgetState.bills.length,
    },
    categoryTotals: {
      cap: categoryCapsTotal,
      spent: categorySpentTotal,
    },
    unintentionalTransactions,
    unintentionalTotal: unintentionalTransactions.reduce(
      (sum, transaction) => sum + getSpendAmount(transaction),
      0
    ),
  };
  return budgetDerivedState;
};

const updateBudgetBillTotalsRow = (derived) => {
  if (!budgetBillsTable || !derived) {
    return;
  }
  const row = budgetBillsTable.querySelector(".budget-row--totals");
  if (!row) {
    return;
  }
  const budgetTotal = row.querySelector('[data-role="bills-budget-total"]');
  const actualTotal = row.querySelector('[data-role="bills-actual-total"]');
  const statusTotal = row.querySelector('[data-role="bills-status-total"]');
  if (budgetTotal) {
    budgetTotal.textContent = formatCurrency(derived.billTotals.budget);
  }
  if (actualTotal) {
    actualTotal.textContent = formatCurrency(derived.billTotals.actual);
  }
  if (statusTotal) {
    statusTotal.textContent = `${derived.billTotals.paid}/${derived.billTotals.count} Paid`;
  }
};

const updateBudgetCategoryTotalsRow = (derived) => {
  if (!budgetCategoriesTable || !derived) {
    return;
  }
  const row = budgetCategoriesTable.querySelector(".budget-row--totals");
  if (!row) {
    return;
  }
  const capTotal = row.querySelector('[data-role="categories-cap-total"]');
  const spentTotal = row.querySelector('[data-role="categories-spent-total"]');
  if (capTotal) {
    capTotal.textContent = formatCurrency(derived.categoryTotals.cap);
  }
  if (spentTotal) {
    spentTotal.textContent = formatCurrency(derived.categoryTotals.spent);
  }
};

const renderBudgetTotals = () => {
  if (!budgetTotals) {
    return;
  }
  const derived = recomputeBudgetDerivedState();
  if (!derived) {
    return;
  }
  if (budgetNetBalance) {
    const netValue = budgetNetBalance.querySelector("strong");
    if (netValue) {
      netValue.textContent = formatCurrency(derived.netBalance);
    }
  }
  budgetTotals.innerHTML = [
    {
      label: "Net Balance",
      value: formatCurrency(derived.netBalance),
      tooltip: "Net impact of actual credits and debits.",
    },
    {
      label: "Budget Remaining",
      value: formatCurrency(derived.budgetRemaining),
      tooltip:
        "Budget variance based on bill actuals and category spend.",
    },
    {
      label: "Budgeted Total",
      value: formatCurrency(derived.totalBudget),
      tooltip: "Sum of all planned bill budgets and category caps.",
    },
    {
      label: "Loaded Transactions",
      value: derived.totalTransactions.toString(),
      tooltip: "Number of transactions currently loaded.",
    },
    {
      label: "Bills Remaining",
      value: derived.billsRemaining.toString(),
      tooltip: "Bills still marked as unpaid.",
    },
    {
      label: "Over Budget Bills",
      value: formatCurrency(derived.totalOverBudget),
      tooltip: "How far bills are over their budgeted amounts.",
    },
  ]
    .map(
      (item) => `<div class="budget-total-card" data-tooltip="${item.tooltip}">
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
  const derived = recomputeBudgetDerivedState();
  if (!derived) {
    return;
  }
  budgetBillsTable.innerHTML = "";
  const headerRow = document.createElement("div");
  headerRow.className = "budget-row budget-row--header budget-row--bills";
  headerRow.innerHTML = `
    <div>Bill</div>
    <div>Budget</div>
    <div>Actual</div>
    <div>Paid/Unpaid</div>
    <div>Delete</div>
  `;
  budgetBillsTable.appendChild(headerRow);
  budgetState.bills.forEach((bill) => {
    const row = document.createElement("div");
    row.className = "budget-row budget-row--bills";
    const actualValue = derived.billActuals.get(bill.id);
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
      <button type="button" data-action="delete">Delete</button>
    `;
    const inputs = row.querySelectorAll("input");
    const nameInput = inputs[0];
    const budgetInput = inputs[1];
    const actualInput = inputs[2];
    const paidInput = inputs[3];
    const deleteButton = row.querySelector('[data-action="delete"]');
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
      updateBudgetBillTotalsRow(recomputeBudgetDerivedState());
    });
    actualInput.addEventListener("input", (event) => {
      const next = parseNumber(event.target.value);
      bill.actual = next === null ? null : Math.abs(next);
      saveBudgetState();
      renderBudgetTotals();
      updateBudgetBillTotalsRow(recomputeBudgetDerivedState());
    });
    actualInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      const next = parseNumber(event.target.value);
      const budget = bill.budget ?? 0;
      if (next !== null && next >= budget) {
        bill.actual = Math.abs(next);
        bill.paid = true;
        saveBudgetState();
        renderBudget();
      }
    });
    paidInput.addEventListener("change", () => {
      bill.paid = paidInput.checked;
      saveBudgetState();
      renderBudgetTotals();
      updateBudgetBillTotalsRow(recomputeBudgetDerivedState());
      renderBudgetBills();
    });
    deleteButton.addEventListener("click", () => {
      budgetState.bills = budgetState.bills.filter(
        (entry) => entry.id !== bill.id
      );
      budgetState.transactions.forEach((transaction) => {
        if (
          transaction.tag?.type === "bill" &&
          transaction.tag?.targetId === bill.id
        ) {
          setTransactionAssignment(transaction, { type: "unintentional" });
          transaction.reviewed = false;
          transaction.autoAssigned = false;
        }
      });
      saveBudgetState();
      renderBudget();
    });
    budgetBillsTable.appendChild(row);
  });
  const totalsRow = document.createElement("div");
  totalsRow.className = "budget-row budget-row--bills budget-row--totals";
  totalsRow.innerHTML = `
    <div><strong>Totals</strong></div>
    <div data-role="bills-budget-total">${formatCurrency(
      derived.billTotals.budget
    )}</div>
    <div data-role="bills-actual-total">${formatCurrency(
      derived.billTotals.actual
    )}</div>
    <div data-role="bills-status-total">${derived.billTotals.paid}/${
    derived.billTotals.count
  } Paid</div>
    <div></div>
  `;
  budgetBillsTable.appendChild(totalsRow);
};

const renderBudgetCategories = () => {
  if (!budgetCategoriesTable) {
    return;
  }
  const derived = recomputeBudgetDerivedState();
  if (!derived) {
    return;
  }
  budgetCategoriesTable.innerHTML = "";
  const headerRow = document.createElement("div");
  headerRow.className = "budget-row budget-row--header budget-row--categories";
  headerRow.innerHTML = `
    <div>Category</div>
    <div>Cap</div>
    <div>Spent</div>
    <div>Actions</div>
  `;
  budgetCategoriesTable.appendChild(headerRow);
  budgetState.categories.forEach((category) => {
    const group = document.createElement("div");
    group.className = "budget-category-group";
    const isCollapsed = collapsedCategoryIds.has(category.id);
    group.classList.toggle("is-collapsed", isCollapsed);
    const row = document.createElement("div");
    row.className = "budget-row budget-row--categories";
    const spent = derived.categorySpentTotals.get(category.id) || 0;
    row.innerHTML = `
      <input type="text" value="${category.name}" />
      <input type="number" step="0.01" min="0" value="${
        category.cap ?? ""
      }" />
      <div>${formatCurrency(spent)}</div>
      <div class="budget-row__actions">
        <button type="button" data-action="toggle">${
          isCollapsed ? "Expand" : "Collapse"
        }</button>
        <button type="button" data-action="delete">Remove</button>
      </div>
    `;
    const [nameInput, capInput] = row.querySelectorAll("input");
    const deleteButton = row.querySelector('[data-action="delete"]');
    const toggleButton = row.querySelector('[data-action="toggle"]');
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
      updateBudgetCategoryTotalsRow(recomputeBudgetDerivedState());
    });
    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        budgetState.categories = budgetState.categories.filter(
          (entry) => entry.id !== category.id
        );
        budgetState.transactions.forEach((transaction) => {
          if (
            transaction.tag?.type === "category" &&
            transaction.tag?.targetId === category.id
          ) {
            setTransactionAssignment(transaction, { type: "unintentional" });
            transaction.reviewed = false;
            transaction.autoAssigned = false;
          }
        });
        saveBudgetState();
        renderBudget();
      });
    }
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        setCategoryCollapsed(category.id, !collapsedCategoryIds.has(category.id));
        renderBudgetCategories();
      });
    }
    group.appendChild(row);
    const categoryTransactions = budgetState.transactions.filter(
      (transaction) =>
        transaction.tag?.type === "category" &&
        transaction.tag?.targetId === category.id
    );
    if (categoryTransactions.length && !isCollapsed) {
      const transactionList = document.createElement("div");
      transactionList.className = "budget-category-transactions";
      categoryTransactions.forEach((transaction) => {
        const transactionRow = document.createElement("div");
        transactionRow.className =
          "budget-row budget-row--category-transaction";
        const typeLabel = getTransactionTypeLabel(transaction);
        transactionRow.innerHTML = `
          <div>
            <strong>${transaction.description}</strong>
            <div class="budget-transaction__meta">
              <span>${transaction.date || "No date"}</span>
              <span>${typeLabel}</span>
            </div>
          </div>
          <div>${formatTransactionAmount(transaction)}</div>
          <div>${transaction.reviewed ? "Reviewed" : "Unreviewed"}</div>
          <button type="button" data-action="clear">Remove</button>
        `;
        const clearButton = transactionRow.querySelector(
          '[data-action="clear"]'
        );
          if (clearButton) {
            clearButton.addEventListener("click", () => {
              setTransactionAssignment(transaction, { type: "unintentional" });
              transaction.reviewed = false;
              transaction.autoAssigned = false;
              saveBudgetState();
              renderBudget();
            });
          }
        transactionList.appendChild(transactionRow);
      });
      group.appendChild(transactionList);
    }
    budgetCategoriesTable.appendChild(group);
  });
  const totalsRow = document.createElement("div");
  totalsRow.className = "budget-row budget-row--categories budget-row--totals";
  totalsRow.innerHTML = `
    <div><strong>Totals</strong></div>
    <div data-role="categories-cap-total">${formatCurrency(
      derived.categoryTotals.cap
    )}</div>
    <div data-role="categories-spent-total">${formatCurrency(
      derived.categoryTotals.spent
    )}</div>
    <div></div>
  `;
  budgetCategoriesTable.appendChild(totalsRow);
};

const renderBudgetUnintentional = () => {
  if (!budgetUnintentional) {
    return;
  }
  const derived = recomputeBudgetDerivedState();
  if (!derived) {
    return;
  }
  const list = derived.unintentionalTransactions;
  const billOptions = budgetState.bills
    .map(
      (bill) => `<option value="bill:${bill.id}">${bill.name}</option>`
    )
    .join("");
  const categoryOptions = budgetState.categories
    .map(
      (category) =>
        `<option value="category:${category.id}">${category.name}</option>`
    )
    .join("");
  const hasAssignments = billOptions.length || categoryOptions.length;
  const assignOptions = hasAssignments
    ? `
      <option value="">Select a bill or category</option>
      ${billOptions ? `<optgroup label="Bills">${billOptions}</optgroup>` : ""}
      ${
        categoryOptions
          ? `<optgroup label="Categories">${categoryOptions}</optgroup>`
          : ""
      }
    `
    : `<option value="">No bills or categories</option>`;
  budgetUnintentional.innerHTML = `
    <div class="budget-unintentional__summary">
      <strong>${formatCurrency(derived.unintentionalTotal)}</strong>
      <span>${list.length} transactions</span>
    </div>
    <div class="budget-unintentional__list">
      ${list
        .map(
          (transaction) => `
            <div class="budget-unintentional__item" data-transaction-id="${
              transaction.id
            }">
              <button
                type="button"
                class="budget-unintentional__assign-toggle"
                aria-expanded="false"
              >
                Assign
              </button>
              <div class="budget-unintentional__details">
                <span class="budget-unintentional__title">${
                  transaction.description
                }</span>
                <label class="budget-unintentional__assign">
                  <span>Assign to</span>
                  <select ${
                    hasAssignments ? "" : "disabled"
                  } data-role="unintentional-assign">
                    ${assignOptions}
                  </select>
                </label>
              </div>
              <span>${formatTransactionAmount(transaction)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
  budgetUnintentional
    .querySelectorAll(".budget-unintentional__item")
    .forEach((item) => {
      const toggle = item.querySelector(".budget-unintentional__assign-toggle");
      const select = item.querySelector('[data-role="unintentional-assign"]');
      if (!toggle || !select) {
        return;
      }
      const feedback = assignmentFeedback.get(item.dataset.transactionId);
      if (feedback) {
        const remaining = feedback.expiresAt - Date.now();
        if (remaining > 0) {
          toggle.disabled = true;
          toggle.textContent = feedback.label;
          toggle.classList.add("is-feedback");
          setTimeout(() => {
            assignmentFeedback.delete(item.dataset.transactionId);
            renderBudgetUnintentional();
          }, remaining);
        } else {
          assignmentFeedback.delete(item.dataset.transactionId);
        }
      }
      toggle.addEventListener("click", () => {
        item.classList.toggle("is-assigning");
        toggle.setAttribute(
          "aria-expanded",
          item.classList.contains("is-assigning") ? "true" : "false"
        );
        if (item.classList.contains("is-assigning")) {
          select.focus();
        }
      });
      select.addEventListener("change", (event) => {
        const selection = event.target.value;
        if (!selection) {
          return;
        }
        const [type, targetId] = selection.split(":");
        const transactionId = item.dataset.transactionId;
        const transaction = budgetState.transactions.find(
          (entry) => entry.id === transactionId
        );
        if (!transaction) {
          return;
        }
        setTransactionAssignment(transaction, { type, targetId });
        transaction.reviewed = true;
        transaction.autoAssigned = false;
        upsertMatchRule(transaction.description, { type, targetId });
        assignmentFeedback.set(transaction.id, {
          label: "Assigned ✓",
          expiresAt: Date.now() + 700,
        });
        saveBudgetState();
        renderBudget();
      });
  });
};

const renderBudgetTransactionsSummary = () => {
  if (!budgetTransactionsSummary) {
    return;
  }
  budgetTransactionsSummary.innerHTML = "";
  const filteredTransactions = budgetState.transactions.filter((transaction) => {
    return isCreditOrTransferTransaction(transaction);
  });
  if (!filteredTransactions.length) {
    budgetTransactionsSummary.innerHTML =
      '<p class="template-empty">No credits or transfers loaded yet.</p>';
    return;
  }
  const headerRow = document.createElement("div");
  headerRow.className = "budget-row budget-row--header budget-row--summary";
  headerRow.innerHTML = `
    <div>Payee</div>
    <div>Type</div>
    <div>Amount</div>
    <div>Date</div>
    <div>Remove</div>
  `;
  budgetTransactionsSummary.appendChild(headerRow);
  filteredTransactions.forEach((transaction) => {
    const row = document.createElement("div");
    row.className = "budget-row budget-row--summary";
    row.innerHTML = `
      <div>${transaction.description}</div>
      <div>${getTransactionTypeLabel(transaction)}</div>
      <div>${formatTransactionAmount(transaction)}</div>
      <div>${transaction.date || "No date"}</div>
      <button type="button" data-action="delete">Remove</button>
    `;
    const deleteButton = row.querySelector('[data-action="delete"]');
    if (deleteButton) {
      deleteButton.addEventListener("click", () => {
        budgetState.transactions = budgetState.transactions.filter(
          (entry) => entry.id !== transaction.id
        );
        saveBudgetState();
        renderBudget();
      });
    }
    budgetTransactionsSummary.appendChild(row);
  });
};

const renderBudgetTransactions = () => {
  if (!budgetTransactions) {
    return;
  }
  const filteredTransactions = budgetState.transactions.filter((transaction) => {
    if (!isSpendTransaction(transaction)) {
      return false;
    }
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
    budgetTransactions.innerHTML = `<p class="template-empty">No spend transactions loaded.</p>`;
    return;
  }
  budgetTransactions.innerHTML = "";
  filteredTransactions.forEach((transaction) => {
    syncTransactionAssignmentFields(transaction);
    const row = document.createElement("div");
    row.className = `budget-transaction ${
      transaction.reviewed ? "is-reviewed" : ""
    }`;
    const assignmentType = transaction.tag?.type || "unintentional";
    const assignmentTarget = transaction.tag?.targetId || "";
    const assignmentLabel =
      assignmentType !== "unintentional" ? getTagLabel(transaction.tag) : "";
    const statusMessage = assignmentLabel
      ? `Assigned to: ${assignmentLabel}`
      : "";
    const feedback = assignmentFeedback.get(transaction.id);
    row.innerHTML = `
      <div class="budget-transaction__header">
        <div class="budget-transaction__merchant">
          <strong>${transaction.description}</strong>
          <div class="budget-transaction__details">
            <span>${transaction.date || "No date"}</span>
            <span>${getTransactionTypeLabel(transaction)}</span>
          </div>
        </div>
        <div class="budget-transaction__amount">
          ${formatTransactionAmount(transaction)}
        </div>
      </div>
      <div class="budget-transaction__assign">
        <label>
          <span>Txn Type</span>
          <select data-role="transaction-type">
            <option value="payment">Payment</option>
            <option value="credit">Credit</option>
            <option value="transfer">Transfer</option>
          </select>
        </label>
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
      <div class="budget-transaction__footer">
        <span class="budget-transaction__status ${
          statusMessage ? "is-success" : ""
        }" data-role="assignment-status">${statusMessage}</span>
        <span class="budget-transaction__status ${
          transaction.reviewed ? "is-success" : "is-error"
        }">
          ${transaction.reviewed ? "Reviewed" : "Unreviewed"}
        </span>
        <div class="budget-transaction__actions">
          <button type="button" data-action="review">
            ${transaction.reviewed ? "Unreview" : "Reviewed"}
          </button>
          <button type="button" data-action="clear">Remove</button>
        </div>
      </div>
    `;
    const assignTypeSelect = row.querySelector('[data-role="assign-type"]');
    const assignTargetSelect = row.querySelector('[data-role="assign-target"]');
    const assignButton = row.querySelector('[data-action="assign"]');
    const statusElement = row.querySelector('[data-role="assignment-status"]');
    const transactionTypeSelect = row.querySelector(
      '[data-role="transaction-type"]'
    );
    if (feedback && assignButton) {
      const remaining = feedback.expiresAt - Date.now();
      if (remaining > 0) {
        assignButton.disabled = true;
        assignButton.textContent = feedback.label;
        assignButton.classList.add("is-feedback");
        setTimeout(() => {
          assignmentFeedback.delete(transaction.id);
          renderBudgetTransactions();
        }, remaining);
      } else {
        assignmentFeedback.delete(transaction.id);
      }
    }
    const currentKind = getTransactionKind(transaction);
    if (transactionTypeSelect) {
      transactionTypeSelect.value = currentKind;
      transactionTypeSelect.addEventListener("change", (event) => {
        const selected = event.target.value;
        transaction.transactionType =
          selected === "credit"
            ? "Credit"
            : selected === "transfer"
              ? "Transfer"
              : "Payment";
        saveBudgetState();
        renderBudget();
      });
    }
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
      if (type !== "unintentional" && !targetId) {
        if (statusElement) {
          statusElement.textContent = "Select a target to assign.";
          statusElement.classList.remove("is-success");
          statusElement.classList.add("is-error");
        }
        return;
      }
      setTransactionAssignment(transaction, { type, targetId });
      if (type !== "unintentional") {
        transaction.reviewed = true;
        transaction.autoAssigned = false;
        upsertMatchRule(transaction.description, { type, targetId });
      }
      saveBudgetState();
      const label = getTagLabel(transaction.tag);
      assignmentFeedback.set(transaction.id, {
        label: "Assigned ✓",
        expiresAt: Date.now() + 700,
      });
      if (statusElement) {
        statusElement.textContent = `Assigned to: ${label}`;
        statusElement.classList.remove("is-error");
        statusElement.classList.add("is-success");
      }
      renderBudget();
    });
    row.querySelector('[data-action="review"]').addEventListener("click", () => {
      transaction.reviewed = !transaction.reviewed;
      saveBudgetState();
      renderBudgetTransactions();
      renderBudgetTotals();
    });
    row.querySelector('[data-action="clear"]').addEventListener("click", () => {
      setTransactionAssignment(transaction, { type: "unintentional" });
      transaction.reviewed = false;
      transaction.autoAssigned = false;
      saveBudgetState();
      renderBudget();
    });
    budgetTransactions.appendChild(row);
  });
};

const getAutoTagForTransaction = (transaction) => {
  if (!transaction?.description) {
    return { type: "unintentional" };
  }
  const ruleMatch = getMatchRuleForDescription(transaction.description);
  if (ruleMatch) {
    return { type: ruleMatch.targetType, targetId: ruleMatch.targetId };
  }
  const normalizedDescription = normalizeMatchText(transaction.description);
  const billMatch = getBestMatchFromList(budgetState.bills, normalizedDescription);
  if (billMatch) {
    return { type: "bill", targetId: billMatch.id };
  }
  const categoryMatch = getBestMatchFromList(
    budgetState.categories,
    normalizedDescription
  );
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
    const nextTag = getAutoTagForTransaction(transaction);
    if (
      transaction.tag?.type === nextTag.type &&
      transaction.tag?.targetId === nextTag.targetId
    ) {
      syncTransactionAssignmentFields(transaction);
      return;
    }
    setTransactionAssignment(transaction, nextTag);
    transaction.autoAssigned = transaction.tag?.type !== "unintentional";
    transaction.reviewed = transaction.tag?.type !== "unintentional";
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
    ensureActiveWorkspace();
    ensureBudgetState();
    const text = event.target.result;
    const rows = parseCsv(text);
    if (!rows.length) {
      setStatus("No transactions found in CSV.");
      return;
    }
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const getIndex = (matches) =>
      headers.findIndex((header) =>
        matches.some((match) => header === match)
      );
    const dateIndex = getIndex(["date", "posted date"]);
    const descriptionIndex = getIndex(["description"]);
    const amountIndex = getIndex(["amount"]);
    const indicatorIndex = getIndex(["credit debit indicator"]);
    const typeIndex = getIndex(["type"]);
    const existingKeys = new Set(
      budgetState.transactions.map(
        (transaction) =>
          `${transaction.date}-${transaction.description}-${transaction.amount}`
      )
    );
    const newTransactions = rows.slice(1).reduce((acc, row) => {
      const description = row[descriptionIndex] || "Transaction";
      const date = row[dateIndex] || "";
      const amountRaw = parseNumber(row[amountIndex]);
      const amount = amountRaw === null ? null : Math.abs(amountRaw);
      const creditDebit = (row[indicatorIndex] || "").trim();
      const rawType = row[typeIndex] || "";
      const transactionType = rawType.trim() || creditDebit || null;
      if (amount === null) {
        return acc;
      }
      const key = `${date}-${description}-${amount}`;
      if (existingKeys.has(key)) {
        return acc;
      }
      const autoTag = getAutoTagForTransaction({
        description,
        amount,
        transactionType,
      });
      const transaction = {
        id: createBudgetId("txn"),
        date,
        description,
        amount,
        transactionType: transactionType || null,
        reviewed: autoTag.type !== "unintentional",
        autoAssigned: autoTag.type !== "unintentional",
        tag: autoTag,
      };
      syncTransactionAssignmentFields(transaction);
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
  ensureActiveWorkspace();
  ensureBudgetState();
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
      const imported = sanitizeBudgetState(JSON.parse(event.target.result));
      ensureActiveWorkspace();
      budgetState = imported;
      if (activeWorkspace) {
        activeWorkspace.budget.bills = imported.bills;
        activeWorkspace.budget.categories = imported.categories;
        activeWorkspace.budget.rules = imported.rules;
        activeWorkspace.transactions = imported.transactions;
      }
      normalizeBudgetTransactions(budgetState);
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
  renderBudgetTransactionsSummary();
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

if (toggleTooltipsButton) {
  toggleTooltipsButton.addEventListener("click", () =>
    setTooltipsEnabled(!tooltipsEnabled)
  );
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

if (workspaceOpenButton) {
  workspaceOpenButton.addEventListener("click", () => openBudgetSelector());
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
    createNewWorkspace();
    navigateToPath("/budget");
    if (budgetModal) {
      closeModal(budgetModal);
    }
  });
}

if (budgetNewSidebarButton) {
  budgetNewSidebarButton.addEventListener("click", () => {
    createNewWorkspace();
    navigateToPath("/budget");
  });
}

if (budgetMainMenuButton) {
  budgetMainMenuButton.addEventListener("click", () =>
    navigateToPath("/")
  );
}

if (budgetImportCsvButton) {
  budgetImportCsvButton.addEventListener("click", () => {
    if (budgetCsvInput) {
      budgetCsvInput.value = "";
      budgetCsvInput.click();
    }
  });
}

if (workspaceSaveButton) {
  workspaceSaveButton.addEventListener("click", () => {
    const name = workspaceNameInput?.value.trim();
    saveActiveWorkspace(name || undefined);
    if (workspaceNameInput && activeWorkspace?.name) {
      workspaceNameInput.value = activeWorkspace.name;
    }
  });
}

if (workspaceSaveSidebarButton) {
  workspaceSaveSidebarButton.addEventListener("click", () => {
    saveActiveWorkspace(workspaceNameInput?.value.trim() || undefined);
  });
}

if (workspaceExportButton) {
  workspaceExportButton.addEventListener("click", () => exportWorkspace());
}

if (workspaceExportSidebarButton) {
  workspaceExportSidebarButton.addEventListener("click", () => exportWorkspace());
}

if (workspaceImportButton) {
  workspaceImportButton.addEventListener("click", () => {
    if (workspaceJsonInput) {
      workspaceJsonInput.value = "";
      workspaceJsonInput.click();
    }
  });
}

if (workspaceJsonInput) {
  workspaceJsonInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      importWorkspace(file);
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
    const actualRaw = parseNumber(event.target.billActual.value);
    const actual = actualRaw === null ? null : Math.abs(actualRaw);
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

if (budgetAddTransactionForm) {
  budgetAddTransactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const description = event.target.transactionPayee.value.trim();
    const amount = parseNumber(event.target.transactionAmount.value);
    const transactionType = event.target.transactionType.value;
    const date = event.target.transactionDate.value || "";
    if (!description || amount === null) {
      return;
    }
    budgetState.transactions.unshift({
      id: createBudgetId("txn"),
      date,
      description,
      amount: Math.abs(amount),
      transactionType,
      reviewed: false,
      autoAssigned: false,
      tag: { type: "unintentional" },
    });
    syncTransactionAssignmentFields(budgetState.transactions[0]);
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

if (budgetCollapseCategoriesButton) {
  budgetCollapseCategoriesButton.addEventListener("click", () => {
    budgetState.categories.forEach((category) => {
      collapsedCategoryIds.add(category.id);
    });
    renderBudgetCategories();
  });
}

if (budgetExpandCategoriesButton) {
  budgetExpandCategoriesButton.addEventListener("click", () => {
    collapsedCategoryIds.clear();
    renderBudgetCategories();
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
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    adjustZoom(direction);
  }
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
