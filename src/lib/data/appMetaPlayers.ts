export type CardTier = "epic_booster" | "big_time" | "show_time" | "highlight";

export type PitchPosition =
  | "CF"
  | "SS"
  | "LWF"
  | "RWF"
  | "AMF"
  | "CMF"
  | "DMF"
  | "LB"
  | "CB"
  | "RB"
  | "GK";

export interface MetaPlayerCard {
  id: string;
  name: string;
  clubOrNation: string;
  position: PitchPosition;
  altPositions: PitchPosition[];
  tier: CardTier;
  playstyle: string;
  boosterName: string;
  baseOvr: number;
  maxPoints: number;
  /** Base level-1 attributes before progression */
  baseStats: {
    offensiveAwareness: number;
    ballControl: number;
    dribbling: number;
    tightPossession: number;
    lowPass: number;
    loftedPass: number;
    finishing: number;
    heading: number;
    setPiece: number;
    curl: number;
    defensiveAwareness: number;
    tackling: number;
    aggression: number;
    defensiveEngagement: number;
    speed: number;
    acceleration: number;
    kickingPower: number;
    jumping: number;
    physicalContact: number;
    balance: number;
    stamina: number;
    gkAwareness: number;
    gkCatching: number;
    gkReflexes: number;
  };
  /** Recommended Division-1 Meta allocation [shoot, pass, drib, dex, lbs, aer, def, gk] */
  metaAllocation: [number, number, number, number, number, number, number, number];
}

export interface BoosterManager {
  id: string;
  name: string;
  style: string;
  proficiency: number;
  statBoostLabel: string;
  ovrBonus: number;
}

export const BOOSTER_MANAGERS: BoosterManager[] = [
  {
    id: "xabi-qc",
    name: "Xabi Alonso (88 QC)",
    style: "Quick Counter",
    proficiency: 88,
    statBoostLabel: "+1 Acceleration",
    ovrBonus: 4,
  },
  {
    id: "deschamps-lbc",
    name: "D. Deschamps (88 LBC)",
    style: "Long Ball Counter",
    proficiency: 88,
    statBoostLabel: "+1 Speed",
    ovrBonus: 4,
  },
  {
    id: "guardiola-poss",
    name: "L. Roman / Pep (88 Poss)",
    style: "Possession Game",
    proficiency: 88,
    statBoostLabel: "+1 Tight Possession",
    ovrBonus: 4,
  },
  {
    id: "stojkovic-qc",
    name: "D. Stojković (88 QC/OW)",
    style: "Quick Counter / Out Wide",
    proficiency: 88,
    statBoostLabel: "+1 Finishing",
    ovrBonus: 4,
  },
  {
    id: "arteta-lbc",
    name: "M. Arteta (88 LBC/Poss)",
    style: "Long Ball Counter",
    proficiency: 88,
    statBoostLabel: "+1 Low Pass",
    ovrBonus: 4,
  },
];

export const SECOND_BOOSTERS = [
  { id: "fantasia", name: "Fantasia (+1 Drib/Bal/Fin)", keys: ["dribbling", "balance", "finishing"] as const },
  { id: "strikers", name: "Striker's Instinct (+1 OA/Fin/Acc)", keys: ["offensiveAwareness", "finishing", "acceleration"] as const },
  { id: "shutdown", name: "Shutdown (+1 DA/Tack/Speed)", keys: ["defensiveAwareness", "tackling", "speed"] as const },
  { id: "agility", name: "Agility (+1 Speed/Acc/Bal)", keys: ["speed", "acceleration", "balance"] as const },
  { id: "duelling", name: "Duelling (+1 Tack/Phys/Stam)", keys: ["tackling", "physicalContact", "stamina"] as const },
  { id: "goalkeeping", name: "Saving (+1 GK Awr/Ref/Cat)", keys: ["gkAwareness", "gkReflexes", "gkCatching"] as const },
];

