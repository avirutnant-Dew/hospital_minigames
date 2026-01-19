export type ProCareGameType = 'HEART_COLLECTOR' | 'EMPATHY_ECHO' | 'SMILE_SPARKLE';

export interface ProCareGame {
  id: string;
  game_type: ProCareGameType;
  team_id: string | null;
  is_active: boolean;
  started_at: string;
  ends_at: string;
  csi_score: number;
  hearts_collected: number;
  correct_votes: number;
  total_votes: number;
  smile_taps: number;
  customers_helped: number;
  created_at: string;
}

export interface ProCareLog {
  id: string;
  game_id: string;
  player_nickname: string;
  team_id: string | null;
  action_type: string;
  is_correct: boolean;
  score_value: number;
  created_at: string;
}

export interface FloatingHeart {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: 'pink' | 'red' | 'rose';
}

export interface EmpathyScenario {
  id: string;
  situation: string;
  optionA: string;
  optionB: string;
  correctOption: 'A' | 'B';
  category: 'complaint' | 'waiting' | 'request' | 'concern';
}

export interface CustomerFace {
  id: string;
  emotion: 'worried' | 'waiting' | 'frustrated';
  targetTaps: number;
  currentTaps: number;
  isSmiling: boolean;
}

export const PRO_CARE_CONFIG = {
  HEART_COLLECTOR: {
    duration: 45,
    scorePerHeart: 50000,
    csiPerHeart: 0.5, // Each heart adds 0.5% to CSI
    spawnInterval: 300, // ms between spawns
    maxHearts: 15,
  },
  EMPATHY_ECHO: {
    duration: 60,
    scorePerCorrect: 200000,
    csiPerCorrect: 2, // Each correct vote adds 2% to CSI
    scenarioTime: 12, // seconds per scenario
  },
  SMILE_SPARKLE: {
    duration: 50,
    scorePerTap: 10000,
    tapsPerSmile: 100, // 100 collective taps to make customer smile
    csiPerSmile: 5, // Each smile adds 5% to CSI
    maxCustomers: 5,
  },
} as const;

export const EMPATHY_SCENARIOS: EmpathyScenario[] = [
  {
    id: '1',
    situation: 'ลูกค้ารอนาน 30 นาที และเริ่มแสดงอาการหงุดหงิด',
    optionA: '"ต้องรอตามคิวค่ะ ทุกคนก็รอเหมือนกัน"',
    optionB: '"ขออภัยมากค่ะ ให้ดิฉันช่วยเช็คสถานะและหาทางเร่งให้นะคะ"',
    correctOption: 'B',
    category: 'waiting',
  },
  {
    id: '2',
    situation: 'ผู้ป่วยบ่นว่าค่ารักษาแพงกว่าที่คาดไว้',
    optionA: '"เข้าใจค่ะ ให้ดิฉันอธิบายรายละเอียดค่าใช้จ่ายและดูว่ามีทางช่วยอย่างไรได้บ้างนะคะ"',
    optionB: '"ค่ารักษาเป็นไปตามมาตรฐานค่ะ"',
    correctOption: 'A',
    category: 'complaint',
  },
  {
    id: '3',
    situation: 'ญาติผู้ป่วยถามซ้ำแล้วซ้ำเล่าเรื่องเดียวกัน',
    optionA: '"บอกไปแล้วค่ะ ขอให้ฟังให้ดี"',
    optionB: '"เข้าใจว่ากังวลค่ะ ให้ดิฉันอธิบายอีกครั้งนะคะ"',
    correctOption: 'B',
    category: 'concern',
  },
  {
    id: '4',
    situation: 'ลูกค้าร้องขอให้เลื่อนนัดในวันนี้',
    optionA: '"ไม่สามารถเลื่อนได้ค่ะ นโยบายไม่อนุญาต"',
    optionB: '"ขอเช็คตารางให้ก่อนนะคะ จะพยายามหาทางช่วยค่ะ"',
    correctOption: 'B',
    category: 'request',
  },
  {
    id: '5',
    situation: 'ผู้ป่วยสูงอายุไม่เข้าใจขั้นตอนการรับยา',
    optionA: '"ให้ดิฉันพาไปเองเลยนะคะ จะอธิบายให้ทีละขั้นตอนค่ะ"',
    optionB: '"เดินไปทางนั้นค่ะ มีป้ายบอกอยู่"',
    correctOption: 'A',
    category: 'request',
  },
  {
    id: '6',
    situation: 'ลูกค้าโทรมาบ่นเรื่องการนัดหมายที่สับสน',
    optionA: '"ขออภัยที่ทำให้สับสนค่ะ ให้ดิฉันจัดการให้ใหม่และยืนยันกับคุณเลยนะคะ"',
    optionB: '"ต้องตรวจสอบจากทางคุณด้วยค่ะ อาจจะจดผิดเอง"',
    correctOption: 'A',
    category: 'complaint',
  },
  {
    id: '7',
    situation: 'ผู้ป่วยกังวลเรื่องผลตรวจที่ยังไม่ออก',
    optionA: '"ผลยังไม่ออกค่ะ รอได้เลย"',
    optionB: '"เข้าใจว่ากังวลค่ะ ให้ดิฉันติดตามให้และจะโทรแจ้งทันทีที่ทราบผลนะคะ"',
    correctOption: 'B',
    category: 'concern',
  },
  {
    id: '8',
    situation: 'ลูกค้าถามหาห้องน้ำด้วยท่าทางเร่งด่วน',
    optionA: '"ไปทางโน้นค่ะ เลี้ยวซ้ายแล้วก็ขวา"',
    optionB: '"เดี๋ยวให้ดิฉันพาไปเลยค่ะ ตามมานะคะ"',
    correctOption: 'B',
    category: 'request',
  },
];

export const CUSTOMER_EMOTIONS = ['worried', 'waiting', 'frustrated'] as const;

export const selectRandomProCareGame = (): ProCareGameType => {
  const games: ProCareGameType[] = ['HEART_COLLECTOR', 'EMPATHY_ECHO', 'SMILE_SPARKLE'];
  return games[Math.floor(Math.random() * games.length)];
};
