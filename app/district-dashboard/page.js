"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  parameterDefinitions,
  defaultState,
  loadCurrentUser,
  saveCurrentUser,
  evaluateParameter,
  getRecommendationLines,
  buildCardPreviewHtml,
  formatDate,
  getStatusClass,
  buildConvexClient
} from "../utils/shc-helpers";

export default function DistrictDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [state, setState] = useState(defaultState);
  const [selectedCard, setSelectedCard] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [convexReady, setConvexReady] = useState(false);
  const [convexClient, setConvexClient] = useState(null);
  const [apiClient, setApiClient] = useState(null);
  const [soilCardForm, setSoilCardForm] = useState({
    district: "",
    testingDate: "",
    testCenterAddress: "",
    testCenterId: "",
    surveyNo: "1",
    farmerName: "",
    farmerVillage: "",
    soilTexture: "",
    soilColor: "",
    recommendationChoice: "auto",
    parameters: {
      ph: "", ec: "", organicCarbon: "", nitrogen: "", phosphorous: "",
      potassium: "", sulphur: "", zinc: "", boron: "", iron: "", manganese: "", copper: ""
    }
  });
  const [messages, setMessages] = useState({ soilCard: "", soilCardType: "", bulkCards: "", bulkCardsType: "" });

  useEffect(() => {
    const user = loadCurrentUser();
    if (!user || user.role !== "district") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    setSoilCardForm((prev) => ({
      ...prev,
      testingDate: prev.testingDate || new Date().toISOString().split("T")[0],
      district: user.district,
      testCenterAddress: prev.testCenterAddress || user.address
    }));
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.convex) {
      setConvexReady(true);
    }
  }, []);

  useEffect(() => {
    if (!convexReady) return;
    const client = buildConvexClient();
    if (!client) {
      console.error("[District] Failed to build Convex client");
      return;
    }
    console.log("[District] Convex client initialized");
    setConvexClient(client);
    setApiClient(window.convex.anyApi);
  }, [convexReady]);

  useEffect(() => {
    if (!convexClient || !apiClient || !currentUser) return;

    const loadCards = async () => {
      const remoteCards = await remoteLoadCards(currentUser.district);
      if (remoteCards) {
        setState((prev) => ({ ...prev, cards: remoteCards }));
      }
    };
    loadCards();

    const interval = setInterval(loadCards, 15000);
    return () => clearInterval(interval);
  }, [convexClient, apiClient, currentUser]);

  async function remoteLoadCards(district) {
    if (!convexClient || !apiClient) return null;
    try {
      return await convexClient.query(apiClient.cards.list, { district });
    } catch (error) {
      console.warn("Convex load cards error:", error);
      return null;
    }
  }

  async function remoteSaveCard(card) {
    if (!convexClient || !apiClient) throw new Error("Convex backend unavailable. Please check your connection.");
    try {
      const result = await convexClient.mutation(apiClient.cards.save, card);
      // Reload cards from Convex to ensure consistency
      const updatedCards = await remoteLoadCards(currentUser?.district);
      if (updatedCards) {
        setState((prev) => ({ ...prev, cards: updatedCards }));
      }
      return result;
    } catch (error) {
      console.error("Failed to save card to Convex:", error);
      throw new Error("Failed to save card. Please try again.");
    }
  }

  async function remoteDeleteCard(cardId) {
    if (!convexClient || !apiClient) throw new Error("Convex backend unavailable. Please check your connection.");
    try {
      const result = await convexClient.mutation(apiClient.cards.deleteCard, { id: cardId });
      // Reload cards from Convex to ensure consistency
      const updatedCards = await remoteLoadCards(currentUser?.district);
      if (updatedCards) {
        setState((prev) => ({ ...prev, cards: updatedCards }));
      }
      return result;
    } catch (error) {
      console.error("Failed to delete card from Convex:", error);
      throw new Error("Failed to delete card. Please try again.");
    }
  }

  const districtCards = useMemo(
    () => (currentUser ? state.cards.filter((card) => card.district === currentUser.district) : []),
    [state.cards, currentUser]
  );

  const districtStats = [
    { value: districtCards.length, label: "Reports Saved", note: "Records created in this district account" },
    { value: currentUser?.district || "-", label: "District", note: currentUser?.address || "" },
    { value: parameterDefinitions.length, label: "Measured Parameters", note: "Includes texture and Soil-Color" }
  ];

  const setMessage = (field, text, type = "") => {
    setMessages((prev) => ({
      ...prev,
      [field]: text,
      [`${field}Type`]: type
    }));
  };

  const handleLogout = () => {
    saveCurrentUser(null);
    router.push("/");
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

  const buildCardRecord = (form) => {
    const evaluations = {};
    Object.entries(form.parameters).forEach(([key, value]) => {
      const definition = parameterDefinitions.find((entry) => entry.key === key);
      evaluations[key] = evaluateParameter(definition, value);
    });
    const recLines = getRecommendationLines(evaluations, form.soilTexture, form.soilColor);
    const autoRecommendation = recLines.join(", ");
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
      soilColor: form.soilColor,
      parameters: form.parameters,
      evaluations,
      recommendation: form.recommendationChoice === "auto" ? autoRecommendation : form.recommendationChoice,
      createdBy: currentUser?.username || "",
      createdAt: new Date().toISOString()
    };
  };

  const handleSoilCardSubmit = async (event) => {
    event.preventDefault();
    const card = buildCardRecord(soilCardForm);
    if (!card.district || !card.testingDate || !card.testCenterId || !card.farmerName || !card.farmerVillage) {
      setMessage("soilCard", "Please complete all required card details.", "error");
      return;
    }
    
    if (!convexClient || !apiClient) {
      setMessage("soilCard", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }
    
    try {
      // Confirm farmer consent before saving to the cloud
      const consent = confirm("Confirm: you have the farmer's explicit consent to store and process their soil data for advisory purposes? (Required)");
      if (!consent) {
        setMessage("soilCard", "Consent is required to save this soil report.", "error");
        return;
      }
      await remoteSaveCard(card);
      setSelectedCard(card);
      setPreviewHtml(buildCardPreviewHtml(card));
      setMessage("soilCard", `Soil Health Report ${card.id} saved successfully to cloud database.`, "success");
    } catch (error) {
      console.error("Save card error:", error);
      setMessage("soilCard", error.message || "Failed to save card. Please try again.", "error");
    }
  };

  const handlePreviewCard = () => {
    const consent = confirm("Confirm: you have the farmer's explicit consent to process and preview their soil data? (Required)");
    if (!consent) {
      setMessage("soilCard", "Consent is required to preview soil data.", "error");
      return;
    }
    const previewCard = buildCardRecord(soilCardForm);
    setSelectedCard(previewCard);
    setPreviewHtml(buildCardPreviewHtml(previewCard));
    setMessage("soilCard", "Preview generated from current form values.", "success");
  };

  const handleViewCard = (cardId) => {
    const card = state.cards.find((entry) => entry.id === cardId);
    if (!card) return;
    setSelectedCard(card);
    setPreviewHtml(buildCardPreviewHtml(card));
  };

  const handleDeleteCard = async (cardId) => {
    const card = state.cards.find((entry) => entry.id === cardId);
    if (!card) return;
    if (!confirm(`Delete Soil Health Report ${card.id}?`)) return;
    if (!convexClient || !apiClient) {
      setMessage("soilCard", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }
    try {
      await remoteDeleteCard(cardId);
      setState((prev) => ({...prev, cards: prev.cards.filter((entry) => entry.id !== cardId)}));
      setMessage("soilCard", `Deleted Soil Health Report ${card.id}.`, "success");
    } catch (error) {
      console.error("Delete card error:", error);
      setMessage("soilCard", error.message || "Failed to delete card. Please try again.", "error");
    }
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
    let successCount = 0, errorCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length !== 22) {
        errorCount++;
        continue;
      }
      const [district, testingDate, testCenterAddress, testCenterId, surveyNo, farmerName, farmerVillage, soilTexture, soilColor, ph, ec, organicCarbon, nitrogen, phosphorous, potassium, sulphur, zinc, boron, iron, manganese, copper, manualRecommendation] = values;
      if (!district || !testingDate || !testCenterAddress || !testCenterId || !surveyNo || !farmerName || !farmerVillage || !soilTexture || !soilColor) {
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
      const autoRecommendation = getRecommendationLines(evaluations, soilTexture, soilColor).join(" ");
      const recommendation = ["Lime", "Gypsum", "Manure"].includes(manualRecommendation)
        ? manualRecommendation
        : autoRecommendation;
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
        soilColor,
        parameters,
        evaluations,
        recommendation,
        createdBy: currentUser?.username || "",
        createdAt: new Date().toISOString()
      };
      
      if (!convexClient || !apiClient) {
        errorCount++;
        continue;
      }
      
      try {
        await remoteSaveCard(card);
        successCount++;
      } catch (error) {
        console.error("Bulk card save failed:", error);
        errorCount++;
      }
    }
    setMessage("bulkCards", `Bulk upload completed. ${successCount} reports generated, ${errorCount} errors.`, successCount > 0 ? "success" : "error");
  };

  const downloadCardPdf = (card) => {
    if (!card) {
      alert("No report selected to download.");
      return;
    }
    const consent = confirm("Confirm: you have the farmer's explicit consent to download/print their soil report? (Required)");
    if (!consent) return;
    const html = buildCardPreviewHtml(card).replace("</body>", "<script>window.onload = () => window.print();</script></body>");
    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocked. Please allow popups to download PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  if (!currentUser) {
    return <div style={{textAlign: 'center', padding: '2rem'}}>Loading...</div>;
  }

  return (
    <>
      <header className="site-header">
        <div className="container topbar">
          <img src="/assets/soil-logo.jpg" alt="Department of Soil & Water Conservation, Nagaland logo" className="top-logo top-logo-round top-logo-left" />
          <div className="brand-center">
            <p className="mini-label">Department of Soil & Water Conservation, Nagaland</p>
            <h1>Soil Health Report Research Programme</h1>
            <p className="brand-subtitle">Research and training portal</p>
          </div>
          <div className="session-box">
            <span className="status-dot"></span>
            <span>District: {currentUser.username}</span>
          </div>
        </div>
      </header>
      <main>
        <section className="workspace-section">
          <div className="container">
            <div className="workspace-header">
              <div>
                <p className="section-tag">Dashboard</p>
                <h2>{currentUser.district} District Dashboard</h2>
                <p>Enter soil test data and generate Soil Health Reports for the district.</p>
              </div>
              <div className="toolbar-actions">
                <Link href="/" className="button button-secondary">Home</Link>
                <button type="button" className="button button-primary" onClick={handleLogout}>Logout</button>
              </div>
            </div>

            <div className="stats-grid">
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
                    <p className="section-tag">Generate Soil Health Report</p>
                    <h3>District Data Entry</h3>
                  </div>
                <form onSubmit={handleSoilCardSubmit} className="stack-form">
                  <div className="form-grid">
                    <label>
                      <span>District</span>
                      <input type="text" value={soilCardForm.district} readOnly />
                    </label>
                    <label>
                      <span>Testing Date</span>
                      <input type="date" value={soilCardForm.testingDate} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, testingDate: event.target.value }))} required />
                    </label>
                    <label className="span-2">
                      <span>Test Center Address</span>
                      <input type="text" value={soilCardForm.testCenterAddress} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, testCenterAddress: event.target.value }))} required />
                    </label>
                    <label>
                      <span>Test Center ID</span>
                      <input type="text" value={soilCardForm.testCenterId} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, testCenterId: event.target.value }))} required />
                    </label>
                    <label>
                      <span>Survey No.</span>
                      <input type="text" value={soilCardForm.surveyNo} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, surveyNo: event.target.value }))} required />
                    </label>
                    <label>
                      <span>Farmer Name</span>
                      <input type="text" value={soilCardForm.farmerName} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, farmerName: event.target.value }))} required />
                    </label>
                    <label>
                      <span>Farmer Village</span>
                      <input type="text" value={soilCardForm.farmerVillage} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, farmerVillage: event.target.value }))} required />
                    </label>
                    <label>
                      <span>Soil Texture</span>
                      <select value={soilCardForm.soilTexture} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, soilTexture: event.target.value }))} required>
                        <option value="">Select texture</option>
                        <option>Alluvial Soil</option>
                        <option>Black Cotton Soil</option>
                        <option>Red & Yellow Soil</option>
                        <option>Laterite Soil</option>
                        <option>Mountainous or Forest Soil</option>
                        <option>Arid or Desert Soil</option>
                        <option>Saline and Alkaline Soil</option>
                        <option>Peaty and Marshy Soil</option>
                        <option>Sandy Loam</option>
                        <option>Sandy Soil</option>
                        <option>Loamy Sand</option>
                        <option>Black Soil</option>
                        <option>Sandy Clay Loam</option>
                        <option>Red loamy soil</option>
                        <option>Clay Loam</option>
                      </select>
                    </label>
                    <label>
                      <span>Soil-Color</span>
                      <select value={soilCardForm.soilColor} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, soilColor: event.target.value }))} required>
                        <option value="">Select Soil-Color</option>
                        <option>black</option>
                        <option>Black</option>
                        <option>Red</option>
                        <option>Brown</option>
                        <option>Yellow</option>
                        <option>Grey</option>
                        <option>Unsure</option>
                      </select>
                    </label>
                  </div>
                  <div className="parameter-grid">
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
                    <select value={soilCardForm.recommendationChoice} onChange={(event) => setSoilCardForm((prev) => ({ ...prev, recommendationChoice: event.target.value }))}>
                      <option value="auto">Auto-generate recommendation</option>                      
                    </select>
                  </label>
                  <div className="form-actions">
                    <button type="submit" className="button button-primary">Save and Generate Report</button>
                    <button type="button" className="button button-secondary" onClick={handlePreviewCard}>Preview Current Data</button>
                  </div>
                </form>
                <p className={`form-message ${messages.soilCardType === "success" ? "message-success" : messages.soilCardType === "error" ? "message-error" : ""}`}>{messages.soilCard}</p>
              </article>

              <article className="panel-card">
                <div className="card-head">
                  <p className="section-tag">Bulk Upload</p>
                  <h3>Soil Health Reports CSV</h3>
                </div>
                <div className="bulk-upload-info">
                  <p>Upload multiple soil health reports using CSV format.</p>
                  <form className="form-grid">
                    <label className="span-2">
                      <span>CSV File</span>
                      <input type="file" accept=".csv" onChange={handleBulkCardsUpload} />
                      <span>___________________________________________________</span>
                      <br/>
                      <br/>
                      <span>Status Color Meanings</span>
                      <span className="status-green">🟢GREEN: SUFFICIENT</span>
                      <span className="status-yellow">🟡YELLOW: NEARLY DEFICIENT</span>
                      <span className="status-orange">🟠ORANGE: MODERATE</span>
                      <span className="status-red">🔴RED: DEFICIENT</span>                      
                      <span className="status-gray">🔘GRAY: NOT APPLICABLE</span>
                      <br/>
                      <br/>
                      <span>___________________________________________________</span>
                      <br/>
                      <br/>
                      <span>Auto Recommendation for Nutrients Deficiency</span>
                      <br/>
                      <span>pH - Lime</span><br/>
                      <span>Nitrogen - Legume Intercropping</span><br/>
                      <span>Potassium - Wood Ash</span><br/>
                      <span>Zinc - Zinc Sulphate</span><br/>
                      <span>Boron - Borax</span><br/>
                      <span>Sulphur - Zinc Sulphate</span><br/>
                      <span>EC - Gypsum</span><br/>
                      <span>Organic Carbon - Farmyard-Manure (FYM)</span><br/>
                      <span>Phosphorus - Rock Phosphate</span><br/>
                      <span>Iron - Ferrous Sulphate</span><br/>
                      <span>Copper - Copper Sulphate</span><br/>
                      <span>Manganese - Manganese Sulphate</span>
                    </label>
                  </form>
                </div>
                <p className={`form-message ${messages.bulkCardsType === "success" ? "message-success" : messages.bulkCardsType === "error" ? "message-error" : ""}`}>{messages.bulkCards}</p>
              </article>
            </div>

            <div className="panel-grid">
              <article className="panel-card">
                <div className="card-head">
                  <p className="section-tag">Saved District Reports</p>
                  <h3>Generated Records</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Report ID</th>
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
                        <tr><td colSpan="5">No reports saved for this district yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel-card wide-card">
                <div className="card-head">
                  <p className="section-tag">Report Preview</p>
                  <h3>Soil Health Report Output</h3>
                </div>
                {selectedCard && (
                  <div className="card-actions">
                    <button type="button" className="button button-secondary" onClick={() => downloadCardPdf(selectedCard)}>Download PDF</button>
                  </div>
                )}
                <div className="card-preview full-preview">
                  {previewHtml ? (
                    <iframe
                      title="Soil Health Report Preview"
                      srcDoc={previewHtml}
                      className="preview-frame"
                    />
                  ) : (
                    <div className="empty-state">
                      {selectedCard ? "Preview generation failed. Please refresh or retry." : "Fill the form and click Preview Current Data or Save and Generate Report to render the Soil Health Report preview."}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-row">
          <p>Department of Soil & Water Conservation, Nagaland — Research & Training Service</p>
          <p>Soil Health Report Programme</p>
        </div>
      </footer>
    </>
  );
}
