# AI Bubble Trouble

An interactive slot machine about the AI investment bubble.
Open `index.html` in a browser to play. Press **F11** for fullscreen on the laptop.


## Where things are

```
index.html            The page: start screen, game screen, end screen
style.css             How everything looks (trading-terminal style: black, white, green, red)

images/
  symbols/            📷 Your photos for the reel symbols   (see README.txt inside)
  news/               📷 Your photos for the news pop-ups   (see README.txt inside)
  backgrounds/         📷 chip-bw.jpg, the game screen background (replace it, same name)
                      📷 data-center.jpg, -2.jpg, -3.jpg: the end screen slideshow

videos/data-center.mp4  🎬 The start page background video (replace it, same name)
audio/                🔊 Voice clips for each symbol: dario, zuckerberg, ellison, musk + musk2, altman, jensen,
                         chatgpt, gemini, claude (.mp3)
                      🔊 generic1-3.mp3, hype lines that play at random on wins
                      🎵 main-street.mp3, the background music (currently switched off: see `backgroundMusic` in settings.js)
                      🔔 cha-ching.mp3 (every win) and news.mp3 (breaking news)
                      🎵 sad-song.mp3, plays on the end screen when the player loses

fonts/vcr-osd-mono.ttf  The one font used everywhere (the pixel "LED board" font)

js/
  symbols.js          ⭐ The reel symbols: names, photo file names, how often they land, payouts
  news-events.js      ⭐ The breaking news events: all the wording
  settings.js         ⭐ The game numbers: spins, bubble, odds
  drawings.js         Built-in pictures used when there's no photo (no need to edit)
  game.js             The rules: what happens on each spin
  sound.js            All the sounds: beeps made by the browser, plus the CEO voice clips
  screen.js           What you see: reels spinning, pop-ups, the bubble, the pop
```

The ⭐ files are the ones made for editing.


## Adding your own photos

**Reel symbols:** save a photo in `images/symbols/` with the name listed in
`images/symbols/README.txt` (for example `claude.png`), then refresh the page.
Use square photos (e.g. 600 x 600), ideally cut out with a transparent background like the
ones already in the folder. To swap one, save the new file over the old one with the same name.
Any symbol without a photo uses its built-in tile.

**News pop-ups:** save a photo in `images/news/` with the name listed in
`images/news/README.txt` (for example `deepseek.jpg`). Wide photos look best.
Any event without a photo just shows the headline.

News photos show in color, all at the same 16:9 size (1200 x 675 works best).
The emoji in messages and the money rain are black and white. To change which things are black and white, edit the
line under "The symbols are the only thing in color" in `style.css`.

The photos only work from the unzipped folder, because the page looks for them
in `images/` next to `index.html`.


## Editing the news events

Open `js/news-events.js`. Each event looks like this:

```js
{
  headline: "DeepSeek shock: a cheap Chinese model wipes nearly $600 billion off Nvidia in one day",
  when: "January 2025",
  picture: "📉",
  photo: "images/news/deepseek.jpg",
  valuation: -30, spins: 0, bubble: 0,
},
```

- Change the **headline** and **when** text freely.
- The last line is what it does: `valuation: -30` means -30%, `spins: 2` means +2 spins,
  `bubble: 10` means the bubble grows 10%. Use 0 for no change.
- The "Valuation -30%" line in the pop-up is written for you from those numbers.
- To add an event, copy one, paste it below, and change it. Keep the comma between events.


## The game screen

- **Top:** the latest breaking news headline (in Times New Roman). No title, so the reels get the space.
- **Middle:** the 5 × 3 grid. The reels spin downward and land one at a time, left to
  right. Winning symbols get a neon green ring, then pop.
- **Big number:** **Total Raised** adds up every win and good news, so it only ever goes up.
  The real valuation, the break-even line and the pop risk are hidden until the end screen.
- **Bottom bar:** Spins Left on the left, SPIN in the middle, AUTO SPIN on the right.
  The money is shown by the valuation meter beside the reels.


## The symbols

