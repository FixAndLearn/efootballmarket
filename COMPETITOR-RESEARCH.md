# What the competition does that you don't — and what's worth taking

Researched 2026-11-17 against PlayerAuctions, G2G, Eldorado.gg, Z2Market/Z2U,
PlayerSells and the eFootball-specific operators. Everything here was checked
against your current code so it says what you *don't* already have.

---

## 0. Read this first: there is a direct competitor on your name

`efootballmarket.com` — **not yours** (`www.efootballmarket.co.ke`). Same niche,
same product category, and they are further along operationally:

- 96 live listings, median $100, priced in **USD**
- **AI-verified listings** — screenshot verification before the listing goes live
- "Reviewed before they go live" — pre-publication moderation, not post-hoc
- Sellers **can be messaged from the listing page before buying** (negotiation)
- Listings can be **Reserved** / "Sale in progress" so two buyers can't collide
- Community funnel to WhatsApp group + Facebook group
- Full price-transparency page: median, quartiles, range by strength/platform

You have 23 listings at KES. They are winning on inventory and on the
verification story.

**Two concrete consequences:**

1. **Trademark.** Same name, same market, `.com` vs `.co.ke`. If they have a
   registered mark you are the more exposed party, because your domain is the
   country variant of theirs. Worth checking KIPI. I can't advise on this, but
   it should be checked before you spend more on the brand.
2. **SEO collision.** Searching "efootball market" surfaces them. Your
   differentiator is *Kenya + M-Pesa + KES*, and your titles/meta should say
   that harder than they currently do.

---

## 1. The single biggest gap: nothing protects the buyer *after* release

This is the finding that matters most, and it is an operational risk, not a
feature request.

**What every real competitor does:** a post-sale claim window where a seller's
money is still reachable if the account gets recalled.

| Platform | Window after sale |
|---|---|
| PlayerSells | 30 days; a report **freezes uncleared seller funds and blocks withdrawals** |
| PlayerAuctions | 72h inspection + optional 7/14/30-day seller warranty |
| Eldorado / Agoras | 5–14 days TradeShield, extendable to 3–6 months paid |
| G2G | 72h inspection + 14-day account warranty |
| Z2U | 72h claim window |
| **eFootballMarket KE** | **24-hour inspection, then nothing** |

Eldorado's own seller rules are blunt about why:

> "Never log in to or recover an account after you've sold it… You stay
> responsible for the account during the TradeShield protection period **and
> after it ends**."
>
> "Zero tolerance for account recovery… You'll be permanently suspended."

**Your current state**, read from your own code and pages:
- `escrowService.ts` sets a **24-hour** inspection deadline, then releases.
- `/dispute-policy` says a post-release report **does not hold seller funds and
  does not reverse an M-Pesa transfer already sent**. Reimbursement is "a
  separate manual decision."

So today: seller gets paid on day 2, recalls the Konami ID on day 20, and your
policy page tells the buyer there is nothing to recover. That is the single most
common fraud in this exact category.

**The eFootball-specific reason this bites harder than it does for Steam:** the
whole handover hinges on the registered email. Konami's recovery path runs
through that email. If the seller keeps access to it, or knows the original
registration details, they can take the account back weeks later — and Konami
support is reported (in the complaint threads I read) to side with whoever holds
the *current* details. Buyers who lost accounts described exactly this: email
changed, then locked out permanently.

**What I'd build:**

- A **`SELLER_RECALL_WINDOW`** (start at 7 days, matching what buyers on
  r/eFootball and similar expect) during which a completed order can be
  re-opened for "account recovered" with funds still clawback-able,
- **Partial release**: release a percentage at confirmation, hold the rest until
  the window closes. This is the mechanism PlayerSells uses and it costs you
  nothing if the sale is honest.
- A **recall counter per seller**, permanent, visible, and never reset. One
  confirmed recall should be a hard suspension — every competitor treats it as
  zero-tolerance.

This is the highest-value thing on this list and it is a policy + escrow change,
not a big build.

---

## 2. Detection you can add cheaply: "is this the same account, relisted?"

I checked — you have **no duplicate/fingerprint detection at all**.

Competitors are repeatedly burned by one scam: sell an account, recall it, relist
it, sell it again. The same account gets sold two or three times.

**Cheap detection that fits your existing schema:** you already store team
strength, division, dream team name, matches played, wins/draws/losses, goals
scored/conceded, account age, and `konami_id_status`. That tuple is effectively a
fingerprint.

Build a `listing_fingerprints` table (hash of `dream_team_name +
overall_team_strength + matches_played + wins + goals_scored`) and flag on:

- identical fingerprint under a **different seller** → block or hold for review
- identical fingerprint under the **same seller** within 90 days after a
  completed sale → this is the relist-after-recall pattern, flag hard