function makeCard(
  id: string,
  name: string,
  clubOrNation: string,
  position: PitchPosition,
  altPositions: PitchPosition[],
  tier: CardTier,
  playstyle: string,
  boosterName: string,
  baseOvr: number,
  maxPoints: number,
  overrides: Partial<MetaPlayerCard["baseStats"]>,
  metaAllocation: [number, number, number, number, number, number, number, number]
): MetaPlayerCard {
  const isGk = position === "GK";
  return {
    id,
    name,
    clubOrNation,
    position,
    altPositions,
    tier,
    playstyle,
    boosterName,
    baseOvr,
    maxPoints,
    baseStats: {
      offensiveAwareness: isGk ? 48 : 76,
      ballControl: isGk ? 55 : 78,
      dribbling: isGk ? 50 : 77,
      tightPossession: isGk ? 54 : 78,
      lowPass: isGk ? 60 : 75,
      loftedPass: isGk ? 62 : 73,
      finishing: isGk ? 45 : 74,
      heading: isGk ? 55 : 72,
      setPiece: 68,
      curl: 72,
      defensiveAwareness: isGk ? 52 : 64,
      tackling: isGk ? 48 : 63,
      aggression: isGk ? 55 : 68,
      defensiveEngagement: isGk ? 50 : 66,
      speed: isGk ? 64 : 79,
      acceleration: isGk ? 66 : 79,
      kickingPower: 79,
      jumping: 75,
      physicalContact: 75,
      balance: 76,
      stamina: 78,
      gkAwareness: isGk ? 83 : 40,
      gkCatching: isGk ? 80 : 40,
      gkReflexes: isGk ? 84 : 40,
      ...overrides,
    },
    metaAllocation,
  };
}