| Symbol | What it does |
|---|---|
| ChatGPT, Gemini, Claude | Common, small wins |
| Five AI CEOs | Dario Amodei, Mark Zuckerberg, Larry Ellison, Elon Musk and Sam Altman. About as common as the AI labs, bigger wins. Sam Altman is the rarest and pays the most. |
| **Jensen Huang (WILD)** | Counts as any symbol: he sells the chips everyone needs. Only lands on the middle three reels. |
| **BREAKING NEWS** | Anywhere on the grid, triggers a real AI event (good or bad) |


## Playing fast (SPACE or the SPIN button)

- **Tap** while the reels spin: they slam to a stop.
- Breaking news never blocks you: stories pop up in the middle and float away while the game goes on.
- **Tap** after a win: starts the next spin right away (the win banner clears).
- **Hold** SPACE down: keeps spinning on its own, without skipping anything.
- **AUTO SPIN** (the button beside SPIN, or the **A** key): autospin. The game spins by
  itself to the end of the game. Press again to turn it off.

## The two meters

- **Bubble (left):** fills red as the bubble grows, and shakes from 70% (`bubbleRedAt` in
  `settings.js`). When it pops, the
  bar fills to the top and breaks, red floods the whole screen, and the valuation counts
  down to $0 in huge numbers in the middle.
- **Valuation (right):** shows your real valuation. The dashed BREAK EVEN line is the $100B you
  started with: finish above it to get the $1 back. The top, marked JACKPOT, is $1 trillion.
  There is no Double Down line: the Double Down is a last-minute surprise (it is not on the
  intro rules either). The bar is always green and never resets to 0 near the top.
  Every spin's compute bill pulls it down; when winning bubbles pop, each "+$4.2B" flies
  into the meter and it rises by that amount. The scale is in multiples (top = 10x the goal).

## The stock tickers (all four edges)

Thin scrolling strips of made-up stock quotes mixed with the game's AI headlines: green for up / good
news, red for down / bad news, white for unchanged (about a third each). They crawl at first and speed
up as the game goes on (`tickerStartSpeed` and `tickerEndSpeed` in `settings.js`). The stock
names are `TICKER_STOCKS` in `screen.js`; the thickness is `--ticker` in `style.css`.

## The valuation chart (bottom right)

One candlestick per spin, drawn after the spin's result plays out. The fat body runs from
where the valuation started that spin to where it ended (green up, red down); the thin
wick shows the whole ride within the spin (the news high, the dip after the compute bill).
The dashed line is break-even.

## How a spin works

0. **The hot start:** the first 4 spins are secretly rigged. The game keeps re-spinning
   behind the scenes until a line wins, the news is only good, and the bubble can't pop.
   It feels too easy, on purpose.

1. **Breaking news first:** if a NEWS symbol lands, a white card with black text grows out of
   the NEWS symbol into the middle, with the photo, headline and effect. Then it rises and only
   fades as it reaches the top (3 seconds in all). The game does not stop. The effect is applied
   right away. Every story works this way, including the Jensen finale. (Adding
   `fullScreen: true` to a story in `news-events.js` makes it stop the game with a big pop-up.)
   News is always good during the hot start. After that it sours a little every spin
   (and faster as the bubble grows), and NEWS lands more often late in the game.
2. **Then the wins ("243 ways", like Lucky Buddha):** a symbol wins when it lands
   anywhere on 3, 4 or 5 reels in a row, starting from the **left** reel. Rows don't
   matter. The WILD fills in for anything. Each extra copy on a reel multiplies the win:
   2 Claudes on reel 1, 2 on reel 2 and 1 on reel 3 = 2 × 2 × 1 = 4 ways = 4 times the pay.
3. **The compute bill:** every spin costs 3% of your valuation. On a spin with no match the bar drops by the bill. On a winning spin the bill is already factored in: a win always at least covers it, so the bar only rises (the "+$" amounts that fly in are the win after the bill). The bar only drops on no match or bad news. Small wins are
   often smaller than the bill, but they're still celebrated with a WIN banner. The bigger
   the win, the bigger the banner (white for small wins, neon green for bigger ones): Line Goes Up, Scaling Laws, Maximum Growth, Hyperscaled, AGI Achieved (italic Times New Roman).
