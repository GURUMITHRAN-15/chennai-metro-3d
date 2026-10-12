/** Where the project lives, and its anonymous visit counter: one place to change them. */

export const REPO = {
  owner: "madesh-ops",
  name: "chennai-metro-3d",
  url: "https://github.com/madesh-ops/chennai-metro-3d",
  contributing: "https://github.com/madesh-ops/chennai-metro-3d/blob/main/CONTRIBUTING.md",
  api: "https://api.github.com/repos/madesh-ops/chennai-metro-3d",
} as const;

/**
 * GoatCounter site code (https://<code>.goatcounter.com): cookie-free,
 * anonymous visit counting. Empty turns counting and the visits figure off.
 * The site's GoatCounter settings must allow visitor counts on the website.
 */
export const GOATCOUNTER_CODE = "";

export const goatcounterUrl = (path: string) => `https://${GOATCOUNTER_CODE}.goatcounter.com${path}`;
