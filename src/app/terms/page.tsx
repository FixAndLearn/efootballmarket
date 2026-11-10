import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { PolicyPageShell } from "@/components/layout/PolicyPageShell";

export const metadata: Metadata = {
  title: "Terms of Service | eFootballMarket Kenya",
  description:
    "Complete Terms of Service governing account eligibility, Clean Konami ID transfers, Safaricom M-Pesa Till 1572931 escrow custody, commission fees, 12-hour delivery SLAs, 24-hour buyer inspection, and dispute resolution on eFootballMarket.co.ke.",
  alternates: { canonical: "https://www.efootballmarket.co.ke/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPageShell
      currentPath="/terms"
      badge="User Agreement"
      title="Terms of Service"
      subtitle="These Terms of Service form a binding agreement between you and eFootballMarket Kenya governing your access to efootballmarket.co.ke, our marketplace listings, Middleman escrow contracts, community tournaments, and editorial resources."
      summaryPoints={[
        "Independent peer-to-peer platform operated in Nairobi, Kenya — not affiliated with Konami Digital Entertainment or Safaricom PLC.",
        "Every squad sold on the marketplace must use a Clean Konami ID with Google Play Games and Apple Game Center completely unlinked.",
        "Buyer payments are held in platform escrow via Safaricom Buy Goods Till 1572931 until delivery and the 24-hour buyer inspection window finish.",
        "Sellers have 12 hours from payment confirmation to deliver login credentials and assist with any my.konami.net verification code.",
        "Buyers have 24 hours from credential delivery to inspect the squad in-game, rebind email/password/2FA, or open an evidence-backed dispute.",
        "Moving a marketplace buyer or seller off-platform to bypass escrow voids all platform buyer/seller protection and results in account suspension.",
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          1. Platform Operator, Scope &amp; Independent Status
        </h2>
        <p>
          <strong>eFootballMarket Kenya</strong> (&ldquo;eFootballMarket,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the web platform located at <strong>efootballmarket.co.ke</strong> from Nairobi, Republic of Kenya. We provide an online venue, neutral payment escrow workflow, Middleman transaction room, community tournament bracket organizer, and tactical editorial library for players of football simulation games.
        </p>
        <p>
          <strong>Non-Affiliation Notice:</strong> eFootballMarket is an independent peer-to-peer service and editorial publication. We are <strong>not</strong> affiliated with, endorsed by, sponsored by, or officially connected to <strong>Konami Digital Entertainment Co., Ltd.</strong>, <strong>Safaricom PLC</strong>, <strong>Sony Interactive Entertainment</strong>, <strong>Microsoft Corporation</strong>, <strong>Valve Corporation</strong>, <strong>Google LLC</strong>, or <strong>Apple Inc.</strong> All game titles, player card names, and platform trademarks remain the property of their respective owners and are referenced solely for descriptive identification.
        </p>
        <p>
          By creating an account, publishing a squad listing, submitting an offer, funding an escrow order, registering for a tournament, or using any tool on the site, you confirm that you have read, understood, and agreed to these Terms alongside our{" "}
          <Link href="/privacy" className="text-sx-green-text underline font-semibold">
            Privacy &amp; Cookie Policy
          </Link>{" "}
          and{" "}
          <Link href="/dispute-policy" className="text-sx-green-text underline font-semibold">
            Buyer Refund &amp; Dispute Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          2. Account Eligibility, Registration &amp; Verification
        </h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Minimum Age &amp; Capacity:</strong> You must be at least <strong>18 years old</strong> (or the age of legal majority in your jurisdiction) and legally capable of entering binding contracts under Kenyan law, including holding an active Safaricom M-Pesa line registered in your legal name or an authorized payment account for settlement.
          </li>
          <li>
            <strong>One Account Per Person:</strong> Each user may maintain only one active eFootballMarket profile unless explicitly authorized in writing by support. Creating secondary accounts to evade a suspension, manipulate offers, or conceal prior scam reports is strictly prohibited.
          </li>
          <li>
            <strong>Identity &amp; Seller Verification (KYC):</strong> To protect high-value transactions, we may require sellers—or buyers flagging unusual payment patterns—to complete identity and M-Pesa payout verification before publishing high-value listings or withdrawing wallet balances. You agree to submit truthful, unaltered identification details.
          </li>
          <li>
            <strong>Account Security:</strong> You are responsible for safeguarding your eFootballMarket password and email inbox. Notify support immediately at <strong>support@efootballmarket.co.ke</strong> if you suspect unauthorized access to your profile.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          3. Clean Konami ID Mandate &amp; Listing Accuracy Rules
        </h2>
        <p>
          Every squad listed for sale or settled through our Middleman room must satisfy all of the following ownership and disclosure standards:
        </p>
        <ol className="list-decimal pl-5 space-y-2.5">
          <li>
            <strong>Sole Ownership:</strong> The seller must be the legitimate, sole controller of the account and its bound email address. Selling stolen, phished, shared, rented, or cracked accounts is a zero-tolerance offense that results in immediate escrow cancellation, buyer refund, permanent ban, and logging in our fraud database.
          </li>
          <li>
            <strong>Mandatory Clean Konami ID Status (Mobile):</strong> Mobile accounts must be linked <strong>exclusively</strong> to a Konami ID. Under <em>Extras &rarr; Support &rarr; Link Data</em> inside the game, both <strong>Google Play</strong> and <strong>Apple ID / Game Center</strong> must read <em>&ldquo;Not Linked.&rdquo;</em> Accounts with active Google Play or Game Center bindings allow silent dual-login recovery by a previous owner and are ineligible for payout unless explicitly disclosed and waived in writing before payment (which our standard marketplace forbids).
          </li>
          <li>
            <strong>Permanent Squad Metrics Only:</strong> Listed Collective Strength (OVR), Epic/Big Time/Show Time counts, Booster Manager ratings, GP, and eFootball Coin balances must reflect <strong>permanent</strong> owned items. Inflating Collective Strength using temporary <em>My League</em> loan players or edited screenshots constitutes material misrepresentation.
          </li>
          <li>
            <strong>OS Coin Separation Disclosure (Android vs iOS):</strong> Under Konami&apos;s cross-OS rules, eFootball Coins purchased or earned on Android do not appear when logging in on iOS, and vice versa. Sellers must accurately select the native platform (`Android`, `iOS`, `PlayStation`, `Xbox`, or `Steam/PC`) where the advertised coin balance resides.
          </li>
          <li>
            <strong>Monthly Data Transfer Quota:</strong> Konami enforces a hard limit of <strong>10 Data Transfers per calendar month</strong> on mobile accounts. Sellers must ensure the listed account has at least <strong>2 remaining transfers</strong> in the current calendar month so the buyer can log in and verify without lockouts.
          </li>
          <li>
            <strong>Clean Account Standing:</strong> Accounts carrying negative eFootball Coin balances (from app-store chargebacks), active matchmaking restrictions, or terms-violation warnings may not be listed.
          </li>
        </ol>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          4. Order Formation, M-Pesa Till 1572931 Custody &amp; Platform Fees
        </h2>
        <p>
          A binding transaction is formed when a buyer either (a) clicks <strong>Buy Now</strong> at the listed Ask Price or (b) has an <strong>Offer</strong> accepted by the seller, and subsequently completes escrow payment.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Official Payment Channel Only:</strong> All marketplace orders, Middleman contracts, and paid tournament registrations settle exclusively through our authorized Safaricom M-Pesa Buy Goods Till <strong>1572931</strong> (either via automated STK Push or verified manual Till receipt entry). Payments sent directly to a seller&apos;s personal phone number, Pochi la Biashara, or external bank account are <strong>outside platform custody</strong> and are not covered by our Escrow Guarantee.
          </li>
          <li>
            <strong>Server Receipt Verification:</strong> An order moves to <em>Escrow Funded</em> status only when our payment gateway confirms the exact KES amount and unique M-Pesa transaction code (`Receipt Number`). Edited or forwarded SMS text messages are never accepted as proof of payment.
          </li>
          <li>
            <strong>Platform Escrow &amp; Service Fees:</strong> Publishing a standard squad listing is free. Upon successful order completion, eFootballMarket deducts the disclosed platform escrow service fee (displayed on the seller listing creation screen and order breakdown—standard marketplace commission is <strong>8% to 10%</strong> depending on order tier, or the flat Middleman fee shown prior to checkout) before crediting net proceeds to the seller&apos;s payout balance. Standard Safaricom M-Pesa carrier tariff charges apply to mobile money transfers.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          5. Seller Delivery Window (12 Hours) &amp; Buyer Inspection Window (24 Hours)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
          <div className="p-4 rounded-lg bg-sx-stone border border-sx-border space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-sx-green-text">
              Seller Handover SLA · 12 Hours
            </p>
            <p className="text-xs sm:text-[13px] text-sx-ink-soft leading-relaxed">
              Once an order is marked <em>Escrow Funded</em>, the seller has up to <strong>12 hours</strong> to submit valid Konami ID / platform credentials inside the encrypted Order Room and provide any required one-time verification code (`OTP`) so the buyer can rebind the email at <code>my.konami.net</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-sx-stone border border-sx-border space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-sx-green-text">
              Buyer Inspection SLA · 24 Hours
            </p>
            <p className="text-xs sm:text-[13px] text-sx-ink-soft leading-relaxed">
              Once credentials are delivered, the buyer has <strong>24 hours</strong> to log in, verify squad accuracy and Clean Konami ID status, change the registered email, password, and 2FA at <code>my.konami.net</code>, and click <strong>Confirm &amp; Release</strong> (or open a Dispute).
            </p>
          </div>
        </div>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Missed Seller Delivery:</strong> If the seller fails to deliver credentials within 12 hours and does not respond to order messages, the buyer may request immediate order cancellation and a <strong>100% escrow refund</strong>.
          </li>
          <li>
            <strong>Automatic Completion After 24 Uncontested Hours:</strong> If the seller delivers working credentials and completes email handover, and the buyer neither clicks <em>Confirm &amp; Release</em> nor opens a dispute within 24 hours of delivery, the platform treats the handover as accepted and may release net escrow proceeds to the seller.
          </li>
          <li>
            <strong>Buyer Duty to Rebind Immediately:</strong> Buyers must change the bound email address, Konami ID password, and Two-Factor Authentication (`2FA`) during the 24-hour inspection window before releasing funds. Leaving an account bound to the seller&apos;s email after releasing escrow forfeits claims arising from delayed credential changes.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          6. Middleman Escrow Contracts &amp; Community Tournaments
        </h2>
        <p>
          <strong>Middleman Deals:</strong> When a buyer and seller negotiate a squad price on WhatsApp, Telegram, Discord, Facebook, or TikTok and create a Middleman contract on eFootballMarket using a unique Deal Code, that contract is governed by the exact same Clean Konami ID rules, 12-hour handover SLA, 24-hour buyer inspection window, and dispute evidence standards as regular marketplace listings.
        </p>
        <p>
          <strong>Community Tournaments:</strong> Players registering for community cups must have a match-ready squad matching any stated OVR cap and stable internet connectivity. Entry passes are refunded in full if a tournament is cancelled by organizers prior to bracket generation; no-shows after bracket lock forfeit their match slot in accordance with the published tournament rules.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          7. Seller Earnings, Wallet Holds &amp; Post-Sale Clawbacks
        </h2>
        <p>
          Net funds from completed orders are credited to the seller&apos;s eFootballMarket earnings ledger and disbursed to the seller&apos;s verified Kenyan M-Pesa phone number upon payout request (typically processed within <strong>1 to 12 hours</strong> during Nairobi settlement hours, subject to security checks).
        </p>
        <p>
          If credible forensic evidence demonstrates that a seller attempted or executed post-sale account reclamation (for example, submitting false original-owner recovery forms or exploiting an undisclosed secondary link after payout), eFootballMarket reserves the right to freeze any remaining funds in the seller&apos;s wallet, offset buyer reimbursement from pending balances, permanently ban the seller, publish verified fraud indicators in our Scammer Registry, and furnish transaction records to Kenyan cybercrime authorities.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          8. Prohibited Conduct &amp; Anti-Circumvention
        </h2>
        <p>Users may not engage in any of the following activities on eFootballMarket:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Sharing personal phone numbers, M-Pesa Paybills/Tills, external links, or social handles inside listing descriptions or pre-escrow chats to solicit direct off-platform payment;</li>
          <li>Submitting edited M-Pesa confirmation codes, doctored screenshots, or spliced screen recordings during checkout or dispute review;</li>
          <li>Releasing, consuming, or legacy-transferring Epic/Big Time players, GP, or eFootball Coins on an account while inspecting it prior to requesting a refund (doing so voids refund eligibility);</li>
          <li>Scraping, automated bot bidding, denial-of-service probing, or attempting to bypass authentication or row-level security controls;</li>
          <li>Harassing, threatening, or impersonating platform moderators or support staff.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          9. Intellectual Property &amp; Editorial Content
        </h2>
        <p>
          Original tactical guides, progression builds, page layouts, software code, and platform branding on eFootballMarket are owned by eFootballMarket Kenya and protected by applicable copyright laws. By uploading squad screenshots or descriptions, you grant eFootballMarket a non-exclusive, royalty-free license to display, watermark for anti-theft protection, and promote your listing across our website and official social channels until the listing is removed.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          10. Publisher Terms Risk &amp; Limitation of Liability
        </h2>
        <p>
          Buyers and sellers acknowledge that game publishers (including Konami Digital Entertainment) maintain their own user agreements regarding account transfers and periodically modify game mechanics, player ratings, server availability, or carryover rules across seasonal updates. Once a Clean Konami ID transfer has been verified, rebound to the buyer&apos;s exclusive email and 2FA, and completed out of escrow, the buyer assumes ongoing operational responsibility for the account.
        </p>
        <p>
          To the fullest extent permitted under Kenyan law, eFootballMarket&apos;s aggregate liability in connection with any specific marketplace order or Middleman contract shall not exceed the <strong>total KES escrow amount actually received by eFootballMarket</strong> for that specific order. We are not liable for indirect, consequential, or off-platform losses, nor for Safaricom M-Pesa network outages or game publisher server maintenance delays.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          11. Account Suspension, Termination &amp; Amendments
        </h2>
        <p>
          We may suspend or terminate access to eFootballMarket immediately where we detect fraud, stolen credentials, fee circumvention, abusive conduct, or breach of these Terms. Lawful, undisputed wallet balances held at termination will be settled following completion of any active 24-hour inspection or fraud hold. We may update these Terms periodically by posting the revised effective date at the top of this page; continued use of the platform after updates take effect constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3 pt-6 border-t border-sx-border">
        <h2 className="text-lg sm:text-xl font-bold text-sx-ink font-display">
          12. Governing Law &amp; Kenyan Dispute Jurisdiction
        </h2>
        <p>
          These Terms of Service and all transactions conducted on eFootballMarket are governed by and construed in accordance with the <strong>Laws of the Republic of Kenya</strong>, including the Kenya Information and Communications Act (Cap. 411A), the Consumer Protection Act, 2012, and the Data Protection Act, 2019. Parties agree to first seek good-faith resolution through our internal Support &amp; Dispute Desk (`support@efootballmarket.co.ke`). Any unresolved legal claim shall be subject to the exclusive jurisdiction of the competent courts and tribunals sitting in <strong>Nairobi, Kenya</strong>.
        </p>
      </section>
    </PolicyPageShell>
  );
}
