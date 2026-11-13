// =====================================================================
//  SCREEN
//  Everything the player sees and clicks: the three screens, the
//  spinning 5×3 reels, the info bar, the bubble and the pop.
//
//  Order of a game:
//    Start screen → startGame() → press SPIN → spin() ... → final round
//    → showEndScreen() → Reset → start screen
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
  newsCard:         document.getElementById("newsCard"),
  newsCardPicture:  document.getElementById("newsCardPicture"),
  newsCardHeadline: document.getElementById("newsCardHeadline"),
  newsCardEffect:   document.getElementById("newsCardEffect"),
  bubbleFill:       document.getElementById("bubbleFill"),
  bubbleMeterValue: document.getElementById("bubbleMeterValue"),
  goalMeter:        document.getElementById("goalMeter"),
  goalFill:         document.getElementById("goalFill"),
  goalValue:        document.getElementById("goalValue"),
  flood:        document.getElementById("flood"),
  crashNumber:  document.getElementById("crashNumber"),
  spinChart:    document.getElementById("spinChart"),
  autoButton:   document.getElementById("autoButton"),
  spinButton:   document.getElementById("spinButton"),
  resetButton:  document.getElementById("resetButton"),

  // Info bar and top bar
  lastWin:      document.getElementById("lastWin"),
  streak:       document.getElementById("streak"),
  spinsLeft:    document.getElementById("spinsLeft"),
  headline:     document.getElementById("headline"),
  message:      document.getElementById("message"),

  // Reels: 5 columns
  reels:        [0, 1, 2, 3, 4].map(i => document.getElementById("reel" + i)),
  spinControls: document.getElementById("spinControls"),
  totalRaised:  document.getElementById("totalRaised"),
  winBanner:    document.getElementById("winBanner"),
  reveal:       document.getElementById("reveal"),

  // Breaking news pop-up
  newsPopup:    document.getElementById("newsPopup"),
  newsPicture:  document.getElementById("newsPicture"),
  newsHeadline: document.getElementById("newsHeadline"),
  newsEffect:   document.getElementById("newsEffect"),

  // Bubble and effects
  bubble:       document.getElementById("bubble"),
  bubbleMeter:  document.getElementById("bubbleMeter"),
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
let autoSpin = false;     // true while AUTO is on: the game keeps spinning by itself
let autoTimer = null;
let newsMood = null;      // this spin's news: true = good, false = bad, null = no story
let hurry = null;         // while something can be sped up (reels moving, a pause), calling this skips ahead
const shownNumbers = { totalRaised: 0, lastWin: 0 };   // what each counter shows right now
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

  // The big Total Raised number glows neon green and grows while it counts up,
  // and a "+$12.4B" floats up out of it.
  if (name === "totalRaised" && target > from) {
    element.classList.add("counting");
    clearTimeout(element.countingTimer);
    element.countingTimer = setTimeout(() => element.classList.remove("counting"), duration);
  }
}

// A "+$12.4B" that rises out of a box and fades away
function floatMoney(box, text, style = "") {
  const floater = document.createElement("span");
  floater.className = "money-float " + style;
  floater.textContent = text;
  box.appendChild(floater);
  setTimeout(() => floater.remove(), 1800);
}

// ----- The valuation meter (right of the reels) -----
// It shows the real valuation. The GOAL line sits halfway up: that's the starting
// valuation you have to finish above. Each step up the meter is a multiple, not a
// fixed amount (the top is 10× the goal, the bottom is a tenth of it), so it can
// show $20 billion and $900 billion on the same bar.
// While winning bubbles are still popping, their money hasn't "arrived" yet:
// pendingCash is what's still flying toward the meter.
let pendingCash = 0;
function showGoalMeter() {
  const value = Math.max(0, game.valuation - pendingCash);
  const goal = SETTINGS.startingValuation;
  const height = value <= 0 ? 0 : Math.max(2, Math.min(100, 50 + 50 * Math.log10(value / goal)));
  page.goalFill.style.height = height + "%";
  page.goalValue.textContent = formatMoney(value);
  page.goalMeter.classList.toggle("below", value < goal);
}

