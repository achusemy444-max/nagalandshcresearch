const STORAGE_KEY = "soil-health-card-nagaland-demo";

const parameterDefinitions = [
  { key: "ph", label: "pH", unit: "", type: "range", min: 5.5, max: 8.5, rangeText: "5.5 - 8.5" },
  { key: "ec", label: "EC (Electric Conductivity)", unit: "dS/m", type: "lt", max: 1, rangeText: "< 1" },
  { key: "organicCarbon", label: "Organic Carbon", unit: "%", type: "range", min: 0.5, max: 0.75, rangeText: "0.50 - 0.75" },
  { key: "nitrogen", label: "Nitrogen", unit: "kg/ha", type: "range", min: 280, max: 560, rangeText: "280 - 560" },
  { key: "phosphorous", label: "Phosphorous", unit: "kg/ha", type: "range", min: 10, max: 25, rangeText: "10 - 25" },
  { key: "potassium", label: "Potassium", unit: "kg/ha", type: "range", min: 120, max: 280, rangeText: "120 - 280" },
  { key: "sulphur", label: "Sulphur", unit: "ppm", type: "gt", min: 10, rangeText: "> 10" },
  { key: "zinc", label: "Zinc", unit: "ppm", type: "gt", min: 0.6, rangeText: "> 0.6" },
  { key: "boron", label: "Boron", unit: "ppm", type: "gt", min: 0.5, rangeText: "> 0.5" },
  { key: "iron", label: "Iron", unit: "ppm", type: "gt", min: 4.5, rangeText: "> 4.5" },
  { key: "manganese", label: "Manganese", unit: "ppm", type: "gt", min: 2, rangeText: "> 2" },
  { key: "copper", label: "Copper", unit: "ppm", type: "gt", min: 0.2, rangeText: "> 0.2" }
];

const defaultState = {
  accounts: [
    {
      id: "admin-1",
      role: "admin",
      district: "All Districts",
      officerName: "Scheme Administrator",
      username: "adminkohima123",
      password: "Adminkohima@123",
      address: "Soil and Water Conservation Department, Kohima, Nagaland"
    },
    {
      id: "district-1",
      role: "district",
      district: "Kohima",
      officerName: "District Soil Officer",
      username: "kohima_user",
      password: "District@123",
      address: "District Test Center, Kohima, Nagaland"
    }
  ],
  cards: []
};

const ui = {
  sessionText: document.getElementById("sessionText"),
  appShell: document.getElementById("appShell"),
  adminPanel: document.getElementById("adminPanel"),
  districtPanel: document.getElementById("districtPanel"),
  dashboardTitle: document.getElementById("dashboardTitle"),
  dashboardSubtitle: document.getElementById("dashboardSubtitle"),
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginMessage: document.getElementById("loginMessage"),
  logoutButton: document.getElementById("logoutButton"),
  adminDownloadPdfButton: document.getElementById("adminDownloadPdfButton"),
  districtDownloadPdfButton: document.getElementById("districtDownloadPdfButton"),
  districtAccountForm: document.getElementById("districtAccountForm"),
  districtAccountMessage: document.getElementById("districtAccountMessage"),
  districtAccountsTable: document.getElementById("districtAccountsTable"),
  adminCardsTable: document.getElementById("adminCardsTable"),
  adminCardPreview: document.getElementById("adminCardPreview"),
  adminStats: document.getElementById("adminStats"),
  districtStats: document.getElementById("districtStats"),
  soilCardForm: document.getElementById("soilCardForm"),
  soilCardMessage: document.getElementById("soilCardMessage"),
  districtCardsTable: document.getElementById("districtCardsTable"),
  districtCardPreview: document.getElementById("districtCardPreview"),
  previewButton: document.getElementById("previewButton"),
  parameterGrid: document.getElementById("parameterGrid"),
  formDistrict: document.getElementById("formDistrict"),
  testingDate: document.getElementById("testingDate"),
  testCenterAddress: document.getElementById("testCenterAddress"),
  testCenterId: document.getElementById("testCenterId"),
  surveyNo: document.getElementById("surveyNo"),
  farmerName: document.getElementById("farmerName"),
  farmerVillage: document.getElementById("farmerVillage"),
  soilTexture: document.getElementById("soilTexture"),
  moistureContext: document.getElementById("moistureContext"),
  manualRecommendation: document.getElementById("manualRecommendation"),
  bulkUploadForm: document.getElementById("bulkUploadForm"),
  bulkUploadFile: document.getElementById("bulkUploadFile"),
  bulkUploadMessage: document.getElementById("bulkUploadMessage"),
  downloadExampleCsv: document.getElementById("downloadExampleCsv"),
  bulkCardsUploadForm: document.getElementById("bulkCardsUploadForm"),
  bulkCardsUploadFile: document.getElementById("bulkCardsUploadFile"),
  bulkCardsUploadMessage: document.getElementById("bulkCardsUploadMessage"),
  downloadCardsExampleCsv: document.getElementById("downloadCardsExampleCsv")
};

