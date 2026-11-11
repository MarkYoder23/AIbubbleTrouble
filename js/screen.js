// =====================================================================
//  SCREEN
//  Everything the player sees and clicks: the three screens, the
//  spinning 5×3 reels, the info bar, the bubble and the pop.
//
//  Order of a game:
//    Start screen → startGame() → press SPIN → spin() ... → final round
//    → cashOut() or doubleDown() → showEndScreen() → Reset → start screen
// =====================================================================


// ---------------------------------------------------------------------
//  Find all the parts of the page we need, once
// ---------------------------------------------------------------------
const page = {
  startScreen:  document.getElementById("startScreen"),
  gameScreen:   document.getElementById("gameScreen"),
  endScreen:    document.getElementById("endScreen"),

  paidCheckbox: document.getElementById("paidCheckbox"),
  startButton:  document.getElementById("startButton"),
  spinButton:   document.getElementById("spinButton"),
  cashOutButton:    document.getElementById("cashOutButton"),
  doubleDownButton: document.getElementById("doubleDownButton"),
  resetButton:  document.getElementById("resetButton"),

  // Info bar and top bar
  lastWin:      document.getElementById("lastWin"),
  streak:       document.getElementById("streak"),
  spinsLeft:    document.getElementById("spinsLeft"),
  headline:     document.getElementById("headline"),
  message:      document.getElementById("message"),

  // Reels: 5 columns
  reels:        [0, 1, 2, 3, 4].map(i => document.getElementById("reel" + i)),
  paylineLayer: document.getElementById("paylineLayer"),
  spinControls: document.getElementById("spinControls"),
  finalRound:   document.getElementById("finalRound"),
  totalRaised:  document.getElementById("totalRaised"),
  winBanner:    document.getElementById("winBanner"),
  finalPitch:   document.getElementById("finalPitch"),
  socialProof:  document.getElementById("socialProof"),
  decisionTimer: document.getElementById("decisionTimer"),
  decisionNote: document.getElementById("decisionNote"),
  reveal:       document.getElementById("reveal"),

  // Breaking news pop-up
  newsPopup:    document.getElementById("newsPopup"),
  newsTag:      document.getElementById("newsTag"),
  newsPicture:  document.getElementById("newsPicture"),
  newsHeadline: document.getElementById("newsHeadline"),
  newsWhen:     document.getElementById("newsWhen"),
  newsEffect:   document.getElementById("newsEffect"),
  newsTimer:    document.getElementById("newsTimer"),

  // Bubble and effects
  bubble:       document.getElementById("bubble"),
  bubblePercent: document.getElementById("bubblePercent"),
  flash:        document.getElementById("flash"),
  effects:      document.getElementById("effects"),
  burstBanner:  document.getElementById("burstBanner"),

  // End screen
  endIcon:      document.getElementById("endIcon"),
  endTitle:     document.getElementById("endTitle"),
  endText:      document.getElementById("endText"),
  ticket:       document.getElementById("ticket"),
};

let game = null;          // the current game (see game.js)
let isSpinning = false;   // true while the reels are moving
const shownNumbers = { totalRaised: 0, lastWin: 0 };   // what each counter shows right now
let decisionCountdown = null;  // the final-round timer, while it's running
let closeNewsPopup = null; // set while the news pop-up is open; call it to close early