// ----- The little candlestick chart (bottom right): one candle per spin -----
// Same scale as the meter: break-even is halfway up. The body runs from where the
// valuation started that spin to where it ended (green up, red down). The thin wick
// shows the whole ride within the spin: up to the news high, down to after the bill.
let lastClose = null;
function chartHeight(value) {
  const goal = SETTINGS.startingValuation;
  return value <= 0 ? 0 : Math.max(2, Math.min(100, 50 + 50 * Math.log10(value / goal)));
}
let pendingCandle = null;
function drawPendingCandle() {
  if (!pendingCandle || !game) return;
  addChartCandle(pendingCandle);
  pendingCandle = null;
}

function addChartCandle(outcome) {
  const open = lastClose === null ? SETTINGS.startingValuation : lastClose;
  const close = game.valuation;
  lastClose = close;
  const afterNews = outcome ? outcome.valuationAfterNews : close;
  const afterBill = outcome ? afterNews - outcome.bill : close;
  const high = chartHeight(Math.max(open, afterNews, close));
  const low = chartHeight(Math.min(open, afterNews, afterBill, close));
  const top = chartHeight(Math.max(open, close));
  const bottom = chartHeight(Math.min(open, close));

  const candle = document.createElement("div");
  candle.className = "candle" + (close < open ? " down" : "");
  candle.innerHTML =
    `<i class="wick" style="bottom:${low}%; height:${Math.max(2, high - low)}%"></i>` +
    `<i class="body" style="bottom:${bottom}%; height:${Math.max(3, top - bottom)}%"></i>`;
  page.spinChart.appendChild(candle);
}
function clearChart() {
  lastClose = null;
  page.spinChart.replaceChildren();
}

// ----- The stock tickers on all four edges -----
// A mix of made-up stock quotes and the game's real AI headlines, in green (up / good)
// and red (down / bad). They crawl at first and speed up as the game goes on.
const TICKER_STOCKS = ["NVDA", "OPAI", "ANTH", "META", "ORCL", "XAI", "GOOG", "MSFT", "TSLA", "AMD", "TSM", "CRWV", "PLTR", "SMCI"];
function tickerItems() {
  const items = [];
  const headlines = [...GOOD_NEWS.map(n => [n.headline, true]), ...BAD_NEWS.map(n => [n.headline, false])]
    .sort(() => Math.random() - 0.5);
  for (let i = 0; i < 16; i++) {
    // Quotes lean white: with the colored headlines mixed in, the whole strip
    // lands at about a third green, a third red, a third white.
    const roll = Math.random();
    const mood = roll < 0.31 ? "up" : roll < 0.62 ? "down" : "flat";
    const stock = TICKER_STOCKS[Math.floor(Math.random() * TICKER_STOCKS.length)];
    const price = (20 + Math.random() * 900).toFixed(2);
    const change = (Math.random() * 9).toFixed(2);
    const tail = { up: ` ▲ +${change}%`, down: ` ▼ -${change}%`, flat: ` ${(Math.random() * 90 + 1).toFixed(1)}M` }[mood];
    items.push(`<span class="${mood}">${stock} ${price}${tail}</span>`);
    if (i % 3 === 2 && headlines.length) {
      const [text, good] = headlines.pop();
      items.push(`<span class="${good ? "up" : "down"}">${text.toUpperCase()}</span>`);
    }
  }
  return items.join("");
}

const tickers = [...document.querySelectorAll(".ticker")].map(strip => ({
  track: strip.querySelector(".ticker-track"),
  sideways: strip.classList.contains("ticker-left") || strip.classList.contains("ticker-right"),
  backwards: strip.classList.contains("ticker-bottom") || strip.classList.contains("ticker-left"),   // so the four don't all run the same way
  offset: 0,
}));
function fillTickers() {
  tickers.forEach(t => {
    const items = tickerItems();
    t.track.innerHTML = items + items;   // twice, so the loop has no gap
    t.offset = 0;
  });
}

// How fast the tickers move right now, in pixels per second
function tickerSpeed() {
  if (!game) return SETTINGS.tickerStartSpeed;
  const progress = Math.min(1, game.spinsPlayed / SETTINGS.maxSpins);
  return SETTINGS.tickerStartSpeed + (SETTINGS.tickerEndSpeed - SETTINGS.tickerStartSpeed) * progress * progress;
}

