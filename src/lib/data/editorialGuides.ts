import { NewsArticle, NewsCategory } from "@/types/database";

export function getCategoryLabel(category: NewsCategory | string) {
  switch (category) {
    case "scammer_alert":
      return {
        label: "Safety & Ban Alerts",
        color: "bg-sx-red-tint border-sx-red-border text-sx-red-text",
      };
    case "escrow_guide":
      return {
        label: "Konami ID & Escrow",
        color: "bg-sx-green-tint border-sx-green-border text-sx-green-text",
      };
    case "efootball_news":
      return {
        label: "eFootball 2027 Meta",
        color: "bg-sx-stone border-sx-border-strong text-sx-ink",
      };
    case "announcement":
      return {
        label: "Esports & Events",
        color: "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text",
      };
    case "update":
      return {
        label: "v6.1 Patch & Drops",
        color: "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text",
      };
    default:
      return {
        label: "eFootball 2027 Guide",
        color: "bg-sx-stone border-sx-border text-sx-ink",
      };
  }
}

const ARTICLE_REAL_PHOTO_BY_SLUG: Record<string, string> = {
  "efootball-2027-black-friday-update-nov-12-campaign-hub-henry-arsenal":
    "/images/articles/ef27-black-friday-campaign-hub.jpg",
  "big-time-thierry-henry-epic-arsenal-fc-pack-review-builds-kenya":
    "/images/articles/ef27-henry-big-time-arsenal.jpg",
  "arsene-wenger-vs-arteta-managers-national-legends-wanyama-guide":
    "/images/articles/ef27-wenger-arsenal-manager.jpg",
  "efootball-2027-v6-season-update-fluid-formation-overload-guide":
    "/images/articles/ef27-fluid-formation-konami.jpg",
  "efootball-v6-1-select-skill-and-select-position-tokens-guide":
    "/images/articles/ef27-select-tokens-yamal.jpg",
  "efootball-2027-dual-link-up-managers-90-proficiency-meta":
    "/images/articles/ef27-klopp-linkup-manager.jpg",
  "efootball-2027-dynamic-volley-and-new-show-time-skills-meta":
    "/images/articles/ef27-dynamic-volley-konami.jpg",
  "efootball-2027-showdown-mode-and-custom-tournaments-guide":
    "/images/articles/ef27-custom-tournament-bracket.jpg",
  "efootball-league-division-1-no-relegation-match-analysis-guide":
    "/images/articles/ef27-match-analysis-konami.jpg",
  "efootball-championship-2027-300k-prize-pool-and-caf-afcon-roadmap":
    "/images/articles/ef27-championship-2027-trophy.jpg",
  "efootball-2027-november-pack-watch-quaresma-ballon-dor-black-friday":
    "/images/articles/ef27-messi-yamal-season-art.jpg",
  "how-to-verify-clean-konami-id-before-releasing-escrow":
    "/images/articles/ef27-konami-security-pin.jpg",
  "efootball-account-scams-and-konami-ban-waves-kenya-2026":
    "/images/articles/ef27-stadium-night-lights.jpg",
};

const CATEGORY_FALLBACK_REAL_PHOTO: Record<string, string> = {
  efootball_news: "/images/articles/ef27-overload-playstyle-konami.jpg",
  escrow_guide: "/images/articles/ef27-konami-security-pin.jpg",
  scammer_alert: "/images/articles/ef27-stadium-night-lights.jpg",
  announcement: "/images/articles/ef27-championship-2027-trophy.jpg",
  update: "/images/articles/ef27-fluid-formation-konami.jpg",
};

/**
 * Ensures every article uses an authentic eFootball 2027 screen or real visual.
 */
export function resolveRealArticlePhoto(
  slug?: string | null,
  category?: string | null,
  currentCoverUrl?: string | null
): string {
  const cleanSlug = (slug || "").trim().toLowerCase();
  if (cleanSlug && ARTICLE_REAL_PHOTO_BY_SLUG[cleanSlug]) {
    if (!currentCoverUrl || currentCoverUrl.startsWith("/images/sx-")) {
      return ARTICLE_REAL_PHOTO_BY_SLUG[cleanSlug];
    }
  }

  if (currentCoverUrl && !currentCoverUrl.startsWith("/images/sx-")) {
    return currentCoverUrl;
  }

  return (
    (category && CATEGORY_FALLBACK_REAL_PHOTO[category]) ||
    "/images/articles/ef27-fluid-formation-konami.jpg"
  );
}

