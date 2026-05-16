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
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [messages, setMessages] = useState({ login: "", loginType: "" });
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
    const { username, password } = loginForm;
    
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
          <img src="/assets/gon-logo.png" alt="Government of Nagaland logo" className="top-logo top-logo-round top-logo-left" />
          <div className="brand-center">
            <p className="mini-label">Soil and Water Conservation Department</p>
            <h1>Soil Health Card Research Programme</h1>
            <p className="brand-subtitle">Directorate Kohima, Nagaland</p>
          </div>
          <div className="session-box">
            <span className={`status-dot ${backendStatus}`}></span>
            <span>Main Server Status: {backendStatus === "online" ? "Online" : backendStatus === "offline" ? "Offline" : "Checking..."}</span>
          </div>
          <img src="/assets/soil-logo.jpg" alt="Soil Health logo" className="top-logo top-logo-right" />
        </div>
      </header>
      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="section-tag">Welcome to the Soil Health Card Research Portal</p>
              <h2>Soil Health Card system for Administration and District-level card generation.</h2>
              <p>
                This prototype includes one Administrator account that can create and manage district user accounts,
                Review all district data, and monitor generated Soil Health Cards. District users can log in, enter soil
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
                <p className="section-tag">Portal Access</p>
                <h3>Login to Soil Health Card System</h3>
              </div>
              <form onSubmit={handleLoginSubmit} className="stack-form">
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
                <p><strong>Sample District User:</strong></p>
                <p>Username: Kohima123</p>
                <p>Password: Kohima123</p>
                <p className="help-note">Contact the Soil and Water Conservation Department for your credentials.</p>
              </div>
              <p className={`form-message ${messages.loginType === "success" ? "message-success" : messages.loginType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.login}</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <div className="container info-grid">
            <article className="panel-card">
              <div className="card-head">
                <p className="section-tag">About Us</p>
                <h3>Soil Health Card Team Center</h3>
              </div>
              <p>
                The Soil Health Card Team Center under the Soil and Water Conservation Department, Kohima, Nagaland supports
                scientific soil testing, district coordination, and data-driven advisory for farmers through the research programme.
              </p>
            </article>

            <article className="panel-card">
              <div className="card-head">
                <p className="section-tag">SHC Scheme</p>
                <h3>Research and Field Support</h3>
              </div>
              <p>
                The SHC Scheme helps collect soil data, test key parameters, generate Soil Health Cards, and provide practical
                recommendations for balanced nutrient use, soil conservation, and better productivity.
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
                <li>Helps generate recommendation-based Soil Health Cards.</li>
                <li>Provides programme-wide inspection for the scheme administrator.</li>
              </ul>
            </article>
          </div>
        </section>

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
                  <p><strong>{districtAnalysis?.totalCards ?? 0}</strong> total soil cards analyzed</p>
                  <div className="legend-list">
                    <div><span className="legend-dot legend-green"></span>Optimal</div>
                    <div><span className="legend-dot legend-yellow"></span>Moderate</div>
                    <div><span className="legend-dot legend-red"></span>Attention</div>
                  </div>
                  {analysisLoading && <p className="analysis-note">Loading nutrient summary…</p>}
                  {!analysisLoading && !districtAnalysis?.totalCards && (
                    <p className="analysis-note">No district nutrient data available yet. Once soil cards are added, this chart will update automatically.</p>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="contact-section">
          <div className="container contact-grid">
            <div className="contact-card">
              <div className="card-head">
                <p className="section-tag">Support & Contact</p>
                <h3>Reach the SHC Team</h3>
              </div>
              <div className="contact-info">
                <p><strong>Email:</strong> SHCS&Wdirectorateteam@gmail.com</p>
                <p><strong>Phone:</strong> 7005303701 (Report any errors, bugs, or needed changes)</p>
                <p><strong>Office:</strong> Soil and Water Conservation Department, Kohima, Nagaland</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="card-head">
                <p className="section-tag">Programme Credits</p>
                <h3>Research Programme Team</h3>
              </div>
              <div className="credits-list">
                <p><strong>Int. Developer and Cyber Security:</strong> Shri. Khanchulo Semy</p>
                <p><strong>Programming Optimizer:</strong> Er. Chentilo (H.G Department on IIT Spl.Developer)</p>
                <p><strong>SHC Virtualizer and Supervisor:</strong> Shri. Kihika G Yeptho</p>
                <p><strong>Advisor:</strong> Shri. Rontilo Kent</p>
              </div>
            </div>
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
