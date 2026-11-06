import type { DiagramEdge, SystemData } from '../data/types';
import type { Level } from '../data';

export const randSeed = () => 1000 + Math.floor(Math.random() * 9000);
export function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed: number) {
  let a = seed;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const plain = (l: string) => l.replace('\n', ' ');
export const key = (a: string, b: string) => [a, b].sort().join('~');
export const problemRand = (sys: string, mode: string, level: string, seed: number) => rng(hash([sys, mode, level, seed].join('|')));

export interface Chip { t: string; i: number }
export interface Puzzle { blanks: string[]; chips: Chip[]; mirror: boolean }
export function makePuzzle(d: SystemData, level: Level, rand: () => number): Puzzle {
  const can = d.nodes.filter(n => !n.deco && n.kind !== 'j');
  const frac = { easy: .3, normal: .6, hard: 1 }[level];
  const cap = { easy: 8, normal: 16, hard: 28 }[level];
  const blanks = shuffled(can, rand).slice(0, Math.min(cap, Math.max(4, Math.round(can.length * frac)))).map(n => n.id);
  const mirror = rand() < .5;
  const names = blanks.map(id => plain(d.nodes.find(n => n.id === id)!.label));
  const chips = shuffled(level === 'hard' ? [...names, ...d.distractors] : names, rand).map((t, i) => ({ t, i }));
  return { blanks, chips, mirror };
}
export function scorePuzzle(d: SystemData, blanks: string[], placed: Record<string, string>) {
  return blanks.filter(id => placed[id] === plain(d.nodes.find(n => n.id === id)!.label)).length;
}

export interface DrawTask {
  todo: DiagramEdge[]; given: DiagramEdge[]; live: Set<string>;
  pos: Record<string, [number, number]>; flatVB: [number, number] | null;
}
export function makeDraw(d: SystemData, level: Level, rand: () => number, groupIdx: number, shuffle: boolean): DrawTask {
  const grp = d.groups ? d.groups[groupIdx] || d.groups[0] : null;
  const inG = grp ? new Set(grp[1]) : null;
  const liveNodes = d.nodes.filter(n => !n.deco && (!inG || !shuffle || inG.has(n.id)));
  const live = new Set(liveNodes.map(n => n.id));
  const edges = d.edges.filter(e => !e.deco && live.has(e.f) && live.has(e.t) && (!inG || (inG.has(e.f) && inG.has(e.t))));
  const rest = d.edges.filter(e => !e.deco && live.has(e.f) && live.has(e.t) && !edges.includes(e));
  const frac = { easy: .35, normal: .65, hard: 1 }[level];
  const sh = shuffled(edges, rand), cut = Math.max(3, Math.round(edges.length * frac));
  const pos: Record<string, [number, number]> = {};
  let flatVB: [number, number] | null = null;
  if (shuffle) {
    const cols = liveNodes.length > 12 ? 5 : 4, rows = Math.ceil(liveNodes.length / cols);
    flatVB = [1200, rows * 170 + 40];
    const slots: [number, number][] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push([1200 / cols * (c + .5), 85 + r * 170]);
    shuffled(liveNodes, rand).forEach((n, i) => { pos[n.id] = slots[i]; });
  }
  return { todo: sh.slice(0, cut), given: [...sh.slice(cut), ...rest], live, pos, flatVB };
}
export function scoreDraw(todo: DiagramEdge[], lines: [string, string][]) {
  const need = new Set(todo.map(e => key(e.f, e.t)));
  const ok = lines.filter(l => need.has(key(l[0], l[1]))).length;
  return { ok, bad: lines.length - ok, total: todo.length };
}
export const scoreOrder = (pick: number[]) => pick.filter((v, i) => v === i).length;
