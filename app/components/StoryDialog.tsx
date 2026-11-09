"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import type { FireUpdate } from "../lib/fireTimeline";
import { formatDateTime, SECTIONS, unitType, type Story } from "../lib/news";
import GoLineHeading from "./GoLineHeading";
import { TtcBadge } from "./TtcIcons";

function describeUnit(unit: string) {
  const type = unitType(unit);
  return type === "Other" ? unit : `${unit} (${type})`;
}

function FireUpdates({ updates }: { updates: FireUpdate[] }) {
  return (
    <section className="dialog__updates">
      <h3>Updates</h3>
      <ul>
        {updates.map((update, index) => {
          const alarmChanged = index > 0 && update.alarm !== updates[index - 1].alarm;
          return (
            <li key={update.at}>
              <time>
                {new Date(update.at).toLocaleTimeString("en-CA", {
                  timeZone: "America/Toronto",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </time>
              <b>[{String(update.alarm).padStart(2, "0")}]</b>
              <span>
                {update.added.length > 0 && (
                  <span className="dialog__added">+{update.added.map(describeUnit).join(", ")} </span>
                )}
                {update.removed.length > 0 && (
                  <span className="dialog__removed">−{update.removed.map(describeUnit).join(", ")} </span>
                )}
                {alarmChanged && <span>Alarm level now {update.alarm}</span>}
                {index === 0 && update.added.length === 0 && <span>No units listed yet</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="dialog__note">Tracked from when this browser first saw the call. [00] is the alarm level.</p>
    </section>
  );
}

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

        {story.fire?.updates && <FireUpdates updates={story.fire.updates} />}

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