4. **Bonus spins are rare:** only a CEO across all five reels gives +1 spin (about 1 game
   in 4), plus the two good news stories that add spins. Most games are 10 spins.
5. **Win streaks:** each win in a row makes the next one bigger (×1.1, ×1.2 ... up to ×1.5).
   Streaks add extra money rain, and the WIN box shows the streak. Under the big win words,
   a smaller line says what matched (e.g. "Five Sam Altmans × 2 ways").
6. **Success inflates the bubble:** every spin adds a little, every winning spin adds a flat bump (`bubblePerWinningSpin`) plus more for a bigger win, and good news adds to it too, so the bubble climbs steadily through a game.
7. **After the last spin, the valuation decides the payout:** below $100B loses the
   dollar, $100B or more gets the dollar back, $500B or more is offered the **Double Down**
   (the final round): take the $1 back, or risk it on one more spin to win $5 or lose it
   all. Finishing above $1 trillion wins the $5 straight away. The Double Down odds are
   hidden (5% at $500B, rising 2 points each time the valuation doubles, up to 12%; see
   `doubleDownMinOdds` in `settings.js`). Double Down is the huge button, cash out is a
   boxed button below it, and a 10-second timer doubles down for the player if they don't choose.
   **The hidden pace line:** every game secretly aims for a finishing valuation (between
   about $650B and $920B; `paceLow`, `paceHigh`) and the valuation is steered along a smooth
   climb toward it, so there are no huge early gains followed by a flat ceiling. A win can only
   lift the valuation to about 30% above the line (`paceSlack`); a winning spin when you are
   behind the line closes the gap (`paceCatchUp`); no spin adds more than 80% of where it
   started (`maxSpinGain`); and when ahead of the line a little more of the news turns bad, when
   behind a little more turns good (`paceNewsSwing`), which makes the dips. The line expects the
   Jensen spy story's -40% near the end (`paceSpyLift`), and the last spins climb back.
   **The soft ceiling** (about $900B-$990B, `ceilingLow`/`ceilingHigh`) is now only a late
   backstop: gains shrink past `ceilingKnee` (90% of it) so nothing jumps or resets. Only 2.5%
   of games have no ceiling (`jackpotChance`); they aim just past $1 trillion and about 0.8%
   of all games end up there.
8. **The reveal:** the end screen shows what the game was hiding: how many wins were
   celebrated, the compute bills paid, and how many spins were really above break-even.


## Common changes

