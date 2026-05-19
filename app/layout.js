import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Department of Soil & Water Conservation, Nagaland — Soil Health Report Portal",
  description: "Research and training portal by the Department of Soil & Water Conservation, Nagaland, for advisory soil health reports.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://unpkg.com/convex@1.3.1/dist/browser.bundle.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
