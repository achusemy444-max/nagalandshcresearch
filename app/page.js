"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  CURRENT_USER_KEY,
  defaultState,
  loadLocalState,
  loadCurrentUser,
  saveCurrentUser
} from "./utils/shc-helpers";

export default function HomePage() {
  const router = useRouter();
  const [state, setState] = useState(defaultState);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [messages, setMessages] = useState({ login: "", loginType: "" });
  const [convexReady, setConvexReady] = useState(false);
  const [convexClient, setConvexClient] = useState(null);
  const [apiClient, setApiClient] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = loadCurrentUser();
    if (currentUser) {
      router.push(currentUser.role === "admin" ? "/admin-dashboard" : "/district-dashboard");
      return;
    }

    const stored = loadLocalState();
    setState(stored);
  }, [router]);

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

    saveCurrentUser(account);
    setMessage("login", `Login successful! Redirecting...`, "success");
    setTimeout(() => {
      router.push(account.role === "admin" ? "/admin-dashboard" : "/district-dashboard");
    }, 500);
  };

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
            <span>Secure Portal Access</span>
          </div>
          <img src="/assets/soil-logo.jpg" alt="Soil Health logo" className="top-logo top-logo-right" />
        </div>
      </header>
      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="section-tag">Welcome to Portal</p>
              <h2>Soil Health Card Scheme: Empowering Farmers for Sustainable Agriculture</h2>
              <p>
                The Soil Health Card Scheme is a government initiative designed to empower farmers with detailed soil health information. 
                Our state-of-the-art testing laboratory provides comprehensive soil analysis using advanced machinery and professional expertise.
              </p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <div className="container">
            <div className="section-header">
              <h2>Benefits of the Soil Health Card Scheme</h2>
              <p>Farmers will gain valuable insights for informed agricultural decisions</p>
            </div>
            <div className="benefits-grid">
              <article className="benefit-card">
                <div className="benefit-icon">📋</div>
                <h3>Proper Soil Health Record</h3>
                <p>Farmers will get a comprehensive soil health record that documents the status of their farmland's soil conditions.</p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon">🌱</div>
                <h3>Soil Management Practices</h3>
                <p>Learn about proper soil management practices and become aware of best practices for soil conservation and fertility.</p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon">📊</div>
                <h3>Nutrient Deficiency Analysis</h3>
                <p>The soil card provides farmers with a clear idea of which nutrients their soil is lacking, enabling informed crop selection.</p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon">🎯</div>
                <h3>Crop Planning</h3>
                <p>Plan the future of crops and land based on detailed soil analysis. Choose crops that are well-suited to your soil type.</p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon">💊</div>
                <h3>Fertilizer Recommendations</h3>
                <p>Receive specific fertilizer recommendations based on your soil's nutrient content, reducing unnecessary expenses.</p>
              </article>
              <article className="benefit-card">
                <div className="benefit-icon">📈</div>
                <h3>Increased Crop Yield</h3>
                <p>Ultimately, informed soil management practices and proper nutrient application lead to improved crop productivity and higher yields.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="info-section info-section-soft">
          <div className="container">
            <div className="section-header">
              <h2>Soil Testing Laboratory</h2>
              <p className="section-subtitle">Empowering Farmers, Enhancing Soil Fertility</p>
            </div>
            <div className="lab-content-grid">
              <article className="lab-card">
                <h3>Our Laboratory</h3>
                <p>
                  Our Soil Testing Laboratory, funded by the Ministry of Agriculture and Farmers Welfare, Government of India, 
                  under the Soil Health and Fertility component of RKVY, is dedicated to analyzing soil samples and providing 
                  valuable insights for informed decision-making.
                </p>
              </article>
              <article className="lab-card">
                <h3>State-of-the-Art Facilities</h3>
                <p>Our laboratory is equipped with advanced machines for precise soil analysis:</p>
                <ul className="facility-list">
                  <li>EC Scale (Electric Conductivity)</li>
                  <li>pH Scale</li>
                  <li>AAS (Atomic Absorption Spectroscopy)</li>
                  <li>Semi-Automatic Nitrogen Analyzer</li>
                  <li>Double Distillation Unit</li>
                </ul>
              </article>
            </div>

            <article className="lab-card full-width">
              <h3>Soil Health Card (SHC) Report</h3>
              <p>
                We provide a printed report, the Soil Health Card, which contains the comprehensive status of the soil based on 12 parameters:
              </p>
              <div className="parameter-categories">
                <div className="param-group">
                  <strong>Macro-Nutrients:</strong>
                  <p>Nitrogen (N), Phosphorous (P), Potassium (K)</p>
                </div>
                <div className="param-group">
                  <strong>Secondary Nutrients:</strong>
                  <p>Sulphur (S)</p>
                </div>
                <div className="param-group">
                  <strong>Micro-Nutrients:</strong>
                  <p>Zinc (Zn), Boron (B), Iron (Fe), Manganese (Mn), Copper (Cu)</p>
                </div>
                <div className="param-group">
                  <strong>Physical Parameters:</strong>
                  <p>pH, EC (Electric Conductivity), Organic Carbon</p>
                </div>
              </div>
            </article>

            <article className="lab-card full-width">
              <h3>Our Process</h3>
              <ol className="process-steps">
                <li><strong>Soil Sampling</strong> - Systematic collection of soil samples from farmer fields</li>
                <li><strong>Testing</strong> - Analysis using advanced laboratory machinery and protocols</li>
                <li><strong>Report Generation</strong> - Creation of comprehensive Soil Health Cards</li>
                <li><strong>Personalized Recommendations</strong> - Tailored guidance based on soil analysis results</li>
                <li><strong>Farmer Guidance</strong> - Direct support for optimal soil health and crop productivity</li>
              </ol>
            </article>

            <article className="lab-card full-width">
              <h3>Our Vision</h3>
              <p>
                Our initiative aligns with the government's vision to empower farmers, boost agricultural growth, and ensure food security. 
                We aim to promote sustainable agricultural practices, enhance soil fertility, and provide accurate and timely recommendations 
                to farmers for achieving optimal soil health and improved crop productivity.
              </p>
            </article>
          </div>
        </section>

        <section className="login-section">
          <div className="container login-container">
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
                <p>Username: kohima_user</p>
                <p>Password: District@123</p>
                <p className="help-note">Contact the Soil and Water Conservation Department for your credentials.</p>
              </div>
              <p className={`form-message ${messages.loginType === "success" ? "message-success" : messages.loginType === "error" ? "message-error" : ""}`} aria-live="polite">{messages.login}</p>
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
