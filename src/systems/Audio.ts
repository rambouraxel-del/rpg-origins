// Audio procédural (WebAudio) : aucune ressource externe, donc aucune licence à créditer. Musique par ambiance, effets par événement.
// Le contexte audio ne démarre qu'après un geste du joueur (règle des navigateurs). Les volumes viennent des options.
import { hub } from '../game';

type Mood = 'palace' | 'forest' | 'village' | 'shrine' | 'stellar' | 'archive' | 'valley' | 'tension' | 'heart' | 'farewell' | 'dark';

interface MoodDef { root: number; scale: number[]; chords: number[][]; beat: number; pad: OscillatorType; pluckRate: number; drone: number; wind: number; bright: number }

const SCALES = { minorPent: [0, 3, 5, 7, 10], majorPent: [0, 2, 4, 7, 9], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], aeolian: [0, 2, 3, 5, 7, 8, 10] };

const MOODS: Record<Mood, MoodDef> = {
  palace: { root: 196, scale: SCALES.lydian, chords: [[0, 2, 4], [3, 5, 7], [1, 3, 5], [4, 6, 8]], beat: 0.7, pad: 'triangle', pluckRate: 0.9, drone: 0.2, wind: 0, bright: 0.9 },
  forest: { root: 164.8, scale: SCALES.majorPent, chords: [[0, 2, 4], [2, 4, 6], [1, 3, 5], [0, 3, 5]], beat: 1.1, pad: 'sine', pluckRate: 0.45, drone: 0.25, wind: 0.5, bright: 0.7 },
  village: { root: 174.6, scale: SCALES.dorian, chords: [[0, 2, 4], [3, 5, 7], [4, 6, 8], [0, 2, 5]], beat: 0.8, pad: 'triangle', pluckRate: 0.7, drone: 0.15, wind: 0.2, bright: 0.85 },
  shrine: { root: 146.8, scale: SCALES.minorPent, chords: [[0, 2, 3], [1, 3, 4], [0, 1, 3]], beat: 1.5, pad: 'sine', pluckRate: 0.3, drone: 0.4, wind: 0.3, bright: 0.6 },
  stellar: { root: 110, scale: SCALES.aeolian, chords: [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]], beat: 1.3, pad: 'sawtooth', pluckRate: 0.35, drone: 0.5, wind: 0, bright: 0.35 },
  archive: { root: 130.8, scale: SCALES.dorian, chords: [[0, 2, 4], [1, 3, 5], [4, 6, 8]], beat: 1.4, pad: 'triangle', pluckRate: 0.25, drone: 0.35, wind: 0.1, bright: 0.5 },
  valley: { root: 123.5, scale: SCALES.aeolian, chords: [[0, 2, 4], [5, 7, 9], [3, 5, 7]], beat: 1.6, pad: 'sine', pluckRate: 0.2, drone: 0.45, wind: 0.4, bright: 0.45 },
  tension: { root: 98, scale: SCALES.aeolian, chords: [[0, 2, 4], [0, 1, 4]], beat: 0.55, pad: 'sawtooth', pluckRate: 0.6, drone: 0.7, wind: 0, bright: 0.3 },
  heart: { root: 130.8, scale: SCALES.lydian, chords: [[0, 2, 4], [2, 4, 6], [3, 5, 7], [1, 3, 5]], beat: 1.8, pad: 'sine', pluckRate: 0.5, drone: 0.5, wind: 0.2, bright: 0.8 },
  farewell: { root: 174.6, scale: SCALES.minorPent, chords: [[0, 2, 3], [3, 4, 0], [1, 2, 4]], beat: 1.9, pad: 'sine', pluckRate: 0.35, drone: 0.2, wind: 0.3, bright: 0.7 },
  dark: { root: 82.4, scale: SCALES.aeolian, chords: [[0, 2, 4], [0, 3, 5]], beat: 1.5, pad: 'sawtooth', pluckRate: 0.15, drone: 0.7, wind: 0.2, bright: 0.2 },
};

const LOC_MOOD: Record<string, Mood> = {
  palace_garden: 'palace', palace_hall: 'palace', palace_portal: 'tension',
  forest_arrival: 'forest', forest_crossing: 'forest', root_shrine: 'shrine', lisiere_square: 'village', lisiere_well: 'shrine',
  river_bank: 'forest', river_relay: 'stellar', water_shrine: 'shrine', miral_gate: 'village', memory_garden: 'shrine', memory_shrine: 'shrine',
  stellar_dock: 'stellar', stellar_command: 'stellar', stellar_lab: 'stellar', chronal_chamber: 'stellar', occupied_archive: 'archive', archive_core: 'archive',
  valley_camp: 'valley', valley_relay: 'stellar', valley_bridge: 'valley', valley_outlook: 'farewell', core_approach: 'heart', core_gate: 'tension', planet_heart: 'heart',
};

