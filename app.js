const storageKey = "vefa-budget-maker";

const defaultBudgetConfig = {
  startingBalance: 0,
  fixedBills: [
    {
      id: "bill-rent",
      name: "Rent",
      monthlyBudget: 1600,
      keywords: ["rent", "leasing"],
      optionalAmountMatch: 1600,
      categoryHint: "Housing",
      overridePaid: false,
      overrideActual: null,
    },
    {
      id: "bill-internet",
      name: "Internet",
      monthlyBudget: 85,
      keywords: ["internet", "comcast", "xfinity"],
      optionalAmountMatch: 85,
      categoryHint: "Utilities",
      overridePaid: false,
      overrideActual: null,
    },
  ],
  runningCategories: [
    {
      id: "cat-groceries",
      name: "Groceries",
      cap: 450,
      keywords: ["grocery", "market", "whole foods", "aldi"],
    },
    {
      id: "cat-gas",
      name: "Gas",
      cap: 180,
      keywords: ["shell", "chevron", "exxon"],
    },
  ],
};

const state = {
  budgetConfig: structuredClone(defaultBudgetConfig),
  transactions: [],
  reviewFilter: "all",
  searchQuery: "",
  selectedTransactionId: null,
  activeAssignId: null,
  isDarkMode: true,
};

const statusText = document.getElementById("status");
const searchInput = document.getElementById("search-input");
const startingBalanceInput = document.getElementById("starting-balance");
const themeToggle = document.getElementById("theme-toggle");
const fixedBillsTable = document.getElementById("fixed-bills-table");
const runningCategoriesTable = document.getElementById("running-categories-table");
const transactionTable = document.getElementById("transaction-table");
const unintentionalList = document.getElementById("unintentional-list");
const unintentionalTotal = document.getElementById("unintentional-total");
const totalTransactions = document.getElementById("total-transactions");
const billsRemaining = document.getElementById("bills-remaining");
const remainingBalance = document.getElementById("remaining-balance");
const addBillButton = document.getElementById("add-bill");
const addCategoryButton = document.getElementById("add-category");
const configBills = document.getElementById("config-bills");
const configCategories = document.getElementById("config-categories");
const csvInput = document.getElementById("csv-input");
const budgetInput = document.getElementById("budget-input");
const importCsvButton = document.getElementById("import-csv");
const exportBudgetButton = document.getElementById("export-budget");
const importBudgetButton = document.getElementById("import-budget");
const filterButtons = document.querySelectorAll(".filter");
const assignModal = document.getElementById("assign-modal");
const assignDescription = document.getElementById("assign-description");
const assignTarget = document.getElementById("assign-target");
const saveAssign = document.getElementById("save-assign");
const cancelAssign = document.getElementById("cancel-assign");
const closeAssign = document.getElementById("close-assign");

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const createId = () => `id-${crypto.randomUUID()}`;

const sanitizeNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeKeywords = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    startingBalanceInput.value = state.budgetConfig.startingBalance.toFixed(2);
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    state.budgetConfig = parsed.budgetConfig || state.budgetConfig;
    state.transactions = parsed.transactions || [];
    state.isDarkMode = parsed.isDarkMode ?? true;
    startingBalanceInput.value = state.budgetConfig.startingBalance.toFixed(2);
  } catch (error) {
    console.error("Failed to load state", error);
  }
};

