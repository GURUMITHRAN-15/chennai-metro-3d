"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { SimulationEngine } from "../../simulation/SimulationEngine";
import type { SimulationState } from "../../simulation/types";
import { fareForJourney } from "../../simulation/fares";
import { useViewStore } from "../../simulation/store";
import { getServerWalkHud, getWalkHud, requestWalk, setWalkHud, subscribeWalkHud, walkInput, type WalkHud as WalkHudState } from "../../three/walkState";
import { formatClock } from "../../utils/format";
import { buttonClass } from "../ui/Button";
import { Close, Restart } from "../ui/Icons";
import { TicketQr } from "./TicketCard";

/** How long a notice stays up (ms). */
const NOTICE_MS = 4200;

const STEPS: WalkHudState["stage"][] = ["buy-ticket", "enter-gate", "to-platform", "board", "riding", "alight", "exit-gate", "drop-ticket", "leave-station"];

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-block min-w-7 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-center font-mono text-[12px] text-ink">{children}</kbd>;
}

/** Ticket counter: the fare for this journey, and a button to pay it. */
function CounterDialog({ engine, fare }: { engine: SimulationEngine; fare: number | null }) {
  const { from, to } = engine.journey;
  const pay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    pay.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setWalkHud({ counterOpen: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/35 px-4 animate-fade-in" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="walk-counter-title" className="hud-panel flex w-[min(420px,100%)] flex-col gap-5 rounded-[18px] p-6 animate-rise-in">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[0.16em] text-muted">TICKET COUNTER · {from.name.toUpperCase()}</span>
          <h2 id="walk-counter-title" className="text-[20px] font-semibold">
            One ticket to {to.name}
          </h2>
          {to.nameTa && (
            <span lang="ta" className="font-tamil text-[14px] text-subtle">
              {to.nameTa}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[14px]">
          <dt className="text-muted">Ticket</dt>
          <dd>Single journey, paper QR</dd>
          <dt className="text-muted">Fare</dt>
          <dd className="tabular font-mono text-[18px] font-semibold">{fare !== null ? `₹${fare}` : "—"}</dd>
        </dl>
        <p className="text-[12px] leading-snug text-muted">Counter tickets are sold at the full fare; the digital discount applies to mobile QR tickets and travel cards.</p>
        <div className="flex gap-3">
          <button ref={pay} type="button" onClick={() => requestWalk("buy-ticket")} className={buttonClass("primary", "md")}>
            Pay {fare !== null ? `₹${fare}` : ""}
          </button>
          <button type="button" onClick={() => setWalkHud({ counterOpen: false })} className={buttonClass("ghost", "md")}>
            Not now
          </button>
        </div>
      </section>
    </div>
  );
}

/** The ticket in the passenger's hand. */
function TicketStub({ engine, fare, startedAboard }: { engine: SimulationEngine; fare: number | null; startedAboard: boolean }) {
  const { from, to } = engine.journey;
  return (
    <div
      aria-label={`Your ticket: ${from.name} to ${to.name}`}
      className="pointer-events-none absolute bottom-[274px] right-3 z-20 flex w-[210px] items-center gap-3 rounded-[10px] bg-[#f4f1e6] p-2.5 text-[#1b2430] shadow-xl animate-rise-in md:bottom-[108px] md:right-5"
    >
      <div className="origin-left scale-[0.5] [margin-right:-56px] [margin-block:-28px]">
        <TicketQr seed={`${from.id}>${to.id}@walk`} />
      </div>
      <div className="flex min-w-0 flex-col text-[11px] leading-tight">
        <span className="text-[9px] font-semibold tracking-[0.14em] text-[#6b7480]">{startedAboard ? "MOBILE QR" : "SINGLE JOURNEY"}</span>
        <span className="truncate font-semibold">{from.name}</span>
        <span className="truncate font-semibold">→ {to.name}</span>
        {fare !== null && <span className="tabular font-mono">₹{fare}</span>}
      </div>
    </div>
  );
}

function Summary({ engine, snap, hud, fare, onClose }: { engine: SimulationEngine; snap: SimulationState; hud: WalkHudState; fare: number | null; onClose: () => void }) {
  const { from, to } = engine.journey;
  const setMode = useViewStore((s) => s.setCameraMode);
  const facts: [string, string][] = [
    ["Time on board", formatClock(snap.duration)],
    ["Distance", `${(snap.totalDistance / 1000).toFixed(1)} km`],
  ];
  if (fare !== null) facts.push(["Fare paid", `₹${fare}`]);
  if (!hud.startedAboard) facts.push(["Used ticket", hud.ticketDropped ? "Dropped in the box" : "Still in your pocket"]);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 animate-fade-in">
      <section role="dialog" aria-labelledby="walk-summary-title" className="hud-panel pointer-events-auto relative flex w-[min(460px,100%)] flex-col gap-5 rounded-[18px] p-6">
        <button type="button" aria-label="Close summary" onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white/10 hover:text-ink">
          <Close size={16} />
        </button>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[0.16em] text-muted">JOURNEY COMPLETE</span>
          <h2 id="walk-summary-title" className="text-[22px] font-semibold leading-tight">
            {from.name} → {to.name}
          </h2>
          {from.nameTa && to.nameTa && (
            <span lang="ta" className="font-tamil text-[14px] text-subtle">
              {from.nameTa} → {to.nameTa}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-[14px]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="tabular text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-col gap-1 border-t border-line pt-4 text-[14px]">
          <span>Thank you for travelling with Chennai Metro.</span>
          <span lang="ta" className="font-tamil text-subtle">
            சென்னை மெட்ரோவில் பயணித்தமைக்கு நன்றி.
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => requestWalk("restart")} className={buttonClass("primary", "md")}>
            <Restart size={16} /> Walk it again
          </button>
          <button type="button" onClick={() => setMode("cinematic")} className={buttonClass("secondary", "md")}>
            Watch from outside
          </button>
          <Link href="/routes" className={buttonClass("ghost", "md")}>
            Choose another journey
          </Link>
        </div>
      </section>
    </div>
  );
}

/** Thumb stick for touch screens: push to walk, push to the rim to run. */
function WalkStick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const R = 46;
  const set = (e: React.PointerEvent) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    let x = (e.clientX - (rect.left + rect.width / 2)) / R;
    let y = (e.clientY - (rect.top + rect.height / 2)) / R;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    walkInput.stickStrafe = x;
    walkInput.stickForward = -y;
    walkInput.run = len > 0.95;
    setKnob({ x, y });
  };
  const stop = () => {
    walkInput.stickStrafe = 0;
    walkInput.stickForward = 0;
    walkInput.run = false;
    setKnob({ x: 0, y: 0 });
  };
  useEffect(() => stop, []);
  return (
    <div
      ref={base}
      role="application"
      aria-label="Walk: drag to move"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="hud-panel pointer-events-auto absolute bottom-[274px] left-3 z-20 hidden h-[124px] w-[124px] touch-none select-none items-center justify-center rounded-full pointer-coarse:flex md:bottom-[108px] md:left-5"
    >
      <span className="h-12 w-12 rounded-full bg-ink/85" style={{ transform: `translate(${knob.x * R * 0.7}px, ${knob.y * R * 0.7}px)` }} />
    </div>
  );
}

/**
 * Everything on screen in Walk mode: what to do next and how far it is, the
 * "use" prompt, short notices, the ticket in hand, the ticket-counter dialog,
 * the end-of-trip summary, and a thumb stick on touch screens.
 */
export function WalkHud({ engine, snap }: { engine: SimulationEngine; snap: SimulationState }) {
  const walking = useViewStore((s) => s.cameraMode === "walk");
  const hud = useSyncExternalStore(subscribeWalkHud, getWalkHud, getServerWalkHud);
  const fare = useMemo(
    () => fareForJourney(engine.route.stations, engine.route.route.fares.bands?.slabs ?? [], engine.journey.from.id, engine.journey.to.id),
    [engine],
  );
  // Notices fade on their own; a repeat of the same text shows again.
  const [seenNotice, setSeenNotice] = useState(0);
  useEffect(() => {
    if (!hud.notice) return;
    const t = window.setTimeout(() => setSeenNotice(hud.noticeId), NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [hud.notice, hud.noticeId]);
  // The summary can be put away to look around; the next trip brings its own.
  const [summaryClosedFor, setSummaryClosedFor] = useState(-1);
  const done = hud.stage === "done";
  useEffect(() => {
    // Free the mouse so the summary's buttons can be clicked.
    if (done && document.pointerLockElement) document.exitPointerLock();
  }, [done]);

  if (!walking || !hud.active) return null;
  const step = STEPS.indexOf(hud.stage);
  const showNotice = hud.notice && hud.noticeId !== seenNotice;
  const showSummary = done && summaryClosedFor !== hud.trip;

  return (
    <>
      {!done && (
        <div
          aria-live="polite"
          className="hud-panel pointer-events-none absolute inset-x-3 top-[72px] z-20 mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-3 rounded-[14px] px-4 py-2.5 md:top-[124px] lg:top-[84px]"
        >
          {!hud.startedAboard && step >= 0 && (
            <span className="tabular shrink-0 rounded-full bg-route px-2 py-0.5 font-mono text-[11px] font-semibold text-black">
              {step + 1}/{STEPS.length}
            </span>
          )}
          <span className="text-[14px] font-medium leading-snug">{hud.objective}</span>
          {hud.distance !== null && <span className="tabular shrink-0 font-mono text-[12px] text-muted">{hud.distance} m</span>}
        </div>
      )}

      {hud.pointerLocked && <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow" />}

      {hud.prompt && !hud.counterOpen && (
        <button
          type="button"
          onClick={() => {
            walkInput.interact = true;
          }}
          className="hud-panel pointer-events-auto absolute inset-x-3 bottom-[410px] z-20 mx-auto flex w-fit items-center gap-2.5 rounded-full px-5 py-2.5 text-[14px] font-medium animate-rise-in md:bottom-[124px]"
        >
          <Key>E</Key>
          {hud.prompt.label}
        </button>
      )}

      {showNotice && (
        <div role="status" className="hud-panel pointer-events-none absolute inset-x-3 bottom-[466px] z-20 mx-auto w-fit max-w-[calc(100%-24px)] rounded-[18px] px-5 py-2 text-center text-[13px] text-ink animate-fade-in md:bottom-[176px]">
          {hud.notice}
        </div>
      )}

      {!hud.pointerLocked && !done && !hud.counterOpen && (
        <p className="hud-panel pointer-events-none absolute bottom-[128px] left-5 z-10 hidden max-w-[300px] flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[12px] px-3.5 py-2.5 text-[12px] text-muted pointer-fine:md:flex">
          <span>Click the view to look around.</span>
          <span className="inline-flex items-center gap-1">
            <Key>W</Key>
            <Key>A</Key>
            <Key>S</Key>
            <Key>D</Key> move
          </span>
          <span className="inline-flex items-center gap-1">
            <Key>Shift</Key> run
          </span>
          <span className="inline-flex items-center gap-1">
            <Key>E</Key> use
          </span>
        </p>
      )}

      {hud.hasTicket && !done && <TicketStub engine={engine} fare={fare} startedAboard={hud.startedAboard} />}
      <WalkStick />
      {hud.counterOpen && <CounterDialog engine={engine} fare={fare} />}
      {showSummary && <Summary engine={engine} snap={snap} hud={hud} fare={fare} onClose={() => setSummaryClosedFor(hud.trip)} />}
    </>
  );
}
