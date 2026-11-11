# AI Bubble Trouble

An interactive slot machine about the AI investment bubble.
Open `index.html` in a browser to play. Press **F11** for fullscreen on the laptop.


## Where things are

```
index.html            The page: start screen, game screen, end screen
style.css             How everything looks (black and white, Helvetica + Times New Roman)

images/
  symbols/            📷 Your photos for the reel symbols   (see README.txt inside)
  news/               📷 Your photos for the news pop-ups   (see README.txt inside)
  backgrounds/         📷 sky.jpg, the game screen background (replace it, same name)
                      📷 data-center.jpg, the end screen background

videos/data-center.mp4  🎬 The start page background video (replace it, same name)
audio/                🔊 Voice clips for each symbol: dario, zuckerberg, ellison, musk + musk2, altman, jensen,
                         chatgpt, gemini, claude (.mp3)
                      🔊 generic1-3.mp3, hype lines that play at random on wins
                      🎵 main-street.mp3, the background music (loops)
                      🔔 cha-ching.mp3 (every win) and news.mp3 (breaking news)

fonts/bubble-gum.ttf  The title font

js/
  symbols.js          ⭐ The reel symbols: names, photo file names, how often they land, payouts
  news-events.js      ⭐ The breaking news events: all the wording
  settings.js         ⭐ The game numbers: spins, bubble, odds, paylines
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
  right. Winning paylines are drawn across the grid.
- **Big number:** **Total Raised** adds up every win and good news, so it only ever goes up.
  The real valuation, the break-even line and the pop risk are hidden until the end screen.
- **Bottom bar:** spins left and Total Raised on the left, the big SPIN button in the
  middle, then the last win and the Bubble.


## The symbols

| Symbol | What it does |
|---|---|
| ChatGPT, Gemini, Claude | Common, small wins |
| Five AI CEOs | Dario Amodei, Mark Zuckerberg, Larry Ellison, Elon Musk and Sam Altman. About as common as the AI labs, bigger wins. Sam Altman is the rarest and pays the most. |
| **Jensen Huang (WILD)** | Counts as any symbol: he sells the chips everyone needs. Only lands on the middle three reels. |
| **BREAKING NEWS** | Anywhere on the grid, triggers a real AI event (good or bad) |


## How a spin works

0. **The hot start:** the first 4 spins are secretly rigged. The game keeps re-spinning
   behind the scenes until a line wins, the news is only good, and the bubble can't pop.
   It feels too easy, on purpose.

1. **Breaking news first:** if a NEWS symbol lands anywhere, it flashes and a pop-up
   shows the event for 12 seconds (click or SPACE to skip). Then its effect is applied.
   News is always good during the hot start. After that it sours a little every spin
   (and faster as the bubble grows), and NEWS lands more often, so the late game fills
   up with bad headlines.
2. **Then the paylines:** 3, 4 or 5 of the same symbol in a row from the **left** reel,
   on any of the 5 lines (the three rows, a V and an upside-down V). The WILD fills in
   for anything. Several winning lines add together.
3. **The compute bill:** every spin costs 9% of your valuation, win or lose. Small wins are
   often smaller than the bill, but they're still celebrated with a WIN banner. The bigger
   the win, the bigger the banner (in neon green): LINE GO UP, SCALING LAWS, MAXIMUM GROWTH, HYPERSCALED, AGI ACHIEVED.
4. A winning line gives +1 spin. Five in a row gives +2. Extra spins feel like a gift, but
   each one is another chance for the bubble to pop.
5. **Win streaks:** each win in a row makes the next one bigger (×1.1, ×1.2 ... up to ×1.5).
   Streaks add a neon yellow line (MOMENTUM, HOCKEY STICK, TO THE MOON, THE SINGULARITY), extra money
   rain and a crowd roar. The WIN box shows the streak.
6. **Success inflates the bubble:** the bigger a win, the more the bubble grows.
7. **Final round** (at or above $100B): a huge **Double Down** button and a small "cash out
   for $1" link. The odds are hidden. A 10-second timer runs, and if it runs out, the game
   doubles down for the player. Once at least 5 players have chosen, it shows the real
   share of players on this machine who doubled down.
8. **The reveal:** the end screen shows what the game was hiding: how many wins were
   celebrated, the compute bills paid, how many spins were really above break-even,
   the Double Down odds and the house edge.


## Common changes

| I want to... | Change this |
|---|---|
| Make a symbol land more or less often | its `weight` in `symbols.js` |
| Make a symbol pay more | its `pays` in `symbols.js` (0.3 = +30%, for 3, 4 and 5 in a row) |
| Change the paylines | `PAYLINES` in `settings.js` |
| Make the reels spin longer or shorter | `firstStop` and `gapBetweenReels` in `spin()` in `screen.js` |
| More or fewer news events | the `weight` of `NEWS_SYMBOL` in `symbols.js` |
| Make the news pop-up stay longer or shorter | `newsPopupSeconds` in `settings.js` (now 12 seconds) |
| Make the bubble pop less | `popRisk` or `bubbleGrowthPerSpin` in `settings.js` |
| Give more spins | `startingSpins`, `maxSpins`, `bonusSpinsForWin` in `settings.js` |
| Change Double Down odds | the three `doubleDown...` numbers in `settings.js` |
| Make every spin cost more or less | `computeBill` in `settings.js` (0.09 = 9%) |
| Change the final-round timer | `decisionSeconds` in `settings.js` |
| Make the cha-ching or news sound softer or louder | the `volume` numbers in `files` at the top of `sound.js` (news is 0.25) |
| Change the payline color | `stroke` under "Winning paylines" in `style.css` (now neon green #39ff14) |
| Make the music softer or louder | `musicStartVolume` and `musicEndVolume` in `settings.js` |
| Change the background music | replace `audio/main-street.mp3` (same name) |
| Change a CEO's voice clip | replace their file in `audio/` (same name), or change their `voice` line in `symbols.js` |
| Add a generic voice line | put the .mp3 in `audio/` and add it to `GENERIC_VOICES` at the bottom of `symbols.js` |
| Give a CEO more voice lines | list them in their `voice`, like Elon's: `["audio/musk.mp3", "audio/musk2.mp3"]` |
| Make generic lines play more or less | `genericOnCeoWin`, `genericOnOtherWin`, `genericOnStreak` in `settings.js` |
| Make Jensen's clip play more or less on big wins | `jensenBigWinChance` in `settings.js` (0.6 = 60%) |
| Change the win banner words | `WIN_TIERS` and `STREAK_WORDS` in `screen.js` |
| Make the rigged hot start longer or shorter | `hotStartSpins` in `settings.js` (0 turns it off) |
| Make win streaks pay more or less | `streakBonus` and `maxStreakBoost` in `settings.js` |
| Make the news turn bad faster or slower | `newsSoursPerSpin` and `lowestGoodNews` in `settings.js` |
| Make the news follow date order more or less strictly | `newsOrderShuffle` in `settings.js` (0 = strictly in order) |
| Make the Jensen spy story hit earlier or later | `spyStorySpinsLeft` in `settings.js` (2 = when 2 spins are left) |
| Make news pile up more or less late in the game | `moreNewsPerSpin` in `settings.js` |
| Make the reels bigger or smaller | `--row-height` near the top of `style.css` |

**Current odds** (150,000 simulated games): the first 4 spins always win. After that,
about 46% of spins win, and about 1 in 4 wins is smaller than that spin's compute bill.
About 1 in 4 spins has breaking news, and about 3 in 4 of the news after the hot
start is bad. The news plays out roughly in date order (older stories early, recent ones late), and a
story doesn't repeat until all of its kind have been shown. The Jensen spy story is always
the last story: it hits near the end of almost every game (the rest pop first), and no news
comes after it. About half of players reach the final round. The house keeps about 45¢
per dollar from players who choose carefully, and about 53¢ from players who always double
down. If you re-tune, also update `houseKeeps` in `settings.js`.

**The decision log** is saved in the browser on the laptop, so it builds up over the day.
To start it fresh, clear the browser's site data for the game.

Changing the numbers changes the odds, so ask Claude to re-run the odds simulation after big changes.