const persistState = () => {
  const payload = {
    budgetConfig: state.budgetConfig,
    transactions: state.transactions,
    isDarkMode: state.isDarkMode,
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
};

const formatMoney = (value) => moneyFormatter.format(value);

const matchByKeywords = (items, description, amount) => {
  const lowerDescription = description.toLowerCase();
  const normalizedAmount = Math.abs(amount);
  return items.find((item) => {
    if (!item.keywords || item.keywords.length === 0) {
      return false;
    }
    const matchesKeyword = item.keywords.some((keyword) =>
      lowerDescription.includes(keyword.toLowerCase())
    );
    if (!matchesKeyword) {
      return false;
    }
    if (item.optionalAmountMatch == null || item.optionalAmountMatch === "") {
      return true;
    }
    return Math.abs(item.optionalAmountMatch - normalizedAmount) <= 0.01;
  });
};

const autoAssignTransaction = (transaction) => {
  const billMatch = matchByKeywords(
    state.budgetConfig.fixedBills,
    transaction.description,
    transaction.amount
  );
  if (billMatch) {
    return {
      ...transaction,
      assignedType: "bill",
      assignedId: billMatch.id,
    };
  }
  const categoryMatch = matchByKeywords(
    state.budgetConfig.runningCategories,
    transaction.description,
    transaction.amount
  );
  if (categoryMatch) {
    return {
      ...transaction,
      assignedType: "category",
      assignedId: categoryMatch.id,
    };
  }
  return { ...transaction, assignedType: null, assignedId: null };
};

const computeBillActual = (bill) => {
  const actual = state.transactions
    .filter((txn) => txn.assignedType === "bill" && txn.assignedId === bill.id)
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
  const overrideActual = bill.overrideActual;
  const displayActual = overrideActual != null ? overrideActual : actual;
  const paid = bill.overridePaid || displayActual > 0;
  return { actual, displayActual, paid };
};

const computeCategorySpend = (category) =>
  state.transactions
    .filter(
      (txn) => txn.assignedType === "category" && txn.assignedId === category.id
    )
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

const computeBillsRemaining = () =>
  state.budgetConfig.fixedBills.reduce((sum, bill) => {
    const { paid } = computeBillActual(bill);
    return paid ? sum : sum + sanitizeNumber(bill.monthlyBudget);
  }, 0);

const computeTotals = () => {
  const totalSpent = state.transactions.reduce(
    (sum, txn) => sum + Math.abs(txn.amount),
    0
  );
  const billsRemainingTotal = computeBillsRemaining();
  const remaining = state.budgetConfig.startingBalance -
    (totalSpent + billsRemainingTotal);
  return { totalSpent, billsRemainingTotal, remaining };
};

const renderFixedBills = () => {
  fixedBillsTable.innerHTML = "";
  const header = document.createElement("div");
  header.className = "table__row header";
  header.style.gridTemplateColumns = "1.2fr 0.8fr 0.8fr 0.6fr 1fr";
  header.innerHTML =
    "<span>Bill</span><span>Budget</span><span>Actual</span><span>Status</span><span>Override</span>";
  fixedBillsTable.appendChild(header);

  state.budgetConfig.fixedBills.forEach((bill) => {
    const { displayActual, paid } = computeBillActual(bill);
    const row = document.createElement("div");
    row.className = "table__row";
    row.style.gridTemplateColumns = "1.2fr 0.8fr 0.8fr 0.6fr 1fr";
    row.innerHTML = `
      <span>${bill.name}</span>
      <span>${formatMoney(bill.monthlyBudget)}</span>
      <span>${formatMoney(displayActual)}</span>
      <span><span class="status-pill ${paid ? "paid" : "unpaid"}">${
      paid ? "Paid" : "Unpaid"
    }</span></span>
      <span class="override">
        <label class="radio">
          <input type="checkbox" data-bill-id="${bill.id}" data-field="overridePaid" ${
      bill.overridePaid ? "checked" : ""
    } />
          Paid
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="Actual"
          data-bill-id="${bill.id}"
          data-field="overrideActual"
          value="${bill.overrideActual ?? ""}"
        />
      </span>
    `;
    fixedBillsTable.appendChild(row);
  });
};

const renderRunningCategories = () => {
  runningCategoriesTable.innerHTML = "";
  const header = document.createElement("div");
  header.className = "table__row header";
  header.style.gridTemplateColumns = "1fr 0.6fr 0.6fr";
  header.innerHTML = "<span>Category</span><span>Cap</span><span>Spent</span>";
  runningCategoriesTable.appendChild(header);

  state.budgetConfig.runningCategories.forEach((category) => {
    const spent = computeCategorySpend(category);
    const row = document.createElement("div");
    row.className = "table__row";
    row.style.gridTemplateColumns = "1fr 0.6fr 0.6fr";
    row.innerHTML = `
      <span>${category.name}</span>
      <span>${formatMoney(category.cap)}</span>
      <span>${formatMoney(spent)}</span>
    `;
    runningCategoriesTable.appendChild(row);
  });
};

const renderQuickTotals = () => {
  totalTransactions.textContent = state.transactions.length;
  const { billsRemainingTotal, remaining } = computeTotals();
  billsRemaining.textContent = formatMoney(billsRemainingTotal);
  remainingBalance.textContent = formatMoney(remaining);
};

const renderUnintentional = () => {
  const unintentional = state.transactions.filter(
    (txn) => !txn.assignedType
  );
  const total = unintentional.reduce(
    (sum, txn) => sum + Math.abs(txn.amount),
    0
  );
  unintentionalTotal.textContent = formatMoney(total);

  const merchantTotals = unintentional.reduce((acc, txn) => {
    const key = txn.description;
    acc[key] = (acc[key] || 0) + Math.abs(txn.amount);
    return acc;
  }, {});

  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  unintentionalList.innerHTML = topMerchants.length
    ? topMerchants
        .map(
          ([merchant, amount]) =>
            `<div>${merchant} <strong>${formatMoney(amount)}</strong></div>`
        )
        .join("")
    : "<div class=\"muted\">No unintentional spending detected.</div>";
};

const renderTransactionTable = () => {
  transactionTable.innerHTML = "";
  const header = document.createElement("div");
  header.className = "table__row header";
  header.style.gridTemplateColumns = "0.7fr 1.6fr 0.8fr 0.9fr 0.9fr";
  header.innerHTML =
    "<span>Date</span><span>Merchant/Description</span><span>Amount</span><span>Current Tag</span><span>Actions</span>";
  transactionTable.appendChild(header);

  const filtered = state.transactions.filter((txn) => {
    if (state.reviewFilter === "reviewed" && !txn.reviewed) {
      return false;
    }
    if (state.reviewFilter === "unreviewed" && txn.reviewed) {
      return false;
    }
    if (state.searchQuery) {
      return txn.description
        .toLowerCase()
        .includes(state.searchQuery.toLowerCase());
    }
    return true;
  });

  filtered.forEach((txn) => {
    const tagLabel = txn.assignedType
      ? txn.assignedType === "bill"
        ? state.budgetConfig.fixedBills.find((bill) => bill.id === txn.assignedId)
            ?.name || "Fixed Bill"
        : state.budgetConfig.runningCategories.find(
            (cat) => cat.id === txn.assignedId
          )?.name || "Running Category"
      : "Unintentional";
    const row = document.createElement("div");
    row.className = "table__row";
    if (txn.reviewed) {
      row.classList.add("is-reviewed");
    }
    if (txn.id === state.selectedTransactionId) {
      row.classList.add("is-selected");
    }
    row.style.gridTemplateColumns = "0.7fr 1.6fr 0.8fr 0.9fr 0.9fr";
    row.innerHTML = `
      <span>${txn.date}</span>
      <span>${txn.description}</span>
      <span>${formatMoney(Math.abs(txn.amount))}</span>
      <span>${tagLabel}</span>
      <span class="actions">
        <button class="ghost" data-action="assign" data-id="${txn.id}">Assign</button>
        <button class="ghost" data-action="review" data-id="${txn.id}">${
      txn.reviewed ? "Unreview" : "Reviewed"
    }</button>
      </span>
    `;
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      state.selectedTransactionId = txn.id;
      render();
    });
    transactionTable.appendChild(row);
  });
};

