// =====================================================================
//  DRAWINGS
//  The built-in pictures for every symbol. Each one is a small SVG
//  drawing written as text. You don't need to read or edit this file.
//
//  These are only used when there is NO photo for a symbol.
//  To use your own photos, see symbols.js.
// =====================================================================

// The background of each symbol's tile. The tile is wider than the drawing,
// so this color fills the space on either side of it.
const TILE_COLORS = {
  dario:      "#1a1a1a",
  zuckerberg: "#1a1a1a",
  ellison:    "#1a1a1a",
  musk:       "#1a1a1a",
  altman:     "#1a1a1a",
  jensen:     "#1a1a1a",   // the WILD
  chatgpt:   "#10a37f",
  gemini:    "linear-gradient(#4285f4, #9b4dff)",
  claude:    "#d97757",
  news:      "#e63946",
};

const DRAWINGS = {
  // ----- The five AI CEOs -----
  // Plain name tiles, shown only until you add their photos (see symbols.js)
  dario: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#1a1a1a"/><text x="50" y="47" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Dario</text><text x="50" y="65" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Amodei</text><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="6" fill="#999">ADD PHOTO</text></svg>`,
  zuckerberg: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#1a1a1a"/><text x="50" y="47" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Mark</text><text x="50" y="65" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Zuckerberg</text><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="6" fill="#999">ADD PHOTO</text></svg>`,
  ellison: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#1a1a1a"/><text x="50" y="47" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Larry</text><text x="50" y="65" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Ellison</text><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="6" fill="#999">ADD PHOTO</text></svg>`,
  musk: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#1a1a1a"/><text x="50" y="47" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Elon</text><text x="50" y="65" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Musk</text><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="6" fill="#999">ADD PHOTO</text></svg>`,
  altman: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#1a1a1a"/><text x="50" y="47" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Sam</text><text x="50" y="65" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Altman</text><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="6" fill="#999">ADD PHOTO</text></svg>`,
  jensen: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#1a1a1a"/><text x="50" y="36" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Jensen</text><text x="50" y="54" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">Huang</text><text x="50" y="70" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="6" fill="#999">ADD PHOTO</text></svg>`,

  // ----- AI lab tiles (simple original designs, not the companies' logos) -----
  chatgpt: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#10a37f"/><path d="M24 22 H76 Q82 22 82 28 V54 Q82 60 76 60 H46 L32 72 V60 H24 Q18 60 18 54 V28 Q18 22 24 22Z" fill="#fff"/><circle cx="36" cy="41" r="5" fill="#10a37f"/><circle cx="50" cy="41" r="5" fill="#10a37f"/><circle cx="64" cy="41" r="5" fill="#10a37f"/><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="14" fill="#fff">ChatGPT</text></svg>`,

  gemini: `<svg viewBox="0 0 100 100"><defs><linearGradient id="gemBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4285f4"/><stop offset="1" stop-color="#9b4dff"/></linearGradient></defs><rect x="0" y="0" width="100" height="100" fill="url(#gemBg)"/><circle cx="40" cy="42" r="18" fill="none" stroke="#fff" stroke-width="7"/><circle cx="60" cy="42" r="18" fill="none" stroke="#ffe27a" stroke-width="7"/><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="16" fill="#fff">Gemini</text></svg>`,

  claude: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#d97757"/><path d="M22 26 Q36 20 50 28 Q64 20 78 26 V62 Q64 56 50 64 Q36 56 22 62Z" fill="#fff"/><path d="M50 28 V64" stroke="#d97757" stroke-width="3"/><path d="M28 34 H44 M28 42 H44 M28 50 H42 M56 34 H72 M56 42 H72 M56 50 H70" stroke="#d97757" stroke-width="2.5" stroke-linecap="round"/><text x="50" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="16" fill="#fff">Claude</text></svg>`,

  // ----- BREAKING NEWS: lands on the reels and triggers a real event -----
  news: `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="#e63946"/><rect x="20" y="16" width="60" height="44" fill="#fff"/><rect x="26" y="22" width="48" height="9" fill="#e63946"/><rect x="26" y="35" width="22" height="18" fill="#bbb"/><path d="M53 37 H74 M53 44 H74 M53 51 H70" stroke="#444" stroke-width="3"/><text x="50" y="76" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="13" fill="#ffcc33">BREAKING</text><text x="50" y="91" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="15" fill="#fff">NEWS</text></svg>`,
};
