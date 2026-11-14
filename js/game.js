// =====================================================================
//  GAME RULES
//  The math behind each spin. This file never touches the screen; it
//  only updates the "game" object. screen.js reads that object to draw.
//
//  The grid is stored as grid[reel][row]:
//    grid[0] is the left reel, grid[4] is the right reel
//    row 0 is the top, row 2 is the bottom
//
//  game.status can be:
//    "playing"     still spinning
//    "jackpot"     out of spins at $1 trillion or more (wins $5, no gamble; rare)
//    "finalRound"  out of spins at $500B or more (Double Down or take the $1 back)
//    "brokeEven"   out of spins at/above the starting valuation (gets the $1 back)
//    "belowStart"  out of spins but below the starting valuation (lost)
//    "popped"      the bubble burst (lost)
//    "bankrupt"    valuation collapsed (lost)
//    "cashedOut"   took the safe $1
//    "doubleWon"   doubled down and won $5
//    "doubleLost"  doubled down and lost
// =====================================================================


// Start a fresh game
function newGame() {
  // Hidden from the player: almost every game has a ceiling just under $1 trillion. The
  // closer the valuation gets to it, the less each win adds (see softAdd), so most big games
  // finish "just shy" and get the Double Down offer. Only a rare game (jackpotChance) has no
  // ceiling, and only that game can pass $1 trillion.
  const noCeiling = Math.random() < SETTINGS.jackpotChance;
  const ceilingShare = SETTINGS.ceilingLow + Math.random() * (SETTINGS.ceilingHigh - SETTINGS.ceilingLow);
  // Also hidden: where this game is "meant" to finish. The valuation is steered along a smooth pace
  // line from the start to this target (see paceLine / paceFactor), so the climb is gradual
  // instead of spiking early and then hitting the ceiling. Most games aim for the $600B-$900B
  // sweet spot (the Double Down); some aim lower; the rare jackpot game aims just past $1T.
  const lerp = (low, high) => low + Math.random() * (high - low);
  let target;
  if (noCeiling) target = lerp(SETTINGS.jackpotTargetLow, SETTINGS.jackpotTargetHigh);
  else if (Math.random() < SETTINGS.lowFinishChance) target = lerp(SETTINGS.lowFinishLow, SETTINGS.lowFinishHigh);
  else target = lerp(SETTINGS.paceLow, SETTINGS.paceHigh);
  return {
    target,
    ceiling: noCeiling ? Infinity : SETTINGS.jackpotAt * ceilingShare,
    valuation: SETTINGS.startingValuation,
    peakValuation: SETTINGS.startingValuation,
    lastWin: 0,             // the last spin's win, before the compute bill (for the WIN box)
    totalRaised: 0,         // every win and good news added up. Only ever goes up.
    winsSeen: 0,            // how many spins had a celebration
    spinsAboveStart: 0,     // how many spins ended at or above the starting valuation
    billsPaid: 0,           // every compute bill added up
    spinsLeft: SETTINGS.startingSpins,
    spinsPlayed: 0,
    streak: 0,              // how many spins in a row had a winning line
    spyStoryShown: false,   // the guaranteed Jensen spy story, once per game
    newsShown: [],          // stories already shown this game (so they don't repeat)
    bubble: 0,              // 0 to 100 (%)
    status: "playing",
  };
}


// Give bonus spins, but never past the SETTINGS.maxSpins limit.
// Returns how many spins were actually added.
function addBonusSpins(game, amount) {
  const room = SETTINGS.maxSpins - game.spinsPlayed - game.spinsLeft;
  const added = Math.max(0, Math.min(amount, room));
  game.spinsLeft += added;
  return added;
}


// How likely a symbol is to land on a given reel.
//   - The WILD (Jensen Huang) only lands on its own reels (the middle three).
//   - NEWS gets more common as the bubble grows and as the game goes on.
function symbolWeight(symbol, reel, bubble, spinsPlayed = 0) {
  if (symbol.isWild && !symbol.reels.includes(reel)) return 0;
  if (symbol.isNews) return symbol.weight * (1 + bubble / 100) * (1 + spinsPlayed * SETTINGS.moreNewsPerSpin);
  return symbol.weight;
}


