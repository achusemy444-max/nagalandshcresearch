"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import {
  STORAGE_KEY,
  CURRENT_USER_KEY,
  parameterDefinitions,
  defaultState,
  loadLocalState,
  saveLocalState,
  loadCurrentUser,
  saveCurrentUser,
  evaluateParameter,
  getRecommendationLines,
  buildCardPreviewHtml,
  formatDate,
  getStatusClass
} from "../utils/shc-helpers";

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [state, setState] = useState(defaultState);
  const [selectedCard, setSelectedCard] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [convexReady, setConvexReady] = useState(false);
  const [convexClient, setConvexClient] = useState(null);
  const [apiClient, setApiClient] = useState(null);
  const [districtAccountForm, setDistrictAccountForm] = useState({ district: "", officerName: "", username: "", password: "", address: "" });
  const [messages, setMessages] = useState({ districtAccount: "", districtAccountType: "", bulkUpload: "", bulkUploadType: "" });

  useEffect(() => {
    const user = loadCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    // Load initial state but prioritize Convex data
    const stored = loadLocalState();
    setState(stored);
  }, [router]);

  useEffect(() => {
    if (!convexReady) return;
    if (typeof window === "undefined" || !window.convex) return;
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return;
    const client = new window.convex.ConvexClient(url);
    setConvexClient(client);
    setApiClient(window.convex.anyApi);
    
    // Load data from Convex when client is ready
    Promise.all([
      remoteLoadAccounts(),
      remoteLoadCards()
    ]).then(([accounts, cards]) => {
      if (accounts) {
        setState((prev) => ({ ...prev, accounts }));
      }
      if (cards) {
        setState((prev) => ({ ...prev, cards }));
      }
    });
  }, [convexReady]);

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
    if (!convexClient || !apiClient) throw new Error("Convex backend unavailable. Please check your connection.");
    try {
      const result = await convexClient.mutation(apiClient.accounts.create, account);
      // Reload accounts from Convex to ensure consistency
      const updatedAccounts = await remoteLoadAccounts();
      if (updatedAccounts) {
        setState((prev) => ({ ...prev, accounts: updatedAccounts }));
      }
      return result;
    } catch (error) {
      console.error("Failed to create account in Convex:", error);
      throw new Error("Failed to create account. Please try again.");
    }
  }

  async function remoteUpdateAccount(account) {
    if (!convexClient || !apiClient) throw new Error("Convex backend unavailable. Please check your connection.");
    try {
      const result = await convexClient.mutation(apiClient.accounts.update, account);
      // Reload accounts from Convex to ensure consistency
      const updatedAccounts = await remoteLoadAccounts();
      if (updatedAccounts) {
        setState((prev) => ({ ...prev, accounts: updatedAccounts }));
      }
      return result;
    } catch (error) {
      console.error("Failed to update account in Convex:", error);
      throw new Error("Failed to update account. Please try again.");
    }
  }

  async function remoteDeleteAccount(accountId) {
    if (!convexClient || !apiClient) throw new Error("Convex backend unavailable. Please check your connection.");
    try {
      const result = await convexClient.mutation(apiClient.accounts.deleteAccount, { id: accountId });
      // Reload accounts from Convex to ensure consistency
      const updatedAccounts = await remoteLoadAccounts();
      if (updatedAccounts) {
        setState((prev) => ({ ...prev, accounts: updatedAccounts }));
      }
      return result;
    } catch (error) {
      console.error("Failed to delete account from Convex:", error);
      throw new Error("Failed to delete account. Please try again.");
    }
  }

  async function remoteSaveCard(card) {
    if (!convexClient || !apiClient) throw new Error("Convex backend unavailable. Please check your connection.");
    try {
      const result = await convexClient.mutation(apiClient.cards.save, card);
      // Reload cards from Convex to ensure consistency
      const updatedCards = await remoteLoadCards();
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
      const updatedCards = await remoteLoadCards();
      if (updatedCards) {
        setState((prev) => ({ ...prev, cards: updatedCards }));
      }
      return result;
    } catch (error) {
      console.error("Failed to delete card from Convex:", error);
      throw new Error("Failed to delete card. Please try again.");
    }
  }
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

  async function remoteDeleteCard(cardId) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.cards.deleteCard, { id: cardId });
  }

  const accounts = useMemo(() => state.accounts, [state.accounts]);
  const districtAccounts = useMemo(() => accounts.filter((account) => account.role === "district"), [accounts]);

  const adminStats = [
    { value: districtAccounts.length, label: "District Accounts", note: "Managed by scheme administrator" },
    { value: state.cards.length, label: "Cards Generated", note: "All district data visible here" },
    { value: new Set(state.cards.map((card) => card.district)).size, label: "Active Districts", note: "Districts with at least one card" }
  ];

  const getNutrientAnalysisByDistrict = () => {
    const districtAnalysis = {};
    state.cards.forEach(card => {
      if (!districtAnalysis[card.district]) {
        districtAnalysis[card.district] = {
          totalCards: 0,
          phStatus: { red: 0, green: 0, yellow: 0 },
          ecStatus: { red: 0, green: 0, yellow: 0 }
        };
      }
      districtAnalysis[card.district].totalCards++;
      
      const phEval = card.evaluations.ph;
      const ecEval = card.evaluations.ec;
      
      if (phEval?.status) {
        districtAnalysis[card.district].phStatus[phEval.status]++;
      }
      if (ecEval?.status) {
        districtAnalysis[card.district].ecStatus[ecEval.status]++;
      }
    });
    return districtAnalysis;
  };

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
    
    if (!convexClient || !apiClient) {
      setMessage("districtAccount", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }
    
    try {
      await remoteCreateAccount(newAccount);
      setDistrictAccountForm({ district: "", officerName: "", username: "", password: "", address: "" });
      setMessage("districtAccount", `District account created for ${district}.`, "success");
    } catch (error) {
      console.error("Create account error:", error);
      setMessage("districtAccount", error.message || "Failed to create account. Please try again.", "error");
    }
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
    if (!confirm(`Delete Soil Health Card ${card.id}?`)) return;
    
    if (!convexClient || !apiClient) {
      setMessage("districtAccount", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }
    
    try {
      await remoteDeleteCard(cardId);
      setMessage("districtAccount", `Deleted Soil Health Card ${card.id}.`, "success");
    } catch (error) {
      console.error("Delete card error:", error);
      setMessage("districtAccount", error.message || "Failed to delete card. Please try again.", "error");
    }
  };

  const handleDeleteAccount = async (accountId) => {
    const account = state.accounts.find((entry) => entry.id === accountId);
    if (!account) return;
    if (!confirm(`Delete district account "${account.username}" (${account.district})?`)) return;
    
    if (!convexClient || !apiClient) {
      setMessage("districtAccount", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }
    
    try {
      await remoteDeleteAccount(accountId);
      setMessage("districtAccount", `Deleted account for ${account.district}.`, "success");
    } catch (error) {
      console.error("Delete account error:", error);
      setMessage("districtAccount", error.message || "Failed to delete account. Please try again.", "error");
    }
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
    if (!convexClient || !apiClient) {
      setMessage("districtAccount", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }
    try {
      await remoteUpdateAccount(updatedAccount);
      setState((prev) => ({...prev, accounts: prev.accounts.map((entry) => (entry.id === accountId ? updatedAccount : entry))}));
      setMessage("districtAccount", `Updated account for ${updatedAccount.district}.`, "success");
    } catch (error) {
      console.error("Update account error:", error);
      setMessage("districtAccount", error.message || "Failed to update account. Please try again.", "error");
    }
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
      if (!convexClient || !apiClient) {
        errorCount++;
        continue;
      }
      try {
        await remoteCreateAccount(newAccount);
        successCount++;
      } catch (error) {
        console.error("Bulk account creation failed:", error);
        errorCount++;
      }
    }
    setMessage("bulkUpload", `Bulk upload completed. ${successCount} accounts created, ${errorCount} errors.`, successCount > 0 ? "success" : "error");
  };

  const downloadCardPdf = (card) => {
    if (!card) {
      alert("No card selected to download.");
      return;
    }
    const html = buildCardPreviewHtml(card).replace("</body>", "<script>window.onload = () => window.print();</script></body>");
    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocked. Please allow popups to download PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const accountActionButtons = (account) => (
    <>
      <button type="button" className="button button-secondary" onClick={() => handleEditAccount(account.id)}>Edit</button>
      <button type="button" className="button button-secondary" onClick={() => handleDeleteAccount(account.id)}>Delete</button>
    </>
  );

  if (!currentUser) {
    return <div style={{textAlign: 'center', padding: '2rem'}}>Loading...</div>;
  }

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
            <span>Admin: {currentUser.username}</span>
          </div>
          <img src="/assets/soil-logo.jpg" alt="Soil Health logo" className="top-logo top-logo-right" />
        </div>
      </header>
      <main>
        <section className="workspace-section">
          <div className="container">
            <div className="workspace-header">
              <div>
                <p className="section-tag">Dashboard</p>
                <h2>Scheme Administrator Dashboard</h2>
                <p>Create district users, inspect all district records, and monitor programme activity.</p>
              </div>
              <div className="toolbar-actions">
                <Link href="/" className="button button-secondary">Home</Link>
                <button type="button" className="button button-primary" onClick={handleLogout}>Logout</button>
              </div>
            </div>

            <div className="stats-grid">
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
                <p className={`form-message ${messages.districtAccountType === "success" ? "message-success" : messages.districtAccountType === "error" ? "message-error" : ""}`}>{messages.districtAccount}</p>
              </article>

              <article className="panel-card">
                <div className="card-head">
                  <p className="section-tag">Bulk Upload</p>
                  <h3>District Accounts CSV</h3>
                </div>
                <div className="bulk-upload-info">
                  <p>Upload multiple district accounts using CSV format.</p>
                  <form className="form-grid">
                    <label className="span-2">
                      <span>CSV File</span>
                      <input type="file" accept=".csv" onChange={handleBulkUpload} />
                    </label>
                  </form>
                </div>
                <p className={`form-message ${messages.bulkUploadType === "success" ? "message-success" : messages.bulkUploadType === "error" ? "message-error" : ""}`}>{messages.bulkUpload}</p>
              </article>
            </div>

            <div className="panel-grid">
              <article className="panel-card">
                <div className="card-head">
                  <p className="section-tag">District Analysis</p>
                  <h3>Nutrient Analysis by District</h3>
                </div>
                <div className="nutrient-analysis">
                  {Object.entries(getNutrientAnalysisByDistrict()).map(([district, data]) => (
                    <div key={district} className="nutrient-summary">
                      <strong>{district}</strong>
                      <p>📊 Total Cards: {data.totalCards}</p>
                      <p>pH Status - 🔴: {data.phStatus.red}</p>
                      <p>pH Status - 🟢: {data.phStatus.green}</p>
                      <p>EC Status - 🔴: {data.ecStatus.red}</p>
                      <p>EC Status - 🟢: {data.ecStatus.green}</p>
                    </div>
                  ))}
                </div>
              </article>

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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {districtAccounts.length ? districtAccounts.map((account) => (
                        <tr key={account.id}>
                          <td>{account.district}</td>
                          <td>{account.officerName}</td>
                          <td>{account.username}</td>
                          <td>{accountActionButtons(account)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4">No district accounts created yet.</td></tr>
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
                        <th>Farmer Name</th>
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

            {selectedCard && (
              <article className="panel-card wide-card">
                <div className="card-head">
                  <p className="section-tag">Card Preview</p>
                  <h3>{selectedCard.id}</h3>
                </div>
                <div className="card-actions">
                  <button type="button" className="button button-secondary" onClick={() => downloadCardPdf(selectedCard)}>Download PDF</button>
                </div>
                <div className="card-preview full-preview">
                  {previewHtml ? (
                    <iframe
                      title="Soil Health Card Preview"
                      srcDoc={previewHtml}
                      className="preview-frame"
                    />
                  ) : (
                    <div className="empty-state">Select a card to render the Soil Health Card preview.</div>
                  )}
                </div>
              </article>
            )}
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
