// Shared helpers for Soil Health Card system

export const STORAGE_KEY = "soil-health-card-nagaland-next";
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
      officerName: "Scheme Administrator",
      username: "adminkohima123",
      password: "Adminkohima@123",
      address: "Soil and Water Conservation Department, Kohima, Nagaland",
      createdAt: new Date().toISOString()
    },
    {
      id: "district-1",
      role: "district",
      district: "Kohima",
      officerName: "District Soil Officer",
      username: "kohima_user",
      password: "District@123",
      address: "District Test Center, Kohima, Nagaland",
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
    adminAccount.username = "adminkohima123";
    adminAccount.password = "Adminkohima@123";
    adminAccount.district = "All Districts";
    adminAccount.officerName = adminAccount.officerName || "Scheme Administrator";
    adminAccount.address = adminAccount.address || "Soil and Water Conservation Department, Kohima, Nagaland";
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

export function classifyRange(value, min, max) {
  if (value >= min && value <= max) return { status: "green", text: "SUFFICIENT" };
  const distance = value < min ? (min - value) / Math.max(min, 1) : (value - max) / Math.max(max, 1);
  if (distance <= 0.1) return { status: "yellow", text: "MEDIUM" };
  if (distance <= 0.25) return { status: "orange", text: "LOW or HIGH" };
  return { status: "red", text: "DEFICIENT" };
}

export function classifyGreaterThan(value, min) {
  if (value >= min) return { status: "green", text: "SUFFICIENT" };
  if (value >= min * 0.85) return { status: "yellow", text: "MEDIUM" };
  if (value >= min * 0.7) return { status: "orange", text: "LOW or HIGH" };
  return { status: "red", text: "DEFICIENT" };
}

export function classifyLessThan(value, max) {
  if (value < max) return { status: "green", text: "SUFFICIENT" };
  if (value <= max * 1.2) return { status: "yellow", text: "MEDIUM" };
  if (value <= max * 1.5) return { status: "orange", text: "LOW or HIGH" };
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

export function getRecommendationLines(evaluations, soilTexture, moistureContext) {
  const lines = [];
  const getStatus = (key) => evaluations[key]?.status;
  if (["yellow", "orange", "red"].includes(getStatus("ph"))) {
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
