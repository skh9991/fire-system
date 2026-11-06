import { describe, it, expect } from 'vitest';
import { SYS } from '../src/data';

describe.each(Object.entries(SYS))('%s 데이터', (_k, d) => {
  const ids = new Set(d.nodes.map(n => n.id)), edges = new Set(d.edges.map(e => e.id));
  it('부품 id가 중복되지 않는다', () => expect(ids.size).toBe(d.nodes.length));
  it('연결은 있는 부품만 가리킨다', () => d.edges.forEach(e => { expect(ids.has(e.f), e.id).toBe(true); expect(ids.has(e.t), e.id).toBe(true); }));
  it('시나리오는 있는 부품과 연결만 가리킨다', () => d.steps.forEach(s => { s.e.forEach(x => expect(edges.has(x), x).toBe(true)); s.n.forEach(x => expect(ids.has(x), x).toBe(true)); }));
  it('이름 있는 부품에는 용도 설명이 있다', () => d.nodes.filter(n => n.label).forEach(n => expect(n.role, n.id).toBeTruthy()));
  it('연습 구역은 있는 부품만 담는다', () => (d.groups || []).forEach(g => g[1].forEach(x => expect(ids.has(x), x).toBe(true))));
  it('오답 부품은 도면에 없는 이름이다', () => d.distractors.forEach(t => expect(d.nodes.some(n => !n.deco && n.label.replace('\n', ' ') === t), t).toBe(false)));
});
