"use client";

import { useEffect, useRef } from "react";
import { Close } from "../ui/Icons";
import { useViewStore } from "../../simulation/store";
import { SHORTCUT_HELP } from "../../hooks/useKeyboardShortcuts";

/** Quick-reference dialog for the keyboard shortcuts. Opened with `?` or the top-bar button. */
export function ShortcutsHelp() {
  const open = useViewStore((s) => s.shortcutsOpen);
  const setOpen = useViewStore((s) => s.setShortcutsOpen);
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab" && panel.current) {
        // The close button is the only focusable control, so keep focus on it.
        e.preventDefault();
        panel.current.querySelector<HTMLElement>("button")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      returnFocus.current?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Close keyboard shortcuts" tabIndex={-1} className="absolute inset-0 bg-black/45 animate-fade-in" onClick={() => setOpen(false)} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="relative flex max-h-[88dvh] w-full max-w-[420px] flex-col rounded-2xl border border-white/[0.06] bg-surface shadow-2xl animate-rise-in"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="shortcuts-title" className="text-[16px] font-semibold">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close keyboard shortcuts"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-subtle hover:bg-white/5 hover:text-ink"
          >
            <Close size={18} />
          </button>
        </div>
        <div className="quiet-scroll overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-[13px]">
            {SHORTCUT_HELP.map((s) => (
              <div key={s.keys} className="contents">
                <dt>
                  <kbd className="inline-block min-w-8 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-center font-mono text-[12px] text-ink">{s.keys}</kbd>
                </dt>
                <dd className="self-center text-muted">{s.action}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[12px] text-muted">Press ? or Esc to close.</p>
        </div>
      </div>
    </div>
  );
}
