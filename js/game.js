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
//    "jackpot"     out of spins at $1 trillion or more (wins $5)
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
  return {
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


// The chance a news event is good. Always good during the hot start,
// then it sours with every spin and as the bubble grows.
function goodNewsChance(game) {
  if (isHotStart(game)) return 1;
  const spinsSince = game.spinsPlayed - SETTINGS.hotStartSpins - 1;
  const chance = SETTINGS.goodNewsChance - spinsSince * SETTINGS.newsSoursPerSpin - game.bubble / 250;
  return Math.max(SETTINGS.lowestGoodNews, chance);
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


// Apply a news event's three numbers (see news-events.js)
function applyNews(game, news) {
  game.valuation *= 1 + (news.valuation || 0) / 100;
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
  if (newsCells.length > 0) {
    news = spyTime ? { ...SPY_STORY, isGood: false } : pickNewsEvent(game);
    if (spyTime) game.spyStoryShown = true;
    const before = game.valuation;
    applyNews(game, news);
    game.totalRaised += Math.max(0, game.valuation - before);   // good news counts as "raised"
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
  const winAmount = game.valuation * totalGain;
  game.valuation += winAmount;
  game.totalRaised += winAmount;

  // 5. Success inflates the bubble: the bigger the win, the more it grows
  game.bubble += SETTINGS.bubbleGrowthPerSpin + totalGain * SETTINGS.bubblePerWin;

  // 6. Keep numbers in range and keep score for the end screen
  game.spinsLeft = Math.max(0, game.spinsLeft);
  game.bubble = Math.min(100, game.bubble);
  game.peakValuation = Math.max(game.peakValuation, game.valuation);
  game.lastWin = winAmount;
  if (game.valuation >= SETTINGS.startingValuation) game.spinsAboveStart += 1;

  // 7. Did the game end?
  game.status = checkStatus(game);

  // netChange: how much the valuation really changed this spin (often negative, even with a win)
  const netChange = game.valuation / valuationBefore - 1;
  const streak = game.streak;
  return { grid, news, newsCells, valuationAfterNews, lineWins, winAmount, bill, totalGain, netChange, bonusSpins, streak };
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
  if (game.valuation >= SETTINGS.startingValuation) return "brokeEven";
  return "belowStart";
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
