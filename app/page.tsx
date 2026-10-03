import type { Metadata } from "next";
import LandingPage from "./landing-preview/LandingPage";
import WebsitePageView from "./components/landing/WebsitePageView";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "https://ontor.ai/" },
};

export default function Home() {
  return <>
    <WebsitePageView pageName="landing" />
    <LandingPage />
  </>;
}
