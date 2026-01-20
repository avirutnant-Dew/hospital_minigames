export type SafeActGameType = 'RISK_DEFENDER' | 'CRITICAL_SYNC' | 'HAZARD_POPPER';

export interface SafeActGame {
  id: string;
  game_type: SafeActGameType;
  team_id: string | null;
  is_active: boolean;
  started_at: string;
  ends_at: string;
  shield_health: number;
  total_correct: number;
  total_wrong: number;
  hazards_cleared: number;
  combo_multiplier: number;
  safety_score?: number;
  created_at: string;
}

export interface SafeActLog {
  id: string;
  game_id: string;
  player_nickname: string;
  team_id: string | null;
  action_type: string;
  is_correct: boolean;
  zone_id: number | null;
  score_value: number;
  created_at: string;
}

export interface BehaviorCard {
  id: string;
  text: string;
  isRisk: boolean; // true = swipe left, false = swipe right
  category: 'infection' | 'fall' | 'medication' | 'equipment' | 'procedure';
}

export interface Hazard {
  id: string;
  zoneId: number;
  tapsRequired: number;
  currentTaps: number;
  isCleared: boolean;
}

export const SAFE_ACT_CONFIG = {
  RISK_DEFENDER: {
    duration: 40,
    correctScore: 100000,
    wrongPenalty: 50000,
    shieldDamage: 5,
    shieldHeal: 2,
  },
  CRITICAL_SYNC: {
    duration: 45,
    safeZoneMin: 40,
    safeZoneMax: 60,
    scorePerSecondInZone: 200000,
    codeBlueThreshold: 5, // seconds outside safe zone
  },
  HAZARD_POPPER: {
    duration: 60,
    tapsPerHazard: 15,
    hazardSpawnInterval: 2000,
    maxHazards: 12,
    scorePerHazard: 500000,
    gridSize: 12, // 4x3 grid
  },
} as const;

export const BEHAVIOR_CARDS: BehaviorCard[] = [
  { id: '1', text: 'ล้างมือก่อนสัมผัสผู้ป่วย', isRisk: false, category: 'infection' },
  { id: '2', text: 'ไม่สวมถุงมือขณะเจาะเลือด', isRisk: true, category: 'infection' },
  { id: '3', text: 'ยกราวกั้นเตียงขึ้นหลังดูแลผู้ป่วย', isRisk: false, category: 'fall' },
  { id: '4', text: 'ปล่อยให้ผู้ป่วยสูงอายุเดินคนเดียว', isRisk: true, category: 'fall' },
  { id: '5', text: 'ตรวจสอบชื่อผู้ป่วยก่อนให้ยา', isRisk: false, category: 'medication' },
  { id: '6', text: 'ให้ยาโดยไม่ตรวจสอบ allergy', isRisk: true, category: 'medication' },
  { id: '7', text: 'ตรวจสอบอุปกรณ์ก่อนใช้งาน', isRisk: false, category: 'equipment' },
  { id: '8', text: 'ใช้อุปกรณ์ที่หมดอายุ', isRisk: true, category: 'equipment' },
  { id: '9', text: 'ยืนยันตัวตนผู้ป่วยก่อนทำหัตถการ', isRisk: false, category: 'procedure' },
  { id: '10', text: 'ข้ามขั้นตอน Time-out ก่อนผ่าตัด', isRisk: true, category: 'procedure' },
  { id: '11', text: 'รายงาน Near Miss ทันที', isRisk: false, category: 'procedure' },
  { id: '12', text: 'ปิดบังความผิดพลาดที่เกิดขึ้น', isRisk: true, category: 'procedure' },
  { id: '13', text: 'สื่อสาร SBAR เมื่อส่งต่อผู้ป่วย', isRisk: false, category: 'procedure' },
  { id: '14', text: 'ไม่บันทึกข้อมูลสำคัญในเวชระเบียน', isRisk: true, category: 'procedure' },
  { id: '15', text: 'ทำความสะอาดอุปกรณ์หลังใช้งาน', isRisk: false, category: 'infection' },
  { id: '16', text: 'ใช้เข็มฉีดยาซ้ำกับผู้ป่วยหลายคน', isRisk: true, category: 'infection' },
];

export const HAZARD_ZONES = [
  { id: 0, name: 'OPD', row: 0, col: 0 },
  { id: 1, name: 'ER', row: 0, col: 1 },
  { id: 2, name: 'Ward 1', row: 0, col: 2 },
  { id: 3, name: 'Ward 2', row: 0, col: 3 },
  { id: 4, name: 'ICU', row: 1, col: 0 },
  { id: 5, name: 'OR', row: 1, col: 1 },
  { id: 6, name: 'Lab', row: 1, col: 2 },
  { id: 7, name: 'Pharmacy', row: 1, col: 3 },
  { id: 8, name: 'Heart Center', row: 2, col: 0 },
  { id: 9, name: 'GI Center', row: 2, col: 1 },
  { id: 10, name: 'Ortho Center', row: 2, col: 2 },
  { id: 11, name: 'Check-up', row: 2, col: 3 },
];

export const selectRandomSafeActGame = (): SafeActGameType => {
  const games: SafeActGameType[] = ['RISK_DEFENDER', 'CRITICAL_SYNC', 'HAZARD_POPPER'];
  return games[Math.floor(Math.random() * games.length)];
};