`dream_team_name` is the strongest single signal and sellers rarely change it.

---

## 3. AI screenshot verification — they have it, you don't

`efootballmarket.com` shows an **"AI verified"** badge on listings. You take
seller screenshots but nothing checks them.

You don't need a model. eFootball screenshots are extremely structured — team
strength, division, player list, coin balance are all rendered in fixed places.
Even a cheap pass gets you most of the value:

- OCR the **team strength** off the screenshot, compare to the listing's
  `overall_team_strength`. Mismatch → hold for review. This alone kills the most
  common lie ("3240 strength" with a screenshot showing 3010).
- Check the screenshot's **player names** against the listing's claimed
  legendaries/epics.
- Flag **identical image reuse** across listings (file hash + perceptual hash).
  This catches the same photos being used for accounts the seller doesn't own.

Sellers who fake screenshots are the ones who recall accounts. This is the
highest-leverage automated check you can build, and it does not need M-Pesa or
payment code touched.

---

## 4. Seller track record — you have a badge, they have a ladder

You have `is_verified_seller` (boolean). That's it.

PlayerAuctions runs **Lvl 1–5** with 30-day rolling performance metrics.
Eldorado runs tiered verification with extra checks for high-risk games.
G2G shows completed-order counts next to ratings.

A boolean tells a buyer nothing about whether this seller has done 0 sales or
50. Given all 23 of your listings are 0-sale (from the earlier audit), **the
honest version of this is more valuable than the impressive one**: show
"New seller · 0 completed sales" prominently rather than hiding it behind a
badge. Buyers trust visible honesty, and it protects you when a new seller
recalls an account — nobody can say they were misled.

Suggested ladder, all derived from data you already have:
- **New** (0 completed sales) — shown explicitly, not hidden
- **Established** (5+ completed, 0 disputes lost)
- **Trusted** (20+ completed, <5% dispute rate, 7-day recall window survived
  clean at least once)
- **Recall flag** — permanent, visible, overrides everything

---

## 5. Negotiation before purchase

`efootballmarket.com`: "Message the seller from the listing page before buying.
Many sellers accept reasonable offers."

You have order chat, but (from the code I read) messaging is scoped to an order.
A buyer who wants to ask "will you take 400 for this?" has no path except to
buy first.

This matters more than it sounds for a Kenyan market where price haggling is
normal. Competitors report it shortens time-to-sale materially.

**Caveat:** an open pre-sale inbox is also a scam surface, and your
`chatFilter.ts` currently blocks WhatsApp/Telegram/links in *order* chat. Any
pre-sale chat must run through the same filter or you've built a bypass around
your own best defense. If you build this, reuse `chatFilter` — don't write a
second one.

---

## 6. Reserve / "sale in progress" state

They show **Reserved — sale in progress** on listings so a second buyer can't
start a parallel checkout. You have status handling but not, as far as I can
tell, an in-flight reservation that hides the buy button.

Two buyers paying for one squad is a genuinely bad failure: you either refund
someone or you're short an account. Worth adding before volume picks up.

---

## 7. Transparency pages they have and you don't

`efootballmarket.com` publishes **median price, quartiles, and full range by
team strength and platform**. That's a trust device disguised as a pricing page:
it tells a buyer "you are not being ripped off" without anyone having to claim it.

You have 23 listings, so your numbers are thin — but you already have
`/compare` and the data to do this. A "what squads actually cost in Kenya"
page would also rank for price-intent searches, which is where buyers start.

---

## What I'd do, in order

1. **Seller recall window + partial release** (§1). Biggest risk, biggest gap.
   This is the one thing that could seriously hurt you with a growing community.
2. **Screenshot strength verification** (§3). Cheap, kills the most common lie,
   and lets you copy their "verified" badge honestly.
3. **Fingerprint / relist detection** (§2). Protects against the recall-and-resell
   loop, which is a direct consequence of growing volume.
4. **Honest seller track record** (§4). Cheap, and builds the trust the whole
   marketplace runs on.
5. **Reserve state** (§6). Prevents double-sale before it happens to you.
6. **Pre-sale negotiation** (§5) — only with `chatFilter` reused.
7. **Price transparency page** (§7).

§1 and §3 change how money is held and released. Per your standing instruction
I am not touching payment or settlement logic without you saying so explicitly —
tell me which of these you want and I'll scope it before writing anything.

---

## Note on the `.com` competitor

Because names collide, be careful with public claims. If they're claiming
"escrow protection" and a buyer confuses the two sites, the complaint lands on
whichever one they think they used. Your `/escrow-guarantee` and
`/dispute-policy` are already unusually precise about what is and isn't covered
(the post-release paragraph is honest and specific) — that precision is an asset.
Keep it.
