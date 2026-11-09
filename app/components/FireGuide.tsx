import { ALARM_LEVELS, UNIT_TYPES } from "../lib/news";

export default function FireGuide() {
  return (
    <aside className="guide" aria-label="Reader's guide to fire incidents">
      <h3 className="guide__title">Reader&apos;s Guide</h3>

      <h4 className="guide__heading">Alarm levels</h4>
      <p>
        Dispatchers can upgrade an incident based on 911 calls and the details callers give, or crews can upgrade it
        on arrival. Fire size and duration, crew rotation in extreme weather, people inside the structure and the need
        for specialized crews can all raise the level.
      </p>
      <dl className="guide__table">
        {ALARM_LEVELS.map(({ level, meaning }) => (
          <div key={level}>
            <dt>{level}</dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
      <p className="guide__small">
        Levels 2 and up count pumpers, aerials, rescues and squads. Hazmat, air lights, district chiefs and command
        vehicles are not counted.
      </p>

      <h4 className="guide__heading">Area</h4>
      <p>The nearest fire station to the incident.</p>

      <h4 className="guide__heading">Unit codes</h4>
      <dl className="guide__table guide__table--units">
        {Object.entries(UNIT_TYPES).map(([code, name]) => (
          <div key={code}>
            <dt>{code}</dt>
            <dd>{name}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
