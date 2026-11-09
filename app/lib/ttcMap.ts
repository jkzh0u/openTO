// A hand-laid schematic of the subway in a 300 x 204 box. Each segment runs from the
// previous point to its own, with its stations spaced evenly along the way.
type LineDefinition = {
  id: string;
  colour: string;
  start: [number, number, string];
  segments: [number, number, string[]][];
};

const LINE_DEFINITIONS: LineDefinition[] = [
  {
    id: "6",
    colour: "#9a9a9c",
    start: [18, 46, "Humber College"],
    segments: [
      [
        100,
        46,
        [
          "Westmore",
          "Martin Grove",
          "Albion",
          "Stevenson",
          "Mount Olive",
          "Rowntree Mills",
          "Pearldale",
          "Duncanwoods",
          "Milvan Rumike",
          "Emery",
          "Signet Arrow",
          "Norfinch Oakdale",
          "Jane and Finch",
          "Driftwood",
          "Tobermory",
          "Sentinel",
          "Finch West",
        ],
      ],
    ],
  },
  {
    id: "4",
    colour: "#c8388f",
    start: [140, 48, "Sheppard-Yonge"],
    segments: [[222, 48, ["Bayview", "Bessarion", "Leslie", "Don Mills"]]],
  },
  {
    id: "5",
    colour: "#f08a24",
    start: [44, 96, "Mount Dennis"],
    segments: [
      [116, 96, ["Keelesdale", "Caledonia", "Fairbank", "Oakwood", "Cedarvale"]],
      [140, 96, ["Forest Hill", "Chaplin", "Avenue", "Eglinton"]],
      [
        286,
        96,
        [
          "Mount Pleasant",
          "Leaside",
          "Laird",
          "Sunnybrook Park",
          "Don Valley",
          "Aga Khan Park & Museum",
          "Wynford",
          "Sloane",
          "O'Connor",
          "Pharmacy",
          "Hakimi Lebovic",
          "Golden Mile",
          "Birchmount",
          "Ionview",
          "Kennedy",
        ],
      ],
    ],
  },
  {
    id: "2",
    colour: "#00a84f",
    start: [18, 136, "Kipling"],
    segments: [
      [
        125,
        136,
        [
          "Islington",
          "Royal York",
          "Old Mill",
          "Jane",
          "Runnymede",
          "High Park",
          "Keele",
          "Dundas West",
          "Lansdowne",
          "Dufferin",
          "Ossington",
          "Christie",
          "Bathurst",
          "Spadina",
          "St George",
        ],
      ],
      [140, 136, ["Bay", "Bloor-Yonge"]],
      [
        240,
        136,
        [
          "Sherbourne",
          "Castle Frank",
          "Broadview",
          "Chester",
          "Pape",
          "Donlands",
          "Greenwood",
          "Coxwell",
          "Woodbine",
          "Main Street",
        ],
      ],
      [286, 96, ["Victoria Park", "Warden", "Kennedy"]],
    ],
  },
  {
    id: "1",
    colour: "#f8c300",
    start: [100, 18, "Vaughan"],
    segments: [
      [100, 46, ["Highway 407", "Pioneer Village", "York University", "Finch West"]],
      [116, 96, ["Downsview Park", "Sheppard West", "Wilson", "Yorkdale", "Lawrence West", "Glencairn", "Cedarvale"]],
      [125, 136, ["St Clair West", "Dupont", "Spadina", "St George"]],
      [125, 178, ["Museum", "Queen's Park", "St Patrick", "Osgoode", "St Andrew"]],
      [132.5, 192, ["Union"]],
      [140, 178, ["King"]],
      [140, 136, ["Queen", "TMU", "College", "Wellesley", "Bloor-Yonge"]],
      [140, 96, ["Rosedale", "Summerhill", "St Clair", "Davisville", "Eglinton"]],
      [140, 48, ["Lawrence", "York Mills", "Sheppard-Yonge"]],
      [140, 18, ["North York Centre", "Finch"]],
    ],
  },
];

export const MAP_WIDTH = 300;
export const MAP_HEIGHT = 204;

export type MapStation = { line: string; name: string; x: number; y: number; isInterchange: boolean };

function round(value: number) {
  return Math.round(value * 100) / 100;
}

const stationCounts = new Map<string, number>();
for (const { start, segments } of LINE_DEFINITIONS) {
  for (const name of [start[2], ...segments.flatMap((segment) => segment[2])]) {
    stationCounts.set(name, (stationCounts.get(name) ?? 0) + 1);
  }
}

export const MAP_LINES = LINE_DEFINITIONS.map(({ id, colour, start, segments }) => {
  const points: [number, number][] = [[start[0], start[1]]];
  const placed: [string, number, number][] = [[start[2], start[0], start[1]]];
  let [previousX, previousY] = start;

  for (const [x, y, names] of segments) {
    names.forEach((name, index) => {
      const share = (index + 1) / names.length;
      placed.push([name, round(previousX + (x - previousX) * share), round(previousY + (y - previousY) * share)]);
    });
    points.push([x, y]);
    previousX = x;
    previousY = y;
  }

  const stations: MapStation[] = placed.map(([name, x, y]) => ({
    line: id,
    name,
    x,
    y,
    isInterchange: (stationCounts.get(name) ?? 0) > 1,
  }));
  return { id, colour, points: points.map((point) => point.join(",")).join(" "), stations };
});

const ALIASES: Record<string, string> = {
  "vaughan metropolitan centre": "vaughan",
  "eglinton west": "cedarvale",
  dundas: "tmu",
  "toronto metropolitan university": "tmu",
  sheppard: "sheppard-yonge",
  bloor: "bloor-yonge",
  yonge: "bloor-yonge",
  "science centre": "don valley",
};

function normalize(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+station$/, "")
    .trim();
  return ALIASES[cleaned] ?? cleaned;
}

export function findStationIndex(line: string, name: string): number {
  const stations = MAP_LINES.find((mapLine) => mapLine.id === line)?.stations ?? [];
  const target = normalize(name);
  return stations.findIndex((station) => normalize(station.name) === target);
}
