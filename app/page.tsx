import type { ReactNode } from "react";
import { ByTheNumbers, GoLineStatus, TorontoConditions } from "./components/FrontExtras";
import { SectionPreview } from "./components/Section";
import { SECTION_IDS, type SectionId } from "./lib/news";

// Shorter columns get these below their stories, in whatever room is left.
const FILLERS: Partial<Record<SectionId, ReactNode>> = {
  fire: <TorontoConditions />,
  go: <GoLineStatus />,
};

export default function Home() {
  return (
    <main className="front">
      {SECTION_IDS.map((id) => (
        <SectionPreview key={id} id={id}>
          {FILLERS[id]}
        </SectionPreview>
      ))}
      <ByTheNumbers />
    </main>
  );
}