// Pick one random symbol for a reel, using the weights above
function randomSymbol(reel, bubble, spinsPlayed = 0) {
  const weightOf = s => symbolWeight(s, reel, bubble, spinsPlayed);
  const totalWeight = ALL_SYMBOLS.reduce((sum, s) => sum + weightOf(s), 0);
  let roll = Math.random() * totalWeight;
  for (const symbol of ALL_SYMBOLS) {
    roll -= weightOf(symbol);
    if (roll < 0) return symbol;
  }
  return ALL_SYMBOLS[0];
}


// Fill the whole 5×3 grid with random symbols
function randomGrid(bubble, spinsPlayed = 0) {
  const grid = [];
  for (let reel = 0; reel < REELS; reel++) {
    grid.push([]);
    for (let row = 0; row < ROWS; row++) grid[reel].push(randomSymbol(reel, bubble, spinsPlayed));
  }
  return grid;
}


// Is this spin part of the rigged hot start?
function isHotStart(game) {
  return game.spinsPlayed <= SETTINGS.hotStartSpins;
}


// Spin the grid. During the hot start, keep re-spinning (secretly) until something wins.
function spinGrid(game) {
  let grid = randomGrid(game.bubble, game.spinsPlayed);
  if (isHotStart(game)) {
    for (let tries = 0; tries < 200 && findWins(grid).length === 0; tries++) {
      grid = randomGrid(game.bubble, game.spinsPlayed);
    }
  }
  return grid;
}


// "243 ways to win" (like Lucky Buddha): a symbol wins when it shows up ANYWHERE
// on each reel in a row, starting from the left reel. Rows don't matter.
//   - 3, 4 or 5 reels in a row = a win (the WILD fills in for anything)
//   - "ways" = how many different paths make the win. 2 Claudes on reel 1 and
//     2 on reel 2 and 1 on reel 3 = 2 × 2 × 1 = 4 ways, so it pays 4 times.
// Returns a list of wins: { symbol, count, ways, gain, cells }
//   cells = every [reel, row] spot that's part of the win (for highlighting)
function findWins(grid) {
  const wins = [];

  for (const symbol of PAYING_SYMBOLS) {
    let count = 0;
    let ways = 1;
    const cells = [];

    for (let reel = 0; reel < REELS; reel++) {
      const matches = [];
      for (let row = 0; row < ROWS; row++) {
        const s = grid[reel][row];
        if (s === symbol || s.isWild) matches.push([reel, row]);
      }
      if (matches.length === 0) break;
      count++;
      ways *= matches.length;
      cells.push(...matches);
    }

    // The left reel never has a WILD, so the symbol itself has to start the win
    const startsWithSymbol = grid[0].includes(symbol);
    if (count >= 3 && startsWithSymbol) {
      wins.push({ symbol, count, ways, gain: symbol.pays[count] * ways, cells });
    }
  }

  return wins;
}


// Find every NEWS symbol anywhere on the grid. Returns a list of [reel, row] spots.
function findNews(grid) {
  const cells = [];
  grid.forEach((column, reel) => column.forEach((symbol, row) => {
    if (symbol.isNews) cells.push([reel, row]);
  }));
  return cells;
}


// The hidden pace line: where the valuation "should" be right now, growing at a steady rate
// from the starting valuation to this game's target by the last spin.
function paceLine(game) {
  const total = game.spinsPlayed + game.spinsLeft;
  const progress = Math.pow(total > 0 ? game.spinsPlayed / total : 1, SETTINGS.paceCurve);
  const line = SETTINGS.startingValuation * Math.pow(game.target / SETTINGS.startingValuation, progress);
  // The Jensen spy story always knocks 40% off near the end, so until it lands the line runs a bit
  // higher; the last spins then climb back toward the target.
  const lift = 1 + (SETTINGS.paceSpyLift - 1) * progress ** 3;   // (it builds up late, so the early climb stays gentle)
  return game.spyStoryShown ? line : line * lift;
}

// How far ahead of the pace line the game is (1 = on the line, 1.5 = 50% ahead)
function paceRatio(game) {
  return game.valuation / paceLine(game);
}

