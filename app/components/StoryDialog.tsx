"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { formatDateTime, SECTIONS, type Story } from "../lib/news";
import GoLineHeading from "./GoLineHeading";
import { TtcBadge } from "./TtcIcons";

export default function StoryDialog({ story, onClose }: { story: Story; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const meta = SECTIONS[story.section];

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialog.current) dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      className={`dialog section--${story.section}`}
      aria-labelledby="story-headline"
      onClose={onClose}
      onClick={closeOnBackdrop}
    >
      <article className="dialog__page">
        <button type="button" className="dialog__close" aria-label="Close story" onClick={() => dialog.current?.close()}>
          ×
        </button>
        <p className="section__kicker">{meta.title}</p>
        {story.ttc && (
          <p className="dialog__ttc">
            <TtcBadge ttc={story.ttc} showStatus />
          </p>
        )}
        {story.goLine && (
          <p className="dialog__ttc">
            <GoLineHeading line={story.goLine} />
          </p>
        )}
        <h2 id="story-headline" className="dialog__headline">
          {story.headline}
        </h2>
        <p className="dialog__byline">
          By {meta.byline} · {formatDateTime(story.time)}
        </p>
        <p className="dialog__summary">{story.summary}</p>

        <dl className="dialog__facts">
          {story.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {story.mapUrl && (
          <a className="dialog__link" href={story.mapUrl} target="_blank" rel="noreferrer">
            View on map
          </a>
        )}
        {meta.note && <p className="dialog__note">{meta.note}</p>}
      </article>
    </dialog>
  );
}
