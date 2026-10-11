import type { ReactNode } from "react";

/** The top of a content page: one large title and a lead paragraph. Same type scale on every page. */
export function PageIntro({ title, children, id }: { title: ReactNode; children?: ReactNode; id?: string }) {
  return (
    <div className="flex max-w-[48rem] flex-col gap-5">
      <h1 id={id} className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
        {title}
      </h1>
      {children && <div className="flex flex-col gap-4 text-[17px] leading-[1.55] text-muted sm:text-[19px]">{children}</div>}
    </div>
  );
}

/** Section heading inside a page: sentence case, tight, no eyebrow. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.15] tracking-[-0.025em]">
      {children}
    </h2>
  );
}