const renderConfig = () => {
  configBills.innerHTML = "";
  const billHeader = document.createElement("div");
  billHeader.className = "table__row header";
  billHeader.style.gridTemplateColumns = "1fr 0.6fr 1fr 0.6fr 0.2fr";
  billHeader.innerHTML =
    "<span>Bill</span><span>Budget</span><span>Keywords</span><span>Amount</span><span></span>";
  configBills.appendChild(billHeader);

  state.budgetConfig.fixedBills.forEach((bill) => {
    const row = document.createElement("div");
    row.className = "table__row";
    row.style.gridTemplateColumns = "1fr 0.6fr 1fr 0.6fr 0.2fr";
    row.innerHTML = `
      <input data-type="bill" data-field="name" data-id="${bill.id}" value="${bill.name}" />
      <input data-type="bill" data-field="monthlyBudget" data-id="${bill.id}" type="number" step="0.01" value="${bill.monthlyBudget}" />
      <input data-type="bill" data-field="keywords" data-id="${bill.id}" value="${bill.keywords.join(", ")}" />
      <input data-type="bill" data-field="optionalAmountMatch" data-id="${bill.id}" type="number" step="0.01" value="${bill.optionalAmountMatch ?? ""}" />
      <button class="icon" data-action="remove-bill" data-id="${bill.id}">✕</button>
    `;
    configBills.appendChild(row);
  });

  configCategories.innerHTML = "";
  const categoryHeader = document.createElement("div");
  categoryHeader.className = "table__row header";
  categoryHeader.style.gridTemplateColumns = "1fr 0.6fr 1fr 0.2fr";
  categoryHeader.innerHTML =
    "<span>Category</span><span>Cap</span><span>Keywords</span><span></span>";
  configCategories.appendChild(categoryHeader);

  state.budgetConfig.runningCategories.forEach((category) => {
    const row = document.createElement("div");
    row.className = "table__row";
    row.style.gridTemplateColumns = "1fr 0.6fr 1fr 0.2fr";
    row.innerHTML = `
      <input data-type="category" data-field="name" data-id="${category.id}" value="${category.name}" />
      <input data-type="category" data-field="cap" data-id="${category.id}" type="number" step="0.01" value="${category.cap}" />
      <input data-type="category" data-field="keywords" data-id="${category.id}" value="${(category.keywords || []).join(", ")}" />
      <button class="icon" data-action="remove-category" data-id="${category.id}">✕</button>
    `;
    configCategories.appendChild(row);
  });
};

