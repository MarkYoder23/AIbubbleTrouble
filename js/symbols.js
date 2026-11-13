// =====================================================================
//  SYMBOLS
//  Every picture that can land on the reels.
//
//  ┌──────────────────────────────────────────────────────────────────┐
//  │  📷  TO USE YOUR OWN PHOTO FOR A SYMBOL                          │
//  │                                                                  │
//  │  1. Save the photo in the  images/symbols/  folder.              │
//  │  2. Name it exactly like the "photo" line for that symbol below, │
//  │     for example  images/symbols/chatgpt.png                      │
//  │  3. Refresh the page.                                            │
//  │                                                                  │
//  │  Using a .jpg instead of .png? Change the ending on the photo    │
//  │  line too, e.g.  photo: "images/symbols/chatgpt.jpg"             │
//  │                                                                  │
//  │  🔊 Each symbol also has a "voice" line: the clip that plays     │
//  │  when it wins (files in the  audio/  folder). Jensen's plays on  │
//  │  big wins. List several clips to pick one at random (see Elon).  │
//  │                                                                  │
//  │  No photo in the folder? The built-in drawing is used instead,   │
//  │  so the game always works.                                       │
//  │                                                                  │
//  │  Tip: tiles are wide (about 850 x 500). Photos are cropped to    │
//  │  fill the tile, so keep the important part in the middle.        │
//  └──────────────────────────────────────────────────────────────────┘
//
//  The other settings on each symbol:
//    name   = the name shown in messages ("CLAUDE on line 2!")
//    weight = how often it lands (bigger = more often)
//    pays   = how much a winning line grows your valuation.
//             0.2 means +20%. The 3, 4 and 5 are how many in a row.
// =====================================================================


// ---------------------------------------------------------------------
//  AI LAB TILES: very common, tiny wins (often smaller than the compute bill)
// ---------------------------------------------------------------------
const AI_LABS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    photo: "images/symbols/chatgpt.png",
    voice: "audio/chatgpt.mp3",
    weight: 20,
    pays: { 3: 0.042, 4: 0.102, 5: 0.24 },
  },
  {
    id: "gemini",
    name: "Gemini",
    photo: "images/symbols/gemini.png",
    voice: "audio/gemini.mp3",
    weight: 20,
    pays: { 3: 0.042, 4: 0.102, 5: 0.24 },
  },
  {
    id: "claude",
    name: "Claude",
    photo: "images/symbols/claude.png",
    voice: "audio/claude.mp3",
    weight: 20,
    pays: { 3: 0.042, 4: 0.102, 5: 0.24 },
  },
];


// ---------------------------------------------------------------------
//  AI CEOs: about as common as the AI labs, bigger wins. Most common to rarest.
//  Sam Altman is the jackpot: five of him is +198%. (Jensen Huang is the WILD, further down.)
//  Add a square photo for each one in images/symbols/ (see the photo line).
//  Until you do, each one shows a plain tile with their name.
// ---------------------------------------------------------------------
const CHARACTERS = [
  {
    id: "dario",
    name: "Dario Amodei",
    photo: "images/symbols/dario-amodei.png",
    voice: "audio/dario.mp3",
    weight: 12,
    pays: { 3: 0.072, 4: 0.18, 5: 0.444 },
  },
  {
    id: "zuckerberg",
    name: "Mark Zuckerberg",
    photo: "images/symbols/mark-zuckerberg.png",
    voice: "audio/zuckerberg.mp3",
    weight: 10,
    pays: { 3: 0.09, 4: 0.204, 5: 0.534 },
  },
  {
    id: "ellison",
    name: "Larry Ellison",
    photo: "images/symbols/larry-ellison.png",
    voice: "audio/ellison.mp3",
    weight: 9,
    pays: { 3: 0.12, 4: 0.264, 5: 0.654 },
  },
  {
    id: "musk",
    name: "Elon Musk",
    photo: "images/symbols/elon-musk.png",
    voice: ["audio/musk.mp3", "audio/musk2.mp3"],   // two lines: one is picked at random
    weight: 9,
    pays: { 3: 0.12, 4: 0.264, 5: 0.654 },
  },
  {
    id: "altman",
    name: "Sam Altman",
    photo: "images/symbols/sam-altman.png",
    voice: "audio/altman.mp3",
    weight: 8,
    pays: { 3: 0.18, 4: 0.444, 5: 1.188 },
  },
];


// ---------------------------------------------------------------------
//  WILD: JENSEN HUANG. He sells the chips everyone else needs, so he helps
//  every winning line: he counts as ANY symbol above.
//  Only lands on the middle three reels.
// ---------------------------------------------------------------------
const WILD = {
  id: "jensen",
  name: "Jensen Huang",
  photo: "images/symbols/jensen-huang.png",
  voice: "audio/jensen.mp3",
  weight: 8,
  isWild: true,
  reels: [1, 2, 3],        // reels are numbered 0 to 4, left to right
};


// ---------------------------------------------------------------------
//  BREAKING NEWS: when it lands, a real event happens (see news-events.js)
// ---------------------------------------------------------------------
const NEWS_SYMBOL = {
  id: "news",
  name: "Breaking News",
  photo: "",   // no photo: the game draws it (a "!" in a green or red circle, see makeSymbol in screen.js)
  weight: 1.6,             // news lands on about 3 spins in 10
  isNews: true,
};


// Lists the game uses (you don't need to change these)
const PAYING_SYMBOLS = [...AI_LABS, ...CHARACTERS];
const ALL_SYMBOLS = [...PAYING_SYMBOLS, WILD, NEWS_SYMBOL];


// ---------------------------------------------------------------------
//  GENERIC VOICE LINES: hype lines that aren't tied to one CEO.
//  They pop up at random on wins (see the voice chances in settings.js).
//  To add one, put the .mp3 in audio/ and add its name to this list.
// ---------------------------------------------------------------------
const GENERIC_VOICES = [
  "audio/generic1.mp3",
  "audio/generic2.mp3",
  "audio/generic3.mp3",
];
