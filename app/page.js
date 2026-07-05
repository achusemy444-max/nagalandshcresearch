"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENT_USER_KEY,
  defaultState,
  loadCurrentUser,
  saveCurrentUser,
  buildConvexClient,
  parameterDefinitions
} from "./utils/shc-helpers";

export default function HomePage() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ username: "", password: "", role: "district" });
  const [messages, setMessages] = useState({ login: "", loginType: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [convexReady, setConvexReady] = useState(false);
  const [convexClient, setConvexClient] = useState(null);
  const [apiClient, setApiClient] = useState(null);
  const [districtAnalysis, setDistrictAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = loadCurrentUser();
    if (currentUser) {
      router.push(currentUser.role === "admin" ? "/admin-dashboard" : "/district-dashboard");
    }
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
      setBackendStatus("offline");
      return;
    }
    setConvexClient(client);
    setApiClient(window.convex.anyApi);
  }, [convexReady]);

  const getStatusCounts = () => ({ green: 0, yellow: 0, orange: 0, red: 0, grey: 0 });

  const getPieGradient = (status = { green: 0, yellow: 0, orange: 0, red: 0, grey: 0 }) => {
    const total = status.green + status.yellow + status.orange + status.red + status.grey;
    if (!total) {
      return "var(--surface-soft)";
    }

    const greenPct = Math.round((status.green / total) * 100);
    const yellowPct = Math.round((status.yellow / total) * 100);
    const orangePct = Math.round((status.orange / total) * 100);
    const redPct = Math.round((status.red / total) * 100);
    const greyPct = 100 - greenPct - yellowPct - orangePct - redPct;
    const slices = [];

    if (greenPct) slices.push(`var(--green) 0% ${greenPct}%`);
    if (yellowPct) slices.push(`var(--yellow) ${greenPct}% ${greenPct + yellowPct}%`);
    if (orangePct) slices.push(`var(--orange) ${greenPct + yellowPct}% ${greenPct + yellowPct + orangePct}%`);
    if (redPct) slices.push(`var(--red) ${greenPct + yellowPct + orangePct}% ${greenPct + yellowPct + orangePct + redPct}%`);
    if (greyPct) slices.push(`var(--grey) ${greenPct + yellowPct + orangePct + redPct}% 100%`);

    return `conic-gradient(${slices.join(", ")})`;
  };

  const computeDistrictAnalysis = (cards = []) => {
    const analysis = {
      totalCards: 0,
      districts: {},
      overall: {}
    };

    parameterDefinitions.forEach(({ key }) => {
      analysis.overall[key] = getStatusCounts();
    });

    cards.forEach((card) => {
      if (!card?.district) return;

      if (!analysis.districts[card.district]) {
        analysis.districts[card.district] = {
          totalCards: 0
        };
        parameterDefinitions.forEach(({ key }) => {
          analysis.districts[card.district][key] = getStatusCounts();
        });
      }

      const districtData = analysis.districts[card.district];
      districtData.totalCards += 1;
      analysis.totalCards += 1;

      parameterDefinitions.forEach(({ key }) => {
        const status = card?.evaluations?.[key]?.status || "grey";
        const normalizedStatus = ["green", "yellow", "orange", "red", "grey"].includes(status) ? status : "grey";
        districtData[key][normalizedStatus] += 1;
        analysis.overall[key][normalizedStatus] += 1;
      });
    });

    return analysis;
  };

  useEffect(() => {
    if (!convexClient || !apiClient) return;

    setAnalysisLoading(true);
    let active = true;
    const loadAnalysis = async () => {
      try {
        const cardList = await convexClient.query(apiClient.cards.list, {});
        if (!active) return;
        setDistrictAnalysis(computeDistrictAnalysis(cardList || []));
      } catch (error) {
        console.warn("Failed to load nutrient analysis:", error);
      } finally {
        if (active) setAnalysisLoading(false);
      }
    };

    loadAnalysis();
    return () => {
      active = false;
    };
  }, [convexClient, apiClient]);

  async function remoteLoadAccounts() {
    if (!convexClient || !apiClient) return null;
    try {
      return await convexClient.query(apiClient.accounts.list, {});
    } catch (error) {
      console.warn("Convex load accounts error:", error);
      return null;
    }
  }

  async function remoteCreateAccount(account) {
    if (!convexClient || !apiClient) throw new Error("Convex unavailable");
    return await convexClient.mutation(apiClient.accounts.create, account);
  }

  const setMessage = (field, text, type = "") => {
    setMessages((prev) => ({
      ...prev,
      [field]: text,
      [`${field}Type`]: type
    }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const { username, password, role } = loginForm;

    if (!convexClient || !apiClient) {
      setMessage("login", "Database connection unavailable. Please check your internet connection and try again.", "error");
      return;
    }

    let account = null;
    try {
      account = await convexClient.query(apiClient.accounts.login, { username, password });
      if (!account) {
        // If no account found, try to initialize default accounts if database is empty
        const accountsRemote = await remoteLoadAccounts();
        if (Array.isArray(accountsRemote) && accountsRemote.length === 0) {
          await Promise.all(defaultState.accounts.map((acct) => remoteCreateAccount(acct).catch(() => null)));
          account = await convexClient.query(apiClient.accounts.login, { username, password });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("login", "Login failed. Please check your credentials and try again.", "error");
      return;
    }

    if (!account) {
      setMessage("login", "Invalid username or password.", "error");
      return;
    }

    if (account.role !== role) {
      setMessage("login", "Account type mismatch. Please select the correct account type.", "error");
      return;
    }

    saveCurrentUser(account);
    setMessage("login", `Login successful! Redirecting...`, "success");
    setTimeout(() => {
      router.push(account.role === "admin" ? "/admin-dashboard" : "/district-dashboard");
    }, 500);
  };

  return (
    <>
      <header className="site-header">
        <div className="container topbar">
          <img src="/assets/soil-logo.jpg" alt="Department of Soil & Water Conservation, Nagaland logo" className="top-logo top-logo-round top-logo-left" />
          <div className="brand-center">
            <p className="mini-label">Department of Soil & Water Conservation, Nagaland</p>
            <h1>Soil Health Report Research & Training Programme</h1>
            <p className="brand-subtitle">Research and training service</p>
          </div>
          <div className="session-box">
            <span className={`status-dot ${backendStatus}`}></span>
            <span>Main Server Status: {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Synchronizing..."}</span>
          </div>
          {/* logo removed to avoid implication of official government branding */}
        </div>
      </header>
      <main className="home-main">
        <div className="container" style={{ paddingTop: '2rem' }}>
          <div className="admin-navbar">
            <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button className={`nav-tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>State Level Nutrient Analysis</button>
            <button className={`nav-tab ${activeTab === 'manuals' ? 'active' : ''}`} onClick={() => setActiveTab('manuals')}>Manuals</button>
            <button className={`nav-tab ${activeTab === 'downloads' ? 'active' : ''}`} onClick={() => setActiveTab('downloads')}>Downloads</button>
            <button className={`nav-tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>Feedback</button>
            <button className={`nav-tab ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>Support and Contact Us</button>
            <button className={`nav-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Login</button>
            <button className="nav-tab" onClick={() => { setActiveTab('dashboard'); setTimeout(() => document.getElementById('aboutUs')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>About Us</button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <section className="hero-section">
              <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
                <div className="hero-copy">
                  <p className="section-tag">Welcome to the Soil Health Report Research and Training Portal</p>
                  <h2></h2>
                  <p>
                    The portal is Autonomous and run by the Department of Soil & Water Conservation, Nagaland. Administrators can create and manage district users, review district soil data, and monitor generated advisory soil health reports. District users can log in, enter soil testing data, and generate automated, training-ready soil health reports. <strong>This platform is developed and operated by the Nagaland SHC Team (State Level), Department of Soil & Water Conservation, Government of Nagaland for research and training purposes only</strong> for legally recognised SHCs, use the official portal at soilhealth.dac.gov.in
                  </p>
                  <div className="hero-features">
                    <span>Autonomous Soil Health Project Team Nagaland</span>
                    <span>Scheme Supervise under administration</span>
                    <span>District account creation</span>
                    <span>12 soil parameters</span>
                    <span>Texture and Soil-Color</span>
                    <span>Status color indicators</span>
                    <span>Nutrient Analysis</span>
                    <span>Auto Recommendation generator</span>
                  </div>
                  <div className="hero-contact">
                    <p><strong>Support & Contact:</strong> Soilandwaterconservation123@gmail.com</p>
                    <p><strong>Phone:</strong> 7005303701</p>
                    <p><strong>This platform is currently in Demo:</strong> Integration or authorization are pending for approval.</p>
                    <p><strong>Note:</strong> This is a research and training service run by the Department of Soil & Water Conservation, Nagaland. For the official SHC, visit <a href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">soilhealth.dac.gov.in</a></p>
                  </div>
                </div>
              </div>
            </section>

            <section className="info-section">
              <div className="container info-grid">
                <article className="panel-card" id="aboutUs">
                  <div className="card-head">
                    <p className="section-tag">About Us</p>
                    <h3>Soil Health Report Team Center</h3>
                  </div>
                  <p>
                    This team center supports scientific soil testing, district coordination, and data-driven advisory for farmers through the Department of Soil & Water Conservation, Nagaland research and training programme. For official SHC issuance, visit soilhealth.dac.gov.in.
                  </p>
                </article>

                <article className="panel-card">
                  <div className="card-head">
                    <p className="section-tag">SHC Scheme</p>
                    <h3>Research and Field Support</h3>
                  </div>
                  <p>
                    The programme helps collect soil data, test key parameters, and provide practical recommendations for balanced nutrient use, soil conservation, and better productivity. This department-authorized report is for research and training purposes and is advisory only; it is not a substitute for the official government SHC.
                  </p>
                </article>

                <article className="panel-card">
                  <div className="card-head">
                    <p className="section-tag">Benefits</p>
                    <h3>Why This Programme Matters</h3>
                  </div>
                  <ul className="check-list compact">
                    <li>Supports accurate fertilizer and nutrient planning.</li>
                    <li>Improves soil health monitoring across districts.</li>
                    <li>Helps generate recommendation-based soil health reports.</li>
                    <li>Provides programme-wide inspection for the scheme administrator.</li>
                  </ul>
                </article>
              </div>
            </section>
          </>
        )}

        {activeTab === 'analysis' && (
          <section className="analysis-section">
            <div className="container analysis-grid">
              <article className="panel-card">
                <div className="card-head">
                  <p className="section-tag">State Level Nutrient Analysis</p>
                  <h3>Nutrient Analysis result from all District</h3>
                </div>
                <div className="analysis-content">
                  <div className="pie-row">
                    <div className="pie-grid">
                      {parameterDefinitions.map((param) => {
                        const counts = districtAnalysis?.overall?.[param.key] || getStatusCounts();
                        return (
                          <div key={param.key} className="pie-card">
                            <div className="pie-chart" style={{ background: getPieGradient(counts) }} aria-hidden="true" />
                            <div className="pie-label">
                              <p><strong>{param.label}</strong></p>
                              <div className="status-row"><span>G {counts.green}</span><span>Y {counts.yellow}</span></div>
                              <div className="status-row"><span>O {counts.orange}</span><span>R {counts.red}</span></div>
                              {counts.grey > 0 && <p className="status-note">N/A {counts.grey}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="analysis-meta">
                    <p><strong>{districtAnalysis ? Object.keys(districtAnalysis.districts).length : 0}</strong> districts reporting</p>
                    <p><strong>{districtAnalysis?.totalCards ?? 0}</strong> total soil reports analyzed</p>
                    <span>Status Color Meanings</span>
                    <span className="status-green">🟢GREEN: SUFFICIENT</span>
                    <span className="status-yellow">🟡YELLOW: NEARLY DEFICIENT</span>
                    <span className="status-orange">🟠ORANGE: MODERATE</span>
                    <span className="status-red">🔴RED: DEFICIENT</span>
                    <span className="status-gray">🔘GRAY: NOT APPLICABLE</span>
                    <div className="legend-list">
                      <div><span className="legend-dot legend-green"></span>Optimal</div>
                      <div><span className="legend-dot legend-yellow"></span>Moderate</div>
                      <div><span className="legend-dot legend-red"></span>Attention</div>
                    </div>
                    {analysisLoading && <p className="analysis-note">Loading nutrient summary…</p>}
                    {!analysisLoading && !districtAnalysis?.totalCards && (
                      <p className="analysis-note">No district nutrient data available yet. Once soil reports are added, this chart will update automatically.</p>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {activeTab === 'manuals' && (
          <section className="workspace-section" style={{ minHeight: '50vh' }}>
            <div className="container panel-grid">
              <article className="panel-card wide-card">
                <div className="card-head">
                  <p className="section-tag">Resources</p>
                  <h3>Manuals & Guidelines</h3>
                </div>
                <p>Training materials, operation guidelines, and scheme manuals will be available here.</p>
              </article>
            </div>
          </section>
        )}

        {activeTab === 'downloads' && (
          <section className="workspace-section" style={{ minHeight: '50vh' }}>
            <div className="container panel-grid">
              <article className="panel-card wide-card">
                <div className="card-head">
                  <p className="section-tag">Resources</p>
                  <h3>Downloads</h3>
                </div>
                <p>Downloadable report templates, offline forms, and other assets will be available here.</p>
              </article>
            </div>
          </section>
        )}

        {activeTab === 'feedback' && (
          <section className="workspace-section" style={{ minHeight: '50vh' }}>
            <div className="container panel-grid">
              <article className="panel-card wide-card">
                <div className="card-head">
                  <p className="section-tag">Communication</p>
                  <h3>Feedback & Reports</h3>
                </div>
                <p>Review feedback, bug reports, and suggestions submitted by district users.</p>
              </article>
            </div>
          </section>
        )}

        {activeTab === 'contact' && (
          <section className="contact-section">
            <div className="container contact-grid">
              <div className="contact-card">
                <div className="card-head">
                  <p className="section-tag">Support & Contact</p>
                  <h3>Reach the Support Team</h3>
                </div>
                <div className="contact-info">
                  <p><strong>Email:</strong> Soilandwaterconservation123@gmail.com</p>
                  <p><strong>Phone:</strong> 7005303701 (Report any errors, bugs, or needed changes)</p>
                  <p><strong>Note:</strong> This is a research and training service run by the Department of Soil & Water Conservation, Nagaland. For the official SHC, visit <a href="https://soilhealth.dac.gov.in" target="_blank" rel="noopener">soilhealth.dac.gov.in</a>.</p>
                  <p><strong>Disclaimer:</strong> <strong>This platform is developed and operated by the Nagaland Soil Health Project Team (Autonomous) for research and training purposes only.</strong> The report generated is advisory and NOT the legally recognised Government of India Soil Health Card. For the official SHC, please visit soilhealth.dac.gov.in</p>
                </div>
              </div>

              <div className="contact-card">
                <div className="card-head">
                  <p className="section-tag">Programme Credits</p>
                  <h3>Research Programme Team</h3>
                </div>
                <div className="credits-list">
                  <p><strong>Int. Developer and Cyber Security:</strong> Shri. Khanchulo Semy</p>
                  <p><strong>Programme Optimizer:</strong> Er. Chentilo</p>
                  <p><strong>SHC Data Virtualizer and Supervisor:</strong> Directorate Soil Health Project Team, Nagaland</p>
                  <p><strong>Programme Advisor:</strong> Soil Health Project Team Advisor</p>
                  <p><strong>Programme Supporter:</strong> Directorate Soil Health Project Team, Nagaland</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'login' && (
          <section className="hero-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="container" style={{ maxWidth: '450px', width: '100%' }}>
              <div className="login-card" style={{ margin: '0' }}>
                <div className="card-head">
                  <p className="section-tag">Portal Access</p>
                  <h3>Login to Soil Health Report System</h3>
                </div>
                <form id="loginForm" onSubmit={handleLoginSubmit} className="stack-form">
                  <label>
                    <span>Account Type</span>
                    <select
                      value={loginForm.role}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, role: event.target.value }))}
                      required
                    >
                      <option value="district">District Account</option>
                      <option value="admin">Administrator Account</option>
                    </select>
                  </label>
                  <label>
                    <span>Username</span>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                      placeholder="Enter your username"
                      required
                    />
                  </label>
                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="Enter your password"
                      required
                    />
                  </label>
                  <button type="submit" className="button button-primary">Login</button>
                </form>
                <div className="login-help">
                  <p><strong>Guest account:</strong></p>
                  <p>Username: (hint)Guestnumber</p>
                  <p>Password: Guestnumber</p>
                  <p className="help-note">Contact the programme administrator for your credentials.</p>
                </div>
                <p className={`form-message ${messages.loginType === "success" ? "message-success" : messages.loginType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.login}</p>
              </div>
            </div>
          </section>
        )}
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
