// Validation et analyse technique d'un PNG, sans dépendance (zlib de Node).
import { inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface PngInfo {
  width: number;
  height: number;
  bytes: number;
  colorType: number;
  bitDepth: number;
  stats?: { meanLuma: number; stdLuma: number; transparentFraction: number };
}

export function inspectPng(buf: Buffer): PngInfo {
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
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];
  const info: PngInfo = { width, height, bytes: buf.length, colorType, bitDepth };
  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (bitDepth !== 8 || interlace !== 0 || !channels) return info; // analyse statistique non disponible, validité OK

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (raw.length < (stride + 1) * height) throw new Error('Données PNG tronquées.');
  const rows: Buffer[] = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
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
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = (line[x] + add) & 255;
    }
    rows.push(line);
    prev = line;
  }
  let n = 0, sum = 0, sumSq = 0, transparent = 0;
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
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

/** Problèmes techniques détectables automatiquement (le jugement artistique reste à la revue). */
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
