import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata = {
  metadataBase: new URL("https://courtvisual.com"),
  title: {
    default: "CourtVisual — Every game, scored for excitement",
    template: "%s · CourtVisual",
  },
  description:
    "CourtVisual scores every upcoming game 0–10 for excitement — playoff stakes, rivalry, star power, historic weight — then shows you where to watch or how to be there. NBA, MLB, NFL, NHL, MLS, WNBA, World Cup, tennis & boxing.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://courtvisual.com",
    siteName: "CourtVisual",
    title: "CourtVisual — Every game, scored for excitement",
    description: "Every upcoming game scored 0–10 for excitement. Watch it, share it, or be there.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourtVisual — Every game, scored for excitement",
    description: "Every upcoming game scored 0–10. Watch it, share it, or be there.",
    images: ["/og.png"],
  },
  authors: [{ name: "Shawn M. Capizzi", url: "https://www.shawncapizzi.com" }],
  creator: "Shawn M. Capizzi",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CourtVisual", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport = {
  themeColor: "#0A0D12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://courtvisual.com/#app",
      name: "CourtVisual",
      url: "https://courtvisual.com",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Scores every upcoming game 0\u201310 for excitement and shows where to watch or how to attend.",
      creator: { "@id": "https://www.shawncapizzi.com/#shawn" },
    },
    {
      "@type": "Person",
      "@id": "https://www.shawncapizzi.com/#shawn",
      name: "Shawn M. Capizzi",
      url: "https://www.shawncapizzi.com",
      jobTitle: "UX Director & Product Design Consultant",
      sameAs: ["https://www.linkedin.com/in/shawncapizzi"],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        )}
        <script dangerouslySetInnerHTML={{ __html: "try{if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});}if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});}).catch(function(){});}}catch(e){}" }} />
        {children}
      </body>
    </html>
  );
}
