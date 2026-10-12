import type { Metadata } from "next";
import { SOCIAL_GRAPH } from "./site-metadata";
import LandingPage from "./landing-preview/LandingPage";
import WebsitePageView from "./components/landing/WebsitePageView";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...SOCIAL_GRAPH, url: "https://ontor.ai/" },
};

export default function Home() {
  return <>
    <WebsitePageView pageName="landing" />
    <LandingPage />
  </>;
}