const render = () => {
  document.documentElement.style.colorScheme = state.isDarkMode
    ? "dark"
    : "light";
  themeToggle.textContent = state.isDarkMode ? "Dark mode" : "Light mode";
  renderQuickTotals();
  renderFixedBills();
  renderRunningCategories();
  renderUnintentional();
  renderTransactionTable();
  renderConfig();
  persistState();
};

const reapplyAutoAssignments = () => {
  state.transactions = state.transactions.map((txn) =>
    txn.assignedType ? txn : autoAssignTransaction(txn)
  );
};

const openAssignModal = (transactionId) => {
  const transaction = state.transactions.find((txn) => txn.id === transactionId);
  if (!transaction) {
    return;
  }
  state.activeAssignId = transactionId;
  assignDescription.textContent = `${transaction.date} • ${transaction.description} • ${formatMoney(
    Math.abs(transaction.amount)
  )}`;
  const selectedType = transaction.assignedType || "unintentional";
  document
    .querySelectorAll("input[name='assign-type']")
    .forEach((radio) => {
      radio.checked = radio.value === selectedType;
    });
  updateAssignTargets(transaction.assignedId);
  assignModal.classList.add("is-open");
  assignModal.setAttribute("aria-hidden", "false");
};

const closeAssignModal = () => {
  assignModal.classList.remove("is-open");
  assignModal.setAttribute("aria-hidden", "true");
  state.activeAssignId = null;
};