// ---------------------------------------------------------------------
//  Small helpers
// ---------------------------------------------------------------------
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function showScreen(screen) {
  [page.startScreen, page.gameScreen, page.endScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// Restart a CSS animation on an element by removing and re-adding its class
function replayAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;   // forces the browser to notice the removal
  element.classList.add(className);
}

function setMessage(text, style = "") {
  page.message.textContent = text;
  page.message.className = "message " + style;
}

function setHeadline(text, style = "") {
  page.headline.textContent = text;
  page.headline.className = "headline " + style;
  replayAnimation(page.headline, "slam");
}


// ---------------------------------------------------------------------
//  Info bar and bubble
// ---------------------------------------------------------------------

// Smoothly count a money counter ("totalRaised" or "lastWin") to a new number
function countTo(name, target, duration = 600) {
  const element = page[name];
  const from = shownNumbers[name];
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - (1 - progress) ** 3;
    shownNumbers[name] = from + (target - from) * eased;
    element.textContent = formatMoney(shownNumbers[name]);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  if (target > from) replayAnimation(element, "went-up");
  if (target < from) replayAnimation(element, "went-down");
}

function updateStats() {
  countTo("totalRaised", game.totalRaised, 1200);   // the big number rolls up slowly, for drama
  shownNumbers.lastWin = 0;
  countTo("lastWin", game.lastWin, 1200);            // the WIN box counts up from zero every time
  page.lastWin.classList.toggle("lit", game.lastWin > 0);
  if (game.lastWin > 0) Sound.rollUp(1.1);                 // ticking while the win counts up
  page.streak.textContent = game.streak >= 2
    ? `🔥 ${game.streak} in a row · wins ×${streakBoost(game.streak + 1).toFixed(1)}` : "";
  page.spinsLeft.textContent = game.spinsLeft;
  page.spinsLeft.classList.toggle("low", game.spinsLeft <= 2);
  page.spinButton.disabled = isSpinning || game.status !== "playing";

  // Bubble: grows from 70px to 150px
  page.bubblePercent.textContent = Math.round(game.bubble) + "%";
  page.bubble.style.setProperty("--size", 70 + game.bubble * 0.8 + "px");

  // The whole screen gets more intense as the bubble grows
  document.body.classList.toggle("danger", game.bubble >= 55);
  document.body.classList.toggle("critical", game.bubble >= 80);

  Sound.musicLouder(game.spinsPlayed / SETTINGS.maxSpins);   // the music swells as the game goes on
}


// ---------------------------------------------------------------------
//  Reels
//  Each reel is one column. It always holds 3 visible symbols (rows).
// ---------------------------------------------------------------------

// Make the box for one symbol.
// Shows your photo (see symbols.js). If the photo is missing, shows the drawing.
const missingPhotos = new Set();   // photos we already know aren't there

function makeSymbol(symbol) {
  const box = document.createElement("div");
  box.className = "symbol";
  box.dataset.id = symbol.id;   // lets style.css pick out one symbol (e.g. the white ChatGPT logo)

  // The drawing sits in the middle of a tile painted in its own color
  const showDrawing = () => {
    box.style.background = TILE_COLORS[symbol.id];
    box.style.backgroundClip = "content-box";   // keep the color out of the white gap
    box.innerHTML = DRAWINGS[symbol.id];
  };

  if (symbol.photo && !missingPhotos.has(symbol.photo)) {
    const img = document.createElement("img");
    img.src = symbol.photo;
    img.alt = symbol.name;
    img.onerror = () => {
      missingPhotos.add(symbol.photo);
      showDrawing();
    };
    box.appendChild(img);
  } else {
    showDrawing();
  }
  return box;
}

function randomCharacter() {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}

// Put three symbols in a reel without animating (used at the start of a game)
function fillReel(reel, symbols) {
  reel.replaceChildren(...symbols.map(makeSymbol));
}

// Spin one reel DOWNWARD and land on the 3 results.
// The strip is built as: [results] [lots of random symbols] [what's showing now].
// It starts on what's showing now and slides down until the results are in view.
// The window only shows the middle row fully, plus a slice of the rows above and
// below, so the strip is shifted to keep the middle row centered.
function spinReel(reel, reelNumber, results, duration, bubble) {
  return new Promise(resolve => {
    const rowHeight = reel.firstElementChild.getBoundingClientRect().height;
    const windowHeight = reel.parentElement.clientHeight;
    const centered = (windowHeight - ROWS * rowHeight) / 2;   // where the strip sits when still
    const extraSymbols = Math.round(duration / 40);           // longer spins need a longer strip
    const current = [...reel.children];
    const extras = [];
    for (let i = 0; i < extraSymbols; i++) extras.push(makeSymbol(randomSymbol(reelNumber, bubble)));
    reel.replaceChildren(...results.map(makeSymbol), ...extras, ...current);

    // Start scrolled up so "what's showing now" is still in the window
    const distance = (results.length + extraSymbols) * rowHeight;
    reel.style.transition = "none";
    reel.style.transform = `translateY(${centered - distance}px)`;
    void reel.offsetHeight;   // lock in the starting position before animating

    // Slide down until the results are in the window
    reel.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.6, 0.25, 1)`;
    reel.style.transform = `translateY(${centered}px)`;

    setTimeout(() => {
      reel.style.transition = "none";
      reel.style.transform = "";   // back to the resting position set in style.css
      fillReel(reel, results);
      Sound.reelStops();
      resolve();
    }, duration);
  });
}

// Spin all five reels; each one stops a bit after the one before
function spinAllReels(grid, firstStop, gap, bubble) {
  Sound.reelsSpinning((firstStop + (REELS - 1) * gap) / 1000, bubble);
  return Promise.all(page.reels.map((reel, i) => spinReel(reel, i, grid[i], firstStop + i * gap, bubble)));
}

// The symbol box at a [reel, row] spot
function cellAt(reel, row) {
  return page.reels[reel].children[row];
}

function highlightCells(cells, className) {
  cells.forEach(([reel, row]) => cellAt(reel, row).classList.add(className));
}

// Every spot on the grid
function allCells() {
  const cells = [];
  for (let reel = 0; reel < REELS; reel++) for (let row = 0; row < ROWS; row++) cells.push([reel, row]);
  return cells;
}

// Draw a line across the reels for each winning payline
// (a thick white line under a black one, so it shows on any picture)
function drawPaylines(lineWins) {
  const layer = page.paylineLayer;
  const box = layer.getBoundingClientRect();
  layer.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);

  layer.innerHTML = lineWins.map(win => {
    const points = PAYLINES[win.line - 1].map((row, reel) => {
      const cell = cellAt(reel, row).getBoundingClientRect();
      return `${cell.left - box.left + cell.width / 2},${cell.top - box.top + cell.height / 2}`;
    }).join(" ");
    return `<polyline points="${points}" pathLength="1" />`;
  }).join("");
}

function clearPaylines() {
  page.paylineLayer.innerHTML = "";
}



// ---------------------------------------------------------------------
//  Playing
// ---------------------------------------------------------------------
function startGame() {
  stopDecisionCountdown();
  game = newGame();
  isSpinning = false;
  shownNumbers.totalRaised = 0;
  shownNumbers.lastWin = 0;

  document.body.classList.remove("collapse", "danger", "critical");
  page.effects.innerHTML = "";
  page.burstBanner.classList.remove("show");
  page.bubble.classList.remove("hidden", "popping");
  page.flash.classList.remove("go");
  page.spinControls.classList.remove("hidden");
  page.finalRound.classList.add("hidden");
  page.newsPopup.classList.add("hidden");
  clearPaylines();
  page.reels.forEach(reel => fillReel(reel, [randomCharacter(), randomCharacter(), randomCharacter()]));

  setHeadline("Seed round raised. Let's grow.");
  Sound.startMusic();
  setMessage("Press SPIN to pump your valuation!");
  updateStats();
  showScreen(page.gameScreen);
}

async function spin() {
  if (!game || isSpinning || game.status !== "playing") return;

  isSpinning = true;
  const bubbleBefore = game.bubble;
  const spinsBefore = game.spinsLeft;
  page.spinButton.disabled = true;
  clearPaylines();
  setMessage(game.streak >= 2 ? "🔥 You can't lose! Keep going..." : "Spinning up the hype machine...");

  // Work out the result first, then animate the reels landing on it.
  // The reels land one at a time, left to right. They speed up a little as the bubble grows.
  const outcome = playSpin(game);
  const firstStop = Math.max(1000, 1500 - bubbleBefore * 5);   // when the first reel lands (ms)
  const gapBetweenReels = 450;                                  // then each next reel lands this much later
  await spinAllReels(outcome.grid, firstStop, gapBetweenReels, bubbleBefore);

  // 1. BREAKING NEWS goes first: flash the symbol, show the pop-up, apply its effect
  if (outcome.news) {
    highlightCells(outcome.newsCells, "news");
    setMessage("📰 BREAKING NEWS!", "meh");
    Sound.newsAlert();
    await wait(700);
    await showNewsPopup(outcome.news);
    setHeadline(outcome.news.headline, outcome.news.isGood ? "good" : "bad");
    await wait(1300);   // a beat to see what the news did before the lines are counted
  }

  // 2. Then the winning lines
  drawPaylines(outcome.lineWins);
  outcome.lineWins.forEach(win => highlightCells(win.cells, "win"));
  showSpinResult(outcome);

  isSpinning = false;
  updateStats();
  if (game.spinsLeft >= spinsBefore) replayAnimation(page.spinsLeft, "bonus");

  // What happens next depends on the game's status
  if (game.status === "popped")     popTheBubble("The AI bubble burst. Your valuation crashed to zero.");
  if (game.status === "bankrupt")   popTheBubble("Your company went bankrupt before the bubble even peaked.");
  if (game.status === "finalRound") { await wait(900); showFinalRound(); }
  if (game.status === "belowStart") {
    setMessage("Final spin... and you're under water.", "lose");
    await wait(1600);
    showEndScreen("lost", `Your final valuation of ${formatMoney(game.valuation)} ended below your ${formatMoney(SETTINGS.startingValuation)} start.`);
  }
}

// Show the message for a spin's result, and play its sound
// Every win gets a celebration, sized by how big it LOOKS, even if the compute bill
// was bigger. The message shows what you won, never what you paid.
function showSpinResult(outcome) {
  const bonus = outcome.bonusSpins ? `  +${outcome.bonusSpins} spin${outcome.bonusSpins > 1 ? "s" : ""}!` : "";

  if (outcome.lineWins.length === 0) {
    setMessage(`Compute bill paid: ${formatMoney(outcome.bill)}`, "meh");
    return;
  }

  // Describe the best line, and mention if there were more
  const best = outcome.lineWins.reduce((a, b) => (b.gain > a.gain ? b : a));
  const more = outcome.lineWins.length - 1;
  const extra = more > 0 ? ` + ${more} more line${more > 1 ? "s" : ""}` : "";
  const howMany = { 3: "THREE", 4: "FOUR", 5: "FIVE" }[best.count];
  setMessage(`${howMany} ${best.symbol.name.toUpperCase()} on line ${best.line}${extra}! +${formatMoney(outcome.winAmount)} raised${bonus}`, "win big");
  celebrate(outcome.totalGain, outcome.streak);
  playVoice(outcome);
}

// Who speaks after a win (the chances are in settings.js):
//   - The biggest winning line's symbol says its line (a CEO, or ChatGPT / Gemini / Claude),
//     but sometimes a generic hype line plays instead.
//   - On a big win led by an AI lab, Jensen often chimes in instead.
//   - A line with no voice clip: sometimes a generic line (more often on a hot streak).
function playVoice(outcome) {
  const chance = odds => Math.random() < odds;
  const voicedWins = outcome.lineWins.filter(win => win.symbol.voice).sort((a, b) => b.gain - a.gain);
  const isAiLab = win => AI_LABS.includes(win.symbol);

  if (voicedWins.length > 0 && isAiLab(voicedWins[0]) && outcome.totalGain >= 0.2 && chance(SETTINGS.jensenBigWinChance)) {
    Sound.voice(WILD.voice);
  } else if (voicedWins.length > 0) {
    Sound.voice(chance(SETTINGS.genericOnCeoWin) ? GENERIC_VOICES : voicedWins[0].symbol.voice);
  } else if (outcome.totalGain >= 0.2 && chance(SETTINGS.jensenBigWinChance)) {
    Sound.voice(WILD.voice);
  } else if (chance(outcome.streak >= 3 ? SETTINGS.genericOnStreak : SETTINGS.genericOnOtherWin)) {
    Sound.voice(GENERIC_VOICES);
  }
}

// The banner, sound and money for a win. Bigger wins get bigger words.
// Every win rains a little money, even the tiny ones.
const WIN_TIERS = [
  { atLeast: 1.0,  words: "AGI ACHIEVED",   rain: 50 },
  { atLeast: 0.5,  words: "HYPERSCALED",    rain: 28 },
  { atLeast: 0.2,  words: "MAXIMUM GROWTH", rain: 14 },
  { atLeast: 0.08, words: "SCALING LAWS",   rain: 8 },
  { atLeast: 0,    words: "LINE GO UP",     rain: 5 },
];

// Extra words under the banner for a win streak
const STREAK_WORDS = [
  { atLeast: 6, words: "THE SINGULARITY" },
  { atLeast: 4, words: "TO THE MOON" },
  { atLeast: 3, words: "HOCKEY STICK" },
  { atLeast: 2, words: "MOMENTUM" },
];

function celebrate(gain, streak) {
  const tier = WIN_TIERS.find(t => gain >= t.atLeast);
  const hot = STREAK_WORDS.find(s => streak >= s.atLeast);
  page.winBanner.innerHTML = tier.words + (hot ? `<small>🔥 ${hot.words} · ${streak} WINS</small>` : "");
  replayAnimation(page.winBanner, "show");
  makeItRain(tier.rain + Math.min(streak, 6) * 3);
  Sound.chaChing();
}


// Show the event's photo if it's in images/news/, otherwise its emoji
function showNewsPicture(news) {
  page.newsPicture.replaceChildren();          // no photo = no picture (keeps the pop-up clean)
  if (!news.photo || missingPhotos.has(news.photo)) return;

  const img = new Image();
  img.alt = "";
  img.onload = () => page.newsPicture.replaceChildren(img);
  img.onerror = () => missingPhotos.add(news.photo);
  img.src = news.photo;
}


// ---------------------------------------------------------------------
//  Breaking news pop-up
//  Shows the event, then closes by itself after SETTINGS.newsPopupSeconds.
//  Clicking it or pressing SPACE closes it early.
// ---------------------------------------------------------------------
function showNewsPopup(news) {
  return new Promise(resolve => {
    page.newsPopup.className = "news-popup " + (news.isGood ? "good" : "bad");
    page.newsTag.textContent = "BREAKING NEWS";
    showNewsPicture(news);
    page.newsHeadline.textContent = news.headline;
    page.newsWhen.textContent = news.when;
    page.newsEffect.textContent = describeNews(news);
    page.newsTimer.style.animationDuration = SETTINGS.newsPopupSeconds + "s";
    replayAnimation(page.newsTimer, "running");
    setTimeout(() => (news.isGood ? Sound.goodNews() : Sound.badNews()), 300);

    const timer = setTimeout(close, SETTINGS.newsPopupSeconds * 1000);
    function close() {
      clearTimeout(timer);
      closeNewsPopup = null;
      page.newsPopup.classList.add("hidden");
      resolve();
    }
    closeNewsPopup = close;
  });
}


// ---------------------------------------------------------------------
//  Final round: Cash Out or Double Down
// ---------------------------------------------------------------------
// The final round nudges players to double down:
//   - Double Down is huge; Cash Out is a small link
//   - the odds are hidden (they're shown on the end screen)
//   - a real number from this machine's history: how many players doubled down
//   - a countdown. If it runs out, the game doubles down for you.
function showFinalRound() {
  game.doubleDownOdds = doubleDownOdds(game);   // saved for the reveal on the end screen
  page.spinControls.classList.add("hidden");
  page.finalRound.classList.remove("hidden");
  page.finalPitch.textContent = `You've raised ${formatMoney(game.totalRaised)}. The bubble is still growing.`;
  page.socialProof.textContent = socialProofText();
  setHeadline("Final round. Investors are waiting.", "good");
  setMessage("Ride the bubble one more time?", "win");
  Sound.chaChing();
  startDecisionCountdown();
}

function startDecisionCountdown() {
  let secondsLeft = SETTINGS.decisionSeconds;
  page.decisionTimer.style.animationDuration = secondsLeft + "s";
  replayAnimation(page.decisionTimer, "running");

  const tick = () => {
    page.decisionNote.textContent = `Your board doubles down for you in ${secondsLeft}...`;
    if (secondsLeft <= 3) Sound.reelStops();
    if (secondsLeft === 0) { stopDecisionCountdown(); doubleDown(true); return; }
    secondsLeft -= 1;
  };
  tick();
  decisionCountdown = setInterval(tick, 1000);
}

function stopDecisionCountdown() {
  clearInterval(decisionCountdown);
  decisionCountdown = null;
}

// ---------------------------------------------------------------------
//  The decision log: a real tally of what players chose on this machine.
//  It's kept in this browser, so it builds up over the day on the gallery laptop.
// ---------------------------------------------------------------------
const LOG_KEY = "aiBubbleTrouble.decisions";

function readLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || { doubled: 0, cashed: 0 }; }
  catch (e) { return { doubled: 0, cashed: 0 }; }
}

