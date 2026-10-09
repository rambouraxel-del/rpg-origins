// PNG sans dépendance : validation, analyse technique, décodage, encodage, mini-dessin (pour les planches de preuve).
import { crc32, deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

export interface PngInfo {
  width: number;
  height: number;
  bytes: number;
  colorType: number;
  bitDepth: number;
  stats?: { meanLuma: number; stdLuma: number; transparentFraction: number };
}

interface Parsed {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
  idat: Buffer[];
}

function parse(buf: Buffer): Parsed {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('Signature PNG invalide.');
  let pos = 8;
  let ihdr: Buffer | undefined;
  const idat: Buffer[] = [];
  let iend = false;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') { iend = true; break; }
    pos += 12 + len;
  }
  if (!ihdr || !iend || idat.length === 0) throw new Error('PNG incomplet (IHDR/IDAT/IEND manquant).');
  return { width: ihdr.readUInt32BE(0), height: ihdr.readUInt32BE(4), bitDepth: ihdr[8], colorType: ihdr[9], interlace: ihdr[12], idat };
}

/** Lignes de pixels défiltrées (8 bits, non entrelacé). */
function unfilter(p: Parsed, channels: number): Buffer[] {
  const raw = inflateSync(Buffer.concat(p.idat));
  const stride = p.width * channels;
  if (raw.length < (stride + 1) * p.height) throw new Error('Données PNG tronquées.');
  const rows: Buffer[] = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < p.height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = (line[x] + add) & 255;
    }
    rows.push(line);
    prev = line;
  }
  return rows;
}

export function inspectPng(buf: Buffer): PngInfo {
  const p = parse(buf);
  const info: PngInfo = { width: p.width, height: p.height, bytes: buf.length, colorType: p.colorType, bitDepth: p.bitDepth };
  const channels = CHANNELS[p.colorType];
  if (p.bitDepth !== 8 || p.interlace !== 0 || !channels) return info; // statistiques indisponibles, validité OK
  const rows = unfilter(p, channels);
  let n = 0, sum = 0, sumSq = 0, transparent = 0;
  for (let y = 0; y < p.height; y += 4) {
    for (let x = 0; x < p.width; x += 4) {
      const o = x * channels;
      const row = rows[y];
      const luma = channels >= 3 ? 0.299 * row[o] + 0.587 * row[o + 1] + 0.114 * row[o + 2] : row[o];
      const alpha = channels === 4 ? row[o + 3] : channels === 2 ? row[o + 1] : 255;
      n++; sum += luma; sumSq += luma * luma;
      if (alpha < 16) transparent++;
    }
  }
  const mean = sum / n;
  info.stats = { meanLuma: mean, stdLuma: Math.sqrt(Math.max(0, sumSq / n - mean * mean)), transparentFraction: transparent / n };
  return info;
}

/** Problèmes techniques détectables automatiquement (le jugement artistique reste à la revue visuelle). */
export function technicalIssues(info: PngInfo, expected: { width: number; height: number }): string[] {
  const issues: string[] = [];
  if (info.width !== expected.width || info.height !== expected.height) {
    issues.push(`dimensions ${info.width}x${info.height} au lieu de ${expected.width}x${expected.height}`);
  }
  if (info.stats) {
    if (info.stats.stdLuma < 5) issues.push('image quasi uniforme (probablement vide)');
    if (info.stats.transparentFraction > 0.9) issues.push('image quasi entièrement transparente');
  }
  return issues;
}

// ---- Raster RGBA, encodage, dessin -------------------------------------------------------------

export interface Raster {
  width: number;
  height: number;
  data: Uint8Array; // RGBA
}

export function newRaster(width: number, height: number, rgb: [number, number, number]): Raster {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
  return { width, height, data };
}

export function decodeRaster(buf: Buffer): Raster {
  const p = parse(buf);
  const channels = CHANNELS[p.colorType];
  if (p.bitDepth !== 8 || p.interlace !== 0 || !channels) throw new Error('Format PNG non pris en charge pour les aperçus (8 bits, non entrelacé requis).');
  const rows = unfilter(p, channels);
  const data = new Uint8Array(p.width * p.height * 4);
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      const o = x * channels, d = (y * p.width + x) * 4, r = rows[y];
      if (channels === 1 || channels === 2) data.set([r[o], r[o], r[o], channels === 2 ? r[o + 1] : 255], d);
      else data.set([r[o], r[o + 1], r[o + 2], channels === 4 ? r[o + 3] : 255], d);
    }
  }
  return { width: p.width, height: p.height, data };
}

export function encodePng(r: Raster): Buffer {
  const stride = r.width * 4;
  const raw = Buffer.alloc((stride + 1) * r.height);
  for (let y = 0; y < r.height; y++) Buffer.from(r.data.buffer, r.data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  const chunk = (type: string, data: Buffer) => {
    const b = Buffer.alloc(12 + data.length);
    b.writeUInt32BE(data.length, 0);
    b.write(type, 4, 'ascii');
    data.copy(b, 8);
    b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(r.width, 0);
  ihdr.writeUInt32BE(r.height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Réduit pour tenir dans maxW x maxH (jamais agrandi), moyenne 2x2 par pixel. */
export function fit(src: Raster, maxW: number, maxH: number): Raster {
  const s = Math.min(maxW / src.width, maxH / src.height, 1);
  const w = Math.max(1, Math.floor(src.width * s)), h = Math.max(1, Math.floor(src.height * s));
  const out = newRaster(w, h, [0, 0, 0]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const acc = [0, 0, 0, 0];
      for (const [dx, dy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const sx = Math.min(src.width - 1, Math.floor((x + dx) / s)), sy = Math.min(src.height - 1, Math.floor((y + dy) / s));
        const o = (sy * src.width + sx) * 4;
        for (let c = 0; c < 4; c++) acc[c] += src.data[o + c] / 4;
      }
      out.data.set(acc.map(Math.round), (y * w + x) * 4);
    }
  }
  return out;
}

/** Copie src sur dst ; l'alpha est fondu sur un gris moyen pour que la transparence reste visible. */
export function blit(dst: Raster, src: Raster, x0: number, y0: number): void {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const dx = x0 + x, dy = y0 + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const o = (y * src.width + x) * 4, d = (dy * dst.width + dx) * 4, a = src.data[o + 3] / 255;
      for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round(src.data[o + c] * a + 90 * (1 - a));
      dst.data[d + 3] = 255;
    }
  }
}

export function fillRect(r: Raster, x0: number, y0: number, w: number, h: number, rgb: [number, number, number]): void {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < r.width && y < r.height) r.data.set([...rgb, 255], (y * r.width + x) * 4);
}

const DIGITS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

/** Écrit des chiffres (police 5x7 agrandie). Retourne la largeur occupée. */
export function drawDigits(r: Raster, x: number, y: number, text: string, scale: number, fg: [number, number, number], bg: [number, number, number]): number {
  const w = text.length * 6 * scale + scale;
  fillRect(r, x, y, w, 9 * scale, bg);
  [...text].forEach((ch, i) => {
    DIGITS[ch]?.forEach((row, ry) => [...row].forEach((bit, rx) => bit === '1' && fillRect(r, x + scale + (i * 6 + rx) * scale, y + scale + ry * scale, scale, scale, fg)));
  });
  return w;
}
