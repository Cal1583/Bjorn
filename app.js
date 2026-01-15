const billsTable = document.getElementById("bills-table");
const categoriesTable = document.getElementById("categories-table");
const transactionsTable = document.getElementById("transactions-table");
const searchInput = document.getElementById("search-input");
const themeToggle = document.getElementById("theme-toggle");
const statusText = document.getElementById("status");
const assignModal = document.getElementById("assign-modal");
const assignClose = document.getElementById("assign-close");
const assignForm = document.getElementById("assign-form");
const assignType = document.getElementById("assign-type");
const assignTarget = document.getElementById("assign-target");
const assignTargetRow = document.getElementById("assign-target-row");
const filterButtons = document.querySelectorAll(".filter-button");
const billsRemainingValue = document.getElementById("bills-remaining");
const totalTransactionsValue = document.getElementById("total-transactions");
const totalBillsRemainingValue = document.getElementById("total-bills-remaining");
const remainingBalanceValue = document.getElementById("remaining-balance");
const unintentionalTotal = document.getElementById("unintentional-total");
const unintentionalList = document.getElementById("unintentional-list");
const importTransactionsButton = document.getElementById("import-transactions");
const exportBudgetButton = document.getElementById("export-budget");
const importBudgetButton = document.getElementById("import-budget");
const transactionsInput = document.getElementById("transactions-input");
const budgetInput = document.getElementById("budget-input");

const STORAGE_KEYS = {
  budget: "vefaBudget",
  transactions: "vefaTransactions",
  overrides: "vefaOverrides",
  theme: "vefaBudgetTheme",
};

const defaultBudget = {
  fixedBills: [
    {
      id: "bill-1",
      name: "Rent",
      monthlyBudget: 1500,
      keywords: ["rent", "landlord"],
      amountMatch: 1500,
      categoryHint: "Housing",
    },
    {
      id: "bill-2",
      name: "Electric",
      monthlyBudget: 120,
      keywords: ["electric", "utility"],
      amountMatch: null,
      categoryHint: "Utilities",
    },
    {
      id: "bill-3",
      name: "Internet",
      monthlyBudget: 80,
      keywords: ["fiber", "internet"],
      amountMatch: null,
      categoryHint: "Utilities",
    },
  ],
  runningCategories: [
    { id: "cat-1", name: "Groceries", cap: 450, keywords: ["market", "grocery"] },
    { id: "cat-2", name: "Dining", cap: 220, keywords: ["cafe", "restaurant"] },
    { id: "cat-3", name: "Transport", cap: 160, keywords: ["uber", "metro"] },
  ],
};

const defaultTransactions = [
  {
    id: "txn-1",
    date: "2024-03-01",
    description: "Northwind Rent",
    amount: 1500,
    reviewed: false,
    assignment: { type: "bill", id: "bill-1" },
  },
  {
    id: "txn-2",
    date: "2024-03-03",
    description: "Cloud Cafe",
    amount: 18.45,
    reviewed: false,
    assignment: { type: "category", id: "cat-2" },
  },
  {
    id: "txn-3",
    date: "2024-03-05",
    description: "Metropolis Electric",
    amount: 114.2,
    reviewed: true,
    assignment: { type: "bill", id: "bill-2" },
  },
  {
    id: "txn-4",
    date: "2024-03-06",
    description: "Downtown Market",
    amount: 82.91,
    reviewed: false,
    assignment: { type: "category", id: "cat-1" },
  },
  {
    id: "txn-5",
    date: "2024-03-07",
    description: "Streaming Service",
    amount: 12.99,
    reviewed: false,
    assignment: null,
  },
];

let budgetState = loadFromStorage(STORAGE_KEYS.budget, defaultBudget);
let transactionsState = loadFromStorage(
  STORAGE_KEYS.transactions,
  defaultTransactions
);
let overridesState = loadFromStorage(STORAGE_KEYS.overrides, {});
let selectedTransactionId = null;
let activeFilter = "all";
let activeSearch = "";
let activeAssignmentId = null;

function loadFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return structuredClone(fallback);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse storage", error);
    return structuredClone(fallback);
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateStatus(message) {
  statusText.textContent = message;
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function normalizeAmount(value) {
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const number = Number.parseFloat(normalized);
  if (Number.isNaN(number)) {
    return 0;
  }
  return Math.abs(number);
}

function getMerchantName(description) {
  if (!description) {
    return "Unknown";
  }
  const cleaned = description.trim();
  if (!cleaned) {
    return "Unknown";
  }
  const dashSplit = cleaned.split(" - ");
  if (dashSplit.length > 1) {
    return dashSplit[0];
  }
  return cleaned.split(" ").slice(0, 2).join(" ");
}

function applyAutoMatching() {
  transactionsState = transactionsState.map((txn) => {
    const description = txn.description.toLowerCase();
    const amount = normalizeAmount(txn.amount);
    const billMatch = budgetState.fixedBills.find((bill) => {
      const keywordMatch = bill.keywords?.some((keyword) =>
        description.includes(keyword.toLowerCase())
      );
      if (!keywordMatch) {
        return false;
      }
      if (bill.amountMatch) {
        return normalizeAmount(bill.amountMatch) === amount;
      }
      return true;
    });

    if (billMatch) {
      return { ...txn, assignment: { type: "bill", id: billMatch.id } };
    }

    const categoryMatch = budgetState.runningCategories.find((category) => {
      return category.keywords?.some((keyword) =>
        description.includes(keyword.toLowerCase())
      );
    });

    if (categoryMatch) {
      return {
        ...txn,
        assignment: { type: "category", id: categoryMatch.id },
      };
    }

    return { ...txn, assignment: txn.assignment ?? null };
  });
  saveToStorage(STORAGE_KEYS.transactions, transactionsState);
}

function getAssignmentLabel(assignment) {
  if (!assignment) {
    return "Unintentional";
  }
  if (assignment.type === "bill") {
    const bill = budgetState.fixedBills.find((item) => item.id === assignment.id);
    return bill ? `Bill: ${bill.name}` : "Bill: Unknown";
  }
  if (assignment.type === "category") {
    const category = budgetState.runningCategories.find(
      (item) => item.id === assignment.id
    );
    return category ? `Category: ${category.name}` : "Category: Unknown";
  }
  return "Unintentional";
}

function getBillActual(billId) {
  const override = overridesState[billId];
  if (override && override.actual !== null && override.actual !== undefined) {
    return Number(override.actual) || 0;
  }
  return transactionsState
    .filter((txn) => txn.assignment?.type === "bill" && txn.assignment.id === billId)
    .reduce((sum, txn) => sum + normalizeAmount(txn.amount), 0);
}

function getBillStatus(billId, budgetAmount) {
  const override = overridesState[billId];
  if (override?.paid === true) {
    return "paid";
  }
  const actual = getBillActual(billId);
  return actual >= budgetAmount ? "paid" : "unpaid";
}

function getBillsRemainingTotal() {
  return budgetState.fixedBills.reduce((sum, bill) => {
    const status = getBillStatus(bill.id, bill.monthlyBudget);
    if (status === "unpaid") {
      return sum + bill.monthlyBudget;
    }
    return sum;
  }, 0);
}

function getCategorySpend(categoryId) {
  return transactionsState
    .filter(
      (txn) => txn.assignment?.type === "category" && txn.assignment.id === categoryId
    )
    .reduce((sum, txn) => sum + normalizeAmount(txn.amount), 0);
}

function getUnintentionalTransactions() {
  return transactionsState.filter((txn) => !txn.assignment);
}

function renderBills() {
  billsTable.innerHTML = "";

  budgetState.fixedBills.forEach((bill) => {
    const row = document.createElement("tr");
    const actual = getBillActual(bill.id);
    const status = getBillStatus(bill.id, bill.monthlyBudget);
    const override = overridesState[bill.id] || { paid: null, actual: null };

    row.innerHTML = `
      <td>${bill.name}</td>
      <td>${formatCurrency(bill.monthlyBudget)}</td>
      <td>${formatCurrency(actual)}</td>
      <td>
        <span class="status-pill status-pill--${status}">
          ${status.toUpperCase()}
        </span>
      </td>
      <td>
        <div class="override-controls">
          <label>
            <input type="checkbox" data-bill-paid="${bill.id}" ${
              override.paid ? "checked" : ""
            } />
            Manual Paid
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="Actual amount"
            data-bill-actual="${bill.id}"
            value="${override.actual ?? ""}"
          />
        </div>
      </td>
    `;
    billsTable.appendChild(row);
  });
}

function renderCategories() {
  categoriesTable.innerHTML = "";
  budgetState.runningCategories.forEach((category) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${category.name}</td>
      <td>${formatCurrency(category.cap)}</td>
      <td>${formatCurrency(getCategorySpend(category.id))}</td>
    `;
    categoriesTable.appendChild(row);
  });
}

function renderUnintentional() {
  const unintentionalTransactions = getUnintentionalTransactions();
  const total = unintentionalTransactions.reduce(
    (sum, txn) => sum + normalizeAmount(txn.amount),
    0
  );
  unintentionalTotal.textContent = formatCurrency(total);

  const merchantTotals = unintentionalTransactions.reduce((acc, txn) => {
    const name = getMerchantName(txn.description);
    acc[name] = (acc[name] || 0) + normalizeAmount(txn.amount);
    return acc;
  }, {});

  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  unintentionalList.innerHTML = "";
  if (topMerchants.length === 0) {
    const empty = document.createElement("p");
    empty.className = "panel__subtitle";
    empty.textContent = "All transactions are assigned.";
    unintentionalList.appendChild(empty);
    return;
  }

  topMerchants.forEach(([name, amount]) => {
    const item = document.createElement("div");
    item.className = "unintentional-item";
    item.innerHTML = `<span>${name}</span><strong>${formatCurrency(amount)}</strong>`;
    unintentionalList.appendChild(item);
  });
}

function renderTotals() {
  const totalTransactions = transactionsState.reduce(
    (sum, txn) => sum + normalizeAmount(txn.amount),
    0
  );
  const billsRemaining = getBillsRemainingTotal();
  const categoryTotal = budgetState.runningCategories.reduce(
    (sum, category) => sum + category.cap,
    0
  );
  const billActualTotal = budgetState.fixedBills.reduce(
    (sum, bill) => sum + getBillActual(bill.id),
    0
  );
  const categorySpendTotal = budgetState.runningCategories.reduce(
    (sum, category) => sum + getCategorySpend(category.id),
    0
  );
  const unintentionalSpend = getUnintentionalTransactions().reduce(
    (sum, txn) => sum + normalizeAmount(txn.amount),
    0
  );
  const budgetTotal = categoryTotal +
    budgetState.fixedBills.reduce((sum, bill) => sum + bill.monthlyBudget, 0);
  const spentTotal = billActualTotal + categorySpendTotal + unintentionalSpend;
  const remainingBalance = budgetTotal - spentTotal;

  billsRemainingValue.textContent = formatCurrency(billsRemaining);
  totalBillsRemainingValue.textContent = formatCurrency(billsRemaining);
  totalTransactionsValue.textContent = formatCurrency(totalTransactions);
  remainingBalanceValue.textContent = formatCurrency(remainingBalance);
}

function renderTransactions() {
  transactionsTable.innerHTML = "";
  const filtered = transactionsState.filter((txn) => {
    const matchesSearch =
      !activeSearch ||
      txn.description.toLowerCase().includes(activeSearch) ||
      txn.date.includes(activeSearch);
    if (!matchesSearch) {
      return false;
    }
    if (activeFilter === "reviewed") {
      return txn.reviewed;
    }
    if (activeFilter === "unreviewed") {
      return !txn.reviewed;
    }
    return true;
  });

  filtered.forEach((txn) => {
    const row = document.createElement("tr");
    row.className = "transaction-row";
    if (txn.reviewed) {
      row.classList.add("is-reviewed");
    }
    if (txn.id === selectedTransactionId) {
      row.classList.add("is-selected");
    }

    row.innerHTML = `
      <td>${txn.date}</td>
      <td>${txn.description}</td>
      <td>${formatCurrency(normalizeAmount(txn.amount))}</td>
      <td>${getAssignmentLabel(txn.assignment)}</td>
      <td>
        <div class="action-buttons">
          <button type="button" data-assign="${txn.id}">Assign</button>
          <button type="button" data-reviewed="${txn.id}" class="${
            txn.reviewed ? "is-active" : ""
          }">${txn.reviewed ? "Reviewed" : "Mark reviewed"}</button>
        </div>
      </td>
    `;

    row.addEventListener("click", () => {
      selectedTransactionId = txn.id;
      renderTransactions();
    });

    transactionsTable.appendChild(row);
  });
}

function renderAll() {
  renderBills();
  renderCategories();
  renderUnintentional();
  renderTotals();
  renderTransactions();
}

function openAssignModal(transactionId) {
  activeAssignmentId = transactionId;
  assignType.value = "bill";
  updateAssignTargets();
  assignModal.hidden = false;
}

function closeAssignModal() {
  assignModal.hidden = true;
  activeAssignmentId = null;
}

function updateAssignTargets() {
  const type = assignType.value;
  assignTarget.innerHTML = "";

  if (type === "bill") {
    budgetState.fixedBills.forEach((bill) => {
      const option = document.createElement("option");
      option.value = bill.id;
      option.textContent = bill.name;
      assignTarget.appendChild(option);
    });
    assignTargetRow.hidden = false;
    return;
  }

  if (type === "category") {
    budgetState.runningCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      assignTarget.appendChild(option);
    });
    assignTargetRow.hidden = false;
    return;
  }

  assignTargetRow.hidden = true;
}

function handleAssignSubmit(event) {
  event.preventDefault();
  const transaction = transactionsState.find((txn) => txn.id === activeAssignmentId);
  if (!transaction) {
    return;
  }

  if (assignType.value === "unintentional") {
    transaction.assignment = null;
  } else {
    transaction.assignment = {
      type: assignType.value,
      id: assignTarget.value,
    };
  }
  saveToStorage(STORAGE_KEYS.transactions, transactionsState);
  updateStatus("Assignment saved.");
  closeAssignModal();
  renderAll();
}

function handleReviewToggle(transactionId) {
  transactionsState = transactionsState.map((txn) => {
    if (txn.id === transactionId) {
      return { ...txn, reviewed: !txn.reviewed };
    }
    return txn;
  });
  saveToStorage(STORAGE_KEYS.transactions, transactionsState);
  renderTransactions();
}

function handleOverrides(event) {
  const paidId = event.target.getAttribute("data-bill-paid");
  const actualId = event.target.getAttribute("data-bill-actual");

  if (paidId) {
    overridesState[paidId] = overridesState[paidId] || { paid: null, actual: null };
    overridesState[paidId].paid = event.target.checked ? true : null;
  }

  if (actualId) {
    overridesState[actualId] = overridesState[actualId] || { paid: null, actual: null };
    overridesState[actualId].actual = event.target.value
      ? Number(event.target.value)
      : null;
  }

  saveToStorage(STORAGE_KEYS.overrides, overridesState);
  renderAll();
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      if (current.length || row.length) {
        row.push(current.trim());
        rows.push(row);
        row = [];
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current.length || row.length) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function importTransactions(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(reader.result || "");
    if (!rows.length) {
      updateStatus("No transactions found in file.");
      return;
    }

    const headers = rows[0].map((header) => header.toLowerCase());
    const dateIndex = headers.findIndex((header) => header.includes("date"));
    const descriptionIndex = headers.findIndex(
      (header) => header.includes("description") || header.includes("merchant")
    );
    const amountIndex = headers.findIndex((header) => header.includes("amount"));

    const dataRows = rows.slice(1);
    transactionsState = dataRows
      .filter((row) => row.length)
      .map((row, index) => {
        const date = row[dateIndex] || `2024-03-${String(index + 1).padStart(2, "0")}`;
        const description = row[descriptionIndex] || "Imported transaction";
        const amount = normalizeAmount(row[amountIndex]);
        return {
          id: `txn-${Date.now()}-${index}`,
          date,
          description,
          amount,
          reviewed: false,
          assignment: null,
        };
      });

    applyAutoMatching();
    saveToStorage(STORAGE_KEYS.transactions, transactionsState);
    updateStatus(`Imported ${transactionsState.length} transactions.`);
    renderAll();
  };
  reader.readAsText(file);
}

function exportBudget() {
  const payload = JSON.stringify(budgetState, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vefa-budget.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  updateStatus("Budget exported.");
}

function importBudget(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.fixedBills || !data.runningCategories) {
        updateStatus("Budget JSON missing required sections.");
        return;
      }
      budgetState = data;
      saveToStorage(STORAGE_KEYS.budget, budgetState);
      applyAutoMatching();
      updateStatus("Budget imported and applied.");
      renderAll();
    } catch (error) {
      console.error(error);
      updateStatus("Unable to import budget JSON.");
    }
  };
  reader.readAsText(file);
}

function handleThemeToggle() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  saveToStorage(STORAGE_KEYS.theme, isDark);
}

function loadTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === "true") {
    document.body.classList.add("dark");
    themeToggle.setAttribute("aria-pressed", "true");
  }
}

function initEventListeners() {
  searchInput.addEventListener("input", (event) => {
    activeSearch = event.target.value.trim().toLowerCase();
    renderTransactions();
  });

  themeToggle.addEventListener("click", handleThemeToggle);

  billsTable.addEventListener("change", handleOverrides);
  billsTable.addEventListener("input", handleOverrides);

  transactionsTable.addEventListener("click", (event) => {
    const assignId = event.target.getAttribute("data-assign");
    const reviewedId = event.target.getAttribute("data-reviewed");
    if (assignId) {
      event.stopPropagation();
      openAssignModal(assignId);
      return;
    }
    if (reviewedId) {
      event.stopPropagation();
      handleReviewToggle(reviewedId);
    }
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");
      activeFilter = button.dataset.filter;
      renderTransactions();
    });
  });

  assignClose.addEventListener("click", closeAssignModal);
  assignForm.addEventListener("submit", handleAssignSubmit);
  assignType.addEventListener("change", updateAssignTargets);

  importTransactionsButton.addEventListener("click", () => transactionsInput.click());
  transactionsInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importTransactions(file);
    }
    transactionsInput.value = "";
  });

  exportBudgetButton.addEventListener("click", exportBudget);
  importBudgetButton.addEventListener("click", () => budgetInput.click());
  budgetInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importBudget(file);
    }
    budgetInput.value = "";
  });

  assignModal.addEventListener("click", (event) => {
    if (event.target === assignModal) {
      closeAssignModal();
    }
  });
}

applyAutoMatching();
loadTheme();
initEventListeners();
renderAll();
