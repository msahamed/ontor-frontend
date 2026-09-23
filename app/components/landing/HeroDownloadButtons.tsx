"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DownloadLink from "@/app/install/_components/DownloadLink";
import styles from "../../page.module.css";

const MAC_DMG_URL = "https://ontor.ai/downloads/mac/Ontor.dmg";
const WINDOWS_EXE_URL = "https://ontor.ai/downloads/windows/Ontor.exe";

type Platform = "macos" | "windows" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  // Mobile visitors keep both buttons equal and can use /install/.
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return "other";
  if (/Mac/i.test(ua) || /Mac/i.test(platform)) return "macos";
  if (/Win/i.test(ua) || /Win/i.test(platform)) return "windows";
  return "other";
}

export default function HeroDownloadButtons() {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const macPrimary = platform === "macos" || platform === "other";
  const windowsPrimary = platform === "windows";

  const macButton = (
    <DownloadLink
      className={macPrimary ? styles.primaryButton : styles.secondaryButton}
      href={MAC_DMG_URL}
      platform="macos"
      fileName="Ontor.dmg"
    >
      Download for Mac
    </DownloadLink>
  );

  const windowsButton = (
    <DownloadLink
      className={windowsPrimary ? styles.primaryButton : styles.secondaryButton}
      href={WINDOWS_EXE_URL}
      platform="windows"
      fileName="Ontor.exe"
    >
      Download for Windows
    </DownloadLink>
  );

  return (
    <div className={styles.downloadCta}>
      <div className={styles.actions}>
        {platform === "windows" ? (
          <>
            {windowsButton}
            {macButton}
          </>
        ) : (
          <>
            {macButton}
            {windowsButton}
          </>
        )}
      </div>
      <p className={styles.trialNote}>
        14 days free · no card · Mac &amp; Windows
      </p>
      <p className={styles.installOptionsNote}>
        <Link href="/install/">Or see all install options</Link>
      </p>
    </div>
  );
}