| I want to... | Change this |
|---|---|
| Make a symbol land more or less often | its `weight` in `symbols.js` |
| Make a symbol pay more | its `pays` in `symbols.js` (0.3 = +30%, for 3, 4 and 5 in a row) |
| Make the reels spin longer or shorter | `firstStop` and `gapBetweenReels` in `spin()` in `screen.js` |
| More or fewer news events | the `weight` of `NEWS_SYMBOL` in `symbols.js` |
| Make the news card stay longer or shorter | `newsCardSeconds` in `settings.js` |
| Make a story stop the game with a full-screen pop-up | add `fullScreen: true,` to it in `news-events.js` |
| Make the pauses around news shorter or longer | `newsLeadIn` and `newsAfterPause` in `settings.js` |
| Make the news pop-up stay longer or shorter | `newsPopupSeconds` in `settings.js` (now 12 seconds) |
| Make the bubble pop less | `popRisk` or `bubbleGrowthPerSpin` in `settings.js` |
| Give more spins | `startingSpins`, `maxSpins`, `bonusSpinsForWin`, `bonusSpinsForFive` in `settings.js` |
| Change autospin's pace | `autoSpinPause`, `autoSpinPauseAfterWin`, `autoNewsSeconds` in `settings.js` |
| Make every spin cost more or less | `computeBill` in `settings.js` (0.03 = 3%) |
| Make wins add more or less valuation (the bubble doesn't care) | `winPayScale` in `settings.js` |
| Make the climb steadier or wilder / aim games higher or lower | `paceSlack`, `maxSpinGain`, `paceCatchUp`, `paceLow`, `paceHigh` in `settings.js` |
| Make the $1 trillion jackpot more or less rare | `jackpotChance` in `settings.js` |
| Change when the Double Down is offered, or its odds | `doubleDownAt`, `doubleDownMinOdds`, `doubleDownOddsPerDoubling` and `doubleDownMaxOdds` in `settings.js` |
| Change the final-round timer | `decisionSeconds` in `settings.js` |
| Make the cha-ching or news sound softer or louder | the `volume` numbers in `files` at the top of `sound.js` (news is 0.25) |
| Change the win highlight color | `.symbol.win img` in `style.css` (now neon green #39ff14) |
| Turn the background music on | `backgroundMusic: true` in `settings.js` |
| Make the music softer or louder | `musicStartVolume` and `musicEndVolume` in `settings.js` |
| Make the CEO voice clips quieter or louder | `voiceVolume` in `settings.js` |
| Change the background music | replace `audio/main-street.mp3` (same name) |
| Change a CEO's voice clip | replace their file in `audio/` (same name), or change their `voice` line in `symbols.js` |
| Add a generic voice line | put the .mp3 in `audio/` and add it to `GENERIC_VOICES` at the bottom of `symbols.js` |
| Give a CEO more voice lines | list them in their `voice`, like Elon's: `["audio/musk.mp3", "audio/musk2.mp3"]` |
| Make generic lines play more or less | `genericOnCeoWin`, `genericOnOtherWin`, `genericOnStreak` in `settings.js` |
| Make Jensen's clip play more or less on big wins | `jensenBigWinChance` in `settings.js` (0.6 = 60%) |
| Change the win banner words | `WIN_TIERS` in `screen.js` |
| Make the rigged hot start longer or shorter | `hotStartSpins` in `settings.js` (0 turns it off) |
| Make win streaks pay more or less | `streakBonus` and `maxStreakBoost` in `settings.js` |
| Make the news turn bad faster or slower | `newsSoursPerSpin` and `lowestGoodNews` in `settings.js` |
| Make the news follow date order more or less strictly | `newsOrderShuffle` in `settings.js` (0 = strictly in order) |
| Make the Jensen spy story hit earlier or later | `spyStorySpinsLeft` in `settings.js` (2 = when 2 spins are left) |
| Make the winning bubbles pop faster or slower | `highlightBeforePop`, `bubblePopGap` and `cashFlightSeconds` in `settings.js` |
| Make the reels speed up more or less over the game | `spinSpeedUp` and `maxSpinSpeed` in `settings.js` |
| Make news pile up more or less late in the game | `moreNewsPerSpin` in `settings.js` |
| Make the reels bigger or smaller | `--row-height` near the top of `style.css` |

**Current odds** (150,000 simulated games): the first 4 spins always win. After that,
about 47% of spins win, and about 1 in 3 wins is smaller than that spin's compute bill.
About 3 in 10 spins have breaking news, and about 3 in 4 of the news after the hot
start is bad. The news plays out roughly in date order (older stories early, recent ones late), and a
story doesn't repeat until all of its kind have been shown. The Jensen spy story is always
the last story: it hits near the end of almost every game (the rest pop first), and no news
comes after it. About 56% of games end with the Double Down offer (they finish at a median of about $810B, almost all between $560B and $940B),
about 23% get their dollar back, about 21% lose (the bubble popping), and about 0.8% hit the
$1 trillion jackpot. If about 85% of the players who are offered the Double Down take it,
the house keeps about 45¢ per dollar.

**The decision log** is saved in the browser on the laptop, so it builds up over the day.
To start it fresh, clear the browser's site data for the game.

Changing the numbers changes the odds, so ask Claude to re-run the odds simulation after big changes.

**Latest tweaks:** a lost Double Down fills the grid with 15 solid red NEWS symbols (no fading before the red flood covers them); the pop countdown falls at a constant rate to $0 (under $1B it keeps counting in billions); and news stories swing harder (good news up to +50%, bad news down to -40%, the Jensen spy story still -40%).
