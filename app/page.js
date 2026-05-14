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
    if (!url) return;
    const client = new window.convex.ConvexClient(url);
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
              <p className="section-tag">Portal Overview</p>
              <h2>Online-based Soil Health Card system for scheme administration and district-level card generation.</h2>
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
                <p><strong>Int. Developer:</strong> Shri. Khanchulo Semy</p>
                <p><strong>Cyber Security and Optimization Developer:</strong> Er. Chentilo (IIT Developer Sp.)</p>
                <p><strong>SHC Virtualizer:</strong> Shri. Kihika G Yeptho</p>
                <p><strong>Advisor:</strong> Shri. Rontilo Kent</p>
                <p><strong>Supervisor:</strong> Smti. Krutalu Tunyi</p>
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