export const EDITORIAL_GUIDES: NewsArticle[] = [
  {
    id: "update-2026-11-12-black-friday-campaign-henry-arsenal",
    title:
      "eFootball 2027 Black Friday Update (12 Nov 2026): Campaign Hub, 5,000-Coin Platinum Ticket, Henry Debut, Wenger & Arsenal Packs",
    slug: "efootball-2027-black-friday-update-nov-12-campaign-hub-henry-arsenal",
    category: "update",
    summary:
      "Everything in Konami's 12 November 2026 maintenance update: the Black Friday Campaign Hub (Silver/Gold/Platinum Tickets, up to 5,000 Coins), free Highlight: Arsenal FC Chance Deals, Big Time Thierry Henry, Arsène Wenger & Mikel Arteta managers, Epic National Legends with Victor Wanyama, and the exact EAT timings Kenyan players need.",
    content: `## What Dropped in the 12 November 2026 Maintenance

Konami's Thursday maintenance on **12 November 2026** pushed eFootball 2027's **Black Friday Campaign** live across mobile, console and PC. It is the biggest free-coin window of the v6.1 season and it also carries the long-awaited **Big Time Thierry Henry** debut, two new Arsenal managers, and a Kenyan name in the new **Epic: National Legends** list. Here is the full, verified breakdown.

## Campaign Dates (East Africa Time)

- **Start**: 12 Nov 2026, 02:00 UTC = **05:00 EAT**
- **End**: 3 Dec 2026, 01:59 UTC = **04:59 EAT**
- **Daily login reset**: 02:00 UTC = **05:00 EAT** every day
- **Objectives Round 1**: 19 Nov, 05:00 EAT
- **Objectives Round 2**: 26 Nov, 05:00 EAT

## Campaign Hub: Silver, Gold & Platinum Tickets

The Campaign Hub board advances when you finish **PvP or VS AI matches** (Exhibition, Training and Skill Up matches do **not** count). Rewards along the track:

- **Silver Tickets (x8)** – GP, EXP trainers and consumables.
- **Gold Tickets (x2)** – draw for up to **3,000 eFootball Coins** each.
- **Platinum Ticket (x1)** – one draw for up to **5,000 eFootball Coins**. It sits at the final space of the third week, and Konami's wording is "a chance", so treat it as a lottery, not a guarantee.
- **Thierry Henry Stadium Choreo + Giant Prop** – a golden kneeling-Henry statue and a tifo for your stadium.
- **4 x Highlight: Arsenal FC Chance Deals** from the Hub, on top of the login present below.

## Free Login Rewards

Log in once during the campaign to receive **1 x "Highlight: Arsenal FC" Chance Deal** (the Highlight pool tops out at 94 OVR for Rice, Saka, Gabriel and Ødegaard-type cards and 93 for Raya). The cumulative Special Login Bonus adds **2 Random Skill Tokens, 2 Random Position Tokens, 110,000 GP and 60,000 EXP**.

## Special Events Schedule

1. **London Clubs** (12 Nov – 3 Dec): VS AI event, collect Event Points for rewards.
2. **Team Effort** (19 Nov – 3 Dec): win match after match, but any player card used in a previous win is locked for the rest of the event, so squad depth matters.
3. **English Clubs** (26 Nov – 3 Dec): PvP event with Bonus Targets; Player Bonuses and results decide your points.

## New Packs in the Same Update

- **Big Time & Epic: Arsenal FC** – 250-player box headlined by **Big Time Thierry Henry (CF, 105 max)** with Epic **Sol Campbell, Dennis Bergkamp, David Seaman, Emmanuel Petit and Giovanni van Bronckhorst**. First 10-player draw is discounted to **500 Coins**. Full review: [Henry pack breakdown](/news/big-time-thierry-henry-epic-arsenal-fc-pack-review-builds-kenya).
- **Manager: Arsène Wenger** – 750 Coins, **90 Possession Game / 89 Quick Counter**, Dual Link-Up **Breakthrough Pass B + Shadow Link C**.
- **Arsenal FC 26–27 Club Pack** – 1,500 Coins with **Show Time Bukayo Saka (Blitz Curler)** and manager **Mikel Arteta (90 Long Ball Counter / 90 Overload)**.
- **Epic: National Legends Selection** – pick one Epic for **900 Coins**, including Kenya's **Victor Wanyama**. Manager and Legends guide: [Wenger vs Arteta + Wanyama](/news/arsene-wenger-vs-arteta-managers-national-legends-wanyama-guide).

## What This Means for Buying & Selling Accounts in Kenya

- **Coin stashes are suddenly valuable.** An account sitting on 500–1,500 unspent Coins can hit the discounted Henry 10-draw or the Wenger pack immediately. Remember Coins **do not move across Android <-> iOS** during Data Transfer, so match the platform badge on any [marketplace listing](/browse) before you pay.
- **Expect a flood of "Henry + Campbell" listings from 13 November.** Ask the seller for an in-game screenshot of the card inside **My Team > Players** with the Konami ID visible, not just a pack-opening clip.
- **Campaign progress is account-bound.** If you buy mid-campaign, the Hub spaces already cleared by the seller stay cleared, so an account that has reached the Gold Ticket row is worth more than a fresh one.
- **Pay only through escrow.** Use [eFootballMarket escrow](/escrow-guarantee) with M-Pesa Till **1572931**; funds release only after you confirm the Konami ID password, email and 2-step code were handed over cleanly. Our [Konami ID buyer checklist](/news/how-to-verify-clean-konami-id-before-releasing-escrow) covers the full hand-over.

## Quick FAQ

**Is the 5,000-Coin Platinum Ticket guaranteed?** No. It is a draw with a chance of up to 5,000 Coins.

**Do Exhibition matches move the Campaign Hub?** No. Only PvP (eFootball League, events) and VS AI matches count.

**When should I spend?** The first 10-draw of the Arsenal box at 500 Coins is the best Coin-per-card value in this update; the 750-Coin Wenger pack is the best manager value if you run Possession Game.`,
    author_name: "eFootballMarket Patch Desk",
    cover_image_url: "/images/articles/ef27-black-friday-campaign-hub.jpg",
    is_pinned: true,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-12T10:00:00.000Z",
    updated_at: "2026-11-13T18:00:00.000Z",
  },
  {
    id: "review-big-time-henry-epic-arsenal-fc-pack-2026-11",
    title:
      "Big Time Thierry Henry & Epic Arsenal FC Pack Review: 105 CF, Campbell, Bergkamp Builds & Kenyan Resale Value",
    slug: "big-time-thierry-henry-epic-arsenal-fc-pack-review-builds-kenya",
    category: "efootball_news",
    summary:
      "Full card-by-card review of the 12 Nov 2026 Big Time & Epic: Arsenal FC box: Henry (Deep-Lying Forward, Momentum Dribbling + Acceleration Burst + Blitz Curler), Campbell, Bergkamp, van Bronckhorst, Seaman and Petit with progression builds, boosters, tier verdict and what each card adds to an account's KES price.",
    content: `## Henry Finally Lands in eFootball 2027

After weeks of teasers built around his solo goal against Tottenham, **Thierry Henry** debuted on **12 November 2026** as a **Big Time** card dated **16 Nov '02**. He headlines the **Big Time & Epic: Arsenal FC** box (250 players) with five Epic team-mates from the Wenger era. The first 10-player draw costs **500 Coins**, then standard pricing applies. Below is what every card actually does, plus the builds the community has settled on after the first 48 hours.

## Thierry Henry (CF, 88 base -> 105 max)

- **Attacking Playing Style**: Deep-Lying Forward · **Defensive**: Front Line Poacher
- **Show Time Skills**: Momentum Dribbling, Acceleration Burst, Blitz Curler
- **Booster**: Finishing · **Extra**: Monumental Celebration animation
- **Progression (7/4/6/10/10/4/0)**: Shooting 7, Passing 4, Dribbling 6, Dexterity 10, Lower Body Strength 10, Aerial 4.
- **Suggested skills**: One-touch Pass, Through Passing, Sole Control, Flip Flap, Acrobatic Finishing.

On paper he lacks 99 Speed/Acceleration, but in matches he closes space like Mbappé because **Acceleration Burst** stacks with his long stride. As a Deep-Lying Forward he receives on the edge of the box, where **Blitz Curler** and **Momentum Dribbling** chain naturally. Known weaknesses: ordinary heading for a 188 cm striker and no Goal Poacher option, so pair him with a runner (Yamal, Saka Show Time) if you rely on through balls.

## Sol Campbell (CB, 104 max)

- **Defensive Playing Style**: The Destroyer · **Show Time**: Power Tackle, Shadow Hunt
- **Booster**: Physical Contact +6 · **Build**: 0/0/0/7/8/8/11 + GK1 1
- Verdict: top-three CB in the game right now. Enough recovery pace for **Shadow Hunt** to trigger, and the physical profile out-muscles Haaland-type targets.

## Dennis Bergkamp (SS, 103 max)

- **Attacking**: Creative Playmaker · **Defensive**: Front Line Poacher · **Show Time**: Phenomenal Pass, Magnetic Feet
- **Booster**: Ball Control +6 · **Build**: 8/4/10/9/9/4/0
- Verdict: a second-striker who creates rather than runs in behind. Keep him in the half-spaces behind Henry; do not expect Gullit-style pace.

## Giovanni van Bronckhorst (LB, 101 max)

- **Attacking**: Attacking Full-back · **Defensive**: High Line Master · **Show Time**: Edged Crossing, Long-reach Tackle
- **Boosters**: Stealing, Duelling · **Build**: 0/6/4/8/11/4/9
- Verdict: the best-balanced LB released this season; the Edged Crossing + Long-reach Tackle combo is unique for a full-back.

## David Seaman (GK, 102 max)

- **Defensive**: Defensive Goalkeeper · **Show Time**: GK Directing Defence · **Booster**: Saving
- **Build**: Aerial 1, GK1 10, GK2 8, GK3 11.

## Emmanuel Petit (CMF, 100 max)

- **Box-to-Box** both phases · **Show Time**: Phenomenal Pass, Attack Trigger · **Boosters**: Ball Protection, Balancer
- **Build**: 0/7/7/7/11/3/7. Solid but replaceable; Vieira, Yaya Touré and Xabi Alonso do the same job better.

## Tier Verdict

| Tier | Players |
| --- | --- |
| SSS (Endgame) | Thierry Henry, Sol Campbell |
| SS (Excellent) | Bergkamp, van Bronckhorst, Seaman, Petit |

Community pack rating sits around **3.5 / 5**: not the cheapest value box of 2026, but a 250-player pool with zero dead Epics and two genuine endgame cards.

## How These Cards Move Account Prices in Kenya

1. **Henry adds a premium, Campbell adds almost as much.** Buyers on [eFootballMarket](/browse) value a maxed Henry roughly like a Big Time Del Piero tier card; a Campbell + Henry pair justifies a clear step up over a plain 3150-strength squad.
2. **Do not pay for an un-levelled Henry as if it were 105.** Ask for a screenshot showing current level and remaining progression points.
3. **Free Highlight Arsenal cards are not Epics.** The 94 Rice/Saka Highlight cards from the campaign login are nice but every active account can get them; they should not raise a listing price.
4. **Verify ownership before escrow release.** Follow our [Konami ID buyer checklist](/news/how-to-verify-clean-konami-id-before-releasing-escrow) and keep payment inside escrow via M-Pesa Till **1572931** until you have logged in yourself and seen the card in **My Team**.`,
    author_name: "eFootballMarket Valuation Desk",
    cover_image_url: "/images/articles/ef27-henry-big-time-arsenal.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-13T09:00:00.000Z",
    updated_at: "2026-11-13T18:00:00.000Z",
  },
  {
    id: "guide-wenger-arteta-managers-national-legends-wanyama-2026-11",
    title:
      "Arsène Wenger vs Mikel Arteta in eFootball 2027: Dual Link-Up Setups, Arsenal 26–27 Pack & Epic National Legends with Kenya's Victor Wanyama",
    slug: "arsene-wenger-vs-arteta-managers-national-legends-wanyama-guide",
    category: "efootball_news",
    summary:
      "Which new Arsenal manager fits your squad: Wenger (90 Possession Game / 89 Quick Counter, Breakthrough Pass B + Shadow Link C, 750 Coins) or Arteta (90 Long Ball Counter / 90 Overload, Breakthrough Pass C + 1-2 Cut-in C, inside the 1,500-Coin Arsenal 26–27 pack), plus the 900-Coin Epic National Legends Selection featuring Victor Wanyama.",
    content: `## Two Arsenal Managers, Two Very Different Game Plans

The **12 November 2026** update added two Arsenal managers at once. Both carry the v6.0 **Dual Link-Up Play** system, but they want completely different squads. Here is how to choose, and how each one changes what buyers look for in an account.

## Arsène Wenger (Manager Pack, 750 Coins)

- **Proficiencies**: **90 Possession Game** (Low Pass booster) / **89 Quick Counter** (Kicking Power booster)
- **Link-Up Play 1 – Breakthrough Pass B**: needs a **Box-to-Box CMF** feeding a **Goal Poacher CF**.
- **Link-Up Play 2 – Shadow Link C**: needs a **Deep-Lying Forward CF** with a **Hole Player AMF** behind him.
- Konami's own launch line was "Wengerball has arrived", and the pack art is labelled **02–03**, the season before the Invincibles.

**Who should buy Wenger**: anyone already running a Possession Game spine (Xabi Alonso, Yaya Touré, Bergkamp) who wants a Quick Counter fallback for Showdown. Shadow Link C is tailor-made for **Big Time Henry (DLF)** plus a Hole Player like Gullit or Ødegaard. The pack's Highlight slots reportedly feature current Gunners such as **Zubimendi (DMF)** and **Gyökeres (CF)**.

## Mikel Arteta (inside the Arsenal FC 26–27 Club Pack, 1,500 Coins)

- **Proficiencies**: **90 Long Ball Counter / 90 Overload** – the first manager to pair a 90 in the new Overload playstyle with a 90 counter style.
- **Link-Up Play 1 – Breakthrough Pass C** · **Link-Up Play 2 – 1-2 Cut-in C**
- **Pack contents**: **Show Time Bukayo Saka (Blitz Curler)**, Declan Rice, Bruno Guimarães, David Raya, Gabriel Magalhães, Jurriën Timber, Kai Havertz, Martin Ødegaard, Riccardo Calafiori and more. 10 Highlight cards, each able to take a booster.

**Who should buy Arteta**: Overload users who struggled with weak-side exposure. 90 Long Ball Counter lets you flip to a direct plan mid-match without proficiency loss, which is exactly what the no-relegation Division 1–3 format rewards.

## Quick Comparison

| | Wenger | Arteta |
| --- | --- | --- |
| Cost | 750 Coins (manager only) | 1,500 Coins (manager + Saka pack) |
| Styles | 90 Possession / 89 Quick Counter | 90 Long Ball Counter / 90 Overload |
| Link-Ups | Breakthrough Pass B + Shadow Link C | Breakthrough Pass C + 1-2 Cut-in C |
| Best with | DLF Henry + Hole Player AMF | Overload shapes, fast wingers (Saka, Traoré) |

## Epic: National Legends Selection (900 Coins, choose one)

The second volume of **National Legends** lets you pick **one Epic for 900 Coins**; every card carries a Show Time skill. Confirmed names include **Sócrates (Brazil), Obafemi Martins (Nigeria), Daisuke Matsui (Japan), Rafael Márquez (Mexico), Victor Wanyama (Kenya), Aliou Cissé (Senegal), Mustapha Hadji (Morocco), Rüştü Reçber (Türkiye), Madjid Bougherra (Algeria), Nashat Akram (Iraq), Piyapong Pue-on (Thailand), Safiq Rahim (Malaysia), Essam El Hadary (Egypt) and Bhaichung Bhutia (India)**, with 17 nations in total.

### Victor Wanyama – the Kenyan pick

- **Position**: DMF · **Base OVR**: 82 · **Defensive Playing Style**: Tough Marker (new in v6.1) · Attacking: Basic
- **Profile**: 184 cm / 87 kg, right-footed, **Weak Foot Accuracy High**, **Form Unwavering** (Injury Resistance Low)
- **Base stats that matter**: Aggression 79, Physical Contact 79, Stamina 80, Tackling 77, Kicking Power 77, Defensive Awareness 76, Defensive Engagement 76, Speed 75.

Wanyama is not a meta DMF compared with Rijkaard or Vieira, but **Tough Marker** on a Legend with Unwavering form makes him a reliable Division 1 rotation piece, and he is the first Harambee Stars legend in eFootball. Expect Kenyan sellers to feature him in listings; price him as a sentimental extra, not a premium Epic. (India received a regional 50 INR Bhutia deal; no equivalent Kenyan offer has been announced.)

## Buyer and Seller Notes

- **Managers transfer with the account** and keep their proficiency levels, so a Wenger or Arteta at high level is a genuine asset. Check **Managers > Owned** on a live screen before releasing [escrow](/escrow-guarantee).
- **Link-Up Plays only fire with the right roles.** When evaluating a squad for Wenger, confirm the CF is actually a Deep-Lying Forward on his Attacking Playing Style sheet.
- Trade safely on [eFootballMarket](/browse): pay via M-Pesa Till **1572931** into escrow, verify the Konami ID with our [buyer checklist](/news/how-to-verify-clean-konami-id-before-releasing-escrow), then release.`,
    author_name: "eFootballMarket Tactical Desk",
    cover_image_url: "/images/articles/ef27-wenger-arsenal-manager.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-13T12:00:00.000Z",
    updated_at: "2026-11-13T18:00:00.000Z",
  },
  {
    id: "update-efootball-2027-v6-fluid-formation-overload",
    title:
      "eFootball 2027 (v6.0 – v6.1.1) Tactical Overhaul: Fluid Formation, Overload Playstyle & Split Playing Styles",
    slug: "efootball-2027-v6-season-update-fluid-formation-overload-guide",
    category: "update",
    summary:
      "Konami's v6.0.0 season update (and October's v6.1.1 patch) fundamentally changed Game Plan setup—retiring old Deep Line instructions in favor of automatic Fluid Formations, the 6th Team Playstyle (Overload), and separate Attacking vs Defensive Playing Styles.",
    content: `## Why Your Old Static Game Plan No Longer Works in eFootball 2027

Since Konami rolled out the **eFootball 2027 Season Update (v6.0.0 on Console/PC and v11.0 on Mobile)** and followed up with **v6.1.0 / v6.1.1 in October 2026**, copying and pasting an old 2025/early-2026 static formation into Division 1 is a trap. Konami didn't just add new cards—they rebuilt three core systems inside **Game Plan**:

1. **Fluid Formation** now shifts your XI between two distinct shapes automatically whenever possession changes hands.
2. **Attacking** and **Deep Line** were **removed from Individual Instructions**, meaning players who used to drop a DMF into a back-five via *Deep Line* must now build that transition natively inside Fluid Formation.
3. Every player card is now evaluated across **separate Attacking Playing Styles and Defensive Playing Styles**, alongside a brand-new 6th Team Playstyle: **Overload**.

## 1. Setting Up Fluid Formation Without Opening Midfield Gaps

With **Fluid Formation** turned on in **Game Plan -> Tactics -> Set Formation**, you configure an **Attack (In Possession)** shape and a **Defence (Out of Possession)** shape using the exact same eleven starters—no manual sub-tactic toggling required during open play.

- **Meta Setup A (3-2-5 Attack -> 4-4-2 / 4-5-1 Defence)**: Push one Offensive Fullback high into wide midfield or inverted CMF while your opposite Defensive Fullback slides inside to form a back three in buildup; out of possession, both wingers drop into a compact four- or five-man midfield line.
- **Meta Setup B (4-2-2-2 Attack -> 5-3-2 Defence)**: Place your Anchor Man DMF between your two Centre-Backs on the *Out of Possession* board to recreate the discontinued *Deep Line* shield against two-striker counter-attacks.
- **Crucial Sprint-Distance Rule**: Never drag a player from LWF in Attack all the way to LB in Defence! If a player has to sprint 45 meters every time you lose the ball, they get caught out of position during the first 4 seconds of a transition and hit red stamina by the 60th minute. Keep positional shifts within one adjacent zone.

## 2. Overload: How the 6th Team Playstyle Actually Plays

![Konami's Overload Team Playstyle concentrates teammates near the ball side for short passing triangles and rapid ball-side pressing](/images/articles/ef27-overload-playstyle-konami.jpg)

Joining Possession Game, Quick Counter, Long Ball Counter, Out Wide, and Long Ball, **Overload** pulls midfielders and near-side fullbacks toward whichever flank or half-space currently holds the ball.

1. **When Attacking**: Creates instant 4v3 numerical superiority around the ball carrier, making one-touch triangles and \`1-2 Cut-In\` combinations far harder to intercept.
2. **When Defending**: Compresses aggressively around the opponent's ball carrier with a high line to suffocate short buildup.
3. **The Weak-Side Risk**: Because Overload drags your central midfielders toward the strong side, opponents with \`Visionary Pass\` or \`Edged Crossing\` wingers can punish you with diagonal switches to the far touchline. Always keep a fast fullback (\`88+ Speed\`) on the weak side when running Overload managers like **Frank Lampard**, **Mikel Arteta**, or **Tomoaki Makino**.

## 3. Split Attacking & Defensive Playing Styles (v6.0 & v6.1 Additions)

Player behaviour is now split into **Attacking Playing Style** (active with the ball) and **Defensive Playing Style** (active without the ball), with Konami adding four standout roles in **v6.1.0**:

- **Build-up GK (Attacking GK Role)**: Goalkeepers step noticeably higher outside their six-yard box during settled possession to act as an extra passing outlet against high presses.
- **Press Back & Front Line Poacher (Defensive Forward Roles)**: Dictates whether your CF/RWF tracks back into midfield passing lanes (*Press Back*) or hovers aggressively on the last defender's shoulder (*Front Line Poacher*, as seen on the new **Epic Ricardo Quaresma**).
- **Tough Marker (Defensive Role for DMF, CB, LB, RB)**: Tightens physical contact engagement and body-check timing against ball-carrying AMFs inside Zone 14.

Checking both halves of a card's Playing Style sheet is now mandatory before buying or building any squad on the [Live Marketplace](/browse).`,
    author_name: "eFootballMarket Tactical Desk",
    cover_image_url: "/images/articles/ef27-fluid-formation-konami.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-10T09:00:00.000Z",
    updated_at: "2026-11-10T09:00:00.000Z",
  },
  {
    id: "guide-efootball-v6-1-select-skill-position-tokens",
    title:
      "Select Skill & Select Position Tokens in eFootball v6.1: How the 100-Token System Ends RNG Pain",
    slug: "efootball-v6-1-select-skill-and-select-position-tokens-guide",
    category: "efootball_news",
    summary:
      "Released on October 8, 2026 in eFootball v6.1.0, Select Skill Tokens and Select Position Tokens let you hand-pick exact skills and dark-green positions for 100 tokens—while retiring Advanced Skill Tokens at a 1:20 conversion rate.",
    content: `## Goodbye Pure RNG: What Changed in the v6.1.0 Token Overhaul

For years, building an endgame Epic or Show Time player meant burning dozens of random Skill Training Programs—or spending millions of GP on 0-GP dummy Legacy Transfers—just to avoid rolling *Sombrero* on a Centre-Back. With **eFootball v6.1.0 (released October 8, 2026)**, Konami introduced two deterministic training items alongside **Additional Skill Deletion**:

1. **Select Skill Token**: Collect **100 Select Skill Tokens** to pick the **exact** eligible Additional Skill you want from the Skill Training list—zero randomness.
2. **Select Position Token**: Collect **100 Select Position Tokens** to upgrade a player's **Position Proficiency** to full dark-green familiarity in a chosen eligible role.
3. **Advanced Skill Tokens Retired (1 : 20 Conversion)**: Konami permanently discontinued *Advanced Skill Tokens* in v6.1.0, automatically converting every leftover Advanced Skill Token in player inventories into **20 Select Skill Tokens**.
4. **Direct Skill Deletion**: You can now delete an unwanted Additional Skill directly off a card to free up one of its five slots cleanly before applying a guaranteed skill.

Standard 1-token **Random Skill Training Programs** and **Random Position Tokens** still remain in the game for budget rolls, so save your 100-stack Select Tokens strictly for high-impact meta upgrades.

## Best Priority Picks for Your First 100 Select Skill Tokens

Because accumulating 100 Select Skill Tokens through **Showdown PvP events**, Campaign Hubs, and login objectives takes discipline, never spend 100 Select Tokens on common filler skills. Target the animations that swing Division 1 matches:

- **One-Touch Pass (AMF / CMF / CF)**: Midfield pressing in v6.1 punishes slow two-touch trapping animations; putting guaranteed *One-Touch Pass* on a physical striker or destroyer midfielder transforms transition speed overnight.
- **Double Touch (CF / Wingers / Playmakers)**: Especially lethal on cards that already hold *Sole Control* and *Flip Flap*, immediately unlocking the tight **Level 3 Ball-Roll Double Touch**.
- **Blocker & Aerial Superiority (CB / DMF / Defensive FB)**: *Blocker* triggers automated outstretched-leg blocks on cutbacks, while *Aerial Superiority* is non-negotiable against cross-heavy \`Edged Crossing\` and \`Dynamic Volley\` setups.
- **Through Passing (AMF / Orchestrator DMF)**: Adds critical curl and lane-bending accuracy to ground and lofted through balls feeding your \`Key Man\`.

## Smartest Ways to Spend 100 Select Position Tokens

Remember Konami's eligibility rule: **Select Position Tokens** only upgrade positions where a card already holds partial (light-green) compatibility—you cannot turn a pure CB into a CF. Where 100 Select Position Tokens shine brightest:

1. **Unlocking AMF on Explosive Wingers (LWF/RWF/RMF -> AMF)**: Essential if you run narrow **4-2-2-2** or **4-2-1-3** Fluid Formations and want wingers like Lamine Yamal, Bale, or Quaresma operating centrally without an OVR/stat penalty.
2. **Unlocking CF on Goal-Scoring SS / Wingers**: Gives hybrid forwards full familiarity as lone or paired strikers.
3. **Unlocking CB or DMF on Hybrid Fullbacks**: Lets fast Defensive Fullbacks slide into a back-three or double-pivot cleanly.

## Don't Forget Position-Aware Booster Crafting (15-Booster Pool)

Pair your Select Tokens with Konami's expanded **Booster Crafting** pool—which includes specialized boosters like **Regista**, **Ball Protector**, **Accuracy**, and **Duelling**—where Random Booster Tokens draw from a filtered pool of 15 position-relevant boosters rather than wasting striker boosters on defenders.`,
    author_name: "eFootballMarket Meta Desk",
    cover_image_url: "/images/articles/ef27-select-tokens-yamal.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-09T14:00:00.000Z",
    updated_at: "2026-11-10T08:30:00.000Z",
  },
  {
    id: "guide-dual-link-up-managers-90-proficiency",
    title:
      "Dual Link-Up Play & 90-Proficiency Managers in eFootball 2027: Klopp, Conte, Kovač & Mourinho",
    slug: "efootball-2027-dual-link-up-managers-90-proficiency-meta",
    category: "efootball_news",
    summary:
      "Managers in eFootball 2027 now reach 89–90 Team Playstyle proficiency and carry TWO simultaneous Link-Up Plays. Here is how Centrepiece + Key Man triggers work and which 750–1,500 Coin managers are worth owning.",
    content: `## From +1 Stat Boosters to Dual Link-Up Play Tacticians

Manager selection in **eFootball 2027** is no longer just about buying any 88-proficiency coach. Over the past two cycles, Konami introduced **Link-Up Play**—special tactical combination moves triggered between two designated roles in your starting XI—and in **v6.0 / v6.1** escalated the meta with **Dual Link-Up Managers** and **89–90 Team Playstyle Proficiency** ratings.

When scouting an account to buy on [eFootballMarket](/browse) (or deciding where to spend 750 to 1,500 eFootball Coins), expired and limited-edition Link-Up Managers are now some of the highest-value assets a Dream Team can hold.

## How Link-Up Play (\`Centrepiece\` + \`Key Man\`) Actually Triggers

![In-game Link-Up Play setup showing how the Centrepiece and Key Man positions and playing styles activate boosted passing and runs](/images/articles/ef27-mourinho-linkup-play.jpg)

Inside **Game Plan -> Tactics -> Link-up Play**, each manager's skill specifies an exact **position** and **Playing Style** for two players:

1. **The Centrepiece (Passer / Trigger)**: For example, a *Creative Playmaker* at \`AMF\` or \`LWF/RWF\`, or an *Orchestrator* at \`DMF\`.
2. **The Key Man (Runner / Finisher)**: For example, a *Goal Poacher* at \`CF\` or a *Hole Player* at \`LMF/RMF\`.

When both slots are filled by matching players and the **Centrepiece** receives possession in the trigger zone, the **Key Man** automatically fires a scripted high-priority run while through passes, chipped balls, and first-touch trapping between the pair receive a noticeable accuracy and speed buff.

## Top Meta Managers in eFootball 2027 Right Now

1. **Jürgen Klopp (2018–19 Liverpool Pack — 750 Coins, v6.1.1)**:
   - **Proficiency**: **90 Quick Counter** & **83 Overload**
   - **Boosters**: **+1 Defensive Awareness** & **+1 Stamina** (ideal for heavy counter-pressing!)
   - **Dual Link-Up Plays**: **2-Man Press A** + **Breakthrough Pass D** (*Creative Playmaker* LWF/RWF -> *Goal Poacher* CF), plus Highlight **Alexis Mac Allister** and **Wataru Endo** included in the bundle.
2. **Niko Kovač (Borussia Dortmund 26–27 Club Pack — Oct 2026)**:
   - **Proficiency**: **90 Possession Game** & **89 Out Wide**
   - **Boosters**: **+1 Ball Control** & **+1 Defensive Engagement**
   - **Dual Link-Up Plays**: **Aggressive Centring B** + **Shadow Link B**. One of the strongest dual-playstyle Possession/Out Wide managers ever released.
3. **Antonio Conte (v6.0 Launch Pioneer)**:
   - The very first manager introduced with **two Link-Up Plays** (**Touchdown Pass C** + **One-Two Cut-In B**), giving counter-attacking 3-5-2 and 3-4-3 squads lethal automatisms.
4. **Specialist Single & Dual Link-Up Options**:
   - **Christian Chivu** (Inter 26–27 Club Pack, 1,500 Coins alongside Show Time *Low Screamer* Lautaro Martínez).
   - **Ricardo Rodríguez** (**88 Possession Game**, Dual Link-Up: *Over-the-Top Pass A* + *Breakthrough Pass A*) & **Tomoaki Makino** (*Overload* specialist, *Over-the-Top Pass C* + *1-2 Cut-in B*) for 750 Coins each.
   - **Frank Rijkaard** (*89 Quick Counter / Out Wide*, *Over-the-Top Pass B*, +1 Tight Possession & +1 Balance), **Fabio Capello** (*Over-the-Top Pass A*), **Ronald Koeman** (*89 Out Wide / 88 Possession*, *Aggressive Centering A*), and **José Mourinho** (*Diagonal Long Pass A*).

## Why 88–90 Proficiency Saves Custom Progression Points

Under an **88–90 proficiency manager**, attributes at **85+** jump by **+3** on the pitch (and **+4** if stacked with one of the manager's +1 stat boosters!). Never waste expensive 3-point and 4-point progression levels pushing raw stats to 97–99 when **95–96 raw** already hits the **99 cap** automatically in your Game Plan.`,
    author_name: "eFootballMarket Meta Desk",
    cover_image_url: "/images/articles/ef27-klopp-linkup-manager.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-08T15:30:00.000Z",
    updated_at: "2026-11-10T08:00:00.000Z",
  },
  {
    id: "guide-dynamic-volley-and-2026-showtime-skills",
    title:
      "Mastering Dynamic Volley & Late-2026 Show Time Skills: Low Screamer, Magnetic Feet & Trusted Shields",
    slug: "efootball-2027-dynamic-volley-and-new-show-time-skills-meta",
    category: "efootball_news",
    summary:
      "How to trigger v6.0.0's mid-air Dynamic Volley command instead of weak headers, plus a practical breakdown of the newest Show Time skills—Low Screamer, Magnetic Feet, Snap Strike, Attack Trigger, and Aerial Fort.",
    content: `## Dynamic Volley: Turning Crosses & Second Balls Into Rockets

Before **eFootball v6.0.0**, firing at goal off a waist-high cross or a cleared corner bounce frequently forced your striker into a weak, looping header straight into the goalkeeper's gloves. Konami solved this directly with the **Dynamic Volley** mechanic.

### How to Trigger Dynamic Volley on Mobile & Console/PC
- **The Exact Input**: Perform a **Stunning Shot** command (*Flick Shoot Left/Right* on Classic Mobile touch controls, or *R2/RT + Shoot* on Console/PC) **while the incoming ball is still airborne**—whether from an early cross, a chipped \`Over-the-Top\` Link-Up pass, or a penalty-box clearance.
- **Visual Confirmation**: Your striker's power gauge turns **purple**, and players with high *Finishing*, *Kicking Power*, and *Acrobatic Finishing* adjust their body stride using v6.0's new cross-step animations to unleash scissor volleys, side-volleys, or driven downward strikes regardless of ball height.
- **Timing Caveat**: Because Stunning Shots require a slightly longer wind-up than standard shots, trigger the Dynamic Volley **before** the ball reaches your striker's chest—if a *Tough Marker* CB is already touching your striker's back, use a normal first-time tap instead so you aren't dispossessed mid-swing.
- **Smart Assist Interaction**: When *Smart Assist* is enabled, the engine can automatically convert high-ball opportunities in front of goal into Dynamic Volleys—one reason crosses from \`Edged Crossing\` specialists have surged in the v6.1 meta.

## Late-2026 Show Time Skills Ranked by Real Pitch Impact

Konami has rapidly expanded the **Show Time** skill roster across recent Epic, Big Time, and Club Packs. Here is what the newest skills actually do in Division 1 matches:

1. **Low Screamer (Shooting)**: Drives venomous, low-trajectory skimming strikes into the bottom corners that beat tall goalkeepers before they can fold their legs—featured on **Epic Marco van Basten**, **Show Time Lautaro Martínez** (Inter 26–27 pack), **Epic Diego Forlán**, and **Show Time Adama Traoré**.
2. **Magnetic Feet & Snap Strike (Dribbling / Finishing)**: Headlined by **Epic Ruud Gullit** and **Clarence Seedorf** in October 2026, *Magnetic Feet* keeps close-control touches glued to the boot during v6.0's rebalanced slower Dash Dribble speed, while *Snap Strike* accelerates short-backlift shots inside crowded penalty boxes.
3. **Attack Trigger (Midfield Transition)**: Seen on **Epic Xabi Alonso**, **Clarence Seedorf**, and **Show Time Martin Ødegaard**, sharpening forward movement and progressive ball release the moment midfield possession is secured.
4. **Aerial Fort, Shadow Hunt & GK Directing Defence (Defensive Meta)**: Featured in October's **Show Time: Trusted Shields** box (**Micky van de Ven** carrying *Fortress + Aerial Fort + Shadow Hunt*, and **Thibaut Courtois** with *GK Directing Defence*), directly countering \`Bullet Header\` and \`Dynamic Volley\` cross spam.
5. **Edged Crossing + Momentum Dribbling**: The signature combo on newly debuted **Epic Ricardo Quaresma** and **Show Time Wesley**, whipping dipping early crosses behind high \`Overload\` defensive lines.`,
    author_name: "eFootballMarket Tactical Desk",
    cover_image_url: "/images/articles/ef27-dynamic-volley-konami.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-07T12:00:00.000Z",
    updated_at: "2026-11-09T18:00:00.000Z",
  },
  {
    id: "update-showdown-and-custom-tournaments-efootball-2027",
    title:
      "Inside eFootball 2027's New Modes: \"Do-or-Die\" Showdown PvP & 8-Player Custom Tournaments",
    slug: "efootball-2027-showdown-mode-and-custom-tournaments-guide",
    category: "update",
    summary:
      "How v6.1's high-stakes Showdown knockout mode rewards Select Skill Tokens, and how v6.0's in-game 8-player Custom Tournament mode (with live organizer spectating) powers community cups.",
    content: `## Two Competitive Modes That Changed Weekly Grinding

For seasons, players complained that outside of **eFootball League** Division pushes and repetitive 50-Coin Thursday events, Dream Team lacked genuine tournament tension. In **eFootball 2027 (v6.0.0 and v6.1.0/v6.1.1)**, Konami answered with two dedicated tournament modes: **Showdown** for solo PvP rewards, and **Custom Tournament** for community organizers and friend groups.

## 1. Showdown PvP: Win to Advance, One Loss Ends Your Run

![Reaching the Showdown Final in eFootball 2027—every round is single-elimination with Select Skill Tokens on the line](/images/articles/ef27-showdown-final-mode.jpg)

Introduced in **October 2026 (v6.1.0 / v6.1.1)**, **Showdown** is a limited-attempt, bracket-style online PvP gauntlet where every single match carries knockout stakes:

- **Single-Elimination Format**: Win your match to advance deeper toward the **Showdown Final**; lose once and your current run resets, consuming one of your limited event entries.
- **High-Value Token Rewards**: Showdown is one of the primary free-to-play sources of **Select Skill Tokens**—making every run count toward your next 100-token guaranteed skill pick.
- **Survival Tips for Showdown Runs**:
  1. Check **Live Update Condition Arrows** carefully—prioritize **Permanent-B Condition** Epics and **A/B-rated** starters so a red arrow never ruins a Final.
  2. Prepare **at least 2 of your 20 Game Plan Lists** specifically for Showdown: a balanced starter Fluid Formation, and a compact **Long Ball Counter** 5-at-the-back closing setup for protecting a 1-0 lead after the 75th minute.
  3. Never enter a Showdown match on unstable 1–2 bar mobile signal—wait for a clean **4-bar or 5-bar** connection on 5 GHz Fiber or locked 4G LTE.

## 2. Custom Tournament Mode: Native 8-Player Brackets & Live Spectating

Launched in **v6.0.0**, **Custom Tournament** lets any player create and host structured tournaments for **up to 8 participants** directly inside eFootball without external spreadsheets:

- **Custom Squad & Match Rules**: Organizers can run open Dream Team whale brackets, enforce themed club/nationality rules, or customize match timers and extra-time/penalty settings.
- **Real-Time Organizer Spectating**: Tournament hosts can **spectate live matches** between participants in real time—making dispute verification, fair-play monitoring, and live TikTok/YouTube commentary effortless for Kenyan clans!
- **900 Backup Player Slots & 20 Game Plans**: Combined with Konami's expansion to **900 Backup Player Slots** and **20 Game Plan Lists** (up from 10 in v5.5.0), serious competitors can maintain dedicated U-3100, Partner Club, African National Team, and Unlimited Whale squads simultaneously.

Want to test your Dream Team in organized Kenyan cash brackets with M-Pesa Till prize custody? Check active brackets in our [Tournaments Arena](/tournaments).`,
    author_name: "eFootballMarket Competitions Desk",
    cover_image_url: "/images/articles/ef27-custom-tournament-bracket.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-06T11:00:00.000Z",
    updated_at: "2026-11-09T11:00:00.000Z",
  },
  {
    id: "guide-efootball-league-ranked-rules-match-analysis",
    title:
      "eFootball League Ranked Guide (2026/27): No Mid-Phase Relegation, Smart Assist Lock & 10-Match Analysis",
    slug: "efootball-league-division-1-no-relegation-match-analysis-guide",
    category: "efootball_news",
    summary:
      "How Division 1–3 relegation protection, previous-phase Rating seeding, locked PvP Smart Assist settings, 10-Match Analysis charts, and 60 FPS Kenyan network tuning help you climb faster.",
    content: `## Modern eFootball League Rules Every Division Grinder Must Know

Between **v5.5.0** and **v6.1.1 (October 2026)**, Konami quietly rewrote the rules of **eFootball™ League (PvP Category)**—changing how promotions, relegations, rating resets, and assistive controls work in ranked play:

1. **Zero Mid-Phase Relegation in Divisions 1, 2 & 3**: Once you break into **Division 3, Division 2, or Division 1** during an active Phase, **you can no longer be relegated back down mid-Phase**, even if you hit a tough losing streak while testing a new Fluid Formation!
2. **Previous-Phase Division Affects Starting Rating**: At the start of each new Phase (such as October's Phase 3/4 cycle), your initial PvP Rating calculation now factors in the highest Division you reached in the previous Phase—rewarding late-season pushes.
3. **Smart Assist Locked During PvP Matches**: Players can **no longer toggle Smart Assist on or off mid-match** in PvP games. Furthermore, **patch v6.1.1 (October 15, 2026)** fixed the annoying visual bug where power gauges failed to display in online PvP matches against opponents using Smart Assist.
4. **Phase Rank Show Time Rewards**: Reaching high ranks in eFootball League continues to award exclusive **Highlight / Show Time** cards (such as Phase 3's **Show Time Adama Traoré** with *Acceleration Burst* and *Low Screamer*).

## Using the 10-Match PvP Match Analysis Tool to Fix Leaks

Instead of guessing why you plateau around 1,750 Rating, open Konami's built-in **Match Analysis** screen, which audits your **last 10 PvP matches** and benchmarks your tendencies against players in higher divisions:

- **Goal Type Ratio**: Tracks what percentage of your goals scored—and goals conceded!—come from *Low Through Balls*, *Chipped Through Balls*, *Crosses*, *Low Crosses*, *Dribbling*, *Set Pieces*, *Rebounds*, or *Right After Stealing*.
- **Attacking & Defensive Habit Charts**: Reveals how frequently you rely on *Dash Dribbling* vs *Finesse Dribbling*, and how often you commit to *Pressing* vs *Match-Up* jockeying.
- **Quick Diagnostic Fix**: If your chart shows 60%+ of goals conceded come from *Low Through Balls* and *Right After Stealing*, you are holding Dash-Press with your Centre-Backs and forcing risky central passes out from the back. Switch cursor change to **Semi-Assisted**, track runners manually with your DMF, and let your Fluid Formation settle before playing forward.

## Smooth 60 FPS & Low-Jitter Matchmaking in Kenya

Even the best 3220+ squad loses 50/50 duels if thermal throttling or wireless packet jitter delays your inputs:

1. **Graphics -> Standard + 60 FPS**: On Android and iOS, locking **Standard Graphics + 60 FPS** keeps frame pacing flat at **16.6 ms** across all 90 minutes without overheating mid-range Snapdragon/Dimensity phones in the second half.
2. **5 GHz Fiber or Locked 4G LTE**: On Safaricom Home Fibre, Zuku, or Faiba, always connect to the **5 GHz** Wi-Fi band. When playing on mobile data indoors where 5G fluctuates at 1–2 bars, lock your network mode to **4G / LTE Only** to prevent mid-match 5G-to-4G handover freezes.
3. **Matchmaking Area**: Keep **Search Nearby Area Only** enabled and accept **4-bar or 5-bar** connections so One-Touch Passes and Dynamic Volleys register instantaneously.`,
    author_name: "eFootballMarket Editorial Desk",
    cover_image_url: "/images/articles/ef27-match-analysis-konami.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-05T10:00:00.000Z",
    updated_at: "2026-11-08T10:00:00.000Z",
  },
  {
    id: "announcement-efootball-championship-2027-300k-caf",
    title:
      "eFootball Championship 2027 ($300,000 Prize Pool), Partner Club Qualifiers & Konami × CAF African Content",
    slug: "efootball-championship-2027-300k-prize-pool-and-caf-afcon-roadmap",
    category: "announcement",
    summary:
      "Konami tripled the official eFootball Championship 2027 prize pool to $300,000, expanded World Finals to 24 players with Africa Regional Finals, and deepened African football content through its official CAF partnership.",
    content: `## Biggest Esports Expansion in Franchise History: $300,000 on the Line

Konami officially kicked off the **eFootball™ Championship 2027** circuit in October 2026 with two headline upgrades for competitive Mobile and Console/PC players worldwide—including **Africa**:

1. **Prize Pool Tripled to $300,000**: Up three-fold from the previous season's global pool.
2. **Expanded 24-Player World Finals (Summer / July 2027)**: More qualification berths across both **eFootball Championship Open** (with dedicated **Africa**, Europe, Americas, East Asia, and West Asia Regional Finals in May–June 2027) and the **6 Official Partner Club Events**.

## Complete 2026–2027 Partner Club Event Calendar

Every Partner Club competition features **5 stages**—Round 1 (VS AI), Round 2 (PvP), Round 3 (15-Match Ranking Round where the **Top 16 Mobile and Top 16 Console players** advance), Club Regional Qualifiers, and live **LAN Club Finals**—each accompanied by themed Club Packs and Chance Deals in-game:

- **FC Internazionale Milano**: Online Qualifiers started October 8, 2026 · **Club Finals: November 28, 2026**
- **Borussia Dortmund**: Online Qualifiers **November – December 2026** · Club Finals: December 2026
- **Arsenal FC**: Online Qualifiers **December 2026 – January 2027** · Club Finals: January 2027
- **FC Barcelona**: Online Qualifiers **January – February 2027** · Club Finals: March 2027
- **Manchester United**: Online Qualifiers **February – March 2027** · Club Finals: May 2027
- **AC Milan**: Online Qualifiers **March – April 2027** · Club Finals: April – May 2027

Meanwhile, **eFootball Championship 2027 Open** in-game First Qualifiers run **January – April 2027**, Second Qualifiers **April – May 2027**, and **Africa Regional Finals** in **May – June 2027**.

## Konami × CAF Partnership & African Football Rising

African players have more official representation in **eFootball 2027** than ever before:

- **Official Konami × CAF Collaboration**: Following Konami's landmark partnership with the **Confederation of African Football (CAF)**, eFootball has already rolled out **Road to CAF AFCON 2027** Show Time packs (headlined by African stars like Achraf Hakimi, Nicolas Jackson, Calvin Bassey, and Ibrahim Mazza) alongside the **Moroccan League** addition in v6.0.0.
- **National Legends & East African Hype**: With East Africa (Kenya, Uganda, and Tanzania) co-hosting AFCON 2027 and Konami expanding its **Epic: National Legends** series across African footballing nations, Kenyan squad builders can finally pair elite African icons with European club legends.

Sharpen your tournament nerve every weekend ahead of the Open qualifiers in our local [eFootballMarket Tournaments Arena](/tournaments).`,
    author_name: "eFootballMarket Esports Desk",
    cover_image_url: "/images/articles/ef27-championship-2027-trophy.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-04T09:00:00.000Z",
    updated_at: "2026-11-09T09:00:00.000Z",
  },
  {
    id: "update-november-2026-pack-watch-squad-valuation",
    title:
      "eFootball 2027 Pack & Market Radar: Epic Quaresma, Ballon d'Or Big Time, Free Forlán & Black Friday Watch",
    slug: "efootball-2027-november-pack-watch-quaresma-ballon-dor-black-friday",
    category: "update",
    summary:
      "Which recent October–November 2026 eFootball 2027 packs actually hold long-term resale value in Kenya, what to watch in November's Black Friday campaign, and how to price Clean Konami ID squads in KES.",
    content: `## How Recent eFootball 2027 Packs Shape Kenyan Squad Prices

Between October's **v6.1.0 / v6.1.1** cycle and November's **Black Friday** build-up, Konami has dropped a dense streak of 150-player boxes, 50-player packs, and 1,500-Coin Partner Club bundles. If you are buying, selling, or swapping an account on [eFootballMarket Kenya](/browse), knowing which cards move real secondary-market value—and which are free login inflation—saves thousands of shillings.

## Standout Q4 2026 Releases That Hold Resale Demand

1. **Netherlands Epic Trio (Van Basten, Gullit, Rijkaard)**: Still the gold standard for spine value. **Hole Player Ruud Gullit** (*Magnetic Feet + Snap Strike*) and **Build Up CB Frank Rijkaard** (*Fortress + Long-Reach Tackle*) fit every Fluid Formation in the game and command instant buyer interest in Kenya.
2. **European Clubs Midfielders (Seedorf, Yaya Touré, Xabi Alonso)**: **Yaya Touré** (*Phenomenal Pass + Long-Reach Tackle*) alongside Patrick Vieira remains the benchmark physical midfield pivot in Division 1.
3. **Epic Ricardo Quaresma (50-Player Debut Pack)**: Making his long-awaited eFootball 2027 Legend debut as a *Cross Specialist / Front Line Poacher* with *Momentum Dribbling* and *Edged Crossing*, Quaresma's 50-player box odds made him a collector favourite.
4. **World Player of the Year / Ballon d'Or 2026 Pack & Partner Club Packs**: High-ceiling **104+ Big Time / Show Time** attackers (**Kane**, **Mbappé**, **Lamine Yamal**) plus the **Inter 26–27** (Christian Chivu + *Low Screamer* Lautaro Martínez) and **Borussia Dortmund 26–27** (90-Possession Niko Kovač + Show Time Nmecha) 1,500-Coin Club Packs offer tremendous value-per-coin compared to deep 150-box gambles.
5. **Free Campaign Epics vs Rare Box Epics**: Because **Epic Diego Forlán** (*Low Screamer*) was obtainable via the Halloween Daily Free Draw / 12-attempt guarantee (Oct 22 – Nov 5), experienced Kenyan buyers won't overpay for an account *just* because it shows Forlán or free tutorial Messi—buyers pay premiums for scarce 150-box spines (Vieira, Gullit, Maldini, Araujo, Courtois/Schmeichel/Cech) and **Dual Link-Up 90-Proficiency Managers**.

## Black Friday Campaign Is Now Live (12 Nov – 3 Dec 2026)

Konami's 12 November maintenance delivered exactly what the cycle promised: a Campaign Hub with Silver/Gold/Platinum Tickets (up to **5,000 Coins**), **Big Time Thierry Henry** in a 250-player Arsenal box, **Arsène Wenger** and **Mikel Arteta** as Dual Link-Up managers, and a **National Legends Selection** that includes Kenya's **Victor Wanyama**. Read the [full update breakdown](/news/efootball-2027-black-friday-update-nov-12-campaign-hub-henry-arsenal) and the [Henry pack review](/news/big-time-thierry-henry-epic-arsenal-fc-pack-review-builds-kenya).

- **Buyer Tip**: Sellers looking to fund fresh Black Friday spins frequently list clean, well-built 3150–3210+ squads at sharp KES prices on [Friday Drops](/friday-drops) and the [Main Marketplace](/browse).
- **Coin Carryover Reminder**: eFootball Coins **do not transfer across Android <-> iOS** OS families during Data Transfer (Android coins stay on Android; iOS coins stay on iOS), though all **Epic/Big Time/Show Time players, GP, Select Skill Tokens, and Managers** transfer 100% intact! Always match the listing's platform badge if you are buying an account specifically for its unspent Coin stash.`,
    author_name: "eFootballMarket Valuation Desk",
    cover_image_url: "/images/articles/ef27-messi-yamal-season-art.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-03T13:00:00.000Z",
    updated_at: "2026-11-10T07:30:00.000Z",
  },
  {
    id: "guide-verify-clean-konami-id-k-id-escrow-2027",
    title:
      "eFootball 2027 Konami ID Buyer Checklist: Google Play Unlink, New v6.0 k-ID Child Check & M-Pesa Escrow",
    slug: "how-to-verify-clean-konami-id-before-releasing-escrow",
    category: "escrow_guide",
    summary:
      "Updated for eFootball 2027 (v6.0 – v6.1.1): how to verify Google Play / Game Center is Not Linked, check for Konami's new k-ID Child Account restriction, avoid the Android OTP space bug, and rebind 2FA under Till 1572931 escrow.",
    content: `## 4 Checks Every Buyer Must Run Inside the 24-Hour Escrow Window

When you purchase a squad on **eFootballMarket Kenya** (or lock an external deal via our [Middleman Escrow Desk](/middleman)), your KES payment sits safely in **Safaricom Buy Goods Till 1572931** while you inspect the account. With **eFootball 2027 (v6.0.0 – v6.1.1)**, there are **four mandatory security checks** to complete before clicking **Confirm & Release Payout**.

## Check 1: Perform Title-Screen Data Transfer & Inspect \`Link Data\`

Never tap *Link Data* inside your own existing account—that overwrites links! Instead, from the **eFootball 2027 Title Screen**, tap the **bottom-right menu circle -> Data Transfer -> Transfer Data Linked to KONAMI ID**. Once inside the clubhouse:

1. Navigate to **Extras -> Support -> Link Data**.
2. Confirm **Link Data Using KONAMI ID** says **Linked**.
3. Confirm **Google Play** (Android) / **Game Center** (iOS) says **Not Linked**.
   - If Google Play or Apple Game Center shows *Linked*, **stop immediately**—a linked OS account lets the previous owner log back in without your Konami password. Take an uncropped screenshot and click **Raise Dispute** in your order room for a full M-Pesa escrow refund.

## Check 2: Verify It Is NOT a \`k-ID\` Restricted Child Account (New in v6.0.0!)

Starting with the **August 13, 2026 Season Update (v6.0.0)**, Konami integrated **\`k-ID\`** for parental consent and guardian controls on **KONAMI ID Child Accounts**:

- On a Child Account, performing **Data Transfers** or spending **eFootball™ Points** can trigger mandatory **parent/guardian KONAMI ID consent or guardian 2FA**, locking out a new buyer!
- **How to Verify**: Sign in at **https://my.konami.net** -> **Personal Information** during inspection and verify the registered Date of Birth / account type is a standard adult KONAMI ID with unrestricted **Email Address** and **Two-Step Verification** settings.

## Check 3: Check Monthly Data Transfers & Avoid the Android OTP Space Bug

- **10 Data Transfers Per Month Cap**: Konami enforces a hard limit of **10 Data Transfers per calendar month** (resetting on the 1st UTC). Once you transfer the squad onto your main phone, avoid hopping between multiple devices.
- **Fixing the Android \`"Left Spaces"\` OTP Loop**: When pasting the 6-digit Konami verification code on some Android keyboards (Gboard/Samsung clipboard), invisible trailing spaces can trigger a *"left spaces in the code"* error loop. Always **type the 6 digits manually** on the keypad rather than long-pressing Paste.

## Check 4: Rebind Email, Password & Two-Step Verification at \`my.konami.net\`

Once the roster, OVR, Epics, and clean \`Link Data\` check out:

1. Open **https://my.konami.net** -> **Personal Information -> Email Address** and change the email to a **fresh personal Gmail/Outlook** that already has its own 2FA turned on.
2. Open **Security -> Password** and set a brand-new 12–20 character password.
3. Open **Security -> Two-Step Verification** and bind OTP generation strictly to your new email or Authenticator app.
4. Return to your eFootballMarket order room and click **Confirm & Release Payout**—completing a 100% irreversible, clean handover!`,
    author_name: "eFootballMarket Trust & Safety",
    cover_image_url: "/images/articles/ef27-konami-security-pin.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-02T09:30:00.000Z",
    updated_at: "2026-11-10T09:15:00.000Z",
  },
  {
    id: "alert-konami-ban-waves-and-kenya-account-scams-2026",
    title:
      "2026/27 Safety Alert: Konami Auto-Clicker Ban Waves, Modding Warnings & WhatsApp Escrow Scams in Kenya",
    slug: "efootball-account-scams-and-konami-ban-waves-kenya-2026",
    category: "scammer_alert",
    summary:
      "Konami's October 2026 enforcement wave suspended accounts using automated macro tools and unauthorized client mods. Learn how to spot flagged accounts, fake M-Pesa SMS edits, and OTP hijacks before trading.",
    content: `## Konami's October 2026 Enforcement Wave: What Got Accounts Suspended

During **October 2026 maintenance updates** in **eFootball 2027**, Konami issued formal enforcement actions and permanent/temporary suspensions targeting two specific violations that directly affect secondary-market buyers:

1. **Automated Farming & Auto-Clicker Tools**: Konami suspended waves of accounts detected running third-party screen-macro / auto-clicker apps to farm GP, Tour Events, and My League matches unattended.
2. **Unauthorized Client Modding, Reverse Engineering & Void-Match Exploits**: Following earlier v5.5–v6.1 anti-cheat updates, Konami reiterated strict bans against modified mobile APKs, reverse-engineered clients, and network manipulation in **eFootball League** and **Showdown**.

**Why Escrow Inspection Saves You**: In blind WhatsApp/Telegram cash trades, scammers rush to dump accounts that have just received a Konami match restriction or negative-coin chargeback flag. On **eFootballMarket Kenya**, your M-Pesa payment stays locked in **Till 1572931** until you sign in on the official Play Store / App Store / Steam / PlayStation client and verify the account enters online matchmaking cleanly.

## 5 Active WhatsApp & Facebook eFootball Scams in Kenya Right Now

1. **The Pre-Payment \`my.konami.net\` OTP Hijack ("Let Me Log In Just to Check")**: A scammer posing as a serious buyer asks for your Konami ID email, password, and a single 6-digit OTP *"just to view your Fluid Formation in-game before sending M-Pesa."* Instead of opening eFootball, they enter that 6-digit OTP on **my.konami.net** to swap your registered email address and steal your squad in 25 seconds! **Never share a Konami OTP until escrow payment is verified inside an active order room.**
2. **Edited M-Pesa Confirmation SMS Screenshots**: Fraudsters use fake SMS generators to send \`Confirmed. Ksh6,500.00 sent to...\` screenshots while pressuring you over a phone call that *"Safaricom messages are delayed."* Always check your real M-Pesa balance via \`*334#\` or the M-Pesa App—or trade exclusively through **Till 1572931** escrow.
3. **Stolen 3230+ Ballon d'Or / Henry / Gullit Whale Screenshots for KES 2,000**: Any stranger advertising a squad loaded with 15+ Double-Booster Epics and 90-proficiency managers for KES 1,800 *"urgent school fees quick sale"* is recycling screenshots lifted from TikTok or Telegram.
4. **Cropped \`Link Data\` Screenshots**: Sellers who crop out the bottom half of **Extras -> Support -> Link Data** are almost always hiding an active **Google Play** or **Game Center** link so they can log back in two days after you pay.
5. **Fake WhatsApp Group "Trusted Admins"**: Colluding scammers run 900-member trading groups where the "seller" and the "official group middleman" are the exact same person operating two SIM cards.

## Trade With Zero Guesswork

- Run every unknown phone number, Till number, or social handle through our free [Scammer Check Database](/scammer-check) before replying.
- Found a genuine seller on WhatsApp, TikTok, or Facebook? Generate an instant protected deal link on our [Middleman Escrow Desk](/middleman) so neither side ever goes first blindly.`,
    author_name: "eFootballMarket Trust & Safety",
    cover_image_url: "/images/articles/ef27-stadium-night-lights.jpg",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-09T15:00:00.000Z",
  },
];
