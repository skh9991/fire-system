import { N, E, r } from './helpers';

export const pumpNodes = ()=>[
  N('tank','수원',110,670,'tank',r('tank')),
  N('pump','주펌프',270,640,'pump',{at:[0,-34,'middle'],...r('pump')}),
  N('ck','체크밸브',370,640,'check',r('chk')),
  N('dv','토출측\n개폐밸브',470,640,'gate',{role:'펌프 토출측 물길을 여닫습니다.',tip:'펌프 주변 배관의 자세한 구성은 옥내소화전설비 도면과 같습니다.'}),
  N('riser','입상관',620,640,'hub',{lp:'b',...r('riser')}),
  N('cham','압력챔버',780,640,'cham',{lp:'t3',...r('cham')}),
  N('cps','압력스위치',880,640,'tag',{code:'PS',w:44,...r('ps')}),
  N('mcc','동력제어반',1040,700,'panel',{code:'MCC',lp:'l2',...r('mcc')}),
  N('fdc','송수구',470,530,'fdc',{at:[-28,6,'end'],...r('fdc')})
];
export const pumpEdges = ()=>[
  E('tank','pump','w',[[150,640],[270,640]]),E('pump','ck'),E('ck','dv'),E('dv','riser'),
  E('riser','cham'),E('cham','cps','s'),
  E('mcc','pump','s',[[1040,726],[1040,742],[270,742],[270,662]]),
  E('fdc','riser','w',[[470,530],[570,530],[570,640]])
];