// Wins get a boost when the game has fallen behind the pace line (1 = no boost). Ahead of it,
// wins are held back by pathRoom instead (see playSpin).
function paceFactor(game) {
  const factor = Math.pow(paceRatio(game), -SETTINGS.paceStrength);
  return Math.min(SETTINGS.paceMax, Math.max(1, factor));
}


// The chance a news event is good. Always good during the hot start,
// then it sours with every spin and as the bubble grows.
function goodNewsChance(game) {
  if (isHotStart(game)) return 1;
  const spinsSince = game.spinsPlayed - SETTINGS.hotStartSpins - 1;
  const chance = SETTINGS.goodNewsChance - spinsSince * SETTINGS.newsSoursPerSpin - game.bubble / 250;
  // A light touch: ahead of the pace line, bad news is a little more likely (a dip); behind it, good news is.
  const swing = Math.min(SETTINGS.paceNewsSwing, Math.max(-SETTINGS.paceNewsSwing, (1 - paceRatio(game)) * 0.5));
  return Math.min(0.95, Math.max(SETTINGS.lowestGoodNews, chance + swing));
}

// All the stories (good and bad) in date order, so each one has a place on the game's timeline:
// 0 = the oldest story, 1 = the newest.
const NEWS_TIMELINE = [...GOOD_NEWS, ...BAD_NEWS].sort((a, b) => a.date.localeCompare(b.date));
function timelinePlace(event) {
  return NEWS_TIMELINE.indexOf(event) / (NEWS_TIMELINE.length - 1);
}

// Pick a news event. Good or bad is decided first. Then the story whose date best
// matches how far into the game we are wins (with a little randomness), so the news
// plays out roughly in order. A story only repeats once every story of its kind is used.
function pickNewsEvent(game) {
  const isGood = Math.random() < goodNewsChance(game);
  const list = isGood ? GOOD_NEWS : BAD_NEWS;
  let fresh = list.filter(event => !game.newsShown.includes(event));
  if (fresh.length === 0) fresh = list;

  const progress = Math.min(1, game.spinsPlayed / SETTINGS.maxSpins);
  const distance = event => Math.abs(timelinePlace(event) - progress) + Math.random() * SETTINGS.newsOrderShuffle;
  const event = fresh.reduce((best, e) => (distance(e) < distance(best) ? e : best));

  game.newsShown.push(event);
  return { ...event, isGood };
}


// Add money to the valuation. Far below this game's hidden ceiling the full amount is added. Once
// the valuation is past the "knee" (a share of the ceiling, SETTINGS.ceilingKnee), the closer it
// gets to the ceiling the less of each win counts, so it creeps up toward the ceiling and (almost)
// never passes it. Nothing ever jumps or resets. A game with no ceiling (the rare jackpot game,
// see newGame) adds the full amount.
function softAdd(valuation, amount, ceiling) {
  if (amount <= 0 || ceiling === Infinity) return valuation + amount;
  const knee = ceiling * SETTINGS.ceilingKnee;
  let value = valuation;
  let left = amount;
  if (value < knee) {                       // the part below the knee counts in full
    const free = Math.min(left, knee - value);
    value += free;
    left -= free;
  }
  if (left <= 0) return value;
  const room = ceiling - value;             // above the knee: each win only fills part of the room that's left
  if (room <= 0) return value;
  return ceiling - room * Math.exp(-left / room);
}


// Apply a news event's three numbers (see news-events.js)
function applyNews(game, news) {
  const change = game.valuation * (news.valuation || 0) / 100;
  game.valuation = softAdd(game.valuation, change, game.ceiling);   // (bad news just subtracts)
  game.bubble += news.bubble || 0;
  if (news.spins > 0) addBonusSpins(game, news.spins);
  if (news.spins < 0) game.spinsLeft += news.spins;
}


// Turn a news event's numbers into words, e.g. "Valuation +40% · +1 spin"
function describeNews(news) {
  const parts = [];
  const signed = n => (n > 0 ? "+" : "") + n;
  if (news.valuation) parts.push(`Valuation ${signed(news.valuation)}%`);
  if (news.spins) parts.push(`${signed(news.spins)} spin${Math.abs(news.spins) > 1 ? "s" : ""}`);
  if (news.bubble) parts.push(`Bubble ${signed(news.bubble)}%`);
  return parts.join(" · ") || "No effect";
}