const updateAssignTargets = (selectedId = null) => {
  const selectedType = document.querySelector(
    "input[name='assign-type']:checked"
  ).value;
  assignTarget.innerHTML = "";
  let options = [];
  if (selectedType === "bill") {
    options = state.budgetConfig.fixedBills.map((bill) => ({
      id: bill.id,
      name: bill.name,
    }));
  }
  if (selectedType === "category") {
    options = state.budgetConfig.runningCategories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
  }
  if (selectedType === "unintentional") {
    assignTarget.disabled = true;
    return;
  }
  assignTarget.disabled = false;
  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.id;
    optionElement.textContent = option.name;
    assignTarget.appendChild(optionElement);
  });
  if (selectedId) {
    assignTarget.value = selectedId;
  }
};

const handleAssignSave = () => {
  const transaction = state.transactions.find(
    (txn) => txn.id === state.activeAssignId
  );
  if (!transaction) {
    closeAssignModal();
    return;
  }
  const selectedType = document.querySelector(
    "input[name='assign-type']:checked"
  ).value;
  if (selectedType === "unintentional") {
    transaction.assignedType = null;
    transaction.assignedId = null;
  } else {
    transaction.assignedType = selectedType;
    transaction.assignedId = assignTarget.value;
  }
  closeAssignModal();
  render();
};

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines
    .map((line) => line.split(","))
    .filter((row) => row.length >= 3)
    .map((row) => ({
      date: row[0].trim(),
      description: row[1].trim(),
      amount: sanitizeNumber(row[2]),
    }))
    .filter((row) => row.date && row.description && row.amount !== null);
};

const importCsvFile = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const rows = parseCsv(text);
    const transactions = rows
      .filter((row) => !row.date.toLowerCase().includes("date"))
      .map((row) =>
        autoAssignTransaction({
          id: createId(),
          date: row.date,
          description: row.description,
          amount: row.amount,
          reviewed: false,
        })
      );
    state.transactions = [...state.transactions, ...transactions];
    statusText.textContent = `Imported ${transactions.length} transactions.`;
    render();
  };
  reader.readAsText(file);
};

const exportBudgetJson = () => {
  const payload = JSON.stringify(state.budgetConfig, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vefa-budget.json";
  link.click();
  URL.revokeObjectURL(url);
};

const importBudgetJson = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      state.budgetConfig = {
        startingBalance: sanitizeNumber(data.startingBalance || 0),
        fixedBills: data.fixedBills || [],
        runningCategories: data.runningCategories || [],
      };
      startingBalanceInput.value = state.budgetConfig.startingBalance.toFixed(2);
      state.transactions = state.transactions.map((txn) =>
        autoAssignTransaction({
          ...txn,
          assignedType: null,
          assignedId: null,
        })
      );
      statusText.textContent = "Budget JSON imported.";
      render();
    } catch (error) {
      statusText.textContent = "Could not import budget JSON.";
    }
  };
  reader.readAsText(file);
};

fixedBillsTable.addEventListener("input", (event) => {
  const target = event.target;
  const billId = target.dataset.billId;
  if (!billId) {
    return;
  }
  const bill = state.budgetConfig.fixedBills.find((item) => item.id === billId);
  if (!bill) {
    return;
  }
  if (target.dataset.field === "overridePaid") {
    bill.overridePaid = target.checked;
  }
  if (target.dataset.field === "overrideActual") {
    bill.overrideActual = target.value ? sanitizeNumber(target.value) : null;
  }
  render();
});

configBills.addEventListener("input", (event) => {
  const target = event.target;
  const { type, field, id } = target.dataset;
  if (type !== "bill") {
    return;
  }
  const bill = state.budgetConfig.fixedBills.find((item) => item.id === id);
  if (!bill) {
    return;
  }
  if (field === "keywords") {
    bill.keywords = normalizeKeywords(target.value);
  } else if (field === "monthlyBudget") {
    bill.monthlyBudget = sanitizeNumber(target.value);
  } else if (field === "optionalAmountMatch") {
    bill.optionalAmountMatch = target.value ? sanitizeNumber(target.value) : null;
  } else {
    bill[field] = target.value;
  }
  reapplyAutoAssignments();
  render();
});