function recordDecision(choice) {
  const log = readLog();
  log[choice] += 1;
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) { /* storage not available: skip */ }
}

// Only shows a number once there's enough real history to be honest about it
function socialProofText() {
  const log = readLog();
  const total = log.doubled + log.cashed;
  if (total < 5) return "";
  return `${Math.round((log.doubled / total) * 100)}% of investors on this machine doubled down`;
}

async function cashOut() {
  if (!game || game.status !== "finalRound") return;
  stopDecisionCountdown();
  recordDecision("cashed");
  game.status = "cashedOut";
  page.finalRound.classList.add("hidden");
  Sound.chaChing();
  makeItRain(16);
  await wait(1400);
  showEndScreen("won1");
}

// timedOut = true when the countdown ran out and the game chose for the player
async function doubleDown(timedOut = false) {
  if (!game || game.status !== "finalRound") return;
  stopDecisionCountdown();
  recordDecision("doubled");
  game.timedOut = timedOut === true;
  page.finalRound.classList.add("hidden");
  document.body.classList.add("critical");
  setHeadline(game.timedOut ? "Time's up. Your board went all in." : "All in. One more spin.", "bad");
  setMessage("Doubling down...");

  // Win = the grid fills with the jackpot CEO, with WILDs across the middle.
  // Lose = the whole grid fills with BREAKING NEWS.
  const won = rollDoubleDown(game);
  const best = CHARACTERS.reduce((a, b) => (b.pays[5] > a.pays[5] ? b : a));
  const grid = page.reels.map((reel, i) => [0, 1, 2].map(row => {
    if (!won) return NEWS_SYMBOL;
    return row === 1 && WILD.reels.includes(i) ? WILD : best;
  }));
  clearPaylines();
  await spinAllReels(grid, 1800, 650, 100);    // extra slow for the big moment

  if (won) {
    highlightCells(allCells(), "win");
    game.valuation *= 2;
    countTo("totalRaised", game.totalRaised * 2, 900);   // the jackpot doubles the big number
    setMessage("💎 THE BUBBLE HOLDS! JACKPOT! 💎", "win big");
    Sound.chaChing();
    makeItRain(50);
    await wait(2600);
    showEndScreen("won5");
  } else {
    highlightCells(allCells(), "hit");
    popTheBubble("You doubled down and the bubble burst. Everything is gone.");
  }
}


