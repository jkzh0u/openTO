import type { Story, TtcStatus } from "../lib/news";

type TtcBadgeProps = { ttc: NonNullable<Story["ttc"]>; showStatus?: boolean };

export function TtcBadge({ ttc, showStatus }: TtcBadgeProps) {
  return (
    <span className="ttc-badge-wrap">
      <span
        className={ttc.isLine ? "ttc-badge ttc-badge--line" : "ttc-badge"}
        style={{ background: ttc.background, color: ttc.color }}
      >
        <span className={ttc.label.endsWith("1") ? "ttc-badge__label ttc-badge__label--ends-1" : "ttc-badge__label"}>
          {ttc.label}
        </span>
      </span>
      {showStatus && <TtcStatusIcon status={ttc.status} />}
    </span>
  );
}

const STATUS_STYLES: Record<TtcStatus, { fill: string; glyph: string }> = {
  ok: { fill: "#00923f", glyph: "M7.5 12.5l3 3 6-6.5" },
  closed: { fill: "#d9271e", glyph: "M8.5 8.5l7 7M15.5 8.5l-7 7" },
  detour: { fill: "#f08a24", glyph: "M9 18v-5.5h6V7.5M12.5 10l2.5-2.5 2.5 2.5" },
  delay: { fill: "#d98a00", glyph: "M12 6.5V12l3.5 2.2" },
  scheduled: { fill: "#6b6456", glyph: "M12 6.5V12l3.5 2.2" },
};

function TtcStatusIcon({ status }: { status: TtcStatus }) {
  const { fill, glyph } = STATUS_STYLES[status];
  return (
    <svg className="ttc-status" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill={fill} />
      <path d={glyph} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TtcModeIcons() {
  return (
    <span className="ttc-modes" aria-hidden="true">
      {/* Subway */}
      <svg viewBox="0 0 24 24">
        <path d="M7 2h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" />
        <path d="M6.5 5.5h11v6.5h-11z" fill="var(--paper)" />
        <circle cx="8" cy="16" r="1.5" fill="var(--paper)" />
        <circle cx="16" cy="16" r="1.5" fill="var(--paper)" />
        <path d="M7.5 20l-2 3M16.5 20l2 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {/* Bus */}
      <svg viewBox="0 0 24 24">
        <path d="M6 3h12a3 3 0 0 1 3 3v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a3 3 0 0 1 3-3z" />
        <path d="M5 6.5h14V13H5z" fill="var(--paper)" />
        <circle cx="7.5" cy="16.5" r="1.4" fill="var(--paper)" />
        <circle cx="16.5" cy="16.5" r="1.4" fill="var(--paper)" />
        <path d="M5 20h3v2.5H5zM16 20h3v2.5h-3z" />
      </svg>
      {/* Streetcar */}
      <svg viewBox="0 0 24 24">
        <path d="M12 0.5v4M8.5 1.5h7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 4.5h10a3 3 0 0 1 3 3V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5a3 3 0 0 1 3-3z" />
        <path d="M6 7.5h5V13H6zM13 7.5h5V13h-5z" fill="var(--paper)" />
        <circle cx="8" cy="16.5" r="1.3" fill="var(--paper)" />
        <circle cx="16" cy="16.5" r="1.3" fill="var(--paper)" />
        <path d="M6 20h3v2H6zM15 20h3v2h-3z" />
      </svg>
    </span>
  );
}
