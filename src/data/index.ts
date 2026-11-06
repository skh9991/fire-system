import { hydrant } from './hydrant';
import { wet } from './wet';
import { preaction } from './preaction';
import { alarm } from './alarm';
import type { SystemData } from './types';

export const SYS: Record<string, SystemData> = { hydrant, wet, preaction, alarm };
export const SYSTAB: [string, string][] = [['hydrant', '옥내소화전'], ['wet', '습식 SP'], ['preaction', '준비작동식 SP'], ['alarm', '자동화재탐지']];
export const MODES: [Mode, string][] = [['explore', '탐색'], ['puzzle', '빈칸 퍼즐'], ['draw', '연결 그리기'], ['order', '동작 순서']];
export const LEVELS: [Level, string][] = [['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']];
export type Mode = 'explore' | 'puzzle' | 'draw' | 'order';
export type Level = 'easy' | 'normal' | 'hard';