// ---------------------------------------------------------------------
//  Effects: money rain and THE BIG POP
// ---------------------------------------------------------------------
function makeItRain(howMany) {
  for (let i = 0; i < howMany; i++) {
    const bill = document.createElement("span");
    bill.className = "money";
    bill.textContent = ["💸", "💵", "🪙"][i % 3];
    bill.style.left = Math.random() * 100 + "vw";
    bill.style.animationDelay = Math.random() * 0.9 + "s";
    page.effects.appendChild(bill);
  }
}

async function popTheBubble(reason) {
  page.spinButton.disabled = true;
  page.finalRound.classList.add("hidden");
  setMessage("The bubble is stretching...", "lose");
  Sound.stretching();

  // Step 1: blow the bubble up until it covers the whole screen
  const size = page.bubble.getBoundingClientRect().width || 100;
  const scaleToCoverScreen = (2.4 * Math.hypot(window.innerWidth, window.innerHeight)) / size;
  page.bubble.style.setProperty("--cover", scaleToCoverScreen.toFixed(1));
  page.bubble.classList.add("popping");
  await wait(900);

  // Step 2: POP. Flash, droplets, bursting bubbles and the banner.
  page.bubble.classList.add("hidden");
  replayAnimation(page.flash, "go");
  Sound.pop();
  Sound.stopMusic(0);   // the music cuts out when the bubble pops
  document.body.classList.remove("danger", "critical");
  document.body.classList.add("collapse");
  page.burstBanner.classList.add("show");
  setHeadline("Bubble pops. AI stocks in freefall.", "bad");
  setMessage("💥 POP 💥", "lose");
  addDroplets(40);
  addBursts(60);

  // Step 3: the valuation crashes to zero, and the big number drains away with it
  game.valuation = 0;
  countTo("totalRaised", 0, 1800);

  await wait(3400);
  showEndScreen("lost", reason);
}

