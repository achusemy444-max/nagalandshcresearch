// Shared helpers for Soil Health Report system

export const STORAGE_KEY = "soil-health-report-nagaland-next";
export const CURRENT_USER_KEY = "shc-current-user";

export const parameterDefinitions = [
  { key: "ph", label: "pH", unit: "", type: "ph", min: 5.5, max: 8.5, rangeText: "5.5 - 8.5" },
  { key: "ec", label: "EC (Electric Conductivity)", unit: "dS/m", type: "ec", max: 1, rangeText: "< 1" },
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

export const defaultState = {
  accounts: [
    {
      id: "admin-1",
      role: "admin",
      district: "All Districts",
      officerName: "Administrator",
      username: "admin",
      password: "admin",
      address: "Department of Soil & Water Conservation, Nagaland",
      createdAt: new Date().toISOString()
    },
    {
      id: "district-1",
      role: "district",
      district: "Kohima",
      officerName: "District Soil Officer",
      username: "kohima_user",
      password: "District@123",
      address: "District Soil & Water Conservation Center, Kohima, Nagaland",
      createdAt: new Date().toISOString()
    }
  ],
  cards: []
};

export function migrateState(draft) {
  const adminAccount = draft.accounts.find((account) => account.role === "admin");
  if (!adminAccount) {
    draft.accounts.unshift({ ...defaultState.accounts[0] });
  } else {
    adminAccount.username = "admin";
    adminAccount.password = "admin";
    adminAccount.district = "All Districts";
    adminAccount.officerName = adminAccount.officerName || "Administrator";
    adminAccount.address = adminAccount.address || "Department of Soil & Water Conservation, Nagaland";
  }
  draft.accounts = draft.accounts.filter((account, index) => {
    if (account.role !== "admin") return true;
    return index === draft.accounts.findIndex((a) => a.role === "admin");
  });
  return draft;
}

export function loadLocalState() {
  if (typeof window === "undefined") {
    return defaultState;
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return { ...defaultState };
  }
  try {
    const parsed = JSON.parse(saved);
    const hydrated = {
      accounts: Array.isArray(parsed.accounts) && parsed.accounts.length ? parsed.accounts : [...defaultState.accounts],
      cards: Array.isArray(parsed.cards) ? parsed.cards : []
    };
    return migrateState(hydrated);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return { ...defaultState };
  }
}

export function saveLocalState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadCurrentUser() {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function saveCurrentUser(user) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getConvexConfig() {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const accessToken = process.env.NEXT_PUBLIC_CONVEX_ACCESS_TOKEN?.trim();
  
  if (!url) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
    return null;
  }
  
  if (!accessToken) {
    console.warn("Missing NEXT_PUBLIC_CONVEX_ACCESS_TOKEN - mutations may fail");
  }
  
  const options = {};
  if (accessToken) {
    options.accessToken = accessToken;
  }
  return { url, options };
}

export function buildConvexClient() {
  if (typeof window === "undefined" || !window.convex) {
    console.error("Convex SDK not loaded in browser");
    return null;
  }
  const config = getConvexConfig();
  if (!config) {
    console.error("Failed to get Convex config");
    return null;
  }
  try {
    const client = new window.convex.ConvexClient(config.url, config.options);
    console.log("Convex client initialized successfully with URL:", config.url);
    return client;
  } catch (error) {
    console.error("Failed to initialize Convex client:", error);
    return null;
  }
}

export function classifyRange(value, min, max) {
  if (value >= min && value <= max) return { status: "green", text: "SUFFICIENT" };
  const distance = value < min ? (min - value) / Math.max(min, 1) : (value - max) / Math.max(max, 1);
  if (distance <= 0.1) return { status: "yellow", text: "MEDIUM" };
  if (distance <= 0.25) return { status: "orange", text: "MODERATE" };
  return { status: "red", text: "DEFICIENT" };
}

export function classifyGreaterThan(value, min) {
  if (value >= min) return { status: "green", text: "SUFFICIENT" };
  if (value >= min * 0.85) return { status: "yellow", text: "MEDIUM" };
  if (value >= min * 0.7) return { status: "orange", text: "MODERATE" };
  return { status: "red", text: "DEFICIENT" };
}

export function classifyLessThan(value, max) {
  if (value < max) return { status: "green", text: "SUFFICIENT" };
  if (value <= max * 1.2) return { status: "yellow", text: "MEDIUM" };
  if (value <= max * 1.5) return { status: "orange", text: "MODERATE" };
  return { status: "red", text: "DEFICIENT" };
}

export function classifyPh(value) {
  if (value < 5.5) {
    return { status: "red", text: "HIGH ACIDIC" };
  } else if (value > 8.5) {
    return { status: "red", text: "HIGHLY ALKALINE" };
  } else {
    return { status: "green", text: "NEUTRAL" };
  }
}

export function classifyEc(value, max) {
  if (value <= max) {
    return { status: "green", text: "NORMAL" };
  } else {
    return { status: "red", text: "HIGH SALINE" };
  }
}

export function evaluateParameter(definition, value) {
  if (value === "" || value === null || Number.isNaN(Number(value))) {
    return { value: "", status: "grey", text: "NOT AVAILABLE", rangeText: definition.rangeText };
  }
  const numericValue = Number(value);
  let result;
  if (definition.key === "ph") {
    result = classifyPh(numericValue);
  } else if (definition.key === "ec") {
    result = classifyEc(numericValue, definition.max);
  } else if (definition.type === "range") {
    result = classifyRange(numericValue, definition.min, definition.max);
  } else if (definition.type === "gt") {
    result = classifyGreaterThan(numericValue, definition.min);
  } else {
    result = classifyLessThan(numericValue, definition.max);
  }
  return { value: numericValue, status: result.status, text: result.text, rangeText: definition.rangeText };
}

export function getRecommendationLines(evaluations, soilTexture, soilColor) {
  const recommendations = new Set();
  const status = (key) => evaluations[key]?.status;

  if (["yellow", "orange", "red"].includes(status("ph"))) {
    recommendations.add("Lime");
  }
  if (status("ec") !== "green" && status("ec") !== "grey") {
    recommendations.add("Gypsum");
  }
  if (status("organicCarbon") !== "green" && status("organicCarbon") !== "grey") {
    recommendations.add("Farmyard-Manure (FYM)");
  }
  if (status("nitrogen") !== "green" && status("nitrogen") !== "grey") {
    recommendations.add("Legume Intercropping");
  }
  if (status("phosphorous") !== "green" && status("phosphorous") !== "grey") {
    recommendations.add("Rock Phosphate");
  }
  if (status("potassium") !== "green" && status("potassium") !== "grey") {
    recommendations.add("Wood Ash");
  }
  if (status("sulphur") !== "green" && status("sulphur") !== "grey") {
    recommendations.add("Zinc Sulphate");
  }
  if (status("zinc") !== "green" && status("zinc") !== "grey") {
    recommendations.add("Zinc Sulphate");
  }
  if (status("boron") !== "green" && status("boron") !== "grey") {
    recommendations.add("Borax");
  }
  if (status("iron") !== "green" && status("iron") !== "grey") {
    recommendations.add("Ferrous Sulphate");
  }
  if (status("manganese") !== "green" && status("manganese") !== "grey") {
    recommendations.add("Manganese Sulphate");
  }
  if (status("copper") !== "green" && status("copper") !== "grey") {
    recommendations.add("Copper Sulphate");
  }

  if (!recommendations.size) {
    recommendations.add("All measured values are within the desired range. Continue balanced nutrient management and periodic soil testing.");
  }

  return Array.from(recommendations);
}

export function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function getStatusClass(status) {
  return `status-${status}`;
}

export function buildCardPreviewHtml(card) {
  const paramRows = parameterDefinitions.map((definition) => {
    const evaluation = card.evaluations?.[definition.key] || { value: "", status: "grey", text: "NOT AVAILABLE" };
    const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
    return `<div class="param-row"><div class="param-name">${definition.label}</div><div class="param-range">${definition.rangeText}</div><div class="param-value"><div class="param-measured">${displayValue}</div><div class="param-status ${getStatusClass(evaluation.status)}">${evaluation.text}</div></div></div>`;
  }).join("");
  
  // Create 2-column layout for parameters (6 rows, 2 columns)
  const leftColumnParams = parameterDefinitions.slice(0, 6);
  const rightColumnParams = parameterDefinitions.slice(6, 12);
  
  const leftColumnRows = leftColumnParams.map((definition) => {
    const evaluation = card.evaluations?.[definition.key] || { value: "", status: "grey", text: "NOT AVAILABLE" };
    const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
    return `<div class="param-row"><div class="param-name">${definition.label}</div><div class="param-range">${definition.rangeText}</div><div class="param-value"><div class="param-measured">${displayValue}</div><div class="param-status ${getStatusClass(evaluation.status)}">${evaluation.text}</div></div></div>`;
  }).join("");
  
  const rightColumnRows = rightColumnParams.map((definition) => {
    const evaluation = card.evaluations?.[definition.key] || { value: "", status: "grey", text: "NOT AVAILABLE" };
    const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
    return `<div class="param-row"><div class="param-name">${definition.label}</div><div class="param-range">${definition.rangeText}</div><div class="param-value"><div class="param-measured">${displayValue}</div><div class="param-status ${getStatusClass(evaluation.status)}">${evaluation.text}</div></div></div>`;
  }).join("");
  
  const recommendationText = card.recommendation || "Manure";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${card.id} - Soil Health Report</title><style>body{margin:0;font-family:Arial,sans-serif;color:#1b3421;background:#f6f8f3}*{box-sizing:border-box}.soil-card{max-width:210mm;width:100%;margin:0 auto;padding:24px;background:#fff;border-radius:18px;box-shadow:0 12px 34px rgba(0,0,0,.08)}.soil-card-header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.card-title{display:grid;gap:6px}.card-title h1{margin:0;font-size:1.1rem;color:#165f32}.card-title p{margin:0;color:#445643;font-size:.85rem}.info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}.info-block{background:rgba(109,152,88,.08);padding:12px;border-radius:12px}.info-block strong{display:block;font-size:.82rem;color:#1b3421;margin-bottom:4px}.info-block span{font-size:.75rem;color:#4d5f4b}.section{margin-bottom:18px}.section h2{margin:0 0 8px;font-size:0.92rem;color:#1d5d34}.parameter-table{display:grid;grid-template-columns:1fr 1fr;gap:20px}.parameter-column{display:grid;gap:10px}.param-row{display:grid;grid-template-columns:1.5fr 1fr 1.3fr;gap:10px;padding:12px 14px;border:1px solid rgba(23,49,29,.1);border-radius:10px;align-items:center;font-size:.78rem}.param-name{font-weight:700;color:#1b3421}.param-range{color:#5a6a57}.param-measured{font-weight:700;color:#263b28}.param-status{display:inline-flex;padding:.25rem .5rem;border-radius:999px;font-size:.68rem;font-weight:700;white-space:nowrap}.status-green{color:#1d6a3a;background:rgba(37,132,64,.12)}.status-yellow{color:#b58a00;background:rgba(255,214,84,.16)}.status-orange{color:#b35a00;background:rgba(255,173,75,.14)}.status-red{color:#b00020;background:rgba(255,148,148,.18)}.status-grey{color:#5b6b59;background:rgba(121,132,116,.12)}.recommendation-box{padding:16px;border-radius:14px;background:rgba(204,230,175,.2);border:1px solid rgba(109,152,88,.18);font-size:.86rem;line-height:1.5}.range-indicator{display:grid;grid-template-columns:1fr 1fr;gap:10px}.indicator-card{padding:14px;border-radius:14px;border:1px solid rgba(23,49,29,.08);background:#fafbf7}.indicator-card strong{display:block;margin-bottom:4px;color:#1c4725}.indicator-card span{font-size:.82rem;color:#475746}.footer{display:flex;flex-direction:column;gap:6px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(23,49,29,.1);font-size:.72rem;color:#5b6b57}.footer small{display:block}.disclaimer{font-size:.78rem;color:#3b4b3a;background:rgba(243,246,242,.6);padding:10px;border-radius:8px;margin-top:12px;border:1px solid rgba(23,49,29,.06)}</style></head><body><div class="soil-card"><div class="soil-card-header"><div class="card-title"><h1>Soil Health Card - State Level</h1><p></p></div><div class="logo-group"><div style="text-align:right"><strong>${card.id}</strong><br/><span>${formatDate(card.testingDate)}</span></div></div></div><div class="info-grid"><div class="info-block"><strong>District</strong><span>${card.district}</span></div><div class="info-block"><strong>Survey No.</strong><span>${card.surveyNo}</span></div><div class="info-block"><strong>Farmer Name and Village</strong><span>${card.farmerName}, ${card.farmerVillage}</span></div><div class="info-block"><strong>Test Center</strong><span>${card.testCenterAddress} (${card.testCenterId})</span></div></div><section class="section"><h2>Soil Sample Status</h2><div class="range-indicator"><div class="indicator-card"><strong>Soil Texture</strong><span>${card.soilTexture || 'Not specified'}</span></div><div class="indicator-card"><strong>Soil-Color</strong><span>${card.soilColor || card.moistureContext || 'Not specified'}</span></div></div></section><section class="section"><h2>Parameters | Range | Test Result</h2><div class="parameter-table"><div class="parameter-column">${leftColumnRows}</div><div class="parameter-column">${rightColumnRows}</div></div></section><section class="section"><h2>Recommendation</h2><div class="recommendation-box">${recommendationText}</div></section><section class="section"><div class="disclaimer"><strong>Disclaimer:</strong> Generated by the Department of Soil & Water Conservation, Nagaland for research and training. This report is advisory only and is NOT the legally recognised Government of India Soil Health Card. For the official SHC, visit https://soilhealth.dac.gov.in.</div></section><div class="footer"><small>Generated by Department of Soil & Water Conservation, Nagaland</small><small></small></div></div></body></html>`;
}