configBills.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  if (button.dataset.action === "remove-bill") {
    const removedId = button.dataset.id;
    state.budgetConfig.fixedBills = state.budgetConfig.fixedBills.filter(
      (bill) => bill.id !== removedId
    );
    state.transactions = state.transactions.map((txn) =>
      txn.assignedType === "bill" && txn.assignedId === removedId
        ? { ...txn, assignedType: null, assignedId: null }
        : txn
    );
    reapplyAutoAssignments();
    render();
  }
});

configCategories.addEventListener("input", (event) => {
  const target = event.target;
  const { type, field, id } = target.dataset;
  if (type !== "category") {
    return;
  }
  const category = state.budgetConfig.runningCategories.find(
    (item) => item.id === id
  );
  if (!category) {
    return;
  }
  if (field === "keywords") {
    category.keywords = normalizeKeywords(target.value);
  } else if (field === "cap") {
    category.cap = sanitizeNumber(target.value);
  } else {
    category[field] = target.value;
  }
  reapplyAutoAssignments();
  render();
});

configCategories.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  if (button.dataset.action === "remove-category") {
    const removedId = button.dataset.id;
    state.budgetConfig.runningCategories =
      state.budgetConfig.runningCategories.filter(
        (category) => category.id !== removedId
      );
    state.transactions = state.transactions.map((txn) =>
      txn.assignedType === "category" && txn.assignedId === removedId
        ? { ...txn, assignedType: null, assignedId: null }
        : txn
    );
    reapplyAutoAssignments();
    render();
  }
});

transactionTable.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const { action, id } = button.dataset;
  const txn = state.transactions.find((item) => item.id === id);
  if (!txn) {
    return;
  }
  if (action === "assign") {
    openAssignModal(id);
  }
  if (action === "review") {
    txn.reviewed = !txn.reviewed;
    render();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    state.reviewFilter = button.dataset.filter;
    render();
  });
});

searchInput.addEventListener("input", (event) => {
  state.searchQuery = event.target.value.trim();
  render();
});

startingBalanceInput.addEventListener("input", (event) => {
  state.budgetConfig.startingBalance = sanitizeNumber(event.target.value);
  render();
});

importCsvButton.addEventListener("click", () => {
  csvInput.click();
});

csvInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    importCsvFile(file);
  }
  csvInput.value = "";
});

exportBudgetButton.addEventListener("click", exportBudgetJson);

importBudgetButton.addEventListener("click", () => {
  budgetInput.click();
});

budgetInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    importBudgetJson(file);
  }
  budgetInput.value = "";
});

addBillButton.addEventListener("click", () => {
  state.budgetConfig.fixedBills.push({
    id: createId(),
    name: "New Bill",
    monthlyBudget: 0,
    keywords: [],
    optionalAmountMatch: null,
    categoryHint: "",
    overridePaid: false,
    overrideActual: null,
  });
  render();
});

addCategoryButton.addEventListener("click", () => {
  state.budgetConfig.runningCategories.push({
    id: createId(),
    name: "New Category",
    cap: 0,
    keywords: [],
  });
  render();
});

assignModal.addEventListener("click", (event) => {
  if (event.target === assignModal) {
    closeAssignModal();
  }
});

saveAssign.addEventListener("click", handleAssignSave);

cancelAssign.addEventListener("click", closeAssignModal);

closeAssign.addEventListener("click", closeAssignModal);

assignModal.addEventListener("change", (event) => {
  if (event.target.name === "assign-type") {
    updateAssignTargets();
  }
});

themeToggle.addEventListener("click", () => {
  state.isDarkMode = !state.isDarkMode;
  themeToggle.textContent = state.isDarkMode ? "Dark mode" : "Light mode";
  render();
});

loadState();
render();
