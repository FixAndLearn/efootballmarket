import { NewsArticle } from "@/types/database";

/**
 * Evergreen, original platform reference guides for Kenyan eFootball players.
 * Strictly educational documentation (zero fake listings, zero fake orders, zero fabricated view counts).
 */
export const EDITORIAL_GUIDES: NewsArticle[] = [
  {
    id: "guide-unlink-verification",
    title: "How to Check If an eFootball Account Has Google Play or Game Center Linked",
    slug: "how-to-check-google-play-and-game-center-links-in-efootball",
    category: "escrow_guide",
    summary:
      "Before confirming any account purchase, buyers must verify that only a Konami ID is linked. Here is where to check inside eFootball Mobile and why linked Google Play or Apple IDs are rejected.",
    content: `One of the most common ways buyers lose money in peer-to-peer eFootball trades is purchasing an account that still has the seller's Google Play Games (Android) or Apple Game Center (iOS) profile attached. Even after you change the Konami ID email and password, a linked Google or Apple account can still sign back into the squad from the title screen.

Why Linked Accounts Are Blocked on eFootballMarket

Unlike a Konami ID—where the registered email address, password, and two-step verification can be transferred cleanly to a new owner—Google Play and Apple Game Center links are tied to the seller's personal phone account. Because most sellers cannot hand over their primary Gmail or iCloud account, any squad with an active Google Play or Game Center link remains vulnerable to shared logins or recovery.

For that reason, eFootballMarket requires every listed account to be linked exclusively via Konami ID ("Clean Konami ID").

Where to Check Link Status Inside eFootball Mobile

During your 24-hour inspection window, open eFootball on your phone, complete the initial data transfer using the Konami ID credentials provided in your order room, and check the link screen immediately:

1. From the main menu inside the game, tap Extras in the top-right navigation bar.
2. Open Support, then tap Link Data.
3. Review both rows shown on the screen:
   - Link Data Using Konami ID should display "Linked".
   - Link Data Using Google Play (on Android) or Link Data Using Game Center (on iOS) must display "Not Linked".

What to Do If Google Play or Game Center Shows "Linked"

Do not click Release Funds and do not spend coins or train players on the account. Instead:

1. Take an uncropped screenshot of the Link Data screen showing both link statuses.
2. Open your active order page on eFootballMarket and click Raise Dispute before the 24-hour timer expires.
3. Upload the screenshot in the order evidence panel.

Once our support team confirms that a third-party platform account is attached contrary to platform rules, the held M-Pesa payment is refunded in full to your Safaricom number.`,
    author_name: "eFootballMarket Support",
    is_pinned: true,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-01T09:00:00.000Z",
    updated_at: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "guide-konami-id-transfer",
    title: "Step-by-Step Konami ID Transfer: Changing Email, Password, and Enabling 2FA",
    slug: "konami-id-email-transfer-and-two-step-verification-guide",
    category: "escrow_guide",
    summary:
      "A practical walkthrough for securing a newly purchased Konami ID at my.konami.net during your 24-hour inspection period before releasing seller funds.",
    content: `Logging into the game on your phone is only half of an account handover. You only control an eFootball squad once the underlying Konami ID is bound to an email address that belongs exclusively to you and protected with your own Two-Step Verification.

Step 1: Sign In at my.konami.net

Open your mobile browser and navigate directly to https://my.konami.net (always type the address yourself rather than tapping links sent over social media). Sign in using the Konami ID email and password revealed inside your eFootballMarket order page.

If the seller has Konami Two-Step Verification turned on, Konami will send a 6-digit verification code to the seller's email. Request that code inside the eFootballMarket Order Chat—never move the conversation off-platform, as order chat timestamps serve as your official record if a seller becomes unresponsive.

Step 2: Change the Registered Email Address

1. Inside My KONAMI, open Personal Information -> Email Address.
2. Enter a clean personal email address that already has two-factor authentication enabled on your email provider (such as Gmail or Outlook).
3. Konami will send a confirmation code to your new email address. Enter the code to finalize the change.

Step 3: Update the Password

Navigate to Security -> Password and set a unique password that you have never shared anywhere else. Avoid reusing passwords from other gaming sites or forums.

Step 4: Reset Two-Step Verification

Open Security -> Two-Step Verification. If the seller previously configured an authenticator or email 2FA, disable and re-enroll it under your newly updated email or authenticator app. This invalidates prior verification sessions.

Step 5: Test Data Transfer in eFootball Mobile

Launch eFootball Mobile, tap the menu icon on the bottom-right corner of the title screen (do not use the in-settings Link Data button, which overwrites data), choose Data Transfer -> Transfer Data Linked to a KONAMI ID, and sign in with your updated email and password.

Confirm that the collective team strength, Epic/Big Time cards, GP, and eFootball Coins match the listing photos. Once everything checks out, return to your order page and click Release Funds so the seller receives their M-Pesa payout.`,
    author_name: "eFootballMarket Support",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-03T10:30:00.000Z",
    updated_at: "2026-10-03T10:30:00.000Z",
  },
  {
    id: "guide-mpesa-escrow-explained",
    title: "How M-Pesa Payment Protection Works on eFootballMarket (Till 1572931)",
    slug: "how-mpesa-escrow-protection-works-in-kenya",
    category: "escrow_guide",
    summary:
      "Understand each stage of an eFootballMarket order—from Safaricom STK push deposit and seller delivery SLA to buyer inspection, release, and refund rules.",
    content: `Direct peer-to-peer trades on WhatsApp, Telegram, and Facebook groups fail for a simple reason: someone has to go first. If the buyer sends M-Pesa first, a dishonest seller can block them; if the seller hands over login details first, a dishonest buyer can change the email without paying.

eFootballMarket removes blind trust by holding the buyer's payment in the middle until account access is verified.

1. Order Creation and M-Pesa STK Push

When you buy a listed squad—or open a Bring-Your-Own-Deal contract on the Middleman page—the platform generates a tracked order reference and triggers an automated Lipa Na M-Pesa prompt (Till 1572931) to your Safaricom phone. Payment confirmation is matched server-to-server against the transaction callback rather than relying on forwarded screenshots, which prevents fake M-Pesa SMS scams.

2. 12-Hour Seller Delivery Window

Once payment is confirmed, the listing is locked so nobody else can purchase it, and the seller is notified to submit the Konami ID credentials through the encrypted delivery form within 12 hours. Sellers do not receive any money at this stage. If a seller fails to deliver within the window, the buyer can cancel for a full refund.

3. 24-Hour Buyer Inspection Period

As soon as credentials are submitted, a 24-hour inspection timer starts. During those 24 hours, the buyer logs into eFootball, checks that Google Play and Game Center are unlinked, verifies that players and coin balances match the listing description, and updates the Konami ID email and password at my.konami.net.

4. Payout Release or Dispute Review

- If the account matches as advertised, the buyer clicks Release Funds and the seller's net payout is queued for M-Pesa disbursement.
- If the credentials do not work, a third-party account is linked, or advertised cards are missing, the buyer clicks Raise Dispute and attaches screenshots or a continuous screen recording. Payout remains frozen while an administrator reviews the order chat and evidence.
- If 24 hours pass after credential delivery without the buyer opening a dispute, the order completes automatically so honest sellers are never left waiting indefinitely.`,
    author_name: "eFootballMarket Support",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-06T12:00:00.000Z",
    updated_at: "2026-10-06T12:00:00.000Z",
  },
  {
    id: "guide-kenya-trading-scams",
    title: "Spotting Common WhatsApp & Facebook eFootball Scams in Kenya",
    slug: "avoiding-whatsapp-and-facebook-efootball-scams-in-kenya",
    category: "scammer_alert",
    summary:
      "Learn how Kenyan scammers use edited M-Pesa messages, cloned group admin profiles, and Title-Screen overwrite tricks—and how to protect every trade.",
    content: `Most gaming fraud in Kenya relies on urgency and social pressure rather than technical hacking. Knowing the four most common patterns makes them easy to avoid.

1. Edited M-Pesa Confirmation Messages

When selling an account privately on WhatsApp, scammers often send an edited SMS claiming they have sent money to your M-Pesa number—sometimes followed by a call pretending to be Safaricom customer care asking you to "reverse" an overpayment. Never rely on a forwarded screenshot or an SMS from a normal 07xx/01xx mobile number. Always check your actual M-Pesa statement via the M-Pesa app or official Safaricom sender ID, or sell through eFootballMarket where payment callbacks are verified automatically.

2. Cloned Group Admin / Fake Middleman Numbers

In large Facebook and WhatsApp trading groups, impersonators copy a well-known group admin's display photo and bio, then create a three-way group chat with a victim. Before trusting any off-platform deal, run the phone number through the Scammer Check tool on eFootballMarket or initiate your own contract directly at efootballmarket.co.ke/middleman.

3. The In-Game "Link Data" Overwrite Trap

Scammers sometimes ask an inexperienced seller or buyer to log into a Konami ID by going to Extras -> Support -> Link Data inside an already open guest account. Tapping Link Data inside Settings overwrites the Konami ID with your blank squad instead of downloading the existing squad!

Always download an existing squad from the Title Screen (bottom-right menu button -> Data Transfer), never from inside the in-game Extras menu.

4. "Half Now, Half After Login" Deals

Offering to accept a 50% deposit is the oldest hook in social media groups: the scammer collects KES 1,000 or KES 1,500 from ten buyers in an afternoon using the same stolen squad screenshots and blocks everyone. Legitimate sellers have no problem waiting 24 hours when 100% of the purchase price is already confirmed and held in neutral escrow.`,
    author_name: "eFootballMarket Support",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-10T14:15:00.000Z",
    updated_at: "2026-10-10T14:15:00.000Z",
  },
  {
    id: "guide-seller-listing-standards",
    title: "Seller Guide: Preparing Clear Screenshots and Pricing Your Squad Fairly",
    slug: "how-to-prepare-and-price-your-efootball-squad-for-sale",
    category: "efootball_news",
    summary:
      "What buyers look for when browsing eFootball accounts in Kenya: clear Game Plan screenshots, unlinked account proof, realistic KES pricing, and fast 2FA handovers.",
    content: `Well-documented listings sell faster and face almost zero disputes during buyer inspection. Before publishing a squad on eFootballMarket, take five minutes to prepare clean, accurate details.

1. Capture the Four Screenshots Buyers Actually Check

Upload sharp, uncropped landscape screenshots directly from your device:
- Game Plan (Starting XI & Manager): Shows real Collective Strength (remove temporary My League loan players first so the OVR rating is permanent), playstyle proficiency, and manager boosters.
- Substitutes & Reserves: Highlights key Epic, Big Time, Show Time, and meta POTW cards that add value beyond your starting lineup.
- Top Bar Balances: Clearly shows current eFootball Coins and GP so there is no confusion at handover.
- Link Data Screen (Extras -> Support -> Link Data): Proves upfront that Konami ID is Linked while Google Play and Game Center show Not Linked.

2. Price Realistically for the Kenyan Market

Buyers compare squads primarily by permanent Epic/Big Time starters (such as Gullit, Vieira, Maldini, Araujo, Blitz Curler wingers, and 88-proficiency booster managers) rather than raw GP or standard highlight cards. Check similar OVR squads on the Browse page and enable Make Offer if you are open to reasonable negotiation.

3. Prepare Your Konami ID Before Someone Buys

Before listing, make sure you can access the email inbox tied to your Konami ID without delay. Once a buyer pays into Till 1572931, you have up to 12 hours to deliver credentials, and staying responsive in the Order Chat to pass the one-time Konami email change code lets the buyer verify and release your M-Pesa payout much sooner.`,
    author_name: "eFootballMarket Support",
    is_pinned: false,
    is_published: true,
    views_count: 0,
    created_at: "2026-10-14T11:00:00.000Z",
    updated_at: "2026-10-14T11:00:00.000Z",
  },
];
