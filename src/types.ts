export type Company = 'Jabil' | 'OCS' | 'ISS' | 'Suksesindo' | 'Intern';
export type ShiftGroup = 'Non Shift' | 'Grup A' | 'Grup B' | 'Grup C';
export type Category = 'Ganda Putra' | 'Single Putri';
export type ShiftType = 'Pagi' | 'Siang' | 'Malam';

export interface Player {
  id: string;
  name: string;
  company: Company;
  shiftGroup: ShiftGroup;
  seed?: boolean;
  category: Category;
}

export interface DoublesPair {
  id: string;
  player1: Player;
  player2: Player;
  seed?: boolean;
}

export interface Match {
  id: string;
  matchNumber: number;
  category: Category;
  round: TournamentRound;
  team1?: DoublesPair | Player;
  team2?: DoublesPair | Player;
  winner?: string;
  scores: MatchScore[];
  scheduledDate?: string;
  scheduledTime?: string;
  court?: number;
  status: 'pending' | 'scheduled' | 'completed';
  week?: number;
  nextMatchId?: string;
  nextMatchSlot?: 1 | 2;
}

export type TournamentRound =
  | 'Preliminary'
  | 'Round of 16'
  | 'Quarter Final'
  | 'Semi Final'
  | 'Final';

export interface MatchScore {
  game1Team1: number;
  game1Team2: number;
  game2Team1: number;
  game2Team2: number;
  game3Team1?: number;
  game3Team2?: number;
}

export interface WeekSchedule {
  week: number;
  startDate: string;
  shiftRotation: ShiftRotation;
  matches: Match[];
}

export interface ShiftRotation {
  [key: string]: ShiftGroup;
}

export interface TournamentData {
  players: Player[];
  doublesPairs: DoublesPair[];
  womenSinglePlayers: Player[];
  matches: Match[];
  schedules: WeekSchedule[];
  currentWeek: number;
  drawCompleted: boolean;
  scheduleGenerated: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const COMPANIES: Company[] = ['Jabil', 'OCS', 'ISS', 'Suksesindo', 'Intern'];
export const SHIFT_GROUPS: ShiftGroup[] = ['Non Shift', 'Grup A', 'Grup B', 'Grup C'];
export const SHIFT_TYPES: ShiftType[] = ['Pagi', 'Siang', 'Malam'];

export const TOURNAMENT_INFO = {
  name: 'Jabil Fest 5.0 Badminton Tournament',
  location: 'Progresif Arena',
  day: 'Kamis',
  startTime: '19:00',
  endTime: '22:00',
  startDate: '2026-07-02',
  slogan: 'One Team, One Spirit, One Jabil!',
  courts: 2,
  maxMatchesPerCourt: 4,
  maxMatchesPerWeek: 8,
};

export const WEEK_ROTATIONS: ShiftRotation[] = [
  { 'Malam': 'Grup B', 'Siang': 'Grup A', 'Pagi': 'Grup C' },
  { 'Malam': 'Grup C', 'Siang': 'Grup B', 'Pagi': 'Grup A' },
  { 'Malam': 'Grup A', 'Siang': 'Grup C', 'Pagi': 'Grup B' },
];

export function getWeekRotation(week: number): ShiftRotation {
  const weekIndex = ((week - 1) % 3);
  return WEEK_ROTATIONS[weekIndex];
}

export function getNightShiftGroup(week: number): ShiftGroup {
  const rotation = getWeekRotation(week);
  return rotation['Malam'];
}

export function getWeekStartDate(startWeek: number): string {
  const baseDate = new Date(TOURNAMENT_INFO.startDate);
  const weekOffset = startWeek - 1;
  baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
  return baseDate.toISOString().split('T')[0];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
