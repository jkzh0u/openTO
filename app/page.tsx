import type { ReactNode } from "react";
import FireMap from "./components/FireMap";
import { ByTheNumbers, GoLineStatus } from "./components/FrontExtras";
import { MiniPoliceMap } from "./components/PoliceStats";
import { SectionPreview } from "./components/Section";
import TtcMiniMap from "./components/TtcMiniMap";
import { SECTION_IDS, type SectionId } from "./lib/news";

// Always shown below a column's stories.
const AFTER: Partial<Record<SectionId, ReactNode>> = {
  police: <MiniPoliceMap />,
  fire: <FireMap compact />,
  ttc: <TtcMiniMap />,
};

// Shorter columns get these below their stories, in whatever room is left.
const FILLERS: Partial<Record<SectionId, ReactNode>> = {
  go: <GoLineStatus />,
};

export default function Home() {
  return (
    <main className="front">
      {SECTION_IDS.map((id) => (
        <SectionPreview key={id} id={id} after={AFTER[id]}>
          {FILLERS[id]}
        </SectionPreview>
      ))}
      <ByTheNumbers />
    </main>
  );
}