// Droplets fly out from the middle of the screen
function addDroplets(howMany) {
  for (let i = 0; i < howMany; i++) {
    const drop = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 70;
    drop.className = "droplet";
    drop.style.setProperty("--dx", Math.cos(angle) * distance + "vmax");
    drop.style.setProperty("--dy", Math.sin(angle) * distance + "vmax");
    drop.style.setProperty("--size", 10 + Math.random() * 40 + "px");
    page.effects.appendChild(drop);
  }
}

// Little bubbles popping all over the screen
function addBursts(howMany) {
  for (let i = 0; i < howMany; i++) {
    const burst = document.createElement("span");
    burst.className = "burst";
    burst.style.left = Math.random() * 100 + "vw";
    burst.style.top = Math.random() * 100 + "vh";
    burst.style.setProperty("--size", 20 + Math.random() * 80 + "px");
    burst.style.animationDelay = Math.random() * 0.8 + "s";
    page.effects.appendChild(burst);
  }
}


// ---------------------------------------------------------------------
//  End screen and reset
//  result: "won5", "won1" or "lost"
// ---------------------------------------------------------------------
function showEndScreen(result, reason = "") {
  Sound.stopMusic();
  document.body.classList.remove("collapse", "danger", "critical");
  page.burstBanner.classList.remove("show");
  page.effects.innerHTML = "";
  page.bubble.classList.remove("popping");

  const won = result !== "lost";
  page.endScreen.classList.toggle("won", won);
  page.endScreen.classList.toggle("lost", !won);
  page.ticket.classList.toggle("hidden", !won);

  if (result === "won5") {
    page.endIcon.textContent = "💎";
    page.endTitle.textContent = "You won $5!";
    page.endText.textContent = "You doubled down and the bubble held. Legendary timing.";
    page.ticket.innerHTML = makeTicket(5, "Doubled down");
  } else if (result === "won1") {
    page.endIcon.textContent = "💵";
    page.endTitle.textContent = "You won $1!";
    page.endText.textContent = "You cashed out before the bubble burst. Smart money.";
    page.ticket.innerHTML = makeTicket(1, "Cashed out");
  } else {
    page.endIcon.textContent = "💥";
    page.endTitle.textContent = "You lost your dollar";
    page.endText.textContent = reason;
  }

  page.reveal.innerHTML = makeReveal(result);
  showScreen(page.endScreen);
}