export const META_PLAYERS_DB: MetaPlayerCard[] = [
  makeCard(
    "rummenigge-epic",
    "K. Rummenigge",
    "FC Bayern / Germany",
    "CF",
    ["SS"],
    "epic_booster",
    "Goal Poacher",
    "Striker's Instinct +2",
    91,
    68,
    { offensiveAwareness: 85, finishing: 84, speed: 86, acceleration: 87, kickingPower: 85, dribbling: 81, balance: 80, physicalContact: 79 },
    [9, 0, 8, 10, 8, 4, 0, 0]
  ),
  makeCard(
    "messi-bt-2015",
    "L. Messi (2015 BT)",
    "FC Barcelona / Argentina",
    "RWF",
    ["SS", "AMF", "CF"],
    "big_time",
    "Creative Playmaker",
    "King of Football +3",
    92,
    66,
    { offensiveAwareness: 86, ballControl: 89, dribbling: 91, tightPossession: 90, finishing: 86, acceleration: 88, balance: 91, kickingPower: 84, curl: 88 },
    [8, 4, 8, 10, 9, 0, 0, 0]
  ),
  makeCard(
    "gullit-epic",
    "R. Gullit",
    "AC Milan / Netherlands",
    "CF",
    ["AMF", "SS", "CMF"],
    "epic_booster",
    "Hole Player",
    "Total Package +2",
    91,
    68,
    { offensiveAwareness: 83, ballControl: 83, dribbling: 81, lowPass: 80, finishing: 81, heading: 84, speed: 83, acceleration: 82, physicalContact: 86, jumping: 85, stamina: 84 },
    [8, 4, 8, 9, 8, 5, 0, 0]
  ),
  makeCard(
    "etoo-epic",
    "S. Eto'o",
    "FC Barcelona / Cameroon",
    "CF",
    ["SS"],
    "epic_booster",
    "Goal Poacher",
    "Phenomenal Finishing +2",
    91,
    66,
    { offensiveAwareness: 86, finishing: 84, speed: 89, acceleration: 90, dribbling: 80, balance: 82, kickingPower: 83 },
    [9, 0, 8, 9, 8, 4, 0, 0]
  ),
  makeCard(
    "shevchenko-epic",
    "A. Shevchenko",
    "AC Milan / Ukraine",
    "CF",
    ["SS"],
    "epic_booster",
    "Goal Poacher",
    "Acceleration +2",
    90,
    68,
    { offensiveAwareness: 86, finishing: 85, speed: 86, acceleration: 87, kickingPower: 84, balance: 81 },
    [9, 0, 8, 10, 8, 4, 0, 0]
  ),
  makeCard(
    "mbappe-st",
    "K. Mbappé (Show Time)",
    "Real Madrid / France",
    "CF",
    ["LWF", "RWF"],
    "show_time",
    "Goal Poacher",
    "Phenomenal Finishing +2",
    91,
    66,
    { offensiveAwareness: 85, dribbling: 85, finishing: 83, speed: 90, acceleration: 91, balance: 85 },
    [9, 0, 8, 9, 8, 4, 0, 0]
  ),
  makeCard(
    "neymar-epic-santos",
    "Neymar Jr (Epic)",
    "FC Barcelona / Brazil",
    "LWF",
    ["SS", "AMF"],
    "epic_booster",
    "Prolific Winger",
    "Technique +2",
    91,
    68,
    { ballControl: 89, dribbling: 91, tightPossession: 89, acceleration: 88, speed: 84, finishing: 81, balance: 90, curl: 85 },
    [8, 4, 9, 10, 8, 0, 0, 0]
  ),
  makeCard(
    "cruyff-epic",
    "J. Cruyff",
    "FC Barcelona / Netherlands",
    "SS",
    ["AMF", "CF", "LWF"],
    "epic_booster",
    "Hole Player",
    "Ball-carrying +2",
    91,
    66,
    { offensiveAwareness: 86, ballControl: 88, dribbling: 87, tightPossession: 88, lowPass: 82, finishing: 80, acceleration: 86, balance: 88 },
    [8, 5, 8, 10, 8, 0, 0, 0]
  ),
  makeCard(
    "ronaldinho-epic",
    "Ronaldinho Gaúcho",
    "FC Barcelona / Brazil",
    "LWF",
    ["AMF", "SS"],
    "epic_booster",
    "Prolific Winger",
    "Fantasia +2",
    91,
    66,
    { ballControl: 90, dribbling: 91, tightPossession: 90, lowPass: 83, acceleration: 86, balance: 89, kickingPower: 82, curl: 86 },
    [7, 5, 9, 9, 9, 0, 0, 0]
  ),
  makeCard(
    "hoeness-epic",
    "U. Hoeneß",
    "FC Bayern / Germany",
    "AMF",
    ["SS", "RWF", "RMF" as PitchPosition],
    "epic_booster",
    "Hole Player",
    "Blitz / Agility +2",
    90,
    68,
    { offensiveAwareness: 83, dribbling: 84, speed: 88, acceleration: 88, physicalContact: 82, finishing: 80, stamina: 85 },
    [8, 5, 8, 9, 9, 3, 0, 0]
  ),
  makeCard(
    "bellingham-st",
    "J. Bellingham (ST)",
    "Real Madrid / England",
    "AMF",
    ["CMF"],
    "show_time",
    "Hole Player",
    "Momentum Dribbling +2",
    90,
    66,
    { offensiveAwareness: 83, ballControl: 85, dribbling: 84, lowPass: 82, finishing: 80, speed: 82, stamina: 87, physicalContact: 81 },
    [7, 6, 8, 8, 9, 3, 0, 0]
  ),
  makeCard(
    "vieira-epic",
    "P. Vieira",
    "Arsenal / France",
    "DMF",
    ["CMF", "CB"],
    "epic_booster",
    "Anchor Man",
    "Duelling +2",
    91,
    66,
    { defensiveAwareness: 85, tackling: 87, aggression: 88, defensiveEngagement: 87, speed: 82, acceleration: 79, physicalContact: 88, stamina: 87, lowPass: 78 },
    [0, 4, 4, 6, 8, 6, 12, 0]
  ),
  makeCard(
    "rijkaard-epic",
    "F. Rijkaard",
    "AC Milan / Netherlands",
    "DMF",
    ["CB", "CMF"],
    "epic_booster",
    "Anchor Man",
    "Shutdown +2",
    91,
    66,
    { defensiveAwareness: 86, tackling: 86, defensiveEngagement: 85, lowPass: 82, loftedPass: 81, physicalContact: 86, speed: 79, stamina: 84 },
    [0, 5, 4, 6, 8, 6, 11, 0]
  ),
  makeCard(
    "pirlo-epic",
    "A. Pirlo",
    "AC Milan / Italy",
    "CMF",
    ["DMF", "AMF"],
    "epic_booster",
    "Orchestrator",
    "Passing +2",
    90,
    68,
    { ballControl: 88, tightPossession: 88, lowPass: 91, loftedPass: 92, setPiece: 90, curl: 89, balance: 85, defensiveEngagement: 78, stamina: 84 },
    [3, 8, 8, 8, 9, 0, 7, 0]
  ),
  makeCard(
    "seedorf-epic",
    "C. Seedorf",
    "AC Milan / Netherlands",
    "CMF",
    ["AMF", "DMF"],
    "epic_booster",
    "Box-to-Box",
    "Hard Worker +2",
    90,
    66,
    { ballControl: 85, dribbling: 84, lowPass: 84, kickingPower: 88, speed: 82, physicalContact: 84, balance: 85, stamina: 88, defensiveEngagement: 80 },
    [4, 7, 7, 7, 9, 4, 6, 0]
  ),
  makeCard(
    "davids-epic",
    "E. Davids",
    "Juventus / Netherlands",
    "DMF",
    ["CMF"],
    "epic_booster",
    "Destroyer",
    "Aggression +2",
    90,
    66,
    { defensiveAwareness: 84, tackling: 86, aggression: 92, defensiveEngagement: 90, speed: 83, acceleration: 84, balance: 86, stamina: 90 },
    [0, 5, 5, 7, 8, 5, 11, 0]
  ),
  makeCard(
    "maldini-epic",
    "P. Maldini",
    "AC Milan / Italy",
    "CB",
    ["LB"],
    "epic_booster",
    "Defensive Full-back",
    "Shutdown +2",
    91,
    66,
    { defensiveAwareness: 89, tackling: 89, aggression: 84, defensiveEngagement: 88, speed: 82, acceleration: 80, jumping: 84, physicalContact: 84, stamina: 85 },
    [0, 0, 0, 7, 9, 7, 12, 0]
  ),
  makeCard(
    "araujo-bt",
    "R. Araújo (Big Time)",
    "FC Barcelona / Uruguay",
    "CB",
    ["RB"],
    "big_time",
    "Defensive Full-back",
    "Physical +3",
    90,
    68,
    { defensiveAwareness: 86, tackling: 87, aggression: 87, defensiveEngagement: 87, speed: 86, acceleration: 84, jumping: 88, physicalContact: 88 },
    [0, 0, 0, 7, 8, 8, 12, 0]
  ),
  makeCard(
    "thuram-epic",
    "L. Thuram",
    "Juventus / France",
    "RB",
    ["CB"],
    "epic_booster",
    "Defensive Full-back",
    "Defending +2",
    91,
    66,
    { defensiveAwareness: 88, tackling: 88, defensiveEngagement: 89, speed: 86, acceleration: 85, jumping: 86, physicalContact: 85, stamina: 88 },
    [0, 0, 0, 8, 9, 7, 11, 0]
  ),
  makeCard(
    "costacurta-epic",
    "A. Costacurta",
    "AC Milan / Italy",
    "LB",
    ["RB", "CB"],
    "epic_booster",
    "Defensive Full-back",
    "Defending +2",
    90,
    66,
    { defensiveAwareness: 87, tackling: 87, defensiveEngagement: 88, speed: 81, acceleration: 80, stamina: 85, physicalContact: 82 },
    [0, 0, 0, 8, 9, 6, 12, 0]
  ),
  makeCard(
    "carlos-epic",
    "Roberto Carlos",
    "Real Madrid / Brazil",
    "LB",
    [],
    "epic_booster",
    "Offensive Full-back",
    "Free-kick +2",
    90,
    66,
    { speed: 89, acceleration: 89, kickingPower: 92, curl: 89, loftedPass: 82, stamina: 89, defensiveEngagement: 78, tackling: 77 },
    [2, 6, 6, 8, 9, 4, 8, 0]
  ),
  makeCard(
    "nesta-epic",
    "A. Nesta",
    "AC Milan / Italy",
    "CB",
    [],
    "epic_booster",
    "Destroyer",
    "Fortress +2",
    91,
    66,
    { defensiveAwareness: 89, tackling: 90, aggression: 88, defensiveEngagement: 88, speed: 80, jumping: 86, physicalContact: 86 },
    [0, 0, 0, 7, 8, 8, 12, 0]
  ),
  makeCard(
    "saliba-st",
    "W. Saliba (Show Time)",
    "Arsenal / France",
    "CB",
    [],
    "show_time",
    "Build Up",
    "Fortress +2",
    90,
    66,
    { defensiveAwareness: 86, tackling: 87, defensiveEngagement: 86, speed: 84, acceleration: 80, physicalContact: 85, jumping: 83 },
    [0, 0, 0, 7, 8, 8, 12, 0]
  ),
  makeCard(
    "schmeichel-epic",
    "P. Schmeichel",
    "Man Utd / Denmark",
    "GK",
    [],
    "epic_booster",
    "Defensive Goalkeeper",
    "Goalkeeping +2",
    91,
    64,
    { gkAwareness: 86, gkCatching: 83, gkReflexes: 87, jumping: 82, physicalContact: 84 },
    [0, 0, 0, 0, 0, 4, 0, 12]
  ),
  makeCard(
    "cech-epic",
    "P. Čech",
    "Chelsea / Czechia",
    "GK",
    [],
    "epic_booster",
    "Defensive Goalkeeper",
    "Saving +2",
    91,
    64,
    { gkAwareness: 86, gkCatching: 84, gkReflexes: 86, jumping: 80 },
    [0, 0, 0, 0, 0, 4, 0, 12]
  ),
];

