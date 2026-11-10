import { NewsArticle, NewsCategory } from "@/types/database";

export function getCategoryLabel(category: NewsCategory | string) {
  switch (category) {
    case "scammer_alert":
      return {
        label: "Safety Advisory",
        color: "bg-sx-red-tint border-sx-red-border text-sx-red-text",
      };
    case "escrow_guide":
      return {
        label: "Verification & Escrow",
        color: "bg-sx-green-tint border-sx-green-border text-sx-green-text",
      };
    case "efootball_news":
      return {
        label: "Meta & Tactics",
        color: "bg-sx-stone border-sx-border-strong text-sx-ink",
      };
    case "announcement":
    case "update":
      return {
        label: "Platform Update",
        color: "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text",
      };
    default:
      return {
        label: "Editorial Guide",
        color: "bg-sx-stone border-sx-border text-sx-ink",
      };
  }
}

export const EDITORIAL_GUIDES: NewsArticle[] = [
  {
    id: "guide-team-playstyles-meta-2026",
    title: "eFootball 2026 Team Playstyles Compared: Quick Counter, Long Ball Counter & Possession Game",
    slug: "efootball-2026-team-playstyles-meta-guide",
    category: "efootball_news",
    summary:
      "A mechanical breakdown of defensive line height, compactness, support range, and stamina drain across Quick Counter, Long Ball Counter, Possession Game, Out Wide, and Long Ball in eFootball 2026.",
    content: `## Why Team Playstyle Dictates 70% of Your Match Behavior

In eFootball 2026, your chosen Team Playstyle does far more than boost squad stats when paired with an 88-proficiency manager. Under the hood, Team Playstyle hard-codes four tactical parameters that players can no longer adjust with manual sliders: defensive line height during settled play, defensive line drop timing after losing possession, attacking support spacing, and forward run trigger frequency.

Many Division 2 and Division 3 players blame their defenders' Speed stats when conceding chipped through balls, when the actual culprit is running a ultra-high Quick Counter defensive line without an Anchor Man or Defensive fullback to cover the space behind. Understanding the exact trade-offs of each system lets you build a squad—and a sub-tactic—that survives all 90 minutes.

## Quick Counter: High-Octane Pressing and Vertical Runs

Quick Counter remains the most aggressive transition playstyle in competitive eFootball. The moment your team wins possession, Goal Poachers, Hole Players, and Roaming Flanks sprint vertically into half-spaces before the opponent's back four can reset.

1. Defensive Line Behavior: Holds the highest defensive line in the game (roughly the halfway line when in settled possession) and triggers immediate counter-pressing for 3 to 4 seconds after a turnover.
2. Stamina Cost: Heavy. Midfielders with Box-to-Box or Destroyer playstyles routinely hit red stamina by the 68th minute unless they carry 88+ Stamina and Fighting Spirit.
3. Ideal Formations: 4-2-1-3 (narrow with two SS/CF hybrids and one wide winger), 4-1-2-3, and 4-2-2-2 with dual AMF Hole Players.
4. Mandatory Squad Profile: Centre-backs need at least 84+ Speed and 82+ Acceleration to recover against lofted passes over the top, paired with an Offensive Goalkeeper who sweeps outside the penalty box.

## Long Ball Counter: Compact Low Block for Division 1 Consistency

Despite its name, Long Ball Counter does not force you to hoof long clearances. Instead, it combines the deepest, most compact defensive block in eFootball with immediate forward runs once you win the ball back near your own 18-yard box.

1. Defensive Line Behavior: Instead of stepping up to press after losing the ball, your back four immediately drops toward your own penalty arc, denying space in behind against Mbappé, Owen, Rumme, or Eto'o cards.
2. Spacing Caveat: Because the defensive block sits deep while forwards sprint ahead on turnovers, a large gap can open between your DMF and AMF if you rush passes through central congestion.
3. Ideal Formations: 4-2-2-2 (two DMFs—one Anchor Man, one Orchestrator—behind two creative AMFs and two CFs) or 4-3-1-2 narrow diamond.
4. Goalkeeper Pairing: Defensive Goalkeepers (such as Courtois, Cech, or Schmeichel profiles) excel here because shots come from sharper angles rather than 1v1 breakaways from the halfway line.

## Possession Game: Patient Overload and Triangle Support

Possession Game instructs teammates to check toward the ball carrier rather than sprinting away from them, creating short passing triangles across midfield.

1. Attacking Movement: Forwards rarely make blind runs behind the back line unless triggered manually with Pass-and-Run (flicking after passing) or unless you deploy a dedicated Goal Poacher and Hole Player to break static lines.
2. Defensive Line Risk: Nearly as high as Quick Counter, but with slightly less aggressive immediate pressing—meaning slow Build Up centre-backs can get caught flat-footed if you lose the ball on a careless square pass in midfield.
3. Who Should Use It: Players on low-ping fiber connections who enjoy 60%+ ball retention, Double Touch combinations around the box, and patient cutbacks rather than three-pass transitions.

## Out Wide and Sub-Tactic Switching Mid-Match

Out Wide stretches play to both touchlines, instructing opposite-side wingers and fullbacks to crash the far post when a cross is loaded. While pure Out Wide struggles centrally against compact two-DMF blocks, pairing a Dual-Proficiency Manager (for example, an 88 Quick Counter / 88 Long Ball Counter or 88 Possession / 88 Quick Counter tactician) unlocks the strongest competitive adjustment in eFootball:

- Start matches in Quick Counter or Possession Game to press opponents early and test their composure under pressure.
- Switch to your Sub-Tactic set to Long Ball Counter after taking a two-goal lead or entering the 70th minute, dropping your defensive line automatically while keeping full +3 manager stat boosts across your entire squad.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-hero-banner.jpg",
    is_pinned: true,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-28T09:00:00.000Z",
    updated_at: "2026-11-05T09:00:00.000Z",
  },
  {
    id: "guide-booster-managers-88-breakpoints",
    title: "How 88+ Manager Proficiency & Stat Boosters Work in eFootball 2026 (Exact +2 and +3 Breakpoints)",
    slug: "booster-managers-88-proficiency-stat-breakpoints",
    category: "efootball_news",
    summary:
      "Learn the exact attribute thresholds where an 88-proficiency manager upgrades player stats from +2 to +3, how Manager Boosters stack with Epic Double Boosters, and how to save progression points.",
    content: `## Why Manager Proficiency Changed Squad Building Forever

When Konami raised flagship Manager Team Playstyle proficiency from 85 to 88—and later introduced single-stat and dual-stat Booster Managers—custom player builds changed overnight. An 88-proficiency manager does not give a flat +3 bonus to every attribute on a card. Instead, eFootball calculates the manager bonus proportionally based on each raw attribute's base + progression value (after card boosters are applied, depending on booster order).

Knowing the exact numerical breakpoint where an attribute jumps from +2 to +3 lets you stop investing expensive progression points one notch early and reallocate 4 to 8 saved points into Stamina, Balance, or Weak Foot support stats.

## Exact Stat Breakpoints Under an 88-Proficiency Manager

When your active Team Playstyle matches an 88-proficiency manager (and every starter stands in a valid familiarity position), attributes scale according to three tiers:

1. Attributes at 39 to 56: Receive +1 in-game squad boost.
2. Attributes at 57 to 84: Receive +2 in-game squad boost.
3. Attributes at 85 to 99: Receive +3 in-game squad boost (capped at 99 on the squad sheet).

Compare that against older 85-proficiency GP managers, where a player needed 88 in a raw stat before receiving the +3 jump! Under an 88-proficiency manager, hitting **85** is the magic threshold across every card you train:

- A midfielder trained to **85 Low Pass** automatically jumps to **88 Low Pass** on the pitch.
- A striker trained to **85 Finishing** and **85 Offensive Awareness** reaches **88** in both categories without paying 3 progression points per level for levels 9 through 12.
- Raising any attribute above **96** before manager boosts wastes points if an 88 manager already pushes 96 straight to the **99** ceiling.

## How Manager Stat Boosters (+1 Speed, Acceleration, or Finishing) Stack

Booster Managers carry an additional passive +1 (or two separate +1s on Double-Booster Managers) to specific attributes such as Speed, Acceleration, Tight Possession, Physical Contact, or Lofted Pass.

Here is the critical calculation rule: a Manager's +1 stat booster applies **on top of** the 88-proficiency bonus, up to the hard attribute cap of 99.

1. Suppose a winger has **84 Acceleration** after player progression.
2. With a standard 88-proficiency manager (no Acceleration booster), 84 falls just short of the 85 threshold, so it receives +2 and lands at **86 Acceleration**.
3. With an **88-proficiency +1 Acceleration Booster Manager**, that player receives the proficiency boost plus the +1 manager stat booster—pushing threshold builds cleanly to **88** or turning an **85** raw stat into **89** (85 + 3 proficiency + 1 manager booster)!

## Practical Progression Rules Before Resetting Your Squad

Before spending GP on progression resets (or during free progression reset campaigns), audit your starting XI with these four checkpoints:

1. Never leave key technical stats at **84**: Find 1 or 2 progression points elsewhere to hit **85**, converting a +2 manager bonus into a +3 bonus—essentially buying two stat points for the price of one level.
2. Never train a stat to **97, 98, or 99** raw: Under an 88 manager, **96** already hits **99** (and **95** hits **99** if your manager also holds the matching +1 attribute booster).
3. Account for Epic Card Boosters first: On Epic and Show Time cards with active +2/+3 slot boosters, verify whether the card booster already lifts a stat from 83 to 85 before committing extra progression points.
4. Keep both Main and Sub-Tactic at 88 if switching playstyles: If your manager has 88 Quick Counter and only 75 Long Ball Counter, switching to Long Ball Counter mid-match strips away your +3 squad boosts and tanks pass accuracy. Always pair dual-88 managers when running two playstyles.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-cat-epic.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-25T10:00:00.000Z",
    updated_at: "2026-11-04T10:00:00.000Z",
  },
  {
    id: "guide-custom-player-progression-builds",
    title: "Why Auto-Allocate Hurts Your Squad: Custom Progression Point Builds by Position",
    slug: "custom-player-progression-builds-guide",
    category: "efootball_news",
    summary:
      "Auto-Allocate optimizes exclusively for headline Overall Rating (OVR), often wasting 8 to 14 progression points. Here is how to build Goal Poachers, Hole Players, Anchor Men, and Centre-Backs for real match performance.",
    content: `## The Overall Rating (OVR) Illusion in eFootball

Tapping "Recommended / Auto-Allocate" on a newly packed Epic, Highlight, or POTW-style trainable card produces the highest possible Overall Rating number on your squad screen—say, 103 instead of 101. Unfortunately, eFootball's Overall Rating formula weights position-specific attributes regardless of how diminishing progression costs work.

Every progression category (Shooting, Passing, Dribbling, Dexterity, Lower Body Strength, Aerial Strength, Defending) scales in cost every four levels:

- Levels 1 to 4: Cost **1 point** per level (4 points total)
- Levels 5 to 8: Cost **2 points** per level (8 points total — 12 cumulative)
- Levels 9 to 12: Cost **3 points** per level (12 points total — 24 cumulative)
- Levels 13 to 16: Cost **4 points** per level (16 points total — 40 cumulative)

When Auto-Allocate pushes a striker's Shooting or Dexterity from Level 12 to Level 15, those final three ticks cost **12 progression points**—enough to raise Passing from 0 to Level 6 AND Dribbling by 3 levels! Worse still, Overall Rating has zero direct effect on gameplay physics; the match engine reads only the 22 individual attributes and player skills.

## Blueprint 1: Goal Poacher / Fox in the Box (CF)

A meta striker needs explosive first-step separation, clean ball control under centre-back contact, and reliable finishing angles—not inflated Heading if they are 176 cm tall.

1. Shooting (Target 88–90 Finishing after manager boost): Usually 7 to 9 levels. Once Finishing hits 90+ in-game, curl and shot power matter more than pushing Finishing from 92 to 95.
2. Dribbling (Target 85+ Ball Control & Tight Possession): Never leave a CF at 76 Tight Possession just to hit 102 OVR. Raising Dribbling to 8–10 levels stops heavy first touches inside crowded penalty boxes.
3. Dexterity (Target 90+ Offensive Awareness & Acceleration): Acceleration governs the first 5–8 meters of a burst onto a through ball—prioritize it slightly ahead of top-end Speed for penalty-box strikers.
4. Lower Body Strength (Target 88+ Speed & 85+ Kicking Power): Kicking Power determines shot velocity from the edge of the area; low Kicking Power makes even 94 Finishing easy for tall keepers to parry.
5. Aerial / Physical Contact: Invest 4 cheap points into Aerial Strength even on nimble strikers so Physical Contact reaches 75–80, preventing instant shoulder-barge dispossessions.

## Blueprint 2: Hole Player / Creative Playmaker (AMF & SS)

AMFs touch the ball under 360-degree midfield pressure and arrive late for second-wave finishes.

1. Dribbling (88–92 Tight Possession & Dribbling): Tight Possession controls turn radius when holding left-stick micro-dribbles without sprint.
2. Passing (85–88 Low Pass): Hit the 85 raw breakpoint so an 88 manager pushes Low Pass to 88; combine with One-Touch Pass and Through Passing skills rather than overspending to 94 pass stats.
3. Lower Body Strength (85+ Speed & 84+ Stamina): AMFs cover the most ground in Quick Counter and Long Ball Counter; aim for at least 85 in-game Stamina.
4. Shooting (80–85 Finishing): Even 4 to 6 levels into Shooting transforms wasted cutback chances into reliable low driven goals.

## Blueprint 3: Anchor Man (DMF) & Build Up / Destroyer (CB)

Auto-Allocate frequently dumps 14 to 16 levels into Defending while leaving centre-backs with 73 Speed and 68 Acceleration—fatal against Division 1 counter-attacks.

1. Cap Defending at 10–12 levels on elite Epic/Highlight CBs if Defensive Awareness and Tackling already hit 92–95 after manager boosts.
2. Reallocate those saved 8–12 points into **Lower Body Strength (Speed 84–88)** and **Dexterity (Acceleration 78–83)**. A CB with 93 Defensive Awareness and 86 Speed recovers far more breakaways than a CB with 99 Defensive Awareness and 75 Speed.
3. On Anchor Man DMFs, invest 4 levels into Passing and 4 levels into Dribbling so your pivot does not gift immediate turnovers when pressed after winning a header.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-cat-mobile.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-22T11:00:00.000Z",
    updated_at: "2026-11-03T11:00:00.000Z",
  },
  {
    id: "guide-player-skills-legacy-transfer",
    title: "Best Additional Player Skills by Position & Zero-Waste Raquel Lombardo Legacy Transfer Guide",
    slug: "essential-player-skills-legacy-transfer-guide",
    category: "efootball_news",
    summary:
      "Never roll Skill Training Programs directly on Epic or Highlight cards. Learn how to use 0-GP Standard players and Legacy Transfer to build custom 5-skill loadouts without overwriting slots.",
    content: `## Why Rolling Skill Tokens Directly Wastes Months of Rewards

Every trainable Standard, Highlight, Show Time, Big Time, and Epic player in eFootball 2026 has five empty **Additional Skill** slots alongside their default base skills. However, when you apply a Skill Training Program directly onto a flagship player:

1. The game rolls completely at random from dozens of skills—and **cannot roll a skill the card already owns**, EXCEPT it can roll useless positional mismatches like Sombrero on a Centre-Back or Long Throw on a Striker.
2. Once all five Additional Skill slots are full, using a token directly forces you to overwrite an existing Additional Skill at random, risking the loss of a rare roll like Double Touch or Blocker.

The community-standard **Dummy Player Legacy Transfer** method eliminates random slot waste completely in exchange for GP.

## Step-by-Step: The 0-GP Raquel Lombardo Legacy Transfer Method

To bank every single Skill Training Program cleanly so zero tokens ever go to waste:

1. Open **Contract -> Standard Player List**, filter by **Price: Lowest**, and sign multiple copies of a **0-GP Free Agent** carrying zero base skills (such as **Raquel Lombardo** or similar 50-OVR outfield players with an empty base skill sheet).
2. Apply **exactly ONE** Skill Training Program to each fresh 0-GP dummy card. Because the dummy player has zero base skills and zero filled slots, nothing is ever overwritten.
3. Lock and rename or tag your dummy players by skill (or review them in My Team -> Players) until you collect the exact five skills your star card needs.
4. Select your target star player -> **Legacy Transfer**, and pick the 0-GP dummy card carrying the exact skill you want (costs roughly **257,000 GP** for a single-skill transfer).
5. Advanced GP-Saving Tip: If you want to transfer multiple skills onto the *same* target player in one go and check total GP math first, compare single transfers vs chaining—single 1-skill transfers at ~257,000 GP each give you clean, modular control without locking incompatible skill bundles together.

## Priority 5-Skill Loadouts by Position

### Strikers (CF / Goal Poacher / Deep-Lying Forward)
- **Double Touch** (combine with **Sole Control** + **Flip Flap** to unlock the fast, tight-angle **Level 3 Ball Roll Double Touch** animation!)
- **One-Touch Pass** (essential for instant 1-2 wall passes with your AMF or strike partner)
- **First-Time Shot** (prevents awkward extra touches on low crosses and rebounds)
- **Long-Range Curler** or **Long-Range Shooting** (unlocks high-accuracy finesse and driven finishes from 20 yards)
- **Fighting Spirit** (reduces shot accuracy penalties under physical pressure and low stamina—or **Super-Sub** if used strictly off the bench after halftime)

### Attacking & Central Midfielders (AMF / CMF)
- **One-Touch Pass** & **Through Passing** (Through Passing adds roughly a +15–20% curl/accuracy assist on threaded passes past defenders' hips)
- **Double Touch** & **Sole Control**
- **Interception** or **Track Back** (gives creative playmakers bite during high counter-pressing)

### Defensive Midfielders & Defenders (DMF / CB / Defensive FB)
- **Blocker** (triggers automated outstretched-leg lunge animations against shots and cutbacks—mandatory on every defender and DMF)
- **Interception** (widens the auto-reach radius during Match-Up)
- **Man Marking** (keeps AI defenders glued to runners inside the box)
- **Aerial Superiority** (boosts jump duel win rates against tall Target Men and corner routines)
- **One-Touch Pass** or **Weighted Pass** (cleans up first-time clearances and outlet balls under press)`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-cat-console.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-19T12:00:00.000Z",
    updated_at: "2026-11-02T12:00:00.000Z",
  },
  {
    id: "guide-condition-ratings-permanent-b-form",
    title: "Live Update Condition Ratings (A–E) vs Permanent B Form: Pre-Match Arrows Explained",
    slug: "live-update-condition-ratings-permanent-b-form",
    category: "efootball_news",
    summary:
      "How Thursday Live Update ratings (A through E) interact with Unwavering, Standard, and Inconsistent player form to determine pre-match Condition Arrows—and why Epic cards hold Permanent B condition.",
    content: `## Two Separate Systems: Form Type vs Weekly Live Update Rating

New and intermediate eFootball players frequently confuse a player's permanent **Form** trait (Unwavering, Standard, or Inconsistent) with their weekly **Live Update Condition Rating** (A, B, C, D, or E, refreshed during Thursday maintenance based on real-world weekend league performances).

Before every PvP or AI match kicks off, the match engine combines **both** values to roll one of five pre-match **Condition Arrows** for each starter and substitute:

- **Top Arrow (Cyan / Up ↗↑)**: Significant across-the-board boost to technical and physical attributes (roughly +6% to +9% across outfield stats, often +2 to +4 points per attribute even near high tiers).
- **Good Arrow (Green / Diagonal Up ↗)**: Moderate stat bonus (+1 to +2 across core attributes).
- **Normal Arrow (Yellow / Horizontal →)**: Zero penalty, zero bonus—the player performs at exact squad-sheet numbers.
- **Poor Arrow (Orange / Diagonal Down ↘)**: Noticeable penalty (-4% to -6% across stats and faster stamina drain).
- **Terrible Arrow (Red / Down ↓)**: Severe penalty (-9% to -12% across speed, passing, finishing, and defensive awareness—virtually unplayable in Division 1).

## How A, B, C, D & E Ratings Control Arrow Probabilities

1. **A Rating**: Eliminates downward orange and red arrows completely! Even players with Standard form roll exclusively Normal (→), Diagonal Up (↗), or Top Up (↑) arrows, with Top Up triggering in roughly 35% to 45% of matches.
2. **B Rating**: Also **eliminates downward orange and red arrows completely** on Unwavering and Standard form players! You are guaranteed at worst a Horizontal Normal (→) arrow every single match, with frequent Green (↗) and Cyan (↑) rolls.
3. **C Rating (Default / Off-Season / International Break)**: Here your card's **Form trait** matters enormously:
   - **Unwavering + C**: Very rare downward arrows; overwhelmingly Normal (→) or Green (↗).
   - **Standard + C**: Roughly 15–20% risk of rolling an Orange (↘) or Red (↓) arrow, forcing you to carry bench cover.
   - **Inconsistent + C**: High variance—capable of rolling Top Cyan (↑) frequently, yet equally likely to roll Red (↓). Ironically, **Inconsistent + B or A** is prized on Super-Subs because B/A removes the downward arrows while preserving higher Top-Arrow spikes!
4. **D and E Ratings**: Heavily weighted toward Orange (↘) and Red (↓) arrows. Unless a card is irreplaceable and happens to roll Horizontal in the pre-match lobby, rotate D/E cards out of your matchday 23 until next Thursday's update.

## Why Epic, Big Time & Legendary Cards Dominate Squad Depth

Every **Epic**, **Big Time**, and **Legendary** card—along with select **Show Time** releases depending on Konami's seasonal series rules—carries a **Permanent B Live Update Rating** 365 days a year, regardless of club off-seasons, injuries, or retirement.

In practical squad building, fielding 6 to 8 Permanent-B starters shrinks the number of bench slots you need for injury/arrow insurance. Instead of carrying three spare Centre-Backs in case C-rated defenders roll downward arrows, two Permanent-B Centre-Backs let you pack your bench with specialized **Super-Sub** wingers, physical target strikers, and tactical midfield closers.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-cat-epic.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-16T09:30:00.000Z",
    updated_at: "2026-11-01T09:30:00.000Z",
  },
  {
    id: "guide-division-1-defending-instructions",
    title: "Climbing to eFootball League Division 1: Match-Up Timing, Defensive Line Discipline & Individual Instructions",
    slug: "division-1-defending-match-up-individual-instructions",
    category: "efootball_news",
    summary:
      "Breaking past the 1,700–1,800 rating wall into Division 1 comes down to defensive restraint, Semi-Assisted cursor switching, and smart Individual Instructions rather than blind Dash-Pressing.",
    content: `## Why Most Players Stall at Division 2 (1,650–1,780 Rating)

Watch any Division 3 vs Division 1 replay and the sharpest difference is not attacking skill moves—it is **what happens in the first two seconds after losing possession**. Lower-division players hold **Dash + Press** continuously with their Centre-Backs, dragging one defender out of the back four and opening a straight passing lane for Goal Poachers to run into.

Consistent Division 1 players defend **passing lanes first and the ball carrier second**, letting their defensive structure compress space until the opponent takes a heavy touch.

## Mastering Match-Up vs Dash Tracking

1. **Never hold Match-Up while sprinting full-distance in open space**: Holding Match-Up drops your player into a wide-stance jockey with slower top speed. Use **Dash** alone to sprint back toward your own goal along the runner's inside shoulder, then tap/hold **Match-Up** only at the exact moment the passer winds up their foot.
2. **Defend with your DMF and CMFs—leave your CBs in line**: Manually select your Anchor Man or Box-to-Box midfielder using right-stick player switching (or swipe cursor directional switching on Mobile) and drag them backward into the central pocket in front of your two Centre-Backs. Only switch onto a CB to track a manual deep run or block an imminent shot.
3. **Semi-Assisted Cursor Change**: Switch Cursor Change from *Assisted* to **Semi-Assisted** in controller/touch settings. Assisted auto-switches your active defender on lofted balls and rebounds, often causing accidental directional inputs that pull your last defender the wrong way.

## High-Impact Individual Instructions That Fix Formation Flaws

Game Plan -> **Individual Instructions** gives you two Attacking slots and two Defensive slots. Used surgically, they solve 90% of structural counter-attack goals:

1. **Defensive (Attacking Slot 1) on an Offensive Fullback**: If you lack a natural Defensive Fullback card (such as Costacurta, Tomiyasu, Araujo, or Wan-Bissaka profiles), placing **Defensive** on one fullback transforms your back four into an asymmetric back-three in buildup, stopping 2v2 counter-attacks down the channels.
2. **Anchored (Attacking Slot 2) on your DMF or Central AMF**: Prevents a central pivot from drifting out to the touchline to chase triangular overlaps, keeping the middle of the pitch locked.
3. **Deep Line (Defensive Slot 1) vs Tight Marking**:
   - **Deep Line** on a tall, fast DMF instructs them to drop directly between your two CBs out of possession, creating a temporary 5-at-the-back or 3-CB shield against two-CF narrow formations (4-2-2-2 / 4-3-1-2).
   - **Tight Marking** works best against isolated lone wingers or lone target men—avoid putting **Man Marking** on both opposition CFs if they use Deep-Lying Forwards, or your CBs will follow them to the halfway line and leave craters behind!
4. **Counter Target on an Aging or Low-Stamina Classic No. 10 / SS**: Keeps one elite finisher (such as Messi, Gullit, or Romário profiles) hovering in dangerous transition pockets with full green stamina in the 85th minute.

## Kick-Off Glitch & Stoppage-Time Management

During kick-offs (0', 45', and immediately after scoring), AI defensive awareness briefly lags while forward lines remain compact:

- Immediately flick **Attack/Defense Level down one notch (Blue 1)** before the opponent kicks off, manually select your **DMF or fastest CB**, and sprint straight back 10 yards toward your penalty spot to head away any lofted kick-off chip—then return to balanced level once play settles.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-hero-banner.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-13T14:00:00.000Z",
    updated_at: "2026-10-31T14:00:00.000Z",
  },
  {
    id: "guide-mobile-60fps-ping-kenya",
    title: "Optimizing eFootball Mobile for Locked 60 FPS & Stable Ping on Safaricom 4G/5G and Fiber in Kenya",
    slug: "efootball-mobile-60fps-ping-optimization-kenya",
    category: "efootball_news",
    summary:
      "Input delay in Kenyan online matches comes from two separate bottlenecks: local frame-time throttling and wireless packet jitter. Here are the exact graphics and network settings for smooth matches.",
    content: `## Frame Rate vs Visual Presets: Why Standard + 60 FPS Wins Matches

On eFootball Mobile (Android and iOS), touch input polling and pass-power bar responsiveness are tied directly to frame pacing. At **30 FPS**, each frame takes **33.3 milliseconds** to render; at **60 FPS**, frame time drops in half to **16.6 milliseconds**.

When players select **High Graphics + 60 FPS** on mid-range Snapdragon 7-series, Dimensity 7000/8000, Helio G99, or older iPhone devices, the phone plays smoothly for the first 25 in-game minutes—until battery temperature crosses ~41°C. Once thermal throttling kicks in during the second half, frame rates dip unpredictably between 38 and 52 FPS, causing delayed First-Time Shots and mistimed Double Touches.

### Recommended Competitive Graphics Setup (Title Screen -> Menu -> Graphics)
1. **Graphics**: Set to **Standard** (or **Low** during summer heat / tournament Best-of-3 series on mid-range Android devices). Standard keeps player models, pitch lines, and ball physics crisp while stripping away heavy crowd and stadium lighting shaders that overheat your GPU.
2. **Frame Rate**: Always lock to **60 fps**. Never trade 60 fps down to 30 fps for prettier stadium shadows.
3. **Device Prep Before Division Matches**: Disable Android Battery Saver / iOS Low Power Mode (both hard-cap display refresh or throttle CPU boost clocks), unplug fast-charging cables while playing (charging adds 4–7°C of battery heat), and close background WhatsApp media auto-downloads or TikTok processes.

## Reducing Online Input Lag & Jitter in Nairobi, Mombasa, Kisumu & Eldoret

eFootball Mobile uses regional cloud relay servers (primarily nearest African/Middle Eastern/European cloud nodes depending on matchmaking pool) rather than pure peer-to-peer hosting for Division matches, alongside room relays for Friend Match lobbies. What ruins responsiveness is rarely raw download speed—eFootball uses less than **15–25 MB per match**—it is **packet jitter** (ping spiking from 45 ms to 190 ms every few seconds).

1. **5 GHz Fiber Wi-Fi Beats 2.4 GHz Every Time**: If you play on Safaricom Home Fibre, Zuku, JTL Faiba, or Liquid Home, connect your phone strictly to the **5 GHz** SSID band and play within clear line-of-sight of the router. Legacy 2.4 GHz Wi-Fi suffers severe Bluetooth and apartment interference, causing micro-freezes followed by fast-forward speed-up lag.
2. **Safaricom 4G LTE vs 5G Stability Tip**: In areas where 5G signal sits at only 1–2 bars indoors, phones constantly hand over between 5G NSA and 4G LTE mid-match—creating a 1.5-second freeze right as an opponent enters your penalty box! Locking Preferred Network Type to **4G / LTE Only** during tournament games often delivers flatter, jitter-free frame pacing than weak indoor 5G.
3. **Matchmaking Search Area Setting**: Inside **eFootball League -> Matchmaking Settings**, choose **Search Nearby Area Only**. Widening matchmaking searches pairs you onto distant overseas relay servers (130 ms+ round-trip latency) where One-Touch Passes register half a second late. Only accept **4-bar or 5-bar antenna** pre-match connections during ranked Division climbs.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-cat-middleman.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-10T08:30:00.000Z",
    updated_at: "2026-10-30T08:30:00.000Z",
  },
  {
    id: "guide-unlink-verification",
    title: "How to Check If an eFootball Account Has Google Play or Game Center Linked",
    slug: "how-to-check-google-play-and-game-center-links-in-efootball",
    category: "escrow_guide",
    summary:
      "Before confirming any account purchase, buyers must verify that only a Konami ID is linked. Here is where to check inside eFootball Mobile and why linked Google Play or Apple IDs are rejected.",
    content: `## Why Dual-Linked Accounts Are the #1 Peer-to-Peer Risk

One of the most common ways buyers lose money in informal WhatsApp or Telegram eFootball trades is purchasing an account that still has the seller's **Google Play Games** (Android) or **Apple Game Center** (iOS) profile attached. Even after you change the Konami ID email address, password, and two-step verification code, a still-linked Google Play or Apple Game Center profile can sign back into that exact squad from the eFootball title screen without ever entering your new Konami password.

## Why eFootballMarket Enforces "Clean Konami ID Only"

Unlike a Konami ID—where the registered email address, login password, and authenticator 2FA can be transferred 100% to a new owner—Google Play and Apple Game Center links bind permanently to the seller's personal phone OS account unless unlinked through official Konami support procedures. Because sellers cannot hand over their personal Gmail or iCloud device accounts, any squad carrying an active Google Play or Game Center link remains vulnerable to shared sessions or unauthorized logins.

For that reason, eFootballMarket requires every listed Mobile account to be linked **exclusively via Konami ID ("Clean Konami ID")**.

## Exact Menu Path to Verify Link Status Inside eFootball Mobile

During your 24-hour escrow inspection window—before releasing seller payout—open eFootball on your phone, complete the **Data Transfer** from the title screen (bottom-right menu icon -> Data Transfer -> Transfer Data Linked to Konami ID), and inspect the in-game link screen immediately:

1. From the main clubhouse menu inside the game, tap **Extras** in the top-right navigation bar.
2. Tap **Support**, then open **Link Data**.
3. Check every row displayed on the Link Data status panel:
   - **Link Data Using Konami ID** must display **Linked** (pointing to the Konami ID you just took over).
   - **Link Data Using Google Play** (on Android) or **Link Data Using Game Center** (on iOS) must display **Not Linked**.
4. Also note Konami's monthly transfer quota: eFootball Mobile enforces a hard limit of **10 Data Transfers per calendar month** (resetting on the 1st UTC). Always check that remaining transfers have not been exhausted before completing handover.

## What to Do If Google Play or Game Center Shows "Linked"

Do **not** click Release Funds, do **not** link your own Google/Apple account over an unclear state, and do **not** spend eFootball Coins or Skill Tokens on the squad. Instead:

1. Capture a full, uncropped screenshot of **Extras -> Support -> Link Data** clearly showing the status of both rows alongside the current timestamp.
2. Open your active order room on eFootballMarket and click **Raise Dispute** well before the 24-hour inspection timer expires.
3. Upload the Link Data screenshot directly inside the dispute evidence panel.

Once our moderation desk confirms that a third-party Google Play or Game Center link is attached contrary to listing terms, the held M-Pesa escrow balance is refunded in full to your Safaricom number.`,
    author_name: "eFootballMarket Support",
    cover_image_url: "/images/sx-cat-budget.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-08T09:00:00.000Z",
    updated_at: "2026-10-29T09:00:00.000Z",
  },
  {
    id: "guide-konami-id-2fa-transfer",
    title: "Complete Guide: Changing Konami ID Email, Password & Two-Step Verification Safely",
    slug: "konami-id-email-transfer-and-two-step-verification-guide",
    category: "escrow_guide",
    summary:
      "Step-by-step walkthrough for securing a newly transferred Konami ID at my.konami.net, rotating email ownership, enabling Two-Step Verification, and clearing old active sessions.",
    content: `## Securing Ownership at my.konami.net During Escrow Handover

Receiving a Konami ID username and password inside your eFootballMarket order room is only step one of taking permanent ownership. Until you update the **registered email address**, rotate the **Konami ID password**, and activate **Two-Step Verification (2FA)** under your own inbox, the previous email holder could still trigger a password reset link.

Follow this exact sequence inside your 24-hour escrow inspection window before clicking **Confirm & Release Funds**.

## Step 1: Verify In-Game Squad & Clean Link Status First

Before changing credentials, perform a **Data Transfer** from the eFootball title screen and verify three things inside the game:

1. Collective Team Strength, Epic/Big Time/Show Time player roster, and eFootball Coin balance match the listing photos and description (remembering that Coins do not carry across Android <-> iOS platform switches, though players and GP do).
2. **Extras -> Support -> Link Data** confirms **Google Play / Game Center: Not Linked**.
3. The squad is not under any Konami match suspension or negative coin balance restriction.

Only after the squad passes inspection should you proceed to rebind the Konami ID credentials—this keeps potential return disputes clean and fast if a seller misrepresented a card.

## Step 2: Change the Registered Email Address at my.konami.net

1. Open a clean browser tab and navigate directly to **https://my.konami.net** (never click shortened login links sent over third-party chats).
2. Sign in with the seller-supplied Konami ID email and password, entering the 6-digit OTP code forwarded by the seller in your order chat.
3. Open **Personal Information -> Email Address -> Edit**.
4. Enter a **brand-new or dedicated personal Gmail/Outlook address** that already has its own 2FA enabled and has never been linked to another Konami ID.
5. Konami will send a 6-digit confirmation code to your new email inbox. Enter that code to finalize the email swap—from this second onward, all future Konami security notices route exclusively to your inbox.

## Step 3: Rotate Password & Enable Konami Two-Step Verification

1. Still inside **my.konami.net**, open **Security -> Password** and set a unique 12–20 character alphanumeric password never reused on any other gaming site.
2. Navigate to **Security -> Two-Step Verification** and activate OTP protection (either Authenticator App TOTP via Google Authenticator / Authy or Konami email OTP tied to your newly bound address).
3. Review **Connected Apps / Personal Information** to verify country/region accuracy and confirm no unfamiliar recovery email remains attached.

Once your new email, new password, and 2FA are live—and your device is signed into the squad—you can safely click **Confirm & Release Funds** inside the order room.`,
    author_name: "eFootballMarket Support",
    cover_image_url: "/images/sx-cat-mobile.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-06T10:00:00.000Z",
    updated_at: "2026-10-28T10:00:00.000Z",
  },
  {
    id: "guide-mpesa-escrow-kenya",
    title: "How M-Pesa Escrow Protection Works on eFootballMarket Kenya",
    slug: "how-mpesa-escrow-protection-works-in-kenya",
    category: "escrow_guide",
    summary:
      "Understand every stage of an eFootballMarket escrow order—from Safaricom Buy Goods Till 1572931 verification to the 24-hour buyer inspection window and seller M-Pesa settlement.",
    content: `## Solving the Classic "Who Goes First?" Trap in Kenyan Gaming Trades

In unregulated peer-to-peer gaming groups across Kenya, every direct trade stalls on the same deadlock: if the buyer sends M-Pesa directly to a stranger's phone number first, the seller can block them on WhatsApp immediately; if the seller hands over Konami ID credentials and OTP codes first, a dishonest buyer can rebind the email without paying a shilling.

Escrow removes trust guesswork by placing neutral payment custody between both parties until verified delivery is complete.

## Stage-by-Stage Lifecycle of an Escrow Order

### Stage 1: Checkout & Safaricom Till Deposit
When a buyer clicks **Buy Now** on a verified listing, eFootballMarket creates a unique tracked order record. The buyer completes payment in Kenyan Shillings (KES) via our official **Safaricom M-Pesa Buy Goods Till **1572931**** (or instant STK push / verified receipt submission) and logs the M-Pesa transaction code (for example, **SJK84M29LP**) on the order screen.

Never send funds to a seller's personal M-Pesa phone number, Pochi la Biashara, or external Paybill—any off-platform transfer bypasses escrow custody and cannot be reversed by eFootballMarket.

### Stage 2: Payment Verification & Seller Delivery Lock
Once the M-Pesa Till receipt is matched against the exact order total:

1. The listing is automatically locked from other buyers on the storefront so double-selling cannot occur.
2. The seller receives an instant order notification instructing them to deliver the Konami ID credentials and assist with the login verification code inside the tracked order room—while knowing 100% that the buyer's KES funds are already secured in escrow.

### Stage 3: The Buyer Inspection & Rebinding Window
After credentials are delivered, the buyer enters the protected inspection window to:

- Perform in-game Data Transfer and verify squad Collective Strength, Epic/Booster cards, and GP/Coin balances.
- Check **Extras -> Support -> Link Data** to confirm **Google Play / Game Center: Not Linked**.
- Rebind the Konami ID email address, password, and 2FA at **my.konami.net**.

### Stage 4: Payout Settlement or Evidence-Backed Dispute
- **Smooth Handover**: As soon as the buyer confirms ownership (or when valid delivery expires uncontested per dispute policy rules), eFootballMarket disburses the seller's net payout directly to their registered Safaricom M-Pesa number.
- **Discrepancy Found**: If Google Play is linked, cards are missing, or the seller fails to provide valid credentials within the delivery SLA, the buyer clicks **Raise Dispute**, freezing payout while moderators inspect uncropped screenshots and refund the buyer's M-Pesa payment when listing rules were violated.`,
    author_name: "eFootballMarket Support",
    cover_image_url: "/images/sx-cat-middleman.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-04T11:00:00.000Z",
    updated_at: "2026-10-27T11:00:00.000Z",
  },
  {
    id: "guide-avoid-whatsapp-scams-kenya",
    title: "7 Common WhatsApp, Telegram & Facebook eFootball Scams in Kenya (And How to Spot Them)",
    slug: "avoiding-whatsapp-and-facebook-efootball-scams-in-kenya",
    category: "scammer_alert",
    summary:
      "From fake M-Pesa confirmation SMS edits to the Konami OTP pre-transfer hijack and impersonated group admins, learn the exact red flags Kenyan scammers use in social media trades.",
    content: `## Why Social Media Account Trading Groups Attract Repeat Fraudsters

Because SIM cards, burner Facebook profiles, and Telegram handles take less than ten minutes to replace, scammers recycle the same stolen 3200+ Epic squad screenshots across dozens of Kenyan eFootball groups every week. Knowing the mechanics behind each scam makes them effortless to spot before you ever share a code or send KES 100.

## The 7 Most Frequent eFootball Scams in Kenya

1. **The "Too-Good-To-Be-True" 3210+ Double-Booster Squad for KES 1,800**: A squad stacked with 15+ endgame Double-Booster Epics (Gullit, Vieira, Rijkaard, Maldini, Messi, Rummenigge) takes tens of thousands of shillings or years of luck to assemble. When a stranger lists a true whale squad for KES 1,500–2,500 claiming an "urgent school fees / emergency quick sale today," the screenshots were almost certainly lifted from TikTok or another seller.
2. **Cropped Link Data Screenshots**: Fraudulent sellers willingly send screenshots of the Game Plan pitch—but crop out the top bar or refuse to record a continuous 15-second screen capture opening **Extras -> Support -> Link Data**. Behind the scenes, their personal Google Play account remains linked so they can log back in 48 hours after you pay.
3. **The "Let Me Log In First to Check Your Squad" Buyer Hijack**: Dishonest "buyers" ask sellers for the Konami ID email, password, and a single 6-digit Konami OTP "just to view the squad in-game before sending M-Pesa." Instead of opening eFootball, they enter that OTP on **my.konami.net** to swap your registered email address and lock you out within 30 seconds!
4. **Fake Edited M-Pesa Confirmation SMS Screenshots**: Scammers use SMS generator templates to send fake **Confirmed. Ksh4,500.00 sent to...** screenshots while claiming "Safaricom network is delaying messages, hand over the password quickly." Always verify real M-Pesa statement balances directly via ***334#** or the official M-Pesa App—never trust a chat screenshot.
5. **Fake Group Admin / Colluding Middleman**: A seller invites you into a WhatsApp or Telegram group with 800 members and points to a "trusted group admin" to hold the money. In reality, the seller owns both WhatsApp numbers (or splits stolen funds 50/50 with the group creator).
6. **Zero Monthly Data Transfers Remaining**: A seller hands over a real Konami ID that has already burned all **10 monthly Data Transfers**, leaving you locked at the title screen unable to load the squad onto your phone until next month—while they attempt to rush payout release.
7. **Off-Platform "Save the Fee" Bait**: Someone finds your listing on eFootballMarket, contacts you privately, and asks to pay directly on WhatsApp to skip verification steps. Moving off-platform strips away escrow custody immediately.

## Pre-Trade Verification Checklist

- Run unknown phone numbers, Till numbers, and usernames through the **Scammer Check** database before engaging.
- Never share a **my.konami.net** 6-digit verification code until verified escrow payment is locked inside an active order room.
- Insist on full-screen, uncropped Link Data proof on every Mobile transaction.`,
    author_name: "eFootballMarket Trust & Safety",
    cover_image_url: "/images/sx-cat-budget.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-02T12:00:00.000Z",
    updated_at: "2026-10-26T12:00:00.000Z",
  },
  {
    id: "guide-prepare-price-squad-for-sale",
    title: "Seller's Guide: How to Prepare, Photograph & Price Your eFootball Squad for a Fast Sale",
    slug: "how-to-prepare-and-price-your-efootball-squad-for-sale",
    category: "efootball_news",
    summary:
      "Practical valuation benchmarks in Kenyan Shillings (KES) for starter, mid-tier, and Double-Booster Epic squads—plus how to prepare a clean Konami ID for frictionless escrow handover.",
    content: `## What Serious Kenyan Buyers Actually Pay For in 2026

One of the biggest pricing mistakes first-time sellers make is pricing an account strictly by **Collective Team Strength** (for example, assuming any 3140+ squad commands KES 10,000+). Experienced buyers look past raw OVR inflation from free login cards and evaluate **card permanence, meta playstyles, manager roster, and link cleanliness**.

### Core Valuation Drivers in KES
1. **Endgame Meta Double-Booster Epics & Big Time Cards**: Anchors like Vieira, Rijkaard,Gullit, Maldini, Araujo, Schmeichel, Cech, Rummenigge, Eto'o, Bale, and Blitz Curler / Phenomenal Finishing Show Time attackers carry 70% of secondary-market resale value because they cannot be packed on demand once their 150-player box expires.
2. **88-Proficiency Booster Managers**: Accounts carrying scarce pack managers (especially dual-88 proficiency or +1 Speed / Acceleration / Finishing booster managers) sell significantly faster because buyers cannot purchase expired club/national pack managers in the GP shop.
3. **Unspent eFootball Coins & Skill Dummies**: Mention your exact Android vs iOS vs PlayStation/Steam coin balance clearly—remembering that eFootball Coins stay bound to the OS family where they were earned/purchased (Android coins show as 0 on iOS and vice versa, though remain intact on Android).
4. **Typical Kenyan Market Tiers (Reference Ranges)**:
   - **Starter / Budget Clean IDs (3050–3110 Strength, 1–3 Epics + POTWs)**: Typically clear quickly between **KES 1,200 and KES 3,500**.
   - **Competitive Division 1 Mid-Tier (3120–3175 Strength, 5–9 Meta Epics/Show Times + 88 Manager)**: Typically trade between **KES 4,000 and KES 11,500** depending on spine quality (GK, CB, DMF, CF).
   - **Stacked Collector / Tournament Whale Squads (3185–3230+ Strength, full Permanent-B starting XI + bench)**: Command **KES 12,000 to KES 35,000+** when backed by clean Konami ID documentation.

## 5-Step Pre-Listing Preparation Checklist

1. **Confirm Clean Konami ID Status First**: Open **Extras -> Support -> Link Data** and verify Google Play / Game Center reads **Not Linked** *before* creating a listing. Listings with third-party OS links are rejected or refunded upon buyer inspection.
2. **Move the Konami ID Onto a Dedicated Clean Email**: If your Konami ID is currently tied to your personal university, work, or primary Gmail address, rebind it at **my.konami.net** to a clean dedicated email before listing so handover takes under five minutes once an order lands.
3. **Upload 4 Clear, Uncropped Screenshots**:
   - Full **Game Plan** pitch showing Collective Strength, active Manager, and starting XI + bench.
   - **My Team -> Players** sorted by Overall Rating / Rarity showing reserve Epics, Show Times, and Big Time cards.
   - **Extras -> Support -> Link Data** proving **Konami ID: Linked** and **Google Play / Game Center: Not Linked** (never show your actual email address or login ID in public screenshots!).
   - **Managers** list highlighting 88-proficiency Booster Managers.
4. **Preserve Monthly Data Transfers**: Avoid hopping between multiple phones right before selling so the buyer has plenty of Konami's 10 monthly Data Transfers available.
5. **Stay Reachable After Listing**: Sellers who respond rapidly when an M-Pesa escrow order locks earn 5-star verified seller ratings and faster repeat sales.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/sx-cat-console.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-09-29T09:00:00.000Z",
    updated_at: "2026-10-25T09:00:00.000Z",
  },
];