// Play one spin. Changes the game and returns what happened, so the
// screen can show it in order: news first, then the winning lines.
function playSpin(game) {
  // 1. Spin the grid
  const valuationBefore = game.valuation;
  game.spinsLeft -= 1;
  game.spinsPlayed += 1;
  const grid = spinGrid(game);

  // Near the end, the Jensen spy story is guaranteed: a NEWS symbol is planted on the grid.
  // It's always the LAST story: after it, any NEWS that lands is swapped for another symbol.
  const spyTime = !game.spyStoryShown && game.spinsLeft <= SETTINGS.spyStorySpinsLeft;
  if (spyTime && findNews(grid).length === 0) {
    grid[Math.floor(Math.random() * REELS)][Math.floor(Math.random() * ROWS)] = NEWS_SYMBOL;
  }
  if (game.spyStoryShown) {
    findNews(grid).forEach(([reel, row]) => {
      do { grid[reel][row] = randomSymbol(reel, game.bubble); } while (grid[reel][row].isNews);
    });
  }

  // 2. NEWS happens first. One event per spin, however many NEWS symbols land.
  const newsCells = findNews(grid);
  let news = null;
  let newsGain = 0;
  if (newsCells.length > 0) {
    news = spyTime ? { ...SPY_STORY, isGood: false } : pickNewsEvent(game);
    if (spyTime) game.spyStoryShown = true;
    const before = game.valuation;
    applyNews(game, news);
    newsGain = Math.max(0, game.valuation - before);
    game.totalRaised += newsGain;   // good news counts as "raised"
  }
  const valuationAfterNews = game.valuation;

  // 3. The compute bill comes out of every spin, win or lose
  const bill = game.valuation * SETTINGS.computeBill;
  game.valuation -= bill;
  game.billsPaid += bill;

  // 4. Then winning lines add together. A bigger bubble and a win streak make wins bigger.
  //    Every win is celebrated, even one smaller than the bill.
  const lineWins = findWins(grid);
  let totalGain = 0;
  let bonusSpins = 0;
  game.streak = lineWins.length > 0 ? game.streak + 1 : 0;

  if (lineWins.length > 0) {
    totalGain = lineWins.reduce((sum, win) => sum + win.gain, 0) * winBoost(game.bubble) * streakBoost(game.streak);
    // Bonus spins are rare: only a CEO across all five reels earns one (not the AI logos)
    const gotFive = lineWins.some(win => win.count === 5 && CHARACTERS.includes(win.symbol));
    bonusSpins = addBonusSpins(game, gotFive ? SETTINGS.bonusSpinsForFive : SETTINGS.bonusSpinsForWin);
    game.winsSeen += 1;
  }
  // The money a win adds is steered by the pace line (it can't run far ahead of it), then capped so one spin can't add more than
  // maxSpinGain of where the spin started (good news already used part of that). The bubble below
  // still grows from totalGain alone.
  const gainRoom = Math.max(0, SETTINGS.maxSpinGain * valuationBefore - newsGain);
  // A win can only lift the valuation up to a little above the pace line (paceSlack). Past that it
  // still adds a sliver (paceMin of its normal size) so the numbers never freeze.
  const normalWin = game.valuation * totalGain * SETTINGS.winPayScale;
  const sliver = Math.min(normalWin * SETTINGS.paceMin, game.valuation * SETTINGS.paceSliverMax);
  const pathRoom = Math.max(paceLine(game) * (1 + SETTINGS.paceSlack) - game.valuation, sliver);
  // Behind the line, a winning spin also closes part of the gap (paceCatchUp), so one lucky line gets you back on track.
  const catchUp = lineWins.length > 0 ? Math.max(0, paceLine(game) - game.valuation) * SETTINGS.paceCatchUp : 0;
  const bigWin = Math.min(Math.max(normalWin * paceFactor(game), catchUp), pathRoom, gainRoom);
  // A winning spin never loses money: the win always at least covers that spin's compute bill, so on
  // a win the valuation only goes up (it goes down only on a spin with no match, or bad news).
  const covered = lineWins.length > 0 ? Math.max(bigWin, bill) : bigWin;
  const winAmount = softAdd(game.valuation, covered, game.ceiling) - game.valuation;   // what really gets added
  game.valuation += winAmount;
  game.totalRaised += winAmount;

  // 5. Success inflates the bubble: the bigger the win, the more it grows
  //    Every spin adds a little, every winning spin adds a flat bump plus more for a bigger win.
  //    (Good news adds to the bubble too: see news-events.js.)
  const winBump = lineWins.length > 0 ? SETTINGS.bubblePerWinningSpin : 0;
  game.bubble += SETTINGS.bubbleGrowthPerSpin + winBump + totalGain * SETTINGS.bubblePerWin;

  // 6. Keep numbers in range and keep score for the end screen
  game.spinsLeft = Math.max(0, game.spinsLeft);
  game.bubble = Math.min(100, game.bubble);
  game.peakValuation = Math.max(game.peakValuation, game.valuation);
  game.lastWin = lineWins.length > 0 ? Math.max(0, game.valuation - valuationAfterNews) : 0;   // the win net of the bill
  if (game.valuation >= SETTINGS.startingValuation) game.spinsAboveStart += 1;

  // 7. Did the game end?
  game.status = checkStatus(game);

  // netChange: how much the valuation really changed this spin (often negative, even with a win)
  const netChange = game.valuation / valuationBefore - 1;
  const streak = game.streak;
  const netWin = lineWins.length > 0 ? Math.max(0, game.valuation - valuationAfterNews) : 0;   // what a win really adds, after the bill
  return { grid, news, newsCells, valuationAfterNews, lineWins, winAmount, netWin, bill, totalGain, netChange, bonusSpins, streak };
}


