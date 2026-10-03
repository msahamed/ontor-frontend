import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "../LandingPage";

export const metadata: Metadata = {
  title: "Landing page concepts · Ontor",
  robots: { index: false, follow: false },
};

export default async function LandingConcept({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (variant !== "a" && variant !== "b" && variant !== "c") notFound();
  return <LandingPage variant={variant} preview />;
}
