export type EdgeType = 'w' | 's' | 't'; // 소화수, 전기 신호, 시험·순환
export type Point = [number, number];
export type NodeKind = 'tank' | 'pump' | 'gate' | 'check' | 'gauge' | 'gauge2' | 'flex' | 'strainer' | 'float' | 'ori' | 'cup'
  | 'angle' | 'relief' | 'foot' | 'tag' | 'panel' | 'cham' | 'hub' | 'j' | 'hc' | 'head' | 'ohead' | 'av' | 'fdc' | 'bell'
  | 'det' | 'res' | 'lamp' | 'batt' | 'drain';

export interface DiagramNode {
  id: string;
  /** 도면과 퍼즐에 쓰는 이름. 줄바꿈은 \n */
  label: string;
  x: number;
  y: number;
  kind: NodeKind;
  lp: string;
  /** 연결 그리기에서 구별용으로 쓰는 긴 이름 */
  dl?: string;
  /** 라벨 위치 직접 지정 [dx, dy, text-anchor] */
  at?: [number, number, string];
  code?: string;
  w?: number;
  W?: number;
  H?: number;
  rot?: number;
  side?: number;
  fill?: number;
  small?: number;
  /** 반복 표현용 부품. 문제 출제에서 제외 */
  deco?: number;
  role?: string;
  tip?: string;
}
export interface DiagramEdge { id: string; f: string; t: string; ty: EdgeType; pts: Point[] | null; deco: boolean }
export interface ScenarioStep { t: string; d: string; n: string[]; e: string[] }
export interface SystemData {
  name: string;
  code: string;
  vb?: [number, number];
  zones: [number, number, number, number, string][];
  notes?: (([number, number, string]) | ([number, number, string, number]))[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: ScenarioStep[];
  distractors: string[];
  groups?: [string, string[]][];
}