// The chance the bubble pops on the next spin (0 to 1)
function popChance(bubble) {
  return bubble >= 100 ? 1 : SETTINGS.popRisk * (bubble / 100) ** 2;
}


// Decide the game's status after a spin
function checkStatus(game) {
  if (!isHotStart(game) && Math.random() < popChance(game.bubble)) return "popped";
  if (game.valuation < SETTINGS.bankruptBelow) return "bankrupt";
  if (game.spinsLeft > 0) return "playing";
  if (game.valuation >= SETTINGS.jackpotAt) return "jackpot";
  if (game.valuation >= SETTINGS.doubleDownAt) return "finalRound";
  if (game.valuation >= SETTINGS.startingValuation) return "brokeEven";
  return "belowStart";
}


// The chance that Double Down wins. It is hidden from the player until the end screen.
// It starts at doubleDownMinOdds at $500B and gets a little better each time the
// valuation doubles from there, up to doubleDownMaxOdds.
function doubleDownOdds(game) {
  const timesDoubled = Math.log2(Math.max(1, game.valuation / SETTINGS.doubleDownAt));
  const odds = SETTINGS.doubleDownMinOdds + SETTINGS.doubleDownOddsPerDoubling * timesDoubled;
  return Math.min(SETTINGS.doubleDownMaxOdds, odds);
}


// Roll the Double Down. Returns true if the player won.
function rollDoubleDown(game) {
  const won = Math.random() < doubleDownOdds(game);
  game.status = won ? "doubleWon" : "doubleLost";
  return won;
}


// How much the bubble boosts wins right now (1.0 to 2.0)
function winBoost(bubble) {
  return 1 + bubble / 100;
}

// How much a win streak boosts wins (1 win = ×1, 2 in a row = ×1.1, ...)
function streakBoost(streak) {
  return Math.min(SETTINGS.maxStreakBoost, 1 + Math.max(0, streak - 1) * SETTINGS.streakBonus);
}


// Turn a big number into short money text, like $1.2T or $450B
function formatMoney(amount) {
  const units = [[1e18, "Qi"], [1e15, "Q"], [1e12, "T"], [1e9, "B"], [1e6, "M"]];
  for (const [size, letter] of units) {
    if (amount >= size) {
      const n = amount / size;
      return "$" + n.toFixed(n >= 100 ? 0 : 1) + letter;
    }
  }
  return "$" + Math.max(0, Math.round(amount)).toLocaleString();
}
