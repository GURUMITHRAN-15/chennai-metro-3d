"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "../ui/Icons";
import { searchStations, type Searchable } from "../../lib/stationSearch";

export interface ComboStation extends Searchable {
  id: string;
}

/**
 * Station picker with type-to-search, replacing a native <select> that is hard
 * to scroll on lines with 45+ stations. Follows the ARIA combobox pattern:
 * Arrow keys move through the list, Enter picks, Esc closes, Tab leaves.
 * Searches English, Tamil and alternative names (see lib/stationSearch).
 */
export function StationCombobox({
  id,
  label,
  value,
  stops,
  active,
  onFocus,
  onChange,
  marker,
}: {
  id: string;
  label: string;
  value: string;
  stops: readonly ComboStation[];
  active: boolean;
  onFocus: () => void;
  onChange: (id: string) => void;
  marker: React.ReactNode;
}) {
  // `query` is what the rider has typed; null means "not editing", so the box shows the chosen station.
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selected = stops.find((s) => s.id === value);
  const results = useMemo(() => searchStations(stops, query ?? ""), [stops, query]);
  const expanded = open && results.length > 0;
  const current = results.length > 0 ? Math.min(highlight, results.length - 1) : -1;

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-option-${i}`;

  // Keep the highlighted option visible when arrowing through a long list.
  useEffect(() => {
    if (expanded && current >= 0) document.getElementById(`${id}-option-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [expanded, current, id]);

  const show = () => {
    // Start on the chosen station so the list opens where the rider already is.
    setHighlight(Math.max(0, results.findIndex((s) => s.id === value)));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setQuery(null);
  };
  const choose = (station: ComboStation) => {
    onChange(station.id);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) show();
        else setHighlight(Math.min(results.length - 1, current + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) show();
        else setHighlight(Math.max(0, current - 1));
        break;
      case "Enter":
        if (expanded && current >= 0) {
          e.preventDefault();
          choose(results[current]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="text-[14px] text-muted">
        {label}
      </label>
      <div
        className={`relative flex h-[54px] items-center rounded-2xl bg-white/[0.05] transition-shadow duration-150 ${active ? "shadow-[inset_0_0_0_1.5px_rgba(245,247,250,0.6)]" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"}`}
      >
        <span className="pointer-events-none absolute left-4 flex items-center" aria-hidden="true">
          {marker}
        </span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && current >= 0 ? optionId(current) : undefined}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Search stations"
          value={query ?? selected?.name ?? ""}
          onFocus={(e) => {
            onFocus();
            e.currentTarget.select();
            show();
          }}
          onClick={() => {
            if (!open) show();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onBlur={close}
          onKeyDown={onKeyDown}
          className="h-full w-full cursor-text rounded-2xl bg-transparent pl-11 pr-10 text-[17px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-faint"
        />
        <ChevronDown size={16} className="pointer-events-none absolute right-4 text-muted" />

        {expanded && (
          <ul
            id={listId}
            role="listbox"
            aria-label={`${label} station`}
            className="quiet-scroll absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-2xl"
          >
            {results.map((s, i) => (
              <li
                key={s.id}
                id={optionId(i)}
                role="option"
                aria-selected={s.id === value}
                // Keep focus in the input; a blur here would close the list before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                onMouseMove={() => i !== current && setHighlight(i)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px] ${
                  i === current ? "bg-white/[0.08] text-ink" : "text-subtle"
                } ${s.id === value ? "font-semibold" : ""}`}
              >
                <span className="min-w-0 truncate">{s.name}</span>
                {s.nameTa && (
                  <span lang="ta" className="shrink-0 text-[13px] font-normal text-muted">
                    {s.nameTa}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {open && results.length === 0 && (
          <p className="absolute inset-x-0 top-full z-30 mt-1.5 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px] text-muted shadow-2xl" role="status">
            No station matches “{query}”.
          </p>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {open && query !== null ? `${results.length} ${results.length === 1 ? "station" : "stations"} found` : ""}
      </span>
    </div>
  );
}
