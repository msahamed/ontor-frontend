import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// ── Fonts: self-hosted, no third-party fetch at build or runtime ──
//
// These were `next/font/google`, which self-hosts the files it serves
// but still downloads them from fonts.gstatic.com DURING THE BUILD.
// That made every deploy depend on Google being reachable, and on
// 2026-08-15 it wasn't: a production build died with 14 copies of
// `Module not found: Can't resolve '@vercel/turbopack-next/internal/
// font/google/font'` — one per @font-face rule — over a font fetch
// that had nothing to do with the commit being deployed.
//
// The .woff2 files now live in app/fonts/ and are committed, so a
// build needs nothing but this repo. Both are the VARIABLE cuts, so
// three files cover what previously took ten static weights, and the
// whole set is ~314 kB.
//
// Both faces are SIL Open Font License 1.1 (see app/fonts/OFL-*.txt),
// which explicitly permits redistribution and self-hosting.

// Editorial serif for display type.
const newsreader = localFont({
  src: [
    { path: "./fonts/Newsreader-Variable.woff2", style: "normal" },
    { path: "./fonts/Newsreader-Variable-Italic.woff2", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  // Metric-matched fallback, so the swap from Georgia doesn't reflow.
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Clean grotesque for body + UI.
const hanken = localFont({
  src: [{ path: "./fonts/HankenGrotesk-Variable.woff2", style: "normal" }],
  variable: "--font-hanken",
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const DESCRIPTION =
  "Ontor is performance intelligence from your voice. It sits in your menu bar and reads your nervous-system state — stress, energy, confidence and more — from how you sound across real calls, plus a few-second check-in on mobile. " +
  "It only ever listens to you (speaker-gated), runs on-device, and needs no wearable. macOS, Windows, iOS & Android.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ontor.ai"),
  title: "Ontor — Performance intelligence from your voice",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Ontor — Performance intelligence from your voice",
    description: DESCRIPTION,
    url: "https://ontor.ai",
    siteName: "Ontor",
    type: "website",
    images: [
      {
        url: "/og.png?v=2",
        width: 1200,
        height: 630,
        alt: "Ontor detects shifts and helps you reset.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ontor — Performance intelligence from your voice",
    description: DESCRIPTION,
    images: ["/og.png?v=2"],
  },
};

// ── Site-wide structured data (GEO / AI answer engines) ──
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ontor",
  alternateName: ["Ontor AI", "ontor.ai"],
  url: "https://ontor.ai",
  logo: "https://ontor.ai/og.png",
  description:
    "Ontor builds voice-first, on-device performance-intelligence technology that reads nervous-system state from how you sound.",
  founder: { "@type": "Person", name: "Sabber Ahamed" },
  foundingLocation: "Dallas, TX",
  sameAs: [
    "https://discord.gg/SyZPw3cgG",
    "https://www.linkedin.com/in/sabber-ahamed/",
    "https://github.com/msahamed",
  ],
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ontor",
  url: "https://ontor.ai",
  description: DESCRIPTION,
  publisher: { "@type": "Organization", name: "Ontor" },
};

const APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ontor",
  applicationCategory: "BusinessApplication",
  operatingSystem: "macOS, Windows, iOS, Android",
  url: "https://ontor.ai",
  description: DESCRIPTION,
  featureList: [
    "Desktop menu-bar tool reads your nervous-system state across a live call, in real time",
    "Speaker-gated — only your own voice is analyzed, never the other person on the call",
    "Eight nervous-system signals: energy, stress, confidence, fatigue, vocal strain, expressiveness, articulation, breathing",
    "Voice is analyzed on your device by default; nothing is uploaded unless you turn on optional sync",
    "Quick voice check-in on mobile, with pattern detection over your personal baseline",
  ],
  offers: [
    {
      "@type": "Offer",
      price: "20",
      priceCurrency: "USD",
      description: "$20/month after a 14-day free trial (no card required to start)",
    },
    {
      "@type": "Offer",
      price: "168",
      priceCurrency: "USD",
      description: "$168/year after a 14-day free trial (about $14/month)",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full ${newsreader.variable} ${hanken.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
        {process.env.NODE_ENV === "production" && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-YK3M9ZE2MS"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-YK3M9ZE2MS');
            `}</Script>
          </>
        )}
        {process.env.NODE_ENV === "production" && (
          <Script id="fullstory" strategy="afterInteractive">{`
            window['_fs_host'] = 'fullstory.com';
            window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
            window['_fs_org'] = '10A2GH';
            window['_fs_namespace'] = 'FS';
            !function(m,n,e,t,l,o,g,y){var s,f,a=function(h){
            return!(h in m)||(m.console&&m.console.log&&m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].'),!1)}(e)
            ;function p(b){var h,d=[];function j(){h&&(d.forEach((function(b){var d;try{d=b[h[0]]&&b[h[0]](h[1])}catch(h){return void(b[3]&&b[3](h))}
            d&&d.then?d.then(b[2],b[3]):b[2]&&b[2](d)})),d.length=0)}function r(b){return function(d){h||(h=[b,d],j())}}return b(r(0),r(1)),{
            then:function(b,h){return p((function(r,i){d.push([b,h,r,i]),j()}))}}}a&&(g=m[e]=function(){var b=function(b,d,j,r){function i(i,c){
            h(b,d,j,i,c,r)}r=r||2;var c,u=/Async$/;return u.test(b)?(b=b.replace(u,""),"function"==typeof Promise?new Promise(i):p(i)):h(b,d,j,c,c,r)}
            ;function h(h,d,j,r,i,c){return b._api?b._api(h,d,j,r,i,c):(b.q&&b.q.push([h,d,j,r,i,c]),null)}return b.q=[],b}(),y=function(b){function h(h){
            "function"==typeof h[4]&&h[4](new Error(b))}var d=g.q;if(d){for(var j=0;j<d.length;j++)h(d[j]);d.length=0,d.push=h}},function(){
            (o=n.createElement(t)).async=!0,o.crossOrigin="anonymous",o.src="https://"+l,o.onerror=function(){y("Error loading "+l)}
            ;var b=n.getElementsByTagName(t)[0];b&&b.parentNode?b.parentNode.insertBefore(o,b):n.head.appendChild(o)}(),function(){function b(){}
            function h(b,h,d){g(b,h,d,1)}function d(b,d,j){h("setProperties",{type:b,properties:d},j)}function j(b,h){d("user",b,h)}function r(b,h,d){j({
            uid:b},d),h&&j(h,d)}g.identify=r,g.setUserVars=j,g.identifyAccount=b,g.clearUserCookie=b,g.setVars=d,g.event=function(b,d,j){h("trackEvent",{
            name:b,properties:d},j)},g.anonymize=function(){r(!1)},g.shutdown=function(){h("shutdown")},g.restart=function(){h("restart")},
            g.log=function(b,d){h("log",{level:b,msg:d})},g.consent=function(b){h("setIdentity",{consent:!arguments.length||b})}}(),s="fetch",
            f="XMLHttpRequest",g._w={},g._w[f]=m[f],g._w[s]=m[s],m[s]&&(m[s]=function(){return g._w[s].apply(this,arguments)}),g._v="2.0.0")
            }(window,document,window._fs_namespace,"script",window._fs_script);
          `}</Script>
        )}
      </body>
    </html>
  );
}
