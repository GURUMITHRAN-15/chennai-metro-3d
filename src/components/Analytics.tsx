"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { GOATCOUNTER_CODE, goatcounterUrl } from "../lib/site";

type GoatCounter = { count?: (opts: { path: string }) => void };
const gc = () => (window as unknown as { goatcounter?: GoatCounter }).goatcounter;

/** The last page counted: the script's load and the route effect can both fire for the first page; count it once. */
let counted: string | null = null;
/** The page on screen, as the app names it (no base path or trailing slash, unlike location.pathname). */
let current: string | null = null;
function countPage(path: string) {
  const counter = gc();
  if (!counter?.count || counted === path) return;
  counted = path;
  counter.count({ path });
}

/** Counts one visit per page shown, including client-side navigations (the script alone sees only the first). */
function PageCounter() {
  const pathname = usePathname();
  const search = useSearchParams();
  const path = `${pathname}${search.size ? `?${search}` : ""}`;
  useEffect(() => {
    current = path;
    // If the script is still loading, onReady below counts this page instead.
    countPage(path);
  }, [path]);
  return null;
}

/**
 * Anonymous, cookie-free visit counting with GoatCounter, in production builds
 * only and only when a site code is configured (src/lib/site.ts).
 */
export function Analytics() {
  if (process.env.NODE_ENV !== "production" || !GOATCOUNTER_CODE) return null;
  return (
    <>
      <Script
        src="https://gc.zgo.at/count.js"
        strategy="afterInteractive"
        data-goatcounter={goatcounterUrl("/count")}
        data-goatcounter-settings='{"no_onload": true}'
        onReady={() => {
          if (current) countPage(current);
        }}
      />
      <Suspense fallback={null}>
        <PageCounter />
      </Suspense>
    </>
  );
}
