import "./globals.css";
import "../components/laser/laser.css";

export const metadata = {
  metadataBase: new URL("https://courtvisual.com"),
  openGraph: { images: ["/og.png"] },
  title: "CourtVisual — Game Excitement Index",
  description: "Find the game worth showing up for.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CourtVisual", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport = {
  themeColor: "#E7E3D8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
