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
  maxSpins: 13,               // A game can never go past this many spins.
  bonusSpinsForWin: 0,        // Extra spins for an ordinary win (0 = none: bonus spins are rare).
  bonusSpinsForFive: 1,       // Extra spins for a CEO across all five reels (about 1 game in 4).

  // Autospin (the AUTO button, or the A key): the game spins by itself
  autoSpinPause: 0.6,         // Seconds between spins when nothing was won.
  autoSpinPauseAfterWin: 2.6, // Seconds after a win, so the bubbles get to pop.
  autoNewsSeconds: 3.5,       // News pop-ups close this fast during autospin.

  // The compute bill: every spin costs this, win or lose (0.08 = 8%).
  // Small wins are still celebrated even when they're smaller than the bill.
  winPayScale: 3,           // Multiplies how much valuation a win adds. The bubble does NOT grow faster with it.
  computeBill: 0.03,

  // The bubble (0% to 100%)
  bubbleGrowthPerSpin: 2.25,    // Every spin inflates the bubble this much.
  bubblePerWinningSpin: 1.5,  // A spin with a winning line inflates it this much more, flat.
  bubblePerWin: 6,            // Wins inflate it more: a +50% win adds 0.5 × 6 = 3% to the bubble.
  popRisk: 0.05,              // Chance to pop each spin = popRisk × (bubble ÷ 100)². At 100% it always pops.

  // The hot start: the first few spins are rigged to always win, so it feels easy.
  hotStartSpins: 4,           // How many opening spins are guaranteed a winning line (and only good news).

  // The bubble meter changes color as it fills
  bubbleYellowAt: 40,         // Yellow from this % ...
  bubbleRedAt: 70,            // ... red and shaking from this %.

  // Winning circles pop like bubbles, one after another
  highlightBeforePop: 0.6,    // Seconds the winning circles glow green before they start popping.
  cashFlightSeconds: 1.1,     // How long each "+$4.2B" takes to pop out and fly into the valuation meter.
  bubblePopGap: 0.12,         // Seconds between each pop (0 = all at once).

  // The stock tickers around the edge: slow at first, fast by the end (pixels per second)
  tickerStartSpeed: 30,
  tickerEndSpeed: 260,

  // The reels spin faster as the game goes on
  spinSpeedUp: 0.06,          // 6% faster every spin...
  maxSpinSpeed: 1.8,          // ...up to 1.8 times as fast as the first spin.

  // Background music (audio/main-street.mp3). It starts soft and gets louder with every spin.
  backgroundMusic: false,       // true = play the Main Street music during the game; false = no music.
  voiceVolume: 0.67,          // How loud the CEO and generic voice clips are (1 = full). 0.67 is a third quieter.
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
  newsSoursPerSpin: 0.05,     // Each spin after that, 7% less of the news is good...
  lowestGoodNews: 0.1,        // ...down to 10%. The bubble growing sours it faster, too.
  newsOrderShuffle: 0.25,     // How loosely the news follows date order (0 = strictly in order).
  spyStorySpinsLeft: 2,       // The Jensen spy story always hits once, on the spin when this many spins are left.
  moreNewsPerSpin: 0.08,      // NEWS lands 8% more often every spin played.
  newsCardSeconds: 3,         // How long a news card takes to rise from the middle to the top and fade (the game never waits for it).
  newsLeadIn: 0.6,            // Seconds the NEWS symbol ripples before the story opens (SPACE skips).
  newsAfterPause: 0.5,        // Seconds after the story closes before the wins are shown (SPACE skips).
  newsPopupSeconds: 12,       // How long the news pop-up stays up (click or SPACE to skip).

  // The payout tiers (see checkStatus in game.js):
  //   below startingValuation = lose the $1, at/above it = get the $1 back,
  //   at/above doubleDownAt = Double Down offered: take the $1 back, or risk it for $5.
  jackpotAt: 1e12,                 // $1 trillion or more wins the $5 with no gamble. This is rare on purpose:
  jackpotChance: 0.025,            // only this share of games can ever cross $1T. Every other game has a hidden
  ceilingKnee: 0.9,                // The squeeze starts at this share of the ceiling: wins add less and less above it.
  ceilingLow: 0.90,                // ceiling somewhere between 90% and 99% of $1T that the valuation creeps toward and can't pass,
  ceilingHigh: 0.99,               // so most big games finish "just shy" of $1T.
  // The pace line: every game secretly aims for a finishing valuation and the valuation is steered
  // along a smooth climb toward it. Wins can't run far ahead of the line, and a winning spin when
  // behind it closes the gap. (The soft ceiling above is now only a late backstop.)
  paceLow: 6.5e11,                 // Games aim for a finish somewhere between $650B ...
  paceHigh: 9.2e11,                // ... and $920B (the Double Down sweet spot; games land a bit under their aim).
  lowFinishChance: 0,              // This share of games aim lower instead (0 = none; some still end low from bad luck), ...
  lowFinishLow: 1.5e11,            // ... between $150B ...
  lowFinishHigh: 4.8e11,           // ... and $480B (so some players just get their $1 back).
  jackpotTargetLow: 1.02e12,       // The rare no-ceiling game aims just past $1T.
  jackpotTargetHigh: 1.15e12,
  paceSpyLift: 2.2,                // Until the Jensen spy story hits (-40%), the line runs this much higher.
  paceCurve: 1,                    // 1 = even climb. Above 1 = slower start, steeper finish.
  paceStrength: 2,                 // How strongly wins are boosted when the game is behind the line.
  paceSlack: 0.3,                  // A win can lift the valuation to at most 30% above the pace line.
  paceCatchUp: 1.0,                // A winning spin closes at least this share of the gap to the line.
  paceMin: 0.1,                    // Past that, wins still add this share of their normal size ...
  paceSliverMax: 0.05,             // ... but never more than 5% of the valuation.
  paceMax: 2,                      // ... and far behind the line they're boosted by up to this much.
  maxSpinGain: 0.8,                // No spin can add more than 80% of the valuation it started with (good news included).
  paceNewsSwing: 0.3,              // Ahead of the line, up to 30 points more bad news (and the reverse when behind).
  doubleDownAt: 5e11,              // $500B and up: you are offered the Double Down.

  // Double Down (the final round). The odds are hidden until the end screen.
  decisionSeconds: 10,             // Seconds to choose. If time runs out, it doubles down for you.
  doubleDownMinOdds: 0.06,         // Chance to win at exactly $500B...
  doubleDownOddsPerDoubling: 0.02, // ...plus this much every time the valuation doubles after that...
  doubleDownMaxOdds: 0.12,         // ...but never better than this.
};


// ---------------------------------------------------------------------
//  2. THE GRID: 5 reels (columns) × 3 rows. Rows are 0 = top, 1 = middle, 2 = bottom.
//  Wins use "243 ways" (like Lucky Buddha): a symbol anywhere on each reel in a
//  row, starting from the LEFT reel. The WILD (Jensen Huang) counts as any symbol.
//  (See findWins in game.js.)
// ---------------------------------------------------------------------
const REELS = 5;
const ROWS = 3;