// "What really happened": the numbers the game was hiding
function makeReveal(result) {
  const net = { won5: "+$4", won1: "$0 (you got your dollar back)", lost: "−$1" }[result];
  const row = (label, value) => `<div class="reveal-row"><span>${label}</span><b>${value}</b></div>`;
  const odds = game.doubleDownOdds !== undefined
    ? row("Your Double Down odds", Math.round(game.doubleDownOdds * 100) + "%" + (game.timedOut ? " (the timer chose for you)" : ""))
    : "";
  return `
    <div class="reveal-title">What really happened</div>
    ${row("Wins celebrated", game.winsSeen)}
    ${row("Total raised", formatMoney(game.totalRaised))}
    ${row("Compute bills paid", formatMoney(game.billsPaid))}
    ${row("Spins above break-even", `${game.spinsAboveStart} of ${game.spinsPlayed}`)}
    ${row("Peak valuation", formatMoney(game.peakValuation))}
    ${odds}
    ${row("Your result", net)}
    <p class="reveal-note">This machine is set to keep ${SETTINGS.houseKeeps} of every dollar.</p>`;
}

// The cash-out ticket the player shows to staff
function makeTicket(dollars, how) {
  const ticketNumber = Math.floor(100000 + Math.random() * 900000);
  const row = (label, value) => `<div class="ticket-row"><span>${label}</span><span>${value}</span></div>`;
  return `
    <div class="ticket-head">AI BUBBLE TROUBLE · CASH-OUT TICKET</div>
    ${row("Ticket #", ticketNumber)}
    ${row("Payout", `$${dollars} Human Dollar${dollars > 1 ? "s" : ""}`)}
    ${row("How", how)}
    ${row("Final valuation", formatMoney(game.valuation))}
    ${row("Spins played", game.spinsPlayed)}
    ${row("Time", new Date().toLocaleString())}
    <div class="ticket-foot">Show this screen to staff to collect your winnings.</div>`;
}

function resetToStart() {
  Sound.stopMusic(0);
  game = null;
  page.paidCheckbox.checked = false;
  page.startButton.disabled = true;
  showScreen(page.startScreen);
}


// ---------------------------------------------------------------------
//  Buttons and keys
// ---------------------------------------------------------------------
page.paidCheckbox.addEventListener("change", () => {
  page.startButton.disabled = !page.paidCheckbox.checked;
});

page.startButton.addEventListener("click", () => {
  if (!page.paidCheckbox.checked) return;
  Sound.start();
  startGame();
});

page.spinButton.addEventListener("click", spin);
page.cashOutButton.addEventListener("click", cashOut);
page.doubleDownButton.addEventListener("click", () => doubleDown(false));
page.resetButton.addEventListener("click", resetToStart);

page.newsPopup.addEventListener("click", () => closeNewsPopup && closeNewsPopup());

// Spacebar spins, or closes the news pop-up if it's open
document.addEventListener("keydown", event => {
  if (event.code === "Space" && page.gameScreen.classList.contains("active")) {
    event.preventDefault();
    if (closeNewsPopup) closeNewsPopup();
    else spin();
  }
});