let state = loadState();
let currentUser = null;
let lastCardForPdf = null;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(saved);
    const hydrated = {
      accounts: Array.isArray(parsed.accounts) && parsed.accounts.length ? parsed.accounts : structuredClone(defaultState.accounts),
      cards: Array.isArray(parsed.cards) ? parsed.cards : []
    };
    return migrateState(hydrated);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }
}

function migrateState(draft) {
  const adminAccount = draft.accounts.find((account) => account.role === "admin");
  if (!adminAccount) {
    draft.accounts.unshift(structuredClone(defaultState.accounts[0]));
  } else {
    adminAccount.username = "adminkohima123";
    adminAccount.password = "Adminkohima@123";
    adminAccount.district = "All Districts";
    adminAccount.officerName = adminAccount.officerName || "Scheme Administrator";
    adminAccount.address = adminAccount.address || "Soil and Water Conservation Department, Kohima, Nagaland";
  }

  // Remove any old default admin credentials entry if present (migration cleanup)
  draft.accounts = draft.accounts.filter((account, index) => {
    if (account.role !== "admin") return true;
    return index === draft.accounts.findIndex((a) => a.role === "admin");
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  return draft;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = "form-message";
  if (type) {
    element.classList.add(type === "success" ? "message-success" : "message-error");
  }
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function buildParameterInputs() {
  ui.parameterGrid.innerHTML = parameterDefinitions
    .map(
      (parameter) => `
        <label>
          <span>${parameter.label} ${parameter.unit ? `(${parameter.unit})` : ""}</span>
          <input type="number" step="any" data-parameter="${parameter.key}" placeholder="Range ${parameter.rangeText}">
        </label>
      `
    )
    .join("");
}

function getStatusClass(status) {
  return `status-${status}`;
}

function classifyRange(value, min, max) {
  if (value >= min && value <= max) return { status: "green", text: "SUFFICIENT" };
  const distance = value < min ? (min - value) / Math.max(min, 1) : (value - max) / Math.max(max, 1);
  if (distance <= 0.1) return { status: "yellow", text: "MEDIUM" };
  if (distance <= 0.25) return { status: "orange", text: "MODERATE" };
  return { status: "red", text: "DEFICIENT" };
}

function classifyGreaterThan(value, min) {
  if (value >= min) return { status: "green", text: "SUFFICIENT" };
  if (value >= min * 0.85) return { status: "yellow", text: "MEDIUM" };
  if (value >= min * 0.7) return { status: "orange", text: "MODERATE" };
  return { status: "red", text: "DEFICIENT" };
}

function classifyLessThan(value, max) {
  if (value < max) return { status: "green", text: "SUFFICIENT" };
  if (value <= max * 1.2) return { status: "yellow", text: "MEDIUM" };
  if (value <= max * 1.5) return { status: "orange", text: "DEFICIENT" };
  return { status: "red", text: "DEFICIENT" };
}

function classifyPh(value, max) {
  if (value >= 5.5 && value <= max) return { status: "green", text: "SUFFICIENT" };
  if (value >= 5 && value < 5.5) return { status: "yellow", text: "MEDIUM" };
  if (value >= 4.5 && value < 5) return { status: "orange", text: "MODERATE" };
  if (value < 4.5) return { status: "red", text: "DEFICIENT" };
  // For values above max, still map to the same 4-level text labels.
  if (value <= max + 0.5) return { status: "yellow", text: "MEDIUM" };
  if (value <= max + 1) return { status: "orange", text: "MODERATE" };
  return { status: "red", text: "DEFICIENT" };
}

function evaluateParameter(definition, value) {
  if (value === "" || value === null || Number.isNaN(Number(value))) {
    return { value: "", status: "grey", text: "NOT AVAILABLE", rangeText: definition.rangeText };
  }

  const numericValue = Number(value);
  let result;

  if (definition.key === "ph") {
    result = classifyPh(numericValue, definition.max);
  } else if (definition.type === "range") {
    result = classifyRange(numericValue, definition.min, definition.max);
  } else if (definition.type === "gt") {
    result = classifyGreaterThan(numericValue, definition.min);
  } else {
    result = classifyLessThan(numericValue, definition.max);
  }

  return {
    value: numericValue,
    status: result.status,
    text: result.text,
    rangeText: definition.rangeText
  };
}

function getRecommendationLines(evaluations, soilTexture, moistureContext) {
  const lines = [];
  const getStatus = (key) => evaluations[key]?.status;

  if (getStatus("ph") === "yellow" || getStatus("ph") === "orange" || getStatus("ph") === "red") {
    lines.push("Apply agricultural lime in recommended dose to improve acidic soil reaction and enhance nutrient availability.");
  }
  if (getStatus("ec") !== "green" && getStatus("ec") !== "grey") {
    lines.push("Check irrigation water quality, improve drainage, and avoid excess salt-forming inputs.");
  }
  if (getStatus("organicCarbon") !== "green" && getStatus("organicCarbon") !== "grey") {
    lines.push("Increase compost, farmyard manure, crop residue incorporation, and green manuring to improve organic carbon.");
  }
  if (getStatus("nitrogen") !== "green" && getStatus("nitrogen") !== "grey") {
    lines.push("Apply nitrogen in split doses according to crop stage and combine with organic manures.");
  }
  if (getStatus("phosphorous") !== "green" && getStatus("phosphorous") !== "grey") {
    lines.push("Apply phosphatic fertilizers such as SSP or DAP as per crop requirement and soil test guidance.");
  }
  if (getStatus("potassium") !== "green" && getStatus("potassium") !== "grey") {
    lines.push("Apply potassic fertilizer such as MOP where deficiency is observed.");
  }
  if (getStatus("sulphur") !== "green" && getStatus("sulphur") !== "grey") {
    lines.push("Use sulphur-containing fertilizers or gypsum to correct sulphur deficiency.");
  }
  if (getStatus("zinc") !== "green" && getStatus("zinc") !== "grey") {
    lines.push("Apply zinc sulphate in recommended quantity to address zinc deficiency.");
  }
  if (getStatus("boron") !== "green" && getStatus("boron") !== "grey") {
    lines.push("Apply boron carefully in small recommended doses, such as borax, to avoid toxicity.");
  }
  if (getStatus("iron") !== "green" && getStatus("iron") !== "grey") {
    lines.push("Use iron micronutrient application if deficiency symptoms or low test values are observed.");
  }
  if (getStatus("manganese") !== "green" && getStatus("manganese") !== "grey") {
    lines.push("Apply manganese sulphate if manganese deficiency is confirmed in crop or soil analysis.");
  }
  if (getStatus("copper") !== "green" && getStatus("copper") !== "grey") {
    lines.push("Apply copper sulphate only in recommended doses where copper deficiency exists.");
  }

  if (soilTexture === "Sandy") {
    lines.push("For sandy soil, use split fertilizer doses and increase organic matter to improve nutrient retention.");
  }
  if (soilTexture === "Clayey") {
    lines.push("For clayey soil, maintain good drainage and avoid water stagnation during crop growth.");
  }
  if (soilTexture === "Loamy") {
    lines.push("Loamy soil is suitable for balanced nutrient management; maintain organic matter for sustained productivity.");
  }

  if (moistureContext === "Dry") {
    lines.push("Use mulching and moisture conservation practices because current moisture condition is dry.");
  }
  if (moistureContext === "Wet") {
    lines.push("Improve surface drainage and avoid over-irrigation under wet moisture conditions.");
  }

  if (!lines.length) {
    lines.push("All measured values are within the desired range. Continue balanced nutrient management and periodic soil testing.");
  }

  return lines;
}

function buildCardRecord(fromPreview = false) {
  const parameters = {};
  const evaluations = {};

  document.querySelectorAll("[data-parameter]").forEach((input) => {
    parameters[input.dataset.parameter] = input.value;
  });

  parameterDefinitions.forEach((definition) => {
    evaluations[definition.key] = evaluateParameter(definition, parameters[definition.key]);
  });

  const autoRecommendation = getRecommendationLines(
    evaluations,
    ui.soilTexture.value,
    ui.moistureContext.value
  ).join(" ");

  return {
    id: fromPreview ? "Preview" : `SHC-${Date.now()}`,
    district: currentUser?.role === "district" ? currentUser.district : ui.formDistrict.value.trim(),
    testCenterAddress: ui.testCenterAddress.value.trim(),
    testCenterId: ui.testCenterId.value.trim(),
    testingDate: ui.testingDate.value,
    surveyNo: ui.surveyNo.value.trim(),
    farmerName: ui.farmerName.value.trim(),
    farmerVillage: ui.farmerVillage.value.trim(),
    soilTexture: ui.soilTexture.value,
    moistureContext: ui.moistureContext.value,
    parameters,
    evaluations,
    recommendation: ui.manualRecommendation.value.trim() || autoRecommendation,
    createdBy: currentUser?.username || "",
    createdAt: new Date().toISOString()
  };
}

function renderStats(target, stats) {
  target.innerHTML = stats
    .map(
      (item) => `
        <article class="stat-card">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
          <p>${item.note}</p>
        </article>
      `
    )
    .join("");
}

function renderAccountsTable() {
  const districtAccounts = state.accounts.filter((account) => account.role === "district");
  ui.districtAccountsTable.innerHTML = districtAccounts.length
    ? districtAccounts
        .map(
          (account) => `
            <tr>
              <td>${account.district}</td>
              <td>${account.officerName}</td>
              <td>${account.username}</td>
              <td>${account.address}</td>
              <td>
                <button type="button" class="button button-secondary table-action" data-edit-account="${account.id}">Edit</button>
                <button type="button" class="button button-secondary table-action" data-delete-account="${account.id}">Delete</button>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5">No district accounts created yet.</td></tr>`;
}

function buildCardMarkup(card) {
  // Create parameter table with 2 columns and 6 rows
  const parametersPerColumn = 6;
  const parameterCount = parameterDefinitions.length;
  const col1Params = parameterDefinitions.slice(0, parametersPerColumn);
  const col2Params = parameterDefinitions.slice(parametersPerColumn, parameterCount);

  const buildTableColumn = (parameters) => {
    return parameters
      .map((definition) => {
        const evaluation = card.evaluations[definition.key];
        const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
        return `
          <div class="param-row">
            <div class="param-name">${definition.label}</div>
            <div class="param-range">${definition.rangeText}</div>
            <div class="param-value">
              <div class="param-measured">${displayValue}</div>
              <div class="param-status ${getStatusClass(evaluation.status)}">${evaluation.text}</div>
            </div>
          </div>
        `;
      })
      .join("");
  };

  const parameterTableMarkup = `
    <div class="parameter-table">
      <div class="param-column">
        <div class="param-column-header">
          <span>Parameter</span>
          <span>Range</span>
          <span>Value</span>
        </div>
        ${buildTableColumn(col1Params)}
      </div>
      <div class="param-column">
        <div class="param-column-header">
          <span>Parameter</span>
          <span>Range</span>
          <span>Value</span>
        </div>
        ${buildTableColumn(col2Params)}
      </div>
    </div>
  `;

  return `
    <div class="soil-card">
      <header class="soil-card-header">
        <div class="soil-card-header-content">
          <img src="assets/gon-logo.png" alt="Government of Nagaland logo" class="card-logo card-logo-round">
          <div class="soil-card-title">
            <h1>Soil Health Card</h1>
            <h2>Soil and Water Conservation Department, Kohima, Nagaland</h2>
          </div>
          <img src="assets/soil-logo.jpg" alt="Soil Health logo" class="card-logo">
        </div>
      </header>

      <section class="soil-card-section">
        <h4>Test Center Information</h4>
        <div class="soil-card-meta">
          <div><strong>District</strong><p>${card.district}</p></div>
          <div><strong>Test Center Address</strong><p>${card.testCenterAddress}</p></div>
          <div><strong>Test Center ID</strong><p>${card.testCenterId}</p></div>
          <div><strong>Testing Date</strong><p>${formatDate(card.testingDate)}</p></div>
        </div>
      </section>

      <section class="soil-card-section">
        <h4>Card Issued To</h4>
        <div class="soil-card-issued">
          <div><strong>Survey No.</strong><p>${card.surveyNo}</p></div>
          <div><strong>Name</strong><p>${card.farmerName}</p></div>
          <div><strong>Village</strong><p>${card.farmerVillage}</p></div>
        </div>
      </section>

      <section class="soil-card-section">
        <h4>Soil Sample Details</h4>
        ${parameterTableMarkup}
      </section>

      <section class="soil-card-section">
        <h4>Additional Sample Information</h4>
        <div class="soil-card-meta">
          <div><strong>Soil Texture</strong><p>${card.soilTexture || "Not provided"}</p></div>
          <div><strong>Moisture Context</strong><p>${card.moistureContext || "Not provided"}</p></div>
          <div><strong>Generated By</strong><p>${card.createdBy || "System"}</p></div>
          <div><strong>Card ID</strong><p>${card.id}</p></div>
        </div>
      </section>

      <section class="soil-card-section">
        <h4>Measured Scale Indicator Information</h4>
        <div class="status-indicators-grid">
          <span class="status-green">GREEN: SUFFICIENT</span>
          <span class="status-yellow">YELLOW: MEDIUM</span>
          <span class="status-orange">ORANGE: MODERATE</span>
          <span class="status-red">RED: DEFICIENT</span>
          <span class="status-grey">GREY: NOT AVAILABLE</span>
        </div>
      </section>

      <section class="soil-card-section">
        <h4>Recommendation</h4>
        <div class="recommendation-box">
          <p>${card.recommendation}</p>
        </div>
      </section>

      <section class="soil-card-section">
        <h4>Support & Contact</h4>
        <div class="recommendation-box">
          <p><strong>Email:</strong> SHCS&Wdirectorateteam@gmail.com</p>
          <p><strong>Phone:</strong> 7005303701</p>
        </div>
      </section>
    </div>
  `;
}

function renderAdminCardsTable() {
  ui.adminCardsTable.innerHTML = state.cards.length
    ? state.cards
        .slice()
        .reverse()
        .map(
          (card) => `
            <tr>
              <td>${card.id}</td>
              <td>${card.district}</td>
              <td>${card.farmerName}</td>
              <td>${card.surveyNo}</td>
              <td>${formatDate(card.testingDate)}</td>
              <td>
                <button type="button" class="button button-secondary table-action" data-view-card="${card.id}">Inspect</button>
                <button type="button" class="button button-secondary table-action" data-delete-card="${card.id}">Delete</button>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="6">No Soil Health Cards generated yet.</td></tr>`;
}

function renderDistrictCardsTable() {
  const districtCards = state.cards.filter((card) => card.district === currentUser?.district);
  ui.districtCardsTable.innerHTML = districtCards.length
    ? districtCards
        .slice()
        .reverse()
        .map(
          (card) => `
            <tr>
              <td>${card.id}</td>
              <td>${card.farmerName}</td>
              <td>${card.surveyNo}</td>
              <td>${formatDate(card.testingDate)}</td>
              <td>
                <button type="button" class="button button-secondary table-action" data-view-card="${card.id}">View</button>
                <button type="button" class="button button-secondary table-action" data-delete-card="${card.id}">Delete</button>
              </td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5">No cards saved for this district yet.</td></tr>`;
}

function renderAdminDashboard() {
  ui.dashboardTitle.textContent = "Scheme Administrator Dashboard";
  ui.dashboardSubtitle.textContent = "Create district users, inspect all district records, and monitor programme activity.";
  ui.adminPanel.classList.remove("hidden");
  ui.districtPanel.classList.add("hidden");

  renderStats(ui.adminStats, [
    { value: state.accounts.filter((account) => account.role === "district").length, label: "District Accounts", note: "Managed by scheme administrator" },
    { value: state.cards.length, label: "Cards Generated", note: "All district data visible here" },
    { value: new Set(state.cards.map((card) => card.district)).size, label: "Active Districts", note: "Districts with at least one card" }
  ]);

  renderAccountsTable();
  renderAdminCardsTable();
  ui.adminCardPreview.innerHTML = `<div class="empty-state">Select a card from the table to inspect all entered data.</div>`;
}

function renderDistrictDashboard() {
  ui.dashboardTitle.textContent = `${currentUser.district} District Dashboard`;
  ui.dashboardSubtitle.textContent = "Enter soil test data and generate Soil Health Cards for the district.";
  ui.adminPanel.classList.add("hidden");
  ui.districtPanel.classList.remove("hidden");

  const districtCards = state.cards.filter((card) => card.district === currentUser.district);

  renderStats(ui.districtStats, [
    { value: districtCards.length, label: "Cards Saved", note: "Records created in this district account" },
    { value: currentUser.district, label: "District", note: currentUser.address },
    { value: parameterDefinitions.length, label: "Measured Parameters", note: "Includes texture and moisture context" }
  ]);

  ui.formDistrict.value = currentUser.district;
  ui.formDistrict.readOnly = true;
  if (!ui.testCenterAddress.value) ui.testCenterAddress.value = currentUser.address;
  if (!ui.testingDate.value) ui.testingDate.value = new Date().toISOString().split("T")[0];
  renderDistrictCardsTable();
}

function renderApp() {
  if (!currentUser) {
    ui.appShell.classList.add("hidden");
    ui.sessionText.textContent = "Secure role-based access";
    return;
  }

  ui.appShell.classList.remove("hidden");
  ui.sessionText.textContent = `${currentUser.role === "admin" ? "Scheme Administrator" : "District User"} logged in: ${currentUser.username}`;

  if (currentUser.role === "admin") {
    renderAdminDashboard();
  } else {
    renderDistrictDashboard();
  }
}

function showCardById(cardId, targetElement) {
  const card = state.cards.find((entry) => entry.id === cardId);
  if (!card) return;
  targetElement.innerHTML = buildCardMarkup(card);
  lastCardForPdf = card;
}

function openPrintWindow(card) {
  if (!card) return;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${card.id} - Soil Health Card</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="styles.css" />
        <style>
          body { background: #fff; margin: 0; padding: 0; }
          .print-wrap { padding: 0; }
          @page { size: A4; margin: 12mm; }
          .soil-card { width: 210mm; min-height: 297mm; box-shadow: none; border: none; border-radius: 0; padding: 12mm; }
        </style>
      </head>
      <body>
        <div class="print-wrap">
          ${buildCardMarkup(card)}
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup blocked. Please allow popups to download PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function downloadExampleCsv() {
  const csvContent = `District,Officer Name,Username,Password,Address
Kohima,District Soil Officer,kohima_user,District@123,District Test Center, Kohima, Nagaland
Dimapur,District Soil Officer,dimapur_user,District@123,District Test Center, Dimapur, Nagaland
Mokokchung,District Soil Officer,mokokchung_user,District@123,District Test Center, Mokokchung, Nagaland`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "district_accounts_example.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleBulkUpload() {
  const file = ui.bulkUploadFile.files[0];
  if (!file) {
    setMessage(ui.bulkUploadMessage, "Please select a CSV file to upload.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const csvText = event.target.result;
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      setMessage(ui.bulkUploadMessage, "CSV file must contain at least a header row and one data row.", "error");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['District', 'Officer Name', 'Username', 'Password', 'Address'];
    
    if (!expectedHeaders.every(header => headers.includes(header))) {
      setMessage(ui.bulkUploadMessage, "CSV headers must be: District, Officer Name, Username, Password, Address", "error");
      return;
    }

    const newAccounts = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== 5) {
        errorCount++;
        continue;
      }

      const [district, officerName, username, password, address] = values;

      if (!district || !officerName || !username || !password || !address) {
        errorCount++;
        continue;
      }

      // Check if username already exists
      if (state.accounts.some(acc => acc.username === username)) {
        errorCount++;
        continue;
      }

      newAccounts.push({
        id: `district-${Date.now()}-${i}`,
        role: "district",
        district,
        officerName,
        username,
        password,
        address
      });
      successCount++;
    }

    if (newAccounts.length > 0) {
      state.accounts.push(...newAccounts);
      saveState();
      renderAccountsTable();
      renderAdminDashboard();
    }

    ui.bulkUploadForm.reset();
    setMessage(ui.bulkUploadMessage, `Bulk upload completed. ${successCount} accounts created, ${errorCount} errors.`, successCount > 0 ? "success" : "error");
  };

  reader.readAsText(file);
}

function downloadCardsExampleCsv() {
  const csvContent = `District,Testing Date,Test Center Address,Test Center ID,Survey No.,Farmer Name,Farmer Village,Soil Texture,Moisture Context,pH,EC,Organic Carbon,Nitrogen,Phosphorous,Potassium,Sulphur,Zinc,Boron,Iron,Manganese,Copper,Manual Recommendation
Kohima,2024-05-07,District Test Center, Kohima, Nagaland,KTC001,1,John Doe,Kohima Village,Sandy,Dry,6.5,0.8,0.6,320,18,200,12,0.8,0.6,5.5,3,0.3,Custom recommendation text here
Kohima,2024-05-08,District Test Center, Kohima, Nagaland,KTC002,2,Jane Smith,Kohima Village,Loamy,Moderate,7.2,1.2,0.7,280,22,180,15,0.7,0.7,6.0,2.5,0.4,Another recommendation`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "soil_health_cards_example.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleBulkCardsUpload() {
  const file = ui.bulkCardsUploadFile.files[0];
  if (!file) {
    setMessage(ui.bulkCardsUploadMessage, "Please select a CSV file to upload.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const csvText = event.target.result;
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      setMessage(ui.bulkCardsUploadMessage, "CSV file must contain at least a header row and one data row.", "error");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['District', 'Testing Date', 'Test Center Address', 'Test Center ID', 'Survey No.', 'Farmer Name', 'Farmer Village', 'Soil Texture', 'Moisture Context', 'pH', 'EC', 'Organic Carbon', 'Nitrogen', 'Phosphorous', 'Potassium', 'Sulphur', 'Zinc', 'Boron', 'Iron', 'Manganese', 'Copper', 'Manual Recommendation'];
    
    if (!expectedHeaders.every(header => headers.includes(header))) {
      setMessage(ui.bulkCardsUploadMessage, "CSV headers must match the expected format. Please check the example CSV.", "error");
      return;
    }

    const newCards = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== 22) {
        errorCount++;
        continue;
      }

      const [district, testingDate, testCenterAddress, testCenterId, surveyNo, farmerName, farmerVillage, soilTexture, moistureContext, ph, ec, organicCarbon, nitrogen, phosphorous, potassium, sulphur, zinc, boron, iron, manganese, copper, manualRecommendation] = values;

      if (!district || !testingDate || !testCenterAddress || !testCenterId || !surveyNo || !farmerName || !farmerVillage || !soilTexture || !moistureContext) {
        errorCount++;
        continue;
      }

      // Validate district matches current user
      if (district !== currentUser.district) {
        errorCount++;
        continue;
      }

      const parameters = {
        ph: ph || "",
        ec: ec || "",
        organicCarbon: organicCarbon || "",
        nitrogen: nitrogen || "",
        phosphorous: phosphorous || "",
        potassium: potassium || "",
        sulphur: sulphur || "",
        zinc: zinc || "",
        boron: boron || "",
        iron: iron || "",
        manganese: manganese || "",
        copper: copper || ""
      };

      const evaluations = {};
      parameterDefinitions.forEach((def) => {
        evaluations[def.key] = evaluateParameter(def, parameters[def.key]);
      });

      const autoRecommendation = getRecommendationLines(
        evaluations,
        soilTexture,
        moistureContext
      ).join(" ");

      newCards.push({
        id: `SHC-${Date.now()}-${i}`,
        district,
        testCenterAddress,
        testCenterId,
        testingDate,
        surveyNo,
        farmerName,
        farmerVillage,
        soilTexture,
        moistureContext,
        parameters,
        evaluations,
        recommendation: manualRecommendation || autoRecommendation,
        createdBy: currentUser?.username || "",
        createdAt: new Date().toISOString()
      });
      successCount++;
    }

    if (newCards.length > 0) {
      state.cards.push(...newCards);
      saveState();
      renderDistrictDashboard();
    }

    ui.bulkCardsUploadForm.reset();
    setMessage(ui.bulkCardsUploadMessage, `Bulk upload completed. ${successCount} cards generated, ${errorCount} errors.`, successCount > 0 ? "success" : "error");
  };

  reader.readAsText(file);
}

ui.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = ui.loginUsername.value.trim();
  const password = ui.loginPassword.value.trim();

  const account = state.accounts.find(
    (entry) => entry.username === username && entry.password === password
  );

  if (!account) {
    setMessage(ui.loginMessage, "Invalid username or password.", "error");
    return;
  }

  currentUser = account;
  setMessage(ui.loginMessage, `Login successful for ${account.username}.`, "success");
  renderApp();
});

ui.logoutButton.addEventListener("click", () => {
  currentUser = null;
  renderApp();
  setMessage(ui.loginMessage, "Logged out successfully.", "success");
});

ui.downloadExampleCsv.addEventListener("click", (event) => {
  event.preventDefault();
  downloadExampleCsv();
});

ui.bulkUploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleBulkUpload();
});

ui.downloadCardsExampleCsv.addEventListener("click", (event) => {
  event.preventDefault();
  downloadCardsExampleCsv();
});

ui.bulkCardsUploadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleBulkCardsUpload();
});

