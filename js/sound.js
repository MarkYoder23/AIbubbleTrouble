// =====================================================================
//  SOUND
//  All sounds are made by the browser (Web Audio API), so there are no
//  audio files. Browsers only allow sound after a click, so the Start
//  button calls Sound.start().
// =====================================================================

const Sound = {
  audio: null,
  voices: {},          // the voice clips, loaded once each
  playingVoice: null,
  lastVoice: "",

  // Play one voice clip from a list (a CEO's "voice" in symbols.js, or GENERIC_VOICES).
  // Picks at random, never the same clip twice in a row. Only one clip plays at a time.
  voice(files) {
    const list = [].concat(files || []);
    if (list.length === 0) return;
    const choices = list.length > 1 ? list.filter(f => f !== this.lastVoice) : list;
    const file = choices[Math.floor(Math.random() * choices.length)];
    this.lastVoice = file;

    if (!this.voices[file]) this.voices[file] = new Audio(file);
    if (this.playingVoice) { this.playingVoice.pause(); this.playingVoice.currentTime = 0; }
    this.playingVoice = this.voices[file];
    this.playingVoice.currentTime = 0;
    this.playingVoice.volume = SETTINGS.voiceVolume;   // a third quieter than the raw clips
    this.playingVoice.play().catch(() => {});   // a missing file is fine: no clip
  },

  start() {
    if (!this.audio) {
      try { this.audio = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.audio = null; }   // no sound support: the game still works
    }
    if (this.audio && this.audio.state === "suspended") this.audio.resume();
  },

  // Play one beep.
  //   pitch: how high (Hz)   length: seconds   wave: "sine", "square", "sawtooth" or "triangle"
  //   volume: 0 to 1         delay: seconds before it starts   slideTo: end pitch (optional)
  beep(pitch, length, wave = "square", volume = 0.06, delay = 0, slideTo = null) {
    if (!this.audio) return;
    const now = this.audio.currentTime + delay;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(pitch, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + length);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    osc.connect(gain).connect(this.audio.destination);
    osc.start(now);
    osc.stop(now + length + 0.05);
    return osc;
  },

  // A burst of static that fades out (used for the pop)
  crash(length, volume = 0.4, delay = 0) {
    if (!this.audio) return;
    const now = this.audio.currentTime + delay;
    const buffer = this.audio.createBuffer(1, this.audio.sampleRate * length, this.audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

    const source = this.audio.createBufferSource();
    const filter = this.audio.createBiquadFilter();
    const gain = this.audio.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + length);
    gain.gain.setValueAtTime(volume, now);
    source.connect(filter).connect(gain).connect(this.audio.destination);
    source.start(now);
  },

  // ----- The game's sounds -----

  // Clicking while the reels spin. Gets faster and higher as the bubble grows.
  spinningTicks: [],
  reelsSpinning(seconds, bubble) {
    const gap = 0.08 - bubble * 0.0004;
    this.spinningTicks = [];
    for (let t = 0; t < seconds; t += gap) {
      this.spinningTicks.push(this.beep(500 + Math.random() * 400 + bubble * 4, 0.03, "square", 0.025, t));
    }
  },
  // Cut the spinning ticks short (when the player slams the reels to a stop)
  stopSpinning() {
    this.spinningTicks.forEach(osc => { try { osc && osc.stop(); } catch (e) {} });
    this.spinningTicks = [];
  },

  reelStops()    { this.beep(160, 0.12, "triangle", 0.15); },

  // Coin-counter ticks that climb in pitch while a win counts up
  rollUp(seconds) {
    for (let t = 0, i = 0; t < seconds; t += 0.045, i++) {
      this.beep(900 + i * 25, 0.03, "square", 0.03, t);
    }
  },

  smallWin()     { [523, 659, 784].forEach((p, i) => this.beep(p, 0.18, "square", 0.07, i * 0.09)); },

  bigWin()       { [523, 659, 784, 1047, 1319].forEach((p, i) => this.beep(p, 0.18, "square", 0.07, i * 0.09)); },

  badSpin()      { this.beep(330, 0.35, "sawtooth", 0.06, 0, 110); },

  goodNews()     { [660, 880, 1320].forEach((p, i) => this.beep(p, 0.15, "sine", 0.09, i * 0.08)); },

  // A news-desk "ding ding ding" when a BREAKING NEWS symbol lands
  newsAlert()    { this.playFile("news"); },

  badNews()      { this.beep(300, 0.5, "sawtooth", 0.08, 0, 90); },

  // The rising groan while the bubble stretches before it pops
  stretching() {
    this.beep(90, 0.9, "sawtooth", 0.09, 0, 700);
    this.beep(180, 0.9, "square", 0.04, 0, 1400);
  },

  // One little bubble popping (a quick rising "blip"), slightly different each time
  bubblePop() {
    const pitch = 500 + Math.random() * 300;
    this.beep(pitch, 0.06, "sine", 0.12, 0, pitch * 2.2);
  },

  pop() {
    this.beep(900, 0.06, "sine", 0.3);
    this.crash(1.4, 0.5, 0.03);
    this.beep(400, 2.2, "sawtooth", 0.12, 0.1, 30);
    this.beep(200, 2.5, "square", 0.08, 0.2, 20);
  },

  // Sound files (in the audio/ folder). Replace a file with the same name to change it.
  // All the clips are evened out to the same loudness; "volume" (0 to 1) turns one down.
  files: {
    chaChing: { file: "audio/cha-ching.mp3", volume: 0.8 },   // plays on every winning line
    news:     { file: "audio/news.mp3",      volume: 0.25 },  // plays when BREAKING NEWS lands (kept quiet)
  },

  // Play one of the sound files above. A fresh copy each time, so they can overlap.
  playFile(name, delay = 0) {
    setTimeout(() => {
      const sound = new Audio(this.files[name].file);
      sound.volume = this.files[name].volume;
      sound.play().catch(() => {});   // a missing file is fine: no sound
    }, delay * 1000);
  },

  chaChing(delay = 0) { this.playFile("chaChing", delay); },

  // The sad song that plays on the end screen when the player loses (audio/sad-song.mp3)
  sad: null,
  sadSong() {
    if (!this.sad) this.sad = new Audio("audio/sad-song.mp3");
    this.sad.currentTime = 0;
    this.sad.volume = 0.7;
    this.sad.play().catch(() => {});   // a missing file is fine: no song
  },
  stopSadSong() {
    if (this.sad) this.sad.pause();
  },

  // The song that plays on the $5 win screen (audio/here-comes-the-money.mp3)
  money: null,
  moneySong() {
    if (!this.money) this.money = new Audio("audio/here-comes-the-money.mp3");
    this.money.currentTime = 0;
    this.money.volume = 0.5;   // the file is loud, so this sits level with the other songs
    this.money.play().catch(() => {});   // a missing file is fine: no song
  },
  stopMoneySong() {
    if (this.money) this.money.pause();
  },

  // ----- Background music: Main Street, getting louder as the game goes on -----
  music: null,

  startMusic() {
    if (!SETTINGS.backgroundMusic) return;   // music is switched off for now (see settings.js)
    if (!this.music) {
      this.music = new Audio("audio/main-street.mp3");
      this.music.loop = true;
    }
    this.music.currentTime = 0;
    this.music.volume = SETTINGS.musicStartVolume;
    this.music.play().catch(() => {});   // a missing file is fine: no music
  },

  // progress: 0 at the start of the game, 1 near the end
  musicLouder(progress) {
    if (!this.music) return;
    const p = Math.min(1, Math.max(0, progress));
    this.music.volume = SETTINGS.musicStartVolume + (SETTINGS.musicEndVolume - SETTINGS.musicStartVolume) * p;
  },

  // Fade the music out over a number of seconds (0 = cut it right away)
  stopMusic(seconds = 1.5) {
    const music = this.music;
    if (!music || music.paused) return;
    if (seconds <= 0) { music.pause(); return; }
    const start = music.volume;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      music.volume = Math.max(0, start * (1 - step / steps));
      if (step >= steps) { clearInterval(timer); music.pause(); }
    }, (seconds * 1000) / steps);
  },
};
