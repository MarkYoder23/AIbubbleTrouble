// =====================================================================
//  SETTINGS
//  The numbers that control how the game plays.
//
//  Looking for something else?
//    Symbols and their photos  →  symbols.js
//    News events and wording   →  news-events.js
// =====================================================================


// ---------------------------------------------------------------------
//  1. GAME NUMBERS
// ---------------------------------------------------------------------
const SETTINGS = {
  // Money
  startingValuation: 100e9,   // $100 Billion. Ending below this = you lose.
  bankruptBelow: 5e9,         // Dropping under $5 Billion = instant loss.

  // Spins
  startingSpins: 10,          // How many spins $1 buys.
  maxSpins: 16,               // A game can never go past this many spins.
  bonusSpinsForWin: 1,        // Extra spins for a spin with a winning line.
  bonusSpinsForFive: 2,       // Extra spins instead, if a line has five in a row.

  // The compute bill: every spin costs this, win or lose (0.08 = 8%).
  // Small wins are still celebrated even when they're smaller than the bill.
  computeBill: 0.1,

  // The bubble (0% to 100%)
  bubbleGrowthPerSpin: 2,     // Every spin inflates the bubble this much.
  bubblePerWin: 8,            // Wins inflate it more: a +50% win adds 0.5 × 8 = 4% to the bubble.
  popRisk: 0.05,              // Chance to pop each spin = popRisk × (bubble ÷ 100)². At 100% it always pops.

  // The hot start: the first few spins are rigged to always win, so it feels easy.
  hotStartSpins: 4,           // How many opening spins are guaranteed a winning line (and only good news).

  // Background music (audio/main-street.mp3). It starts soft and gets louder with every spin.
  musicStartVolume: 0.08,     // 0 to 1. How loud at the first spin.
  musicEndVolume: 0.3,        // How loud by the last spins. Keep it under the voice clips.

  // Voice clips on wins (0.6 = 60% of the time):
  jensenBigWinChance: 0.6,    // Jensen, on big wins led by ChatGPT, Gemini or Claude
  genericOnCeoWin: 0.25,      // a generic line instead of the winning symbol's own line
  genericOnOtherWin: 0.45,    // a generic line on wins whose symbols have no clip
  genericOnStreak: 0.5,       // a generic line on a 3+ win streak, when no CEO matched

  // Win streaks: each win in a row makes the next win bigger.
  streakBonus: 0.1,           // +10% per win in a row (2 in a row = ×1.1, 3 = ×1.2 ...)
  maxStreakBoost: 1.5,        // ...but never more than ×1.5.

  // Breaking news. It turns sour as the game goes on.
  goodNewsChance: 0.75,       // How much of the news is good right after the hot start.
  newsSoursPerSpin: 0.07,     // Each spin after that, 7% less of the news is good...
  lowestGoodNews: 0.1,        // ...down to 10%. The bubble growing sours it faster, too.
  newsOrderShuffle: 0.25,     // How loosely the news follows date order (0 = strictly in order).
  spyStorySpinsLeft: 2,       // The Jensen spy story always hits once, on the spin when this many spins are left.
  moreNewsPerSpin: 0.08,      // NEWS lands 8% more often every spin played.
  newsPopupSeconds: 12,       // How long the news pop-up stays up (click or SPACE to skip).

  // Double Down (the final round). The odds are hidden until the end screen.
  decisionSeconds: 10,             // Seconds to choose. If time runs out, it doubles down for you.
  houseKeeps: "about 45¢",         // Shown on the end screen. Update it if you re-tune the odds.
  doubleDownMinOdds: 0.10,         // 10% chance to win at your starting valuation...
  doubleDownOddsPerDoubling: 0.07, // ...plus 7% every time your valuation doubles...
  doubleDownMaxOdds: 0.35,         // ...but never better than 35%.
};


// ---------------------------------------------------------------------
//  2. THE GRID AND PAYLINES
//  5 reels (columns) × 3 rows. Rows are numbered 0 = top, 1 = middle, 2 = bottom.
//  Each payline lists which row to check on each of the 5 reels.
//  A line wins with 3, 4 or 5 of the same symbol in a row, starting from
//  the LEFT reel. The WILD (Jensen Huang) counts as any symbol.
// ---------------------------------------------------------------------
const REELS = 5;
const ROWS = 3;

const PAYLINES = [
  [1, 1, 1, 1, 1],   // Line 1: middle row
  [0, 0, 0, 0, 0],   // Line 2: top row
  [2, 2, 2, 2, 2],   // Line 3: bottom row
  [0, 1, 2, 1, 0],   // Line 4: V shape
  [2, 1, 0, 1, 2],   // Line 5: upside-down V
];