/** Authentic eFootball progression point cost: 1pt (1-4), 2pts (5-8), 3pts (9-12), 4pts (13+) */
export function calcCategoryPointCost(levels: number): number {
  let cost = 0;
  for (let i = 1; i <= levels; i++) {
    if (i <= 4) cost += 1;
    else if (i <= 8) cost += 2;
    else if (i <= 12) cost += 3;
    else cost += 4;
  }
  return cost;
}

export function computeAllocatedStats(
  player: MetaPlayerCard,
  alloc: [number, number, number, number, number, number, number, number],
  managerBoostOn: boolean,
  secondBoosterId: string
) {
  const [shoot, pass, drib, dex, lbs, aer, def, gk] = alloc;
  const mgr = managerBoostOn ? 2 : 0;
  const sec = SECOND_BOOSTERS.find((b) => b.id === secondBoosterId);

  const raw = {
    offensiveAwareness: player.baseStats.offensiveAwareness + dex + mgr,
    ballControl: player.baseStats.ballControl + drib + mgr,
    dribbling: player.baseStats.dribbling + drib + mgr,
    tightPossession: player.baseStats.tightPossession + drib + mgr,
    lowPass: player.baseStats.lowPass + pass + mgr,
    loftedPass: player.baseStats.loftedPass + pass + mgr,
    finishing: player.baseStats.finishing + shoot + mgr,
    heading: player.baseStats.heading + aer + mgr,
    setPiece: player.baseStats.setPiece + shoot + mgr,
    curl: player.baseStats.curl + shoot + mgr,
    defensiveAwareness: player.baseStats.defensiveAwareness + def + mgr,
    tackling: player.baseStats.tackling + def + mgr,
    aggression: player.baseStats.aggression + def + mgr,
    defensiveEngagement: player.baseStats.defensiveEngagement + def + mgr,
    speed: player.baseStats.speed + lbs + mgr,
    acceleration: player.baseStats.acceleration + dex + mgr,
    kickingPower: player.baseStats.kickingPower + lbs + mgr,
    jumping: player.baseStats.jumping + aer + mgr,
    physicalContact: player.baseStats.physicalContact + aer + mgr,
    balance: player.baseStats.balance + dex + mgr,
    stamina: player.baseStats.stamina + lbs + mgr,
    gkAwareness: player.baseStats.gkAwareness + gk + mgr,
    gkCatching: player.baseStats.gkCatching + gk + mgr,
    gkReflexes: player.baseStats.gkReflexes + gk + mgr,
  };

  if (sec) {
    sec.keys.forEach((k) => {
      raw[k] += 1;
    });
  }

  // Clamp 40..103
  (Object.keys(raw) as Array<keyof typeof raw>).forEach((k) => {
    raw[k] = Math.min(103, Math.max(40, raw[k]));
  });

  const usedPoints = alloc.reduce((acc, lvl) => acc + calcCategoryPointCost(lvl), 0);
  const progressRatio = Math.min(1, usedPoints / Math.max(1, player.maxPoints));
  const boostedOvr =
    player.baseOvr +
    Math.round(progressRatio * 10) +
    (managerBoostOn ? 3 : 0) +
    (secondBoosterId ? 1 : 0);

  return {
    stats: raw,
    usedPoints,
    remainingPoints: player.maxPoints - usedPoints,
    boostedOvr: Math.min(107, boostedOvr),
  };
}
