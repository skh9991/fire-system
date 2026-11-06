import { describe, it, expect } from 'vitest';
import { SYS } from '../src/data';
import { makePuzzle, makeDraw, problemRand, plain, scoreDraw, scoreOrder, scorePuzzle } from '../src/engine/engine';

const levels = ['easy', 'normal', 'hard'] as const;
describe('문제 생성', () => {
  it('같은 문제 번호는 같은 문제를 만든다', () => {
    const a = makePuzzle(SYS.hydrant, 'normal', problemRand('hydrant', 'puzzle', 'normal', 1234));
    const b = makePuzzle(SYS.hydrant, 'normal', problemRand('hydrant', 'puzzle', 'normal', 1234));
    expect(a).toEqual(b);
  });
  it('다른 문제 번호는 다른 문제를 만든다', () => {
    const a = makePuzzle(SYS.hydrant, 'normal', problemRand('hydrant', 'puzzle', 'normal', 1));
    const b = makePuzzle(SYS.hydrant, 'normal', problemRand('hydrant', 'puzzle', 'normal', 2));
    expect(a.blanks).not.toEqual(b.blanks);
  });
  for (const k of Object.keys(SYS)) for (const lv of levels) it(`${k} ${lv}: 정답을 모두 넣으면 만점`, () => {
    const d = SYS[k], p = makePuzzle(d, lv, problemRand(k, 'puzzle', lv, 7));
    const placed = Object.fromEntries(p.blanks.map(id => [id, plain(d.nodes.find(n => n.id === id)!.label)]));
    expect(scorePuzzle(d, p.blanks, placed)).toBe(p.blanks.length);
    p.blanks.forEach(id => expect(p.chips.some(c => c.t === placed[id])).toBe(true));
  });
  for (const k of Object.keys(SYS)) it(`${k}: 연결 그리기 전 구역이 풀 수 있는 문제다`, () => {
    const d = SYS[k];
    (d.groups || [['전체', []]]).forEach((_g, i) => {
      const t = makeDraw(d, 'hard', problemRand(k, 'draw', 'hard', 5), i, true);
      expect(t.todo.length).toBeGreaterThan(0);
      t.todo.forEach(e => { expect(t.pos[e.f], e.id).toBeDefined(); expect(t.pos[e.t], e.id).toBeDefined(); });
      expect(scoreDraw(t.todo, t.todo.map(e => [e.f, e.t]))).toEqual({ ok: t.todo.length, bad: 0, total: t.todo.length });
    });
  });
});
describe('채점', () => {
  it('없는 연결은 오답으로 센다', () => {
    const t = makeDraw(SYS.alarm, 'hard', problemRand('alarm', 'draw', 'hard', 5), 0, true);
    expect(scoreDraw(t.todo, [['rc', 'er']]).bad).toBe(1);
  });
  it('연결 방향은 따지지 않는다', () => {
    const t = makeDraw(SYS.alarm, 'hard', problemRand('alarm', 'draw', 'hard', 5), 0, true);
    expect(scoreDraw(t.todo, [[t.todo[0].t, t.todo[0].f]]).ok).toBe(1);
  });
  it('동작 순서는 제자리 개수를 센다', () => expect(scoreOrder([0, 2, 1, 3])).toBe(2));
});
