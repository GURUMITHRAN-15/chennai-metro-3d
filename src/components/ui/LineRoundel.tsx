/** Dark text on light line colours (yellow), white on the rest. */
export function onColour(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum > 150 ? "#070b12" : "#ffffff";
}

const SIZES = { sm: "h-5 w-5 text-[11px]", md: "h-8 w-8 text-[14px]", lg: "h-10 w-10 text-[16px]" };

/**
 * A line's number in a disc of its colour, as on the station signs. Decorative
 * by default: the line's name is expected in the text beside it.
 */
export function LineRoundel({ colour, name, size = "md", label = false }: { colour: string; name: string; size?: keyof typeof SIZES; label?: boolean }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold tabular leading-none ${SIZES[size]}`}
      style={{ background: colour, color: onColour(colour) }}
      {...(label ? { role: "img", "aria-label": name } : { "aria-hidden": true })}
    >
      {name.replace(/\D/g, "")}
    </span>
  );
}