class AudioEngine {
  private ctx?: AudioContext;
  private master?: GainNode;
  private musicBus?: GainNode;
  private sfxBus?: GainNode;
  private mood: Mood | null = null;
  private moodNodes: { stop(): void }[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private chordIdx = 0;
  private nextChord = 0;
  started = false;

  /** À appeler dans un gestionnaire de geste utilisateur. */
  start(): void {
    if (this.started) { void this.ctx?.resume(); return; }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.sfxBus = c.createGain();
    this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
    this.applyVolumes();
    this.started = true;
    document.addEventListener('visibilitychange', () => { if (document.hidden) void c.suspend(); else void c.resume(); });
    if (this.mood) { const m = this.mood; this.mood = null; this.setMood(m); }
  }

  applyVolumes(): void {
    if (!this.musicBus || !this.sfxBus) return;
    this.musicBus.gain.value = 0.22 * hub.options.music;
    this.sfxBus.gain.value = 0.5 * hub.options.sfx;
  }

  forLocation(id: string): void { this.setMood(LOC_MOOD[id] ?? 'forest'); }
  combat(on: boolean): void { this.setMood(on ? 'tension' : LOC_MOOD[hub.state.location.loc] ?? 'forest'); }
  setMood(m: Mood): void {
    if (this.mood === m) return;
    this.mood = m;
    if (!this.ctx || !this.musicBus) return;
    for (const n of this.moodNodes) n.stop();
    this.moodNodes = [];
    if (this.timer) clearInterval(this.timer);
    const def = MOODS[m], c = this.ctx;
    // bourdon
    if (def.drone > 0) this.moodNodes.push(this.drone(def));
    if (def.wind > 0) this.moodNodes.push(this.windNoise(def.wind));
    this.chordIdx = 0; this.nextChord = c.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(def), 250);
  }

  private fadeOut(g: GainNode, t: number): void { const c = this.ctx!; g.gain.cancelScheduledValues(c.currentTime); g.gain.setValueAtTime(g.gain.value, c.currentTime); g.gain.linearRampToValueAtTime(0.0001, c.currentTime + t); }

  private drone(def: MoodDef): { stop(): void } {
    const c = this.ctx!;
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.22 * def.drone, c.currentTime + 2.5);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300 + 500 * def.bright;
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sine'; o1.frequency.value = def.root / 2; o2.type = 'triangle'; o2.frequency.value = def.root / 2 * 1.503;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.musicBus!);
    o1.start(); o2.start();
    return { stop: () => { this.fadeOut(g, 1.5); setTimeout(() => { try { o1.stop(); o2.stop(); } catch { /* arrêté */ } }, 1700); } };
  }

  private windNoise(level: number): { stop(): void } {
    const c = this.ctx!;
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.6;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.12; const lg = c.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency);
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.05 * level, c.currentTime + 3);
    src.connect(f); f.connect(g); g.connect(this.musicBus!); src.start(); lfo.start();
    return { stop: () => { this.fadeOut(g, 1.5); setTimeout(() => { try { src.stop(); lfo.stop(); } catch { /* arrêté */ } }, 1700); } };
  }

  private note(freq: number, t: number, dur: number, type: OscillatorType, vol: number, attack = 0.02, bus?: GainNode): void {
    const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus ?? this.musicBus!); o.start(t); o.stop(t + dur + 0.05);
  }

  private schedule(def: MoodDef): void {
    const c = this.ctx!; if (!c || c.state !== 'running') return;
    const deg = (d: number) => def.root * Math.pow(2, (def.scale[d % def.scale.length] + 12 * Math.floor(d / def.scale.length)) / 12);
    while (this.nextChord < c.currentTime + 1.2) {
      const ch = def.chords[this.chordIdx % def.chords.length];
      const t = this.nextChord, dur = def.beat * 4;
      ch.forEach((d, i) => this.note(deg(d), t + i * 0.04, dur, def.pad, 0.07 * def.bright + 0.02, dur * 0.35));
      // plucks
      const n = Math.round(4 * def.pluckRate * 2);
      for (let k = 0; k < n; k++) { const dd = ch[Math.floor(Math.random() * ch.length)] + (Math.random() < 0.5 ? 7 : 0); this.note(deg(dd) * 2, t + Math.random() * dur, 1.4, 'triangle', 0.045 * def.bright + 0.01, 0.01); }
      this.nextChord += dur; this.chordIdx++;
    }
  }

  // ----------------------------------------------------------------- effets
  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    if (!this.ctx || !this.sfxBus || this.ctx.state !== 'running') return;
    const c = this.ctx, t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  private noise(dur: number, vol: number, f: number, delay = 0): void {
    if (!this.ctx || !this.sfxBus || this.ctx.state !== 'running') return;
    const c = this.ctx, t = c.currentTime + delay, len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; const g = c.createGain(); g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(this.sfxBus); s.start(t);
  }

  click(): void { this.tone(660, 520, 0.07, 'square', 0.08); }
  tick(pitch = 1): void { this.tone(520 * pitch, 480 * pitch, 0.03, 'triangle', 0.05); }
  interact(): void { this.tone(440, 660, 0.12, 'sine', 0.12); }
  whoosh(): void { this.noise(0.5, 0.25, 900); this.tone(200, 520, 0.4, 'sine', 0.05); }
  strike(): void { this.noise(0.12, 0.25, 1800); this.tone(300, 120, 0.12, 'square', 0.06); }
  hit(): void { this.noise(0.15, 0.3, 500); this.tone(180, 60, 0.18, 'sawtooth', 0.12); }
  hurt(): void { this.tone(220, 90, 0.25, 'sawtooth', 0.15); this.noise(0.2, 0.2, 400); }
  dodge(): void { this.noise(0.18, 0.18, 2400); }
  power(): void { this.tone(330, 990, 0.45, 'sine', 0.15); this.tone(495, 1480, 0.5, 'triangle', 0.08, 0.05); }
  chime(): void { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f * 1.003, 0.7, 'sine', 0.1, i * 0.11)); }
  success(): void { [392, 523, 659].forEach((f, i) => this.tone(f, f, 0.5, 'triangle', 0.12, i * 0.12)); }
  fail(): void { this.tone(300, 200, 0.3, 'triangle', 0.1); }
  heal(): void { [440, 554, 659].forEach((f, i) => this.tone(f, f, 0.4, 'sine', 0.1, i * 0.08)); }
  rumble(): void { this.noise(0.9, 0.35, 120); this.tone(60, 40, 0.9, 'sine', 0.2); }
}

export const audio = new AudioEngine();
