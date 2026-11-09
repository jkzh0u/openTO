import type { Story } from "../lib/news";

export default function GoLineHeading({ line }: { line: NonNullable<Story["goLine"]> }) {
  return (
    <span className="go-line" style={{ background: line.colour, color: line.textColour }}>
      {line.name}
    </span>
  );
}
