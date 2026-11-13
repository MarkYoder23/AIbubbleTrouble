// =====================================================================
//  NEWS EVENTS AND HEADLINES
//  The breaking news events players read. Edit the wording freely.
//
//  Each news event has:
//    fullScreen OPTIONAL: add  fullScreen: true,  to make a story stop the game with
//               a big pop-up. Without it, the story shows as a card at the top
//               and the game keeps going.
//    headline   the big headline. Keep it SHORT and punchy (about 5 words).
//               It's shown huge in Times New Roman, exactly as typed here
//               (capital on the first word and names only).
//    when       when it happened (not shown in the pop-up; kept for your reference)
//    date       the same date as "year-month" (e.g. "2025-01"). Stories play out
//               roughly in order: old ones early in the game, recent ones late.
//    picture    an emoji (not shown any more; kept in case you want it back)
//    photo      OPTIONAL: your own picture for this event. Save it in
//               images/news/ with this exact name. No photo, no picture.
//
//  And three simple numbers for what it does (0 = no change):
//    valuation  percent change:  40 means +40%,  -30 means -30%
//    spins      spins gained or lost:  2 means +2 spins,  -1 means -1 spin
//    bubble     how much the bubble grows:  10 means +10%
//
//  The "Valuation +40%" line in the pop-up is written automatically
//  from these numbers, so it always matches.
// =====================================================================


// ---------------------------------------------------------------------
//  GOOD NEWS (more common early in the game)
// ---------------------------------------------------------------------
const GOOD_NEWS = [
  {
    headline: "Stargate: $500 billion for AI",
    when: "January 2025",
    date: "2025-01",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🏗️",
    photo: "images/news/stargate.jpg",
    valuation: 40, spins: 0, bubble: 0,
  },
  {
    headline: "Nvidia hits $5 trillion",
    when: "October 2025",
    date: "2025-10",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "📈",
    photo: "images/news/nvidia-5-trillion.jpg",
    valuation: 35, spins: 0, bubble: 5,
  },
  {
    headline: "Nvidia pays OpenAI to buy Nvidia",
    when: "September 2025",
    date: "2025-09",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🔁",
    photo: "images/news/circular-financing.jpg",
    valuation: 30, spins: 0, bubble: 8,
  },
  {
    headline: "Three Mile Island reopens for AI",
    when: "September 2024",
    date: "2024-09",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "☢️",
    photo: "images/news/three-mile-island.jpg",
    valuation: 0, spins: 2, bubble: 0,
  },
  {
    headline: "CHIPS Act: $52 billion for chips",
    when: "August 2022",
    date: "2022-08",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🏛️",
    photo: "images/news/chips-act.jpg",
    valuation: 10, spins: 1, bubble: 0,
  },
];


// ---------------------------------------------------------------------
//  BAD NEWS (takes over as the bubble grows)
// ---------------------------------------------------------------------
const BAD_NEWS = [
  {
    headline: "DeepSeek wipes $600B off Nvidia",
    when: "January 2025",
    date: "2025-01",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "📉",
    photo: "images/news/deepseek.jpg",
    valuation: -30, spins: 0, bubble: 0,
  },
  {
    headline: "AI agents hack Hugging Face",
    when: "July 2026",
    date: "2026-07",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🤖",
    photo: "images/news/hugging-face-hack.jpg",
    valuation: -20, spins: 0, bubble: 10,
  },
  {
    headline: "ChatGPT, Claude and Grok all crash",
    when: "September 2026",
    date: "2026-09",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🔌",
    photo: "images/news/outage.jpg",
    valuation: 0, spins: -1, bubble: 0,
  },
  {
    headline: "Towns block $130B in data centers",
    when: "Early 2026",
    date: "2026-02",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🪧",
    photo: "images/news/protests.jpg",
    valuation: -15, spins: 0, bubble: 0,
  },
  {
    headline: "Anthropic pays authors $1.5 billion",
    when: "September 2025",
    date: "2025-09",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "⚖️",
    photo: "images/news/authors-settlement.jpg",
    valuation: -20, spins: 0, bubble: 0,
  },
  {
    headline: "MIT: 95% of AI pilots earn nothing",
    when: "August 2025",
    date: "2025-08",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "🧾",
    photo: "images/news/mit-study.jpg",
    valuation: -15, spins: 0, bubble: 8,
  },
  {
    headline: "Chip crash: $2 trillion gone in a day",
    when: "November 5, 2026",
    date: "2026-11",       // year-month: puts the story in order (earlier = earlier in the game)
    picture: "💥",
    photo: "images/news/chip-crash.jpg",
    valuation: -30, spins: 0, bubble: 10,
  },
];


// ---------------------------------------------------------------------
//  THE GUARANTEED STORY: this one never shows up early. It always hits
//  once, near the end of every game (see spyStorySpinsLeft in settings.js).
// ---------------------------------------------------------------------
const SPY_STORY = {
  headline: "Jensen Huang admits affair with alleged Chinese spy",
  when: "November 2026 · The New York Times",
  date: "2026-11",       // year-month: puts the story in order (earlier = earlier in the game)
  picture: "🕵️",
  photo: "images/news/jensen-spy.jpg",
  valuation: -40, spins: 0, bubble: 0,
};
