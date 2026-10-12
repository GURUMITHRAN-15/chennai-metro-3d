"use client";

import { useEffect, useState } from "react";
import snapshot from "../../data/github.json";
import { REPO } from "../../lib/site";
import { ArrowRight, GitHub, Star } from "../ui/Icons";

interface Contributor {
  login: string;
  avatar: string;
  url: string;
  commits: number;
}
interface Stats {
  stars: number;
  forks: number;
  contributors: Contributor[];
}

const fmt = new Intl.NumberFormat("en-IN");

/** GitHub's numbers: the build's snapshot first, then fresh ones from the API if it answers. */
function useGitHubStats(): Stats {
  const [stats, setStats] = useState<Stats>(snapshot);
  useEffect(() => {
    const ctl = new AbortController();
    const get = (path: string) =>
      fetch(`${REPO.api}${path}`, { signal: ctl.signal, headers: { Accept: "application/vnd.github+json" } }).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
    Promise.all([get(""), get("/contributors?per_page=100")])
      .then(([repo, people]: [{ stargazers_count: number; forks_count: number }, { login: string; avatar_url: string; html_url: string; contributions: number; type: string }[]]) =>
        setStats({
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          contributors: people.filter((p) => p.type === "User").map((p) => ({ login: p.login, avatar: p.avatar_url, url: p.html_url, commits: p.contributions })),
        }),
      )
      .catch(() => undefined); // Rate-limited or offline: the snapshot stands.
    return () => ctl.abort();
  }, []);
  return stats;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="tabular text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-none tracking-[-0.03em] text-ink">{value}</dd>
    </div>
  );
}

/** Landing page: the project's repository, its stars and the people who built it. */
export function OpenSource() {
  const { stars, forks, contributors } = useGitHubStats();
  return (
    <section aria-labelledby="open-heading" className="border-t border-line px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
        <div className="flex flex-col gap-6">
          <h2 id="open-heading" className="max-w-[26rem] text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Built in the open. <span className="text-muted">Anyone can read the code, report a problem or add to it.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <a
              href={REPO.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Star ${REPO.name} on GitHub (${stars} stars)`}
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-ink pl-5 pr-2 text-[16px] font-semibold text-bg transition-[transform,background-color] duration-100 ease-out hover:bg-white active:scale-[0.97]"
            >
              <GitHub size={18} />
              Star on GitHub
              <span className="tabular inline-flex h-8 items-center gap-1 rounded-full bg-bg/10 px-3 text-[14px]">
                <Star size={14} /> {fmt.format(stars)}
              </span>
            </a>
            <a href={REPO.contributing} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/85 transition-colors hover:text-ink">
              How to contribute <ArrowRight size={15} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <dl className="grid grid-cols-3 gap-x-8 gap-y-7">
            <Figure label="Stars" value={fmt.format(stars)} />
            <Figure label="Forks" value={fmt.format(forks)} />
            <Figure label="Contributors" value={fmt.format(contributors.length)} />
          </dl>
          {contributors.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] text-muted">Contributors</h3>
              <ul className="flex flex-wrap gap-x-5 gap-y-3">
                {contributors.map((c) => (
                  <li key={c.login}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group -m-1 flex items-center gap-2.5 rounded-full p-1 pr-3 transition-[background-color,transform] duration-100 ease-out hover:bg-white/[0.05] active:scale-[0.97]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- GitHub avatars, static export */}
                      <img src={`${c.avatar}${c.avatar.includes("?") ? "&" : "?"}s=64`} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 rounded-full bg-surface" />
                      <span className="flex flex-col leading-tight">
                        <span className="text-[14px] font-medium text-ink">{c.login}</span>
                        <span className="tabular text-[12px] text-faint">
                          {c.commits} {c.commits === 1 ? "commit" : "commits"}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