ui.districtAccountForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const district = document.getElementById("districtName").value.trim();
  const officerName = document.getElementById("districtOfficer").value.trim();
  const username = document.getElementById("districtUsername").value.trim();
  const password = document.getElementById("districtPassword").value.trim();
  const address = document.getElementById("districtAddress").value.trim();

  if (state.accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
    setMessage(ui.districtAccountMessage, "Username already exists. Choose another username.", "error");
    return;
  }

  state.accounts.push({
    id: `district-${Date.now()}`,
    role: "district",
    district,
    officerName,
    username,
    password,
    address
  });

  saveState();
  ui.districtAccountForm.reset();
  renderAdminDashboard();
  setMessage(ui.districtAccountMessage, `District account created for ${district}.`, "success");
});

ui.previewButton.addEventListener("click", () => {
  const previewCard = buildCardRecord(true);
  ui.districtCardPreview.innerHTML = buildCardMarkup(previewCard);
  lastCardForPdf = previewCard;
  setMessage(ui.soilCardMessage, "Preview generated from current form values.", "success");
});

ui.soilCardForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const card = buildCardRecord(false);

  if (!card.district || !card.testingDate || !card.testCenterId || !card.farmerName || !card.farmerVillage) {
    setMessage(ui.soilCardMessage, "Please complete all required card details.", "error");
    return;
  }

  state.cards.push(card);
  saveState();
  renderDistrictDashboard();
  renderAdminCardsTable();
  ui.districtCardPreview.innerHTML = buildCardMarkup(card);
  lastCardForPdf = card;
  setMessage(ui.soilCardMessage, `Soil Health Card ${card.id} saved successfully.`, "success");
});

