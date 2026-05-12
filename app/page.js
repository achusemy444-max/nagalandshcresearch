"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";

const STORAGE_KEY = "soil-health-card-nagaland-next";
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

function migrateState(draft) {
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

function loadLocalState() {
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

function saveLocalState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function classifyRange(value, min, max) {
  if (value >= min && value <= max) return { status: "green", text: "SUFFICIENT" };
  const distance = value < min ? (min - value) / Math.max(min, 1) : (value - max) / Math.max(max, 1);
  if (distance <= 0.1) return { status: "yellow", text: "MEDIUM" };
  if (distance <= 0.25) return { status: "orange", text: "LOW or HIGH" };
  return { status: "red", text: "DEFICIENT" };
}

function classifyGreaterThan(value, min) {
  if (value >= min) return { status: "green", text: "SUFFICIENT" };
  if (value >= min * 0.85) return { status: "yellow", text: "MEDIUM" };
  if (value >= min * 0.7) return { status: "orange", text: "LOW or HIGH" };
  return { status: "red", text: "DEFICIENT" };
}

function classifyLessThan(value, max) {
  if (value < max) return { status: "green", text: "SUFFICIENT" };
  if (value <= max * 1.2) return { status: "yellow", text: "MEDIUM" };
  if (value <= max * 1.5) return { status: "orange", text: "LOW or HIGH" };
  return { status: "red", text: "DEFICIENT" };
}

function classifyPh(value, max) {
  if (value >= 5.5 && value <= max) return { status: "green", text: "SUFFICIENT" };
  if (value >= 5 && value < 5.5) return { status: "yellow", text: "MEDIUM" };
  if (value >= 4.5 && value < 5) return { status: "orange", text: "LOW or HIGH" };
  if (value < 4.5) return { status: "red", text: "DEFICIENT" };
  if (value > max) return { status: "red", text: "DEFICIENT" };
  // This shouldn't be reached, but just in case
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
  return { value: numericValue, status: result.status, text: result.text, rangeText: definition.rangeText };
}

function getRecommendationLines(evaluations, soilTexture, moistureContext) {
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

function buildCardRecord(form, currentUser) {
  const evaluations = {};
  Object.entries(form.parameters).forEach(([key, value]) => {
    const definition = parameterDefinitions.find((entry) => entry.key === key);
    evaluations[key] = evaluateParameter(definition, value);
  });
  const autoRecommendation = getRecommendationLines(evaluations, form.soilTexture, form.moistureContext).join(" ");
  return {
    id: `SHC-${Date.now()}`,
    district: currentUser?.role === "district" ? currentUser.district : form.district.trim(),
    testCenterAddress: form.testCenterAddress.trim(),
    testCenterId: form.testCenterId.trim(),
    testingDate: form.testingDate,
    surveyNo: form.surveyNo.trim(),
    farmerName: form.farmerName.trim(),
    farmerVillage: form.farmerVillage.trim(),
    soilTexture: form.soilTexture,
    moistureContext: form.moistureContext,
    parameters: form.parameters,
    evaluations,
    recommendation: form.manualRecommendation.trim() || autoRecommendation,
    createdBy: currentUser?.username || "",
    createdAt: new Date().toISOString()
  };
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getStatusClass(status) {
  return `status-${status}`;
}

function buildCardJSX(card) {
  return (
    <div className="soil-card">
      <header className="soil-card-header">
        <div className="soil-card-header-content">
          <img src="/assets/gon-logo.png" alt="Government of Nagaland logo" className="card-logo card-logo-round" />
          <div className="soil-card-title">
            <h1>Soil Health Card</h1>
            <h2>Soil and Water Conservation Department, Kohima, Nagaland</h2>
          </div>
          <img src="/assets/soil-logo.jpg" alt="Soil Health logo" className="card-logo" />
        </div>
      </header>
      <section className="soil-card-section">
        <h4>Test Center Information</h4>
        <div className="soil-card-meta">
          <div><strong>District</strong><p>{card.district}</p></div>
          <div><strong>Test Center Address</strong><p>{card.testCenterAddress}</p></div>
          <div><strong>Test Center ID</strong><p>{card.testCenterId}</p></div>
          <div><strong>Testing Date</strong><p>{formatDate(card.testingDate)}</p></div>
        </div>
      </section>
      <section className="soil-card-section">
        <h4>Card Issued To</h4>
        <div className="soil-card-issued">
          <div><strong>Survey No.</strong><p>{card.surveyNo}</p></div>
          <div><strong>Name</strong><p>{card.farmerName}</p></div>
          <div><strong>Village</strong><p>{card.farmerVillage}</p></div>
        </div>
      </section>
      <section className="soil-card-section">
        <h4>Soil Sample Details</h4>
        <div className="parameter-table">
          <div className="param-column">
            <div className="param-column-header">
              <span>Parameter</span>
              <span>Range</span>
              <span>Value</span>
            </div>
            {parameterDefinitions.slice(0, 6).map((definition) => {
              const evaluation = card.evaluations[definition.key];
              const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
              return (
                <div className="param-row" key={definition.key}>
                  <div className="param-name">{definition.label}</div>
                  <div className="param-range">{definition.rangeText}</div>
                  <div className="param-value">
                    <div className="param-measured">{displayValue}</div>
                    <div className={`param-status ${getStatusClass(evaluation.status)}`}>{evaluation.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="param-column">
            <div className="param-column-header">
              <span>Parameter</span>
              <span>Range</span>
              <span>Value</span>
            </div>
            {parameterDefinitions.slice(6).map((definition) => {
              const evaluation = card.evaluations[definition.key];
              const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
              return (
                <div className="param-row" key={definition.key}>
                  <div className="param-name">{definition.label}</div>
                  <div className="param-range">{definition.rangeText}</div>
                  <div className="param-value">
                    <div className="param-measured">{displayValue}</div>
                    <div className={`param-status ${getStatusClass(evaluation.status)}`}>{evaluation.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="soil-card-section">
        <h4>Additional Sample Information</h4>
        <div className="soil-card-meta">
          <div><strong>Soil Texture</strong><p>{card.soilTexture || "Not provided"}</p></div>
          <div><strong>Moisture Context</strong><p>{card.moistureContext || "Not provided"}</p></div>
          <div><strong>Generated By</strong><p>{card.createdBy || "System"}</p></div>
          <div><strong>Card ID</strong><p>{card.id}</p></div>
        </div>
      </section>
      <section className="soil-card-section">
        <h4>Measured Scale Indicator Information</h4>
        <div className="status-indicators-grid">
          <span className="status-green">GREEN: SUFFICIENT</span>
          <span className="status-yellow">YELLOW: MEDIUM</span>
          <span className="status-orange">ORANGE: LOW or HIGH</span>
          <span className="status-red">RED: DEFICIENT</span>
          <span className="status-grey">GREY: NOT AVAILABLE</span>
        </div>
      </section>
      <section className="soil-card-section">
        <h4>Recommendation</h4>
        <div className="recommendation-box">
          <p>{card.recommendation}</p>
        </div>
      </section>
      <section className="soil-card-section">
        <h4>Support & Contact</h4>
        <div className="recommendation-box">
          <p><strong>Email:</strong> SHCS&Wdirectorateteam@gmail.com</p>
          <p><strong>Phone:</strong> 7005303701</p>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  const [state, setState] = useState(defaultState);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [convexReady, setConvexReady] = useState(false);
  const [convexClient, setConvexClient] = useState(null);
  const [apiClient, setApiClient] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [districtAccountForm, setDistrictAccountForm] = useState({ district: "", officerName: "", username: "", password: "", address: "" });
  const [soilCardForm, setSoilCardForm] = useState({
    district: "",
    testingDate: "",
    testCenterAddress: "",
    testCenterId: "",
    surveyNo: "1",
    farmerName: "",
    farmerVillage: "",
    soilTexture: "",
    moistureContext: "",
    manualRecommendation: "",
    parameters: {
      ph: "",
      ec: "",
      organicCarbon: "",
      nitrogen: "",
      phosphorous: "",
      potassium: "",
      sulphur: "",
      zinc: "",
      boron: "",
      iron: "",
      manganese: "",
      copper: ""
    }
  });
  const [messages, setMessages] = useState({
    login: "",
    loginType: "",
    districtAccount: "",
    districtAccountType: "",
    soilCard: "",
    soilCardType: "",
    bulkUpload: "",
    bulkUploadType: "",
    bulkCards: "",
    bulkCardsType: ""
  });

  useEffect(() => {
    const stored = loadLocalState();
    setState(stored);
    setSoilCardForm((prev) => ({ ...prev, testingDate: prev.testingDate || new Date().toISOString().split("T")[0] }));
  }, []);

  useEffect(() => {
    if (!convexReady) return;
    if (typeof window === "undefined" || !window.convex) return;
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    const accessToken = process.env.NEXT_PUBLIC_CONVEX_ACCESS_TOKEN;
    if (!url || !accessToken) return;
    const client = new window.convex.ConvexClient(url, {
      accessToken
    });
    setConvexClient(client);
    setApiClient(window.convex.anyApi);
  }, [convexReady]);

  useEffect(() => {
    if (currentUser?.role === "district") {
      setSoilCardForm((prev) => ({
        ...prev,
        district: currentUser.district,
        testCenterAddress: prev.testCenterAddress || currentUser.address
      }));
    }
  }, [currentUser]);

  async function remoteLoadAccounts() {
    if (!convexClient || !apiClient) return null;
    try {
      return await convexClient.query(apiClient.accounts.list, {});
    } catch (error) {
      console.warn("Convex load accounts error:", error);
      return null;
    }
  }

  async function remoteLoadCards(district = null) {
    if (!convexClient || !apiClient) return null;
    try {
      return await convexClient.query(apiClient.cards.list, { district });
    } catch (error) {
      console.warn("Convex load cards error:", error);
      return null;
    }
  }

  async function remoteCreateAccount(account) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.accounts.create, account);
  }

  async function remoteUpdateAccount(account) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.accounts.update, account);
  }

  async function remoteDeleteAccount(accountId) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.accounts.deleteAccount, { id: accountId });
  }

  async function remoteSaveCard(card) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.cards.save, card);
  }

  async function remoteDeleteCard(cardId) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.cards.deleteCard, { id: cardId });
  }

  async function refreshState(userDistrict = null) {
    const remoteAccounts = await remoteLoadAccounts();
    if (Array.isArray(remoteAccounts) && remoteAccounts.length) {
      setState((prev) => ({ ...prev, accounts: remoteAccounts }));
    }
    const remoteCards = await remoteLoadCards(userDistrict);
    if (Array.isArray(remoteCards)) {
      setState((prev) => ({ ...prev, cards: remoteCards }));
    }
  }

  const accounts = useMemo(() => state.accounts, [state.accounts]);
  const districtAccounts = useMemo(() => accounts.filter((account) => account.role === "district"), [accounts]);
  const districtCards = useMemo(
    () => (currentUser?.role === "district" ? state.cards.filter((card) => card.district === currentUser.district) : []),
    [state.cards, currentUser]
  );

  const adminStats = [
    { value: districtAccounts.length, label: "District Accounts", note: "Managed by scheme administrator" },
    { value: state.cards.length, label: "Cards Generated", note: "All district data visible here" },
    { value: new Set(state.cards.map((card) => card.district)).size, label: "Active Districts", note: "Districts with at least one card" }
  ];

  const districtStats = [
    { value: districtCards.length, label: "Cards Saved", note: "Records created in this district account" },
    { value: currentUser?.district || "-", label: "District", note: currentUser?.address || "" },
    { value: parameterDefinitions.length, label: "Measured Parameters", note: "Includes texture and moisture context" }
  ];

  const setMessage = (field, text, type = "") => {
    setMessages((prev) => ({
      ...prev,
      [field]: text,
      [`${field}Type`]: type
    }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const { username, password } = loginForm;
    let account = null;
    if (convexClient && apiClient) {
      try {
        account = await convexClient.query(apiClient.accounts.login, { username, password });
        if (!account) {
          const accountsRemote = await remoteLoadAccounts();
          if (Array.isArray(accountsRemote) && accountsRemote.length === 0) {
            await Promise.all(defaultState.accounts.map((acct) => remoteCreateAccount(acct).catch(() => null)));
            account = await convexClient.query(apiClient.accounts.login, { username, password });
          }
        }
      } catch (error) {
        console.warn("Login remote error", error);
      }
    }
    if (!account) {
      account = state.accounts.find((entry) => entry.username === username && entry.password === password);
    }
    if (!account) {
      setMessage("login", "Invalid username or password.", "error");
      return;
    }
    setCurrentUser(account);
    setMessage("login", `Login successful for ${account.username}.`, "success");
    if (convexClient && apiClient) {
      await refreshState(account.role === "district" ? account.district : null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCard(null);
    setMessage("login", "Logged out successfully.", "success");
  };

  const handleCreateDistrictAccount = async (event) => {
    event.preventDefault();
    const { district, officerName, username, password, address } = districtAccountForm;
    if (accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
      setMessage("districtAccount", "Username already exists. Choose another username.", "error");
      return;
    }
    const newAccount = {
      id: `district-${Date.now()}`,
      role: "district",
      district,
      officerName,
      username,
      password,
      address,
      createdAt: new Date().toISOString()
    };
    if (convexClient && apiClient) {
      try {
        await remoteCreateAccount(newAccount);
        await refreshState();
        setDistrictAccountForm({ district: "", officerName: "", username: "", password: "", address: "" });
        setMessage("districtAccount", `District account created for ${district}.`, "success");
        return;
      } catch (error) {
        console.warn("Remote create account failed, falling back locally", error);
      }
    }
    setState((prev) => {
      const next = { ...prev, accounts: [...prev.accounts, newAccount] };
      saveLocalState(next);
      return next;
    });
    setDistrictAccountForm({ district: "", officerName: "", username: "", password: "", address: "" });
    setMessage("districtAccount", `District account created locally for ${district}.`, "success");
  };

  const handleParameterChange = (key, value) => {
    setSoilCardForm((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }));
  };

  const handleSoilCardSubmit = async (event) => {
    event.preventDefault();
    const card = buildCardRecord(soilCardForm, currentUser);
    if (!card.district || !card.testingDate || !card.testCenterId || !card.farmerName || !card.farmerVillage) {
      setMessage("soilCard", "Please complete all required card details.", "error");
      return;
    }
    if (convexClient && apiClient) {
      try {
        await remoteSaveCard(card);
        await refreshState(currentUser?.role === "district" ? currentUser.district : null);
        setSelectedCard(card);
        setMessage("soilCard", `Soil Health Card ${card.id} saved successfully.`, "success");
        return;
      } catch (error) {
        console.warn("Remote save card failed, falling back locally", error);
      }
    }
    setState((prev) => {
      const next = { ...prev, cards: [...prev.cards, card] };
      saveLocalState(next);
      return next;
    });
    setSelectedCard(card);
    setMessage("soilCard", `Soil Health Card ${card.id} saved locally.`, "success");
  };

  const handlePreviewCard = () => {
    const previewCard = buildCardRecord(soilCardForm, currentUser);
    setSelectedCard(previewCard);
    setMessage("soilCard", "Preview generated from current form values.", "success");
  };

  const handleViewCard = (cardId) => {
    const card = state.cards.find((entry) => entry.id === cardId);
    if (!card) return;
    setSelectedCard(card);
  };

  const handleDeleteCard = async (cardId) => {
    const card = state.cards.find((entry) => entry.id === cardId);
    if (!card) return;
    if (!(currentUser?.role === "admin" || currentUser?.role === "district" && card.district === currentUser.district)) return;
    if (!confirm(`Delete Soil Health Card ${card.id}?`)) return;
    if (convexClient && apiClient) {
      try {
        await remoteDeleteCard(cardId);
        await refreshState(currentUser?.role === "district" ? currentUser.district : null);
        setMessage(currentUser.role === "admin" ? "districtAccount" : "soilCard", `Deleted Soil Health Card ${card.id}.`, "success");
        return;
      } catch (error) {
        console.warn("Remote delete failed, falling back locally", error);
      }
    }
    setState((prev) => {
      const next = { ...prev, cards: prev.cards.filter((entry) => entry.id !== cardId) };
      saveLocalState(next);
      return next;
    });
    setMessage(currentUser.role === "admin" ? "districtAccount" : "soilCard", `Deleted Soil Health Card ${card.id}.`, "success");
  };

  const handleDeleteAccount = async (accountId) => {
    const account = state.accounts.find((entry) => entry.id === accountId);
    if (!account) return;
    if (!confirm(`Delete district account "${account.username}" (${account.district})?`)) return;
    if (convexClient && apiClient) {
      try {
        await remoteDeleteAccount(accountId);
        await refreshState(currentUser?.role === "district" ? currentUser.district : null);
        setMessage("districtAccount", `Deleted account for ${account.district}.`, "success");
        return;
      } catch (error) {
        console.warn("Remote delete account failed, falling back locally", error);
      }
    }
    setState((prev) => {
      const next = { ...prev, accounts: prev.accounts.filter((entry) => entry.id !== accountId) };
      saveLocalState(next);
      return next;
    });
    setMessage("districtAccount", `Deleted account for ${account.district}.`, "success");
  };

  const handleEditAccount = async (accountId) => {
    const account = state.accounts.find((entry) => entry.id === accountId);
    if (!account) return;
    const district = prompt("District name:", account.district) ?? account.district;
    const officerName = prompt("Officer name:", account.officerName) ?? account.officerName;
    const username = prompt("Username:", account.username) ?? account.username;
    const password = prompt("Password:", account.password) ?? account.password;
    const address = prompt("Test center address:", account.address) ?? account.address;
    if (state.accounts.some((entry) => entry.id !== accountId && entry.username.toLowerCase() === username.trim().toLowerCase())) {
      setMessage("districtAccount", "Username already exists. Choose another username.", "error");
      return;
    }
    const updatedAccount = {
      ...account,
      district: district.trim() || account.district,
      officerName: officerName.trim() || account.officerName,
      username: username.trim() || account.username,
      password: password.trim() || account.password,
      address: address.trim() || account.address
    };
    if (convexClient && apiClient) {
      try {
        await remoteUpdateAccount(updatedAccount);
        await refreshState(currentUser?.role === "district" ? currentUser.district : null);
        setMessage("districtAccount", `Updated account for ${updatedAccount.district}.`, "success");
        return;
      } catch (error) {
        console.warn("Remote update failed, falling back locally", error);
      }
    }
    setState((prev) => {
      const next = {
        ...prev,
        accounts: prev.accounts.map((entry) => (entry.id === accountId ? updatedAccount : entry))
      };
      saveLocalState(next);
      return next;
    });
    setMessage("districtAccount", `Updated account for ${updatedAccount.district}.`, "success");
  };

  const handleBulkUpload = async (event) => {
    event.preventDefault();
    const file = event.target.files?.[0] || null;
    if (!file) {
      setMessage("bulkUpload", "Please select a CSV file to upload.", "error");
      return;
    }
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      setMessage("bulkUpload", "CSV file must contain at least a header row and one data row.", "error");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim());
    const expectedHeaders = ["District", "Officer Name", "Username", "Password", "Address"];
    if (!expectedHeaders.every((header) => headers.includes(header))) {
      setMessage("bulkUpload", "CSV headers must be: District, Officer Name, Username, Password, Address", "error");
      return;
    }
    let successCount = 0;
    let errorCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length !== 5) {
        errorCount++;
        continue;
      }
      const [district, officerName, username, password, address] = values;
      if (!district || !officerName || !username || !password || !address) {
        errorCount++;
        continue;
      }
      if (state.accounts.some((acc) => acc.username.toLowerCase() === username.toLowerCase())) {
        errorCount++;
        continue;
      }
      const newAccount = {
        id: `district-${Date.now()}-${i}`,
        role: "district",
        district,
        officerName,
        username,
        password,
        address,
        createdAt: new Date().toISOString()
      };
      if (convexClient && apiClient) {
        try {
          await remoteCreateAccount(newAccount);
          successCount++;
          continue;
        } catch (error) {
          console.warn("Bulk remote account creation failed", error);
        }
      }
      setState((prev) => {
        const next = { ...prev, accounts: [...prev.accounts, newAccount] };
        saveLocalState(next);
        return next;
      });
      successCount++;
    }
    setMessage("bulkUpload", `Bulk upload completed. ${successCount} accounts created, ${errorCount} errors.`, successCount > 0 ? "success" : "error");
  };

  const handleBulkCardsUpload = async (event) => {
    event.preventDefault();
    const file = event.target.files?.[0] || null;
    if (!file) {
      setMessage("bulkCards", "Please select a CSV file to upload.", "error");
      return;
    }
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      setMessage("bulkCards", "CSV file must contain at least a header row and one data row.", "error");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim());
    const expectedHeaders = [
      "District",
      "Testing Date",
      "Test Center Address",
      "Test Center ID",
      "Survey No.",
      "Farmer Name",
      "Farmer Village",
      "Soil Texture",
      "Moisture Context",
      "pH",
      "EC",
      "Organic Carbon",
      "Nitrogen",
      "Phosphorous",
      "Potassium",
      "Sulphur",
      "Zinc",
      "Boron",
      "Iron",
      "Manganese",
      "Copper",
      "Manual Recommendation"
    ];
    if (!expectedHeaders.every((header) => headers.includes(header))) {
      setMessage("bulkCards", "CSV headers must match the expected format. Please check the example CSV.", "error");
      return;
    }
    let successCount = 0;
    let errorCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length !== 22) {
        errorCount++;
        continue;
      }
      const [district, testingDate, testCenterAddress, testCenterId, surveyNo, farmerName, farmerVillage, soilTexture, moistureContext, ph, ec, organicCarbon, nitrogen, phosphorous, potassium, sulphur, zinc, boron, iron, manganese, copper, manualRecommendation] = values;
      if (!district || !testingDate || !testCenterAddress || !testCenterId || !surveyNo || !farmerName || !farmerVillage || !soilTexture || !moistureContext) {
        errorCount++;
        continue;
      }
      if (currentUser?.role === "district" && district !== currentUser.district) {
        errorCount++;
        continue;
      }
      const parameters = { ph, ec, organicCarbon, nitrogen, phosphorous, potassium, sulphur, zinc, boron, iron, manganese, copper };
      const evaluations = {};
      parameterDefinitions.forEach((def) => {
        evaluations[def.key] = evaluateParameter(def, parameters[def.key]);
      });
      const autoRecommendation = getRecommendationLines(evaluations, soilTexture, moistureContext).join(" ");
      const card = {
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
      };
      if (convexClient && apiClient) {
        try {
          await remoteSaveCard(card);
          successCount++;
          continue;
        } catch (error) {
          console.warn("Bulk remote card save failed", error);
        }
      }
      setState((prev) => {
        const next = { ...prev, cards: [...prev.cards, card] };
        saveLocalState(next);
        return next;
      });
      successCount++;
    }
    setMessage("bulkCards", `Bulk upload completed. ${successCount} cards generated, ${errorCount} errors.`, successCount > 0 ? "success" : "error");
  };

  const renderCardHtml = (card) => {
    const paramRows = parameterDefinitions.map((definition) => {
      const evaluation = card.evaluations[definition.key];
      const displayValue = evaluation.value === "" ? "N/A" : `${evaluation.value} ${definition.unit}`.trim();
      return `<div class="param-row"><div class="param-name">${definition.label}</div><div class="param-range">${definition.rangeText}</div><div class="param-value"><div class="param-measured">${displayValue}</div><div class="param-status ${getStatusClass(evaluation.status)}">${evaluation.text}</div></div></div>`;
    }).join("");
    return `<div class="soil-card"><header class="soil-card-header"><div class="soil-card-header-content"><img src="/assets/gon-logo.png" alt="Government of Nagaland logo" class="card-logo card-logo-round"><div class="soil-card-title"><h1>Soil Health Card</h1><h2>Soil and Water Conservation Department, Kohima, Nagaland</h2></div><img src="/assets/soil-logo.jpg" alt="Soil Health logo" class="card-logo"></div></header><section class="soil-card-section"><h4>Test Center Information</h4><div class="soil-card-meta"><div><strong>District</strong><p>${card.district}</p></div><div><strong>Test Center Address</strong><p>${card.testCenterAddress}</p></div><div><strong>Test Center ID</strong><p>${card.testCenterId}</p></div><div><strong>Testing Date</strong><p>${formatDate(card.testingDate)}</p></div></div></section><section class="soil-card-section"><h4>Card Issued To</h4><div class="soil-card-issued"><div><strong>Survey No.</strong><p>${card.surveyNo}</p></div><div><strong>Name</strong><p>${card.farmerName}</p></div><div><strong>Village</strong><p>${card.farmerVillage}</p></div></div></section><section class="soil-card-section"><h4>Soil Sample Details</h4><div class="parameter-table"><div class="param-column"><div class="param-column-header"><span>Parameter</span><span>Range</span><span>Value</span></div>${paramRows}</div></div></section><section class="soil-card-section"><h4>Additional Sample Information</h4><div class="soil-card-meta"><div><strong>Soil Texture</strong><p>${card.soilTexture || "Not provided"}</p></div><div><strong>Moisture Context</strong><p>${card.moistureContext || "Not provided"}</p></div><div><strong>Generated By</strong><p>${card.createdBy || "System"}</p></div><div><strong>Card ID</strong><p>${card.id}</p></div></div></section><section class="soil-card-section"><h4>Recommendation</h4><div class="recommendation-box"><p>${card.recommendation}</p></div></section><section class="soil-card-section"><h4>Support & Contact</h4><div class="recommendation-box"><p><strong>Email:</strong> SHCS&Wdirectorateteam@gmail.com</p><p><strong>Phone:</strong> 7005303701</p></div></section></div>`;
  };

  const downloadCardPdf = (card) => {
    if (!card) return;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${card.id} - Soil Health Card</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body{background:#fff;margin:0;padding:0}.print-wrap{padding:0}@page{size:A4;margin:12mm}.soil-card{width:210mm;min-height:297mm;box-shadow:none;border:none;border-radius:0;padding:12mm}</style></head><body><div class="print-wrap">${renderCardHtml(card)}</div><script>window.onload=()=>window.print();</script></body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocked. Please allow popups to download PDF.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const accountActionButtons = (account) => (
    <>
      <button type="button" className="button button-secondary" onClick={() => handleEditAccount(account.id)}>Edit</button>
      <button type="button" className="button button-secondary" onClick={() => handleDeleteAccount(account.id)}>Delete</button>
    </>
  );

  return (
    <>
      <Script
        src="https://unpkg.com/convex@1.3.1/dist/browser.bundle.js"
        strategy="afterInteractive"
        onLoad={() => setConvexReady(true)}
      />
      <header className="site-header">
        <div className="container topbar">
          <img src="/assets/gon-logo.png" alt="Government of Nagaland logo" className="top-logo top-logo-round top-logo-left" />
          <div className="brand-center">
            <p className="mini-label">Soil and Water Conservation Department</p>
            <h1>Soil Health Card Research Programme</h1>
            <p className="brand-subtitle">Kohima, Nagaland</p>
          </div>
          <div className="session-box">
            <span className="status-dot"></span>
            <span>{currentUser ? `${currentUser.role === "admin" ? "Scheme Administrator" : "District User"} logged in: ${currentUser.username}` : "Secure role-based access"}</span>
          </div>
          <img src="/assets/soil-logo.jpg" alt="Soil Health logo" className="top-logo top-logo-right" />
        </div>
      </header>
      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="section-tag">Portal Overview</p>
              <h2>Login-based Soil Health Card system for scheme administration and district-level card generation.</h2>
              <p>
                This prototype includes one Scheme Administrator account that can create and manage district user accounts,
                inspect all district data, and monitor generated Soil Health Cards. District users can log in, enter soil
                testing data, and generate recommendation-ready Soil Health Cards.
              </p>
              <div className="hero-features">
                <span>Scheme administrator control</span>
                <span>District account creation</span>
                <span>12 soil parameters</span>
                <span>Texture and moisture context</span>
                <span>Status color indicators</span>
                <span>Recommendation generator</span>
              </div>
              <div className="hero-contact">
                <p><strong>Support & Contact:</strong> SHCS&Wdirectorateteam@gmail.com</p>
                <p><strong>Phone:</strong> 7005303701</p>
              </div>
            </div>
            <div className="login-card">
              <div className="card-head">
                <p className="section-tag">Login</p>
                <h3>Access the portal</h3>
              </div>
              <form onSubmit={handleLoginSubmit} className="stack-form">
                <label>
                  <span>Username</span>
                  <input type="text" value={loginForm.username} onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="Enter username" required />
                </label>
                <label>
                  <span>Password</span>
                  <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Enter password" required />
                </label>
                <button type="submit" className="button button-primary">Login</button>
              </form>
              <div className="login-help">
                <p><strong>Sample District User:</strong> kohima_user / District@123</p>
                <p><strong>Note:</strong> Administrator login details are not shown on the homepage.</p>
                <p>This portal saves login and Soil Health Card data online through your Convex backend.</p>
              </div>
              <p className={`form-message ${messages.loginType === "success" ? "message-success" : messages.loginType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.login}</p>
            </div>
          </div>
        </section>
        {currentUser && (
          <section className="workspace-section">
            <div className="container">
              <div className="workspace-header">
                <div>
                  <p className="section-tag">Dashboard</p>
                  <h2>{currentUser.role === "admin" ? "Scheme Administrator Dashboard" : `${currentUser.district} District Dashboard`}</h2>
                  <p>{currentUser.role === "admin" ? "Create district users, inspect all district records, and monitor programme activity." : "Enter soil test data and generate Soil Health Cards for the district."}</p>
                </div>
                <div className="toolbar-actions">
                  <button type="button" className="button button-primary" onClick={handleLogout}>Logout</button>
                </div>
              </div>
              {currentUser.role === "admin" ? (
                <section id="adminPanel" className="role-panel">
                  <div className="stats-grid" id="adminStats">
                    {adminStats.map((item) => (
                      <article key={item.label} className="stat-card">
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                        <p>{item.note}</p>
                      </article>
                    ))}
                  </div>
                  <div className="panel-grid">
                    <article className="panel-card wide-card">
                      <div className="card-head">
                        <p className="section-tag">Create District User</p>
                        <h3>Scheme Administrator Control</h3>
                      </div>
                      <form onSubmit={handleCreateDistrictAccount} className="form-grid">
                        <label>
                          <span>District</span>
                          <input type="text" value={districtAccountForm.district} onChange={(event) => setDistrictAccountForm((prev) => ({ ...prev, district: event.target.value }))} placeholder="Example: Dimapur" required />
                        </label>
                        <label>
                          <span>Officer Name</span>
                          <input type="text" value={districtAccountForm.officerName} onChange={(event) => setDistrictAccountForm((prev) => ({ ...prev, officerName: event.target.value }))} placeholder="District officer name" required />
                        </label>
                        <label>
                          <span>Username</span>
                          <input type="text" value={districtAccountForm.username} onChange={(event) => setDistrictAccountForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="Create username" required />
                        </label>
                        <label>
                          <span>Password</span>
                          <input type="text" value={districtAccountForm.password} onChange={(event) => setDistrictAccountForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Create password" required />
                        </label>
                        <label className="span-2">
                          <span>Test Center Address</span>
                          <input type="text" value={districtAccountForm.address} onChange={(event) => setDistrictAccountForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="District test center address" required />
                        </label>
                        <button type="submit" className="button button-primary">Create District Account</button>
                      </form>
                      <p className={`form-message ${messages.districtAccountType === "success" ? "message-success" : messages.districtAccountType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.districtAccount}</p>
                    </article>
                    <article className="panel-card">
                      <div className="card-head">
                        <p className="section-tag">Bulk Upload</p>
                        <h3>District Accounts CSV</h3>
                      </div>
                      <div className="bulk-upload-info">
                        <p>Upload multiple district accounts using CSV format. Download the example file from your browser if needed.</p>
                        <form className="form-grid">
                          <label className="span-2">
                            <span>CSV File</span>
                            <input type="file" accept=".csv" onChange={handleBulkUpload} />
                          </label>
                        </form>
                      </div>
                      <p className={`form-message ${messages.bulkUploadType === "success" ? "message-success" : messages.bulkUploadType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.bulkUpload}</p>
                    </article>
                    <article className="panel-card">
                      <div className="card-head">
                        <p className="section-tag">Account Rules</p>
                        <h3>Portal Access Model</h3>
                      </div>
                      <ul className="check-list compact">
                        <li>One Scheme Administrator controls all district accounts.</li>
                        <li>Administrator can inspect all Soil Health Card records.</li>
                        <li>District users can only create and inspect their district records.</li>
                        <li>All saved records stay in remote Convex backend with local fallback.</li>
                      </ul>
                    </article>
                  </div>
                  <div className="panel-grid">
                    <article className="panel-card">
                      <div className="card-head">
                        <p className="section-tag">District Accounts</p>
                        <h3>Managed Users</h3>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>District</th>
                              <th>Officer</th>
                              <th>Username</th>
                              <th>Address</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {districtAccounts.length ? districtAccounts.map((account) => (
                              <tr key={account.id}>
                                <td>{account.district}</td>
                                <td>{account.officerName}</td>
                                <td>{account.username}</td>
                                <td>{account.address}</td>
                                <td>{accountActionButtons(account)}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan="5">No district accounts created yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                    <article className="panel-card wide-card">
                      <div className="card-head">
                        <p className="section-tag">All District Data</p>
                        <h3>Generated Soil Health Cards</h3>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Card ID</th>
                              <th>District</th>
                              <th>Farmer</th>
                              <th>Survey No.</th>
                              <th>Testing Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.cards.length ? [...state.cards].reverse().map((card) => (
                              <tr key={card.id}>
                                <td>{card.id}</td>
                                <td>{card.district}</td>
                                <td>{card.farmerName}</td>
                                <td>{card.surveyNo}</td>
                                <td>{formatDate(card.testingDate)}</td>
                                <td>
                                  <button type="button" className="button button-secondary" onClick={() => handleViewCard(card.id)}>Inspect</button>
                                  <button type="button" className="button button-secondary" onClick={() => handleDeleteCard(card.id)}>Delete</button>
                                </td>
                              </tr>
                            )) : (
                              <tr><td colSpan="6">No Soil Health Cards generated yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </div>
                  <article className="panel-card">
                    <div className="card-head">
                      <p className="section-tag">Inspection View</p>
                      <h3>Selected Soil Health Card</h3>
                    </div>
                    <div className="card-actions">
                      <button type="button" className="button button-secondary" onClick={() => downloadCardPdf(selectedCard)}>Download PDF</button>
                    </div>
                    <div className="card-preview">
                      {selectedCard ? buildCardJSX(selectedCard) : "Select a card from the table to inspect all entered data."}
                    </div>
                  </article>
                </section>
              ) : (
                <section id="districtPanel" className="role-panel">
                  <div className="stats-grid" id="districtStats">
                    {districtStats.map((item) => (
                      <article key={item.label} className="stat-card">
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                        <p>{item.note}</p>
                      </article>
                    ))}
                  </div>
                  <div className="panel-grid">
                    <article className="panel-card wide-card">
                      <div className="card-head">
                        <p className="section-tag">Generate Soil Health Card</p>
                        <h3>District Data Entry</h3>
                      </div>
                      <form onSubmit={handleSoilCardSubmit} className="stack-form">
                        <div className="form-grid">
                          <label>
                            <span>District</span>
                            <input type="text" value={soilCardForm.district} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, district: event.target.value }))} required readOnly />
                          </label>
                          <label>
                            <span>Testing Date</span>
                            <input type="date" value={soilCardForm.testingDate} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, testingDate: event.target.value }))} required />
                          </label>
                          <label className="span-2">
                            <span>Test Center Address</span>
                            <input type="text" value={soilCardForm.testCenterAddress} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, testCenterAddress: event.target.value }))} placeholder="Enter district address" required />
                          </label>
                          <label>
                            <span>Test Center ID</span>
                            <input type="text" value={soilCardForm.testCenterId} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, testCenterId: event.target.value }))} placeholder="Center ID" required />
                          </label>
                          <label>
                            <span>Survey No.</span>
                            <input type="text" value={soilCardForm.surveyNo} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, surveyNo: event.target.value }))} required />
                          </label>
                          <label>
                            <span>Farmer Name</span>
                            <input type="text" value={soilCardForm.farmerName} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, farmerName: event.target.value }))} placeholder="Name" required />
                          </label>
                          <label>
                            <span>Farmer Village</span>
                            <input type="text" value={soilCardForm.farmerVillage} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, farmerVillage: event.target.value }))} placeholder="Village" required />
                          </label>
                          <label>
                            <span>Soil Texture</span>
                            <select value={soilCardForm.soilTexture} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, soilTexture: event.target.value }))} required>
                              <option value="">Select texture</option>
                              <option>Sandy</option>
                              <option>Loamy</option>
                              <option>Clayey</option>
                              <option>Silty</option>
                              <option>Gravelly</option>
                            </select>
                          </label>
                          <label>
                            <span>Moisture Context</span>
                            <select value={soilCardForm.moistureContext} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, moistureContext: event.target.value }))} required>
                              <option value="">Select moisture context</option>
                              <option>Dry</option>
                              <option>Moderate</option>
                              <option>Moist</option>
                              <option>Wet</option>
                            </select>
                          </label>
                        </div>
                        <div className="parameter-grid" id="parameterGrid">
                          {parameterDefinitions.map((parameter) => (
                            <label key={parameter.key}>
                              <span>{parameter.label} {parameter.unit ? `(${parameter.unit})` : ""}</span>
                              <input
                                type="number"
                                step="any"
                                value={soilCardForm.parameters[parameter.key]}
                                onChange={(event) => handleParameterChange(parameter.key, event.target.value)}
                                placeholder={`Range ${parameter.rangeText}`}
                              />
                            </label>
                          ))}
                        </div>
                        <label>
                          <span>Recommendation</span>
                          <textarea value={soilCardForm.manualRecommendation} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, manualRecommendation: event.target.value }))} rows="4" placeholder="Optional manual recommendation. Leave blank to auto-generate."></textarea>
                        </label>
                        <div className="form-actions">
                          <button type="submit" className="button button-primary">Save and Generate Card</button>
                          <button type="button" className="button button-secondary" onClick={handlePreviewCard}>Preview Current Data</button>
                        </div>
                      </form>
                      <p className={`form-message ${messages.soilCardType === "success" ? "message-success" : messages.soilCardType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.soilCard}</p>
                    </article>
                    <article className="panel-card">
                      <div className="card-head">
                        <p className="section-tag">Measured Scale</p>
                        <h3>Indicator Information</h3>
                      </div>
                      <div className="legend-list">
                        <div><span className="legend-dot legend-green"></span>GREEN: SUFFICIENT</div>
                        <div><span className="legend-dot legend-yellow"></span>YELLOW: MEDIUM</div>
                        <div><span className="legend-dot legend-orange"></span>ORANGE: LOW or HIGH</div>
                        <div><span className="legend-dot legend-red"></span>RED: DEFICIENT</div>
                        <div><span className="legend-dot legend-grey"></span>GREY: NOT AVAILABLE</div>
                      </div>
                    </article>
                  </div>
                  <div className="panel-grid">
                    <article className="panel-card">
                      <div className="card-head">
                        <p className="section-tag">Bulk Upload</p>
                        <h3>Soil Health Cards CSV</h3>
                      </div>
                      <div className="bulk-upload-info">
                        <p>Upload multiple soil health cards using CSV format.</p>
                        <form className="form-grid">
                          <label className="span-2">
                            <span>CSV File</span>
                            <input type="file" accept=".csv" onChange={handleBulkCardsUpload} />
                          </label>
                        </form>
                      </div>
                      <p className={`form-message ${messages.bulkCardsType === "success" ? "message-success" : messages.bulkCardsType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.bulkCards}</p>
                    </article>
                    <article className="panel-card">
                      <div className="card-head">
                        <p className="section-tag">Saved District Cards</p>
                        <h3>Generated Records</h3>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Card ID</th>
                              <th>Farmer</th>
                              <th>Survey No.</th>
                              <th>Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {districtCards.length ? [...districtCards].reverse().map((card) => (
                              <tr key={card.id}>
                                <td>{card.id}</td>
                                <td>{card.farmerName}</td>
                                <td>{card.surveyNo}</td>
                                <td>{formatDate(card.testingDate)}</td>
                                <td>
                                  <button type="button" className="button button-secondary" onClick={() => handleViewCard(card.id)}>View</button>
                                  <button type="button" className="button button-secondary" onClick={() => handleDeleteCard(card.id)}>Delete</button>
                                </td>
                              </tr>
                            )) : (
                              <tr><td colSpan="5">No cards saved for this district yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                    <article className="panel-card wide-card">
                      <div className="card-head">
                        <p className="section-tag">Card Preview</p>
                        <h3>Soil Health Card Output</h3>
                      </div>
                      <div className="card-actions">
                        <button type="button" className="button button-secondary" onClick={() => downloadCardPdf(selectedCard)}>Download PDF</button>
                      </div>
                      <div className="card-preview">
                        {selectedCard ? buildCardJSX(selectedCard) : "Fill the form and preview or save the card to see the generated output here."}
                      </div>
                    </article>
                  </div>
                </section>
              )}
            </div>
          </section>
        )}
        <section className="info-section info-section-soft">
          <div className="container credits-grid">
            <article className="panel-card">
              <div className="card-head">
                <p className="section-tag">Support & Contact</p>
                <h3>Reach the SHC Team</h3>
              </div>
              <p><strong>Email:</strong> SHCS&Wdirectorateteam@gmail.com</p>
              <p><strong>Phone:</strong> 7005303701</p>
              <p><strong>Office:</strong> Soil and Water Conservation Department, Kohima, Nagaland</p>
            </article>
            <article className="panel-card">
              <div className="card-head">
                <p className="section-tag">Programme Credits</p>
                <h3>Research Programme Team</h3>
              </div>
              <p><strong>Int. Developer:</strong> Khanchulo Semy</p>
              <p><strong>Cyber Security and Optimization Developer:</strong> Pekrukhrietuo Pienyu</p>
              <p><strong>SHC Virtualizer:</strong> Sir. Kihika G Yeptho</p>
              <p><strong>Advisor:</strong> Sir. Rontilo Kent</p>
              <p><strong>Supervisor:</strong> (Enter Name)</p>
            </article>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-row">
          <p>Soil Health Card Team Center · Soil and Water Conservation Department · Kohima, Nagaland</p>
          <p>SHC Research Programme Team Kohima</p>
        </div>
      </footer>
    </>
  );
}
