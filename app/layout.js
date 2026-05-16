import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Soil Health Card Portal",
  description: "Next.js Soil Health Card portal with Convex backend",
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