ui.adminDownloadPdfButton?.addEventListener("click", () => {
  if (!lastCardForPdf) {
    alert("Please select a Soil Health Card first.");
    return;
  }
  openPrintWindow(lastCardForPdf);
});

ui.districtDownloadPdfButton?.addEventListener("click", () => {
  if (!lastCardForPdf) {
    alert("Please preview or save a Soil Health Card first.");
    return;
  }
  openPrintWindow(lastCardForPdf);
});

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view-card]");
  const deleteCardButton = event.target.closest("[data-delete-card]");

  if (viewButton) {
    const cardId = viewButton.dataset.viewCard;
    if (currentUser?.role === "admin") {
      showCardById(cardId, ui.adminCardPreview);
    } else {
      showCardById(cardId, ui.districtCardPreview);
    }
    return;
  }

  if (deleteCardButton) {
    const cardId = deleteCardButton.dataset.deleteCard;
    const card = state.cards.find((entry) => entry.id === cardId);
    if (!card) return;

    const isAuthorized = currentUser?.role === "admin" || (currentUser?.role === "district" && card.district === currentUser.district);
    if (!isAuthorized) return;

    const confirmed = confirm(`Delete Soil Health Card ${card.id}?`);
    if (!confirmed) return;

    state.cards = state.cards.filter((entry) => entry.id !== cardId);
    saveState();
    renderApp();

    if (currentUser?.role === "admin") {
      setMessage(ui.districtAccountMessage, `Deleted Soil Health Card ${card.id}.`, "success");
    } else {
      setMessage(ui.soilCardMessage, `Deleted Soil Health Card ${card.id}.`, "success");
    }
    return;
  }
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-account]");
  const deleteButton = event.target.closest("[data-delete-account]");

  if (deleteButton && currentUser?.role === "admin") {
    const accountId = deleteButton.dataset.deleteAccount;
    const account = state.accounts.find((entry) => entry.id === accountId);
    if (!account) return;
    const confirmed = confirm(`Delete district account "${account.username}" (${account.district})?`);
    if (!confirmed) return;
    state.accounts = state.accounts.filter((entry) => entry.id !== accountId);
    saveState();
    renderAdminDashboard();
    setMessage(ui.districtAccountMessage, `Deleted account for ${account.district}.`, "success");
    return;
  }

  if (editButton && currentUser?.role === "admin") {
    const accountId = editButton.dataset.editAccount;
    const account = state.accounts.find((entry) => entry.id === accountId);
    if (!account) return;

    const district = prompt("District name:", account.district) ?? account.district;
    const officerName = prompt("Officer name:", account.officerName) ?? account.officerName;
    const username = prompt("Username:", account.username) ?? account.username;
    const password = prompt("Password:", account.password) ?? account.password;
    const address = prompt("Test center address:", account.address) ?? account.address;

    const usernameTaken = state.accounts.some(
      (entry) => entry.id !== accountId && entry.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (usernameTaken) {
      setMessage(ui.districtAccountMessage, "Username already exists. Choose another username.", "error");
      return;
    }

    account.district = district.trim() || account.district;
    account.officerName = officerName.trim() || account.officerName;
    account.username = username.trim() || account.username;
    account.password = password.trim() || account.password;
    account.address = address.trim() || account.address;

    saveState();
    renderAdminDashboard();
    setMessage(ui.districtAccountMessage, `Updated account for ${account.district}.`, "success");
  }
});

buildParameterInputs();
renderApp();
