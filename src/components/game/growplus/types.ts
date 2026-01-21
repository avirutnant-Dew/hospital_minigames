export type GrowPlusGameType = 'REVENUE_TAP' | 'REFERRAL_LINK' | 'SBU_COMBO' | 'HOSPITAL_NETWORK' | 'DEPARTMENT_EFFICIENCY';

export interface GrowPlusGame {
  id: string;
  game_type: GrowPlusGameType;
  team_id: string | null;
  is_active: boolean;
  started_at: string;
  ends_at: string;
  total_score: number;
  combo_multiplier: number;
  created_at: string;
}

export interface GrowPlusScore {
  id: string;
  game_id: string;
  player_nickname: string;
  team_id: string | null;
  action_type: string;
  score_value: number;
  batch_size?: number; // Number of actions in this batch
  created_at: string;
}

export interface GameSummary {
  totalRevenue: number;
  totalTaps: number;
  totalLinks: number;
  totalCombos: number;
  playerCount: number;
}

// Hospital department types for sequence games
export interface DepartmentNode {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface PatientPathway {
  id: string;
  name: string;
  description: string;
  departments: DepartmentNode[];
  baseReward: number; // THB
}

export const HOSPITAL_DEPARTMENTS = {
  ER: { name: 'ER', icon: '🚑', color: '#FF6B6B' },
  CT_BRAIN: { name: 'CT Brain', icon: '🧠', color: '#4ECDC4' },
  LAB: { name: 'Lab', icon: '🧪', color: '#95E1D3' },
  NEUROLOGY: { name: 'Neurology', icon: '👨‍⚕️', color: '#A8DADC' },
  CATH_LAB: { name: 'Cath Lab', icon: '🛠️', color: '#F1FAEE' },
  ICU: { name: 'ICU', icon: '🏥', color: '#E1BEE7' },
  ECG: { name: 'ECG', icon: '📊', color: '#FFE0B2' },
  CARDIOLOGY: { name: 'Cardiology', icon: '❤️', color: '#FFCCCC' },
  IMAGING: { name: 'Imaging', icon: '🖼️', color: '#B3E5FC' },
  ANTIBIOTICS: { name: 'Antibiotics', icon: '💊', color: '#C8E6C9' },
} as const;

// Patient pathways
export const PATIENT_PATHWAYS: PatientPathway[] = [
  {
    id: 'acute-stroke',
    name: 'Acute Stroke - Mechanical Thrombectomy',
    description: 'Emergency stroke intervention pathway',
    departments: [
      { id: 'er', name: 'ER', icon: '🚑', order: 1 },
      { id: 'ct_brain', name: 'CT Brain', icon: '🧠', order: 2 },
      { id: 'lab', name: 'Lab', icon: '🧪', order: 3 },
      { id: 'neurology', name: 'Neurology', icon: '👨‍⚕️', order: 4 },
      { id: 'cath_lab', name: 'Cath Lab', icon: '🛠️', order: 5 },
      { id: 'icu', name: 'ICU', icon: '🏥', order: 6 },
    ],
    baseReward: 6000000, // 6M THB
  },
  {
    id: 'acute-mi',
    name: 'Acute MI - Coronary Intervention',
    description: 'Acute myocardial infarction intervention',
    departments: [
      { id: 'er', name: 'ER', icon: '🚑', order: 1 },
      { id: 'ecg', name: 'ECG', icon: '📊', order: 2 },
      { id: 'lab', name: 'Lab', icon: '🧪', order: 3 },
      { id: 'cardiology', name: 'Cardiology', icon: '❤️', order: 4 },
      { id: 'cath_lab', name: 'Cath Lab', icon: '🛠️', order: 5 },
      { id: 'icu', name: 'ICU', icon: '🏥', order: 6 },
    ],
    baseReward: 6000000, // 6M THB
  },
  {
    id: 'sepsis',
    name: 'Sepsis - Rapid Treatment',
    description: 'Sepsis management and ICU admission',
    departments: [
      { id: 'er', name: 'ER', icon: '🚑', order: 1 },
      { id: 'lab', name: 'Lab', icon: '🧪', order: 2 },
      { id: 'imaging', name: 'Imaging', icon: '🖼️', order: 3 },
      { id: 'antibiotics', name: 'Antibiotics', icon: '💊', order: 4 },
      { id: 'icu', name: 'ICU', icon: '🏥', order: 5 },
    ],
    baseReward: 5000000, // 5M THB
  },
];

export const GAME_CONFIG = {
  REVENUE_TAP: {
    duration: 30, // seconds
    scorePerAction: 500000,
    targetRevenue: 1150000000,
  },
  REFERRAL_LINK: {
    duration: 45, // seconds
    scorePerAction: 1000000,
  },
  SBU_COMBO: {
    duration: 30, // seconds
    cycleSpeed: 500, // ms per zone
    syncWindow: 500, // ms
    minPlayersForCombo: 20,
    comboMultiplier: 5,
    baseScore: 1000000,
  },
  HOSPITAL_NETWORK: {
    duration: 45, // seconds
    sequenceLength: 3, // departments to tap in sequence
    scorePerSequence: 2000000, // 2M THB
  },
  DEPARTMENT_EFFICIENCY: {
    duration: 30, // seconds
    baseScoreMultiplier: 1,
  },
} as const;

export const SBU_ZONES = ['Heart', 'GI', 'Ortho', 'Check-up'] as const;
export type SBUZone = typeof SBU_ZONES[number];

export const selectRandomGame = (): GrowPlusGameType => {
  const games: GrowPlusGameType[] = ['REVENUE_TAP', 'HOSPITAL_NETWORK', 'DEPARTMENT_EFFICIENCY', 'REFERRAL_LINK', 'SBU_COMBO'];
  return games[Math.floor(Math.random() * games.length)];
};