let lastTickerTime = 0;
function moveTickers(now) {
  const seconds = Math.min(0.1, (now - lastTickerTime) / 1000);
  lastTickerTime = now;
  if (page.gameScreen.classList.contains("active")) {
    const step = tickerSpeed() * seconds;
    tickers.forEach(t => {
      const loop = (t.sideways ? t.track.offsetHeight : t.track.offsetWidth) / 2;   // one copy of the items
      if (loop <= 0) return;
      t.offset = (t.offset + step) % loop;
      const shift = t.backwards ? t.offset - loop : -t.offset;
      t.track.style.transform = t.sideways ? `translateY(${shift}px)` : `translateX(${shift}px)`;
    });
  }
  requestAnimationFrame(moveTickers);
}
requestAnimationFrame(moveTickers);

function updateStats() {
  // the big number rolls up slowly, for drama (longer for bigger jumps)
  const jump = game.totalRaised - shownNumbers.totalRaised;
  const share = jump / Math.max(1, game.totalRaised);    // how big the jump is, 0 to 1
  countTo("totalRaised", game.totalRaised, Math.min(2400, 1000 + share * 2800));
  shownNumbers.lastWin = 0;
  countTo("lastWin", game.lastWin, 1200);            // the WIN box counts up from zero every time
  page.lastWin.classList.toggle("lit", game.lastWin > 0);
  if (game.lastWin > 0) Sound.rollUp(1.1);                 // ticking while the win counts up
  page.streak.textContent = game.streak >= 2
    ? `🔥 ${game.streak} in a row · wins ×${streakBoost(game.streak + 1).toFixed(1)}` : "";
  page.spinsLeft.textContent = game.spinsLeft;
  page.spinsLeft.classList.toggle("low", game.spinsLeft <= 2);
  page.spinButton.disabled = isSpinning || game.status !== "playing";

  // The two meters beside the reels
  page.bubbleFill.style.height = Math.min(100, game.bubble) + "%";
  page.bubbleMeterValue.textContent = Math.round(game.bubble) + "%";
  page.bubbleMeter.classList.toggle("warn", game.bubble >= SETTINGS.bubbleYellowAt);     // yellow
  page.bubbleMeter.classList.toggle("danger", game.bubble >= SETTINGS.bubbleRedAt);      // red and shaking
  showGoalMeter();


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

  // The NEWS symbol is drawn, not a photo: a "!" in a circle. Neon green if this
  // spin's story is good news, red if it's bad. (While the reels are still whizzing
  // by and there's no story this spin, each one is green or red at random.)
  if (symbol.isNews) {
    const good = newsMood === null ? Math.random() < 0.5 : newsMood;
    const dot = document.createElement("div");
    dot.className = "news-dot " + (good ? "good" : "bad");
    dot.textContent = "!";
    box.appendChild(dot);
    return box;
  }

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
// stoppers: a list this reel adds its "stop right now" function to
function spinReel(reel, reelNumber, results, duration, bubble, speed = 1, stoppers = []) {
  return new Promise(resolve => {
    const rowHeight = reel.firstElementChild.getBoundingClientRect().height;
    const windowHeight = reel.parentElement.clientHeight;
    reel.parentElement.classList.add("moving");   // the window only clips while the reel is moving (see style.css)
    const centered = (windowHeight - ROWS * rowHeight) / 2;   // where the strip sits when still
    const extraSymbols = Math.round((duration / 40) * speed);   // longer or faster spins need a longer strip
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

    let landed = false;
    function land() {
      if (landed) return;
      landed = true;
      clearTimeout(timer);
      reel.style.transition = "none";
      reel.style.transform = "";   // back to the resting position set in style.css
      fillReel(reel, results);
      reel.parentElement.classList.remove("moving");
      Sound.reelStops();
      resolve();
    }
    const timer = setTimeout(land, duration);
    stoppers.push(land);
  });
}

// Spin all five reels; each one stops a bit after the one before
// Spin all 5 reels. Pressing SPACE (or SPIN) while they move slams them all to a stop.
// (canStop = false for the big Double Down spin: that one always plays out.)
async function spinAllReels(grid, firstStop, gap, bubble, speed, canStop = true) {
  Sound.reelsSpinning((firstStop + (REELS - 1) * gap) / 1000, bubble);
  const stoppers = [];
  if (canStop) hurry = () => { Sound.stopSpinning(); stoppers.forEach(stop => stop()); };
  await Promise.all(page.reels.map((reel, i) => spinReel(reel, i, grid[i], firstStop + i * gap, bubble, speed, stoppers)));
  hurry = null;
}

// Wait a moment, unless the player presses SPACE (or SPIN) to skip it
function skippableWait(ms) {
  return new Promise(resolve => {
    const timer = setTimeout(done, ms);
    function done() { clearTimeout(timer); hurry = null; resolve(); }
    hurry = done;
  });
}

// How fast the reels spin: 1 on the first spin, a bit faster every spin after
// (spinSpeedUp in settings.js), up to maxSpinSpeed.
function spinSpeed() {
  return Math.min(SETTINGS.maxSpinSpeed, 1 + (game.spinsPlayed - 1) * SETTINGS.spinSpeedUp);
}

// The symbol box at a [reel, row] spot
function cellAt(reel, row) {
  return page.reels[reel].children[row];
}

// After the winning circles light up green, they pop like bubbles one by one,
// left to right: each swells, bursts into a ring and droplets, and a "+$2.1B"
// (its share of the win) floats up out of it. Popped bubbles stay gone.
let popTimers = [];
let popRun = 0;   // goes up every spin, so money from an old spin can't land in a new one
function popWinningBubbles(wins, winAmount) {
  const thisRun = popRun;
  pendingCash = winAmount;   // none of this spin's winnings have reached the meter yet
  // Each win's share of the money, split evenly over its circles
  // (a Jensen that helps two wins gets a share of both)
  const totalGain = wins.reduce((sum, win) => sum + win.gain, 0);
  const cells = [];
  wins.forEach(win => {
    const each = (winAmount * win.gain / totalGain) / win.cells.length;
    win.cells.forEach(([reel, row]) => {
      const known = cells.find(c => c.reel === reel && c.row === row);
      if (known) known.amount += each;
      else cells.push({ reel, row, amount: each });
    });
  });
  cells.sort((a, b) => a.reel - b.reel || a.row - b.row);

  cells.forEach(({ reel, row, amount }, i) => {
    popTimers.push(setTimeout(() => {
      const box = cellAt(reel, row);
      replayAnimation(box, "popping");
      Sound.bubblePop();

      // the ring and droplets, centred on the circle
      const rect = box.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const ring = document.createElement("div");
      ring.className = "bubble-ring";
      ring.style.cssText = `left:${x}px; top:${y}px; --size:${rect.width * 0.8}px`;
      page.effects.appendChild(ring);
      setTimeout(() => ring.remove(), 700);

      for (let d = 0; d < 7; d++) {
        const angle = (d / 7) * Math.PI * 2 + Math.random() * 0.5;
        const distance = rect.width * (0.5 + Math.random() * 0.35);
        const drop = document.createElement("div");
        drop.className = "bubble-drop";
        drop.style.cssText = `left:${x}px; top:${y}px; --size:${6 + Math.random() * 10}px;` +
          `--dx:${Math.cos(angle) * distance}px; --dy:${Math.sin(angle) * distance}px`;
        page.effects.appendChild(drop);
        setTimeout(() => drop.remove(), 700);
      }

      // this bubble's share of the win pops out, then flies into the valuation meter
      const cash = document.createElement("div");
      cash.className = "bubble-cash";
      cash.textContent = "+" + formatMoney(amount);
      cash.style.cssText = `left:${x}px; top:${y}px`;
      page.effects.appendChild(cash);

      // where it's going: the top of the meter's fill (or Total Raised on a small screen with no meters)
      const meterShowing = page.goalMeter.offsetWidth > 0;
      const target = (meterShowing ? page.goalFill : page.spinButton).getBoundingClientRect();
      const dx = target.left + target.width / 2 - x;
      const dy = target.top - y;
      const flight = cash.animate([
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -80%) scale(1.15)", opacity: 1, offset: 0.15 },
        { transform: "translate(-50%, -80%) scale(1)", opacity: 1, offset: 0.45 },   // hangs for a beat
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.45)`, opacity: 0.9 },
      ], { duration: SETTINGS.cashFlightSeconds * 1000, easing: "ease-in" });
      flight.onfinish = () => {
        cash.remove();
        if (thisRun !== popRun) return;            // a new spin already started
        pendingCash = Math.max(0, pendingCash - amount);
        showGoalMeter();                           // the meter rises by this bubble's amount
        replayAnimation(page.goalMeter, "bump");
        Sound.beep(1200 + Math.random() * 300, 0.05, "triangle", 0.08);
      };
    }, (SETTINGS.highlightBeforePop + i * SETTINGS.bubblePopGap) * 1000));
  });
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

// Clear the last spin's win highlights
function clearWins() {
  drawPendingCandle();               // a candle still waiting to be drawn lands now
  popTimers.forEach(clearTimeout);   // a new spin cancels any pops still waiting
  popTimers = [];
  popRun += 1;
  pendingCash = 0;                   // any money still in the air lands at once
  document.querySelectorAll(".bubble-cash").forEach(cash => cash.remove());
  if (game) showGoalMeter();
  document.querySelectorAll(".symbol.popping").forEach(box => box.classList.remove("popping"));
  page.reels.forEach(reel => reel.parentElement.classList.remove("has-win"));
}



// ---------------------------------------------------------------------
//  Playing
// ---------------------------------------------------------------------
function startGame() {
  hideNewsCard();
  setAutoSpin(false);
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
  page.flood.classList.remove("show");
  page.bubbleMeter.classList.remove("broken", "warn", "danger");
  fillTickers();
  clearChart();
  page.newsPopup.classList.add("hidden");
  clearWins();
  page.reels.forEach(reel => fillReel(reel, [randomCharacter(), randomCharacter(), randomCharacter()]));

  setHeadline("Seed round raised. Let's grow.");
  Sound.startMusic();
  setMessage("Press SPIN to pump your valuation!");
  updateStats();
  showScreen(page.gameScreen);
}

// Turn autospin on or off (the AUTO button, or the A key)
function setAutoSpin(on) {
  autoSpin = on;
  clearTimeout(autoTimer);
  page.autoButton.classList.toggle("on", on);
  page.autoButton.innerHTML = on ? "AUTO<br>SPIN ON" : "AUTO<br>SPIN";   // two lines either way
  if (on && !isSpinning) spin();
}

async function spin() {
  if (!game || isSpinning || game.status !== "playing") return;

  clearTimeout(autoTimer);
  isSpinning = true;
  const bubbleBefore = game.bubble;
  const spinsBefore = game.spinsLeft;
  page.spinButton.disabled = false;   // stays pressable: pressing it again slams the reels to a stop
  page.spinButton.classList.add("spinning");
  page.winBanner.classList.remove("show");   // a new spin clears the last win right away
  clearWins();
  setMessage(game.streak >= 2 ? "🔥 You can't lose! Keep going..." : "Spinning up the hype machine...");

  // Work out the result first, then animate the reels landing on it.
  // The reels land one at a time, left to right. Every spin, they whip by faster
  // and land sooner, so the game feels more frantic as it goes.
  const outcome = playSpin(game);
  newsMood = outcome.news ? outcome.news.isGood : null;   // colors the NEWS symbols green or red
  const speed = spinSpeed();
  const firstStop = 1500 / speed;          // when the first reel lands (ms)
  const gapBetweenReels = 450 / speed;     // then each next reel lands this much later
  await spinAllReels(outcome.grid, firstStop, gapBetweenReels, bubbleBefore, speed);

  // 1. BREAKING NEWS goes first: flash the symbol, show the pop-up, apply its effect
  //    Most stories show as a card at the top and the game carries straight on.
  //    A story marked fullScreen (the Jensen finale) stops the game with a pop-up.
  if (outcome.news) {
    highlightCells(outcome.newsCells, "news");   // a ring ripples out of the NEWS symbol
    Sound.newsAlert();
    if (outcome.news.fullScreen) {
      hideNewsCard();
      setMessage("Breaking news!", "meh");
      await skippableWait(SETTINGS.newsLeadIn * 1000);   // the ripple, before the story opens
      await showNewsPopup(outcome.news, outcome.newsCells[0]);
      await skippableWait(SETTINGS.newsAfterPause * 1000);   // a beat to see what the news did
    } else {
      showNewsCard(outcome.news, outcome.newsCells[0]);
    }
    setHeadline(outcome.news.headline, outcome.news.isGood ? "good" : "bad");
  }

  // 2. Then the winning lines
  // Light up every winning symbol, and fade out the rest
  outcome.lineWins.forEach(win => highlightCells(win.cells, "win"));
  popWinningBubbles(outcome.lineWins, outcome.winAmount);
  if (outcome.lineWins.length > 0) page.reels.forEach(reel => reel.parentElement.classList.add("has-win"));
  showSpinResult(outcome);

  isSpinning = false;
  page.spinButton.classList.remove("spinning");
  updateStats();
  // The candle is drawn once the spin's result has played out (after the pops and
  // the flying money on a win; right away on a loss). If the player starts the next
  // spin before that, the candle is drawn at that moment instead (see clearWins).
  const candleDelay = outcome.lineWins.length > 0
    ? (SETTINGS.highlightBeforePop + SETTINGS.cashFlightSeconds) * 1000 : 300;
  pendingCandle = outcome;
  setTimeout(drawPendingCandle, candleDelay);
  if (game.spinsLeft >= spinsBefore) replayAnimation(page.spinsLeft, "bonus");

  // Autospin: the next spin starts by itself after a short pause
  if (autoSpin && game.status === "playing") {
    const pause = outcome.lineWins.length > 0 ? SETTINGS.autoSpinPauseAfterWin : SETTINGS.autoSpinPause;
    autoTimer = setTimeout(spin, pause * 1000);
  }
  if (game.status !== "playing") setAutoSpin(false);   // the game is ending: AUTO switches off

  // What happens next depends on the game's status
  if (game.status === "popped")     popTheBubble("The AI bubble burst. Your valuation crashed to zero.");
  if (game.status === "bankrupt")   popTheBubble("Your company went bankrupt before the bubble even peaked.");
  if (game.status === "jackpot")   { await wait(2200); showEndScreen("won5"); }
  if (game.status === "brokeEven") { await wait(2200); showEndScreen("won1"); }
  if (game.status === "belowStart") {
    await wait(1600);
    showEndScreen("lost", `Your final valuation of ${formatMoney(game.valuation)} ended below your ${formatMoney(SETTINGS.startingValuation)} start.`);
  }
}

// Show the message for a spin's result, and play its sound
// Every win gets a celebration, sized by how big it LOOKS, even if the compute bill
// was bigger. The message shows what you won, never what you paid.
function showSpinResult(outcome) {

  if (outcome.lineWins.length === 0) {
    setMessage(`Compute bill paid: ${formatMoney(outcome.bill)}`, "meh");
    return;
  }

  // The win is described right under the big win words ("Five Sam Altmans"),
  // so the message under the reels stays empty
  const best = outcome.lineWins.reduce((a, b) => (b.gain > a.gain ? b : a));
  const howMany = { 3: "Three", 4: "Four", 5: "Five" }[best.count];
  const ways = best.ways > 1 ? ` × ${best.ways} ways` : "";
  setMessage("");
  celebrate(outcome.totalGain, `${howMany} ${best.symbol.name}s${ways}`);
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
// color: white for small wins, neon green for everything bigger
const WIN_TIERS = [
  { atLeast: 1.0,  words: "AGI Achieved",   rain: 50, color: "#39ff14" },   // neon green
  { atLeast: 0.5,  words: "Hyperscaled",    rain: 28, color: "#39ff14" },   // neon green
  { atLeast: 0.2,  words: "Maximum Growth", rain: 14, color: "#39ff14" },   // neon green
  { atLeast: 0.08, words: "Scaling Laws",   rain: 8,  color: "#39ff14" },   // neon green
  { atLeast: 0,    words: "Line Goes Up",   rain: 5,  color: "#ffffff" },   // white
];

// The big win words, with what matched right under them ("Five Sam Altmans")
function celebrate(gain, whatMatched) {
  const tier = WIN_TIERS.find(t => gain >= t.atLeast);
  // The main words, plus 3 see-through "echo" copies that trail behind them
  const words = `${tier.words}<small>${whatMatched}</small>`;
  page.winBanner.innerHTML =
    `<span class="win-layer echo echo-3">${words}</span>` +
    `<span class="win-layer echo echo-2">${words}</span>` +
    `<span class="win-layer echo echo-1">${words}</span>` +
    `<span class="win-layer">${words}</span>`;
  page.winBanner.style.color = tier.color;
  replayAnimation(page.winBanner, "show");
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
// fromCell: the [reel, row] of the NEWS symbol, so the pop-up grows out of it
// The news card: pops up in the middle with the photo, headline and effect, then
// slides up and fades away (SETTINGS.newsCardSeconds in all). It doesn't stop the game.
let newsCardTimer = null;
// fromCell: the [reel, row] of the NEWS symbol, so the card grows out of it
function showNewsCard(news, fromCell) {
  if (fromCell) {
    // how far that symbol is from where the card sits (left: 50%, top: 42% of the screen)
    const symbol = cellAt(...fromCell).getBoundingClientRect();
    page.newsCard.style.setProperty("--from-x", (symbol.left + symbol.width / 2 - window.innerWidth / 2) + "px");
    page.newsCard.style.setProperty("--from-y", (symbol.top + symbol.height / 2 - window.innerHeight * 0.42) + "px");
  }
  page.newsCardPicture.replaceChildren();
  if (news.photo && !missingPhotos.has(news.photo)) {
    const img = new Image();
    img.alt = "";
    img.onload = () => page.newsCardPicture.replaceChildren(img);
    img.onerror = () => missingPhotos.add(news.photo);
    img.src = news.photo;
  }
  page.newsCardHeadline.textContent = news.headline;
  page.newsCardEffect.textContent = describeNews(news);
  page.newsCard.className = "news-card " + (news.isGood ? "good" : "bad");   // also colors its "!" dot
  replayAnimation(page.newsCard, "show");
  news.isGood ? Sound.goodNews() : Sound.badNews();

  page.newsCard.style.animationDuration = SETTINGS.newsCardSeconds + "s";

  clearTimeout(newsCardTimer);
  newsCardTimer = setTimeout(hideNewsCard, SETTINGS.newsCardSeconds * 1000);
}
function hideNewsCard() {
  clearTimeout(newsCardTimer);
  page.newsCard.classList.remove("show");
}

function showNewsPopup(news, fromCell) {
  return new Promise(resolve => {
    if (fromCell) {
      // How far the symbol is from the middle of the pop-up
      const symbol = cellAt(...fromCell).getBoundingClientRect();
      const machine = page.newsPopup.parentElement.getBoundingClientRect();
      const popupX = machine.left + machine.width / 2;
      const popupY = machine.top + machine.height * 0.45;   // the pop-up sits at top: 45%
      page.newsPopup.style.setProperty("--from-x", (symbol.left + symbol.width / 2 - popupX) + "px");
      page.newsPopup.style.setProperty("--from-y", (symbol.top + symbol.height / 2 - popupY) + "px");
    }
    page.newsPopup.className = "news-popup " + (news.isGood ? "good" : "bad");
    showNewsPicture(news);
    page.newsHeadline.textContent = news.headline;
    page.newsEffect.textContent = describeNews(news);
    setTimeout(() => (news.isGood ? Sound.goodNews() : Sound.badNews()), 300);

    const seconds = autoSpin ? SETTINGS.autoNewsSeconds : SETTINGS.newsPopupSeconds;
    const timer = setTimeout(close, seconds * 1000);
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
//  Effects: money rain and THE BIG POP
// ---------------------------------------------------------------------

async function popTheBubble(reason) {
  hideNewsCard();
  page.spinButton.disabled = true;
  const valuationBefore = game.valuation;

  // Step 1: the bubble meter fills right to the top, red and shaking
  page.bubbleMeter.classList.add("warn", "danger");
  page.bubbleFill.style.height = "100%";
  page.bubbleMeterValue.textContent = "100%";
  Sound.stretching();
  await wait(1100);

  // Step 2: it breaks. Red floods out of the meter until it covers the whole screen.
  const meter = page.bubbleMeter.getBoundingClientRect();
  page.flood.style.setProperty("--x", (meter.left + meter.width / 2) + "px");
  page.flood.style.setProperty("--y", (meter.top + meter.height / 2) + "px");
  page.bubbleMeter.classList.add("broken");
  page.crashNumber.textContent = formatMoney(valuationBefore);
  replayAnimation(page.flood, "show");
  Sound.pop();
  Sound.stopMusic(0);   // the music cuts out when the bubble pops
  document.body.classList.remove("danger", "critical");
  await wait(1300);

  // Step 3: in the middle of the red screen, the valuation drops to $0 in huge numbers
  game.valuation = 0;
  pendingCash = 0;
  showGoalMeter();                 // the valuation meter drains too
  pendingCandle = null;
  addChartCandle(null);            // one last red candle on the chart, down to zero
  const dropTime = 2200;
  const start = performance.now();
  await new Promise(done => {
    function step(now) {
      const t = Math.min(1, (now - start) / dropTime);
      const value = valuationBefore * Math.pow(1 - t, 3);     // fast at first, slowing into zero
      page.crashNumber.textContent = formatMoney(t === 1 ? 0 : value);
      if (t < 1) requestAnimationFrame(step); else done();
    }
    requestAnimationFrame(step);
  });
  Sound.badNews();

  await wait(1800);
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
  if (result === "lost") Sound.sadSong();   // the sad song plays whenever the player loses
  if (result === "won5") Sound.moneySong(); // the money song plays when the player hits $1 trillion
  page.flood.classList.remove("show");
  hideNewsCard();
  Sound.stopMusic();
  document.body.classList.remove("collapse", "danger", "critical");
  page.burstBanner.classList.remove("show");
  page.effects.innerHTML = "";
  page.bubble.classList.remove("popping");

  const won = result !== "lost";
  page.endScreen.classList.toggle("won", won);
  page.endScreen.classList.toggle("lost", !won);
  page.endScreen.classList.toggle("jackpot", result === "won5");   // the money photo behind the $5 win
  page.ticket.classList.toggle("hidden", !won);

  if (result === "won5") {
    page.endIcon.textContent = "💎";
    page.endTitle.textContent = "You won $5!";
    page.endText.textContent = "You rode the hype all the way to $1 trillion. Legendary timing.";
    page.ticket.innerHTML = makeTicket(5, "Hit $1 trillion");
  } else if (result === "won1") {
    page.endIcon.textContent = "💵";
    page.endTitle.textContent = "You got your $1 back";
    page.endText.textContent = "You finished above break-even, but the $5 needed $1 trillion.";
    page.ticket.innerHTML = makeTicket(1, "Broke even");
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
  return `
    <div class="reveal-title">What really happened</div>
    ${row("Wins celebrated", game.winsSeen)}
    ${row("Total raised", formatMoney(game.totalRaised))}
    ${row("Compute bills paid", formatMoney(game.billsPaid))}
    ${row("Spins above break-even", `${game.spinsAboveStart} of ${game.spinsPlayed}`)}
    ${row("Peak valuation", formatMoney(game.peakValuation))}
    ${row("Your result", net)}`;
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
  Sound.stopSadSong();
  Sound.stopMoneySong();
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

// SPIN (or SPACE) does whatever moves the game along: closes the news, slams the
// reels to a stop, skips a pause, or starts the next spin.
function spinOrHurry() {
  if (closeNewsPopup) closeNewsPopup();
  else if (hurry) hurry();
  else spin();
}
page.spinButton.addEventListener("click", spinOrHurry);
page.resetButton.addEventListener("click", resetToStart);

page.newsPopup.addEventListener("click", () => closeNewsPopup && closeNewsPopup());

// Spacebar spins, or closes the news pop-up if it's open
document.addEventListener("keydown", event => {
  if (event.code === "Space" && page.gameScreen.classList.contains("active")) {
    event.preventDefault();
    // Holding SPACE down keeps spinning (auto-play) but doesn't skip anything;
    // tapping it skips ahead.
    if (event.repeat) { if (!isSpinning) spin(); }
    else spinOrHurry();
  }
  // A turns autospin on and off
  if (event.code === "KeyA" && !event.repeat && page.gameScreen.classList.contains("active") && game && game.status === "playing") {
    setAutoSpin(!autoSpin);
  }
});
page.autoButton.addEventListener("click", () => {
  if (game && game.status === "playing") setAutoSpin(!autoSpin);
});

