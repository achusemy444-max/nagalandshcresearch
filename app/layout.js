import "./globals.css";

export const metadata = {
  title: "Soil Health Card Portal",
  description: "Next.js Soil Health Card portal with Convex backend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
