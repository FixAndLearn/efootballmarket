/**
 * Calculates fair, proportional platform fee for hosting tournaments & 1v1 duels.
 * 
 * Rules based on eFootballMarket Kenya policy:
 * - Free tournaments (pot = 0): KES 0
 * - Pot <= KES 100: 15% rounded to whole shillings, with a KES 10 minimum and KES 15 maximum, capped at the pot
 * - Pot >100–250: KES 20
 * - Pot >250–500: KES 35
 * - Pot >500–1,000: KES 60
 * - Pot > KES 1,000: 5% rounded to whole shillings, with a KES 60 minimum
 */
export function calculateTournamentFee(totalPot: number): number {
  if (!Number.isFinite(totalPot) || totalPot <= 0) return 0;
  const pot = Math.floor(totalPot);
  if (pot <= 0) return 0;
  if (pot <= 100) return Math.min(pot, Math.min(15, Math.max(10, Math.round(pot * 0.15))));
  if (pot <= 250) return 20;
  if (pot <= 500) return 35;
  if (pot <= 1000) return 60;
  return Math.max(60, Math.round(pot * 0.05));
}

export function calculateNetPrizePool(
  totalPot: number,
  playerCount: number,
  payoutSplit: "winner_takes_all" | "80_20" | "70_30"
): {
  adminFee: number;
  netPrizePool: number;
  firstPlace: number;
  secondPlace: number;
  isWinnerTakesAll: boolean;
} {
  const safePot = Number.isFinite(totalPot) ? Math.max(0, Math.floor(totalPot)) : 0;
  if (safePot <= 0) {
    return {
      adminFee: 0,
      netPrizePool: 0,
      firstPlace: 0,
      secondPlace: 0,
      isWinnerTakesAll: true,
    };
  }

  const adminFee = calculateTournamentFee(safePot);
  const netPrizePool = Math.max(0, safePot - adminFee);

  // If 1v1 (2 players) or explicitly winner takes all:
  if (playerCount <= 2 || payoutSplit === "winner_takes_all") {
    return {
      adminFee,
      netPrizePool,
      firstPlace: netPrizePool,
      secondPlace: 0,
      isWinnerTakesAll: true,
    };
  }

  if (payoutSplit === "70_30") {
    const firstPlace = Math.round(netPrizePool * 0.7);
    const secondPlace = Math.max(0, netPrizePool - firstPlace);
    return {
      adminFee,
      netPrizePool,
      firstPlace,
      secondPlace,
      isWinnerTakesAll: false,
    };
  }

  // Default 80_20
  const firstPlace = Math.round(netPrizePool * 0.8);
  const secondPlace = Math.max(0, netPrizePool - firstPlace);
  return {
    adminFee,
    netPrizePool,
    firstPlace,
    secondPlace,
    isWinnerTakesAll: false,
  };
}
