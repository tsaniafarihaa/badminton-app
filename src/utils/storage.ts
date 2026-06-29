import { TournamentData } from '../types';

const STORAGE_KEY = 'jabil_fest_5_tournament';

const defaultData: TournamentData = {
  players: [],
  doublesPairs: [],
  womenSinglePlayers: [],
  matches: [],
  schedules: [],
  currentWeek: 1,
  drawCompleted: false,
  scheduleGenerated: false,
};

export function loadTournamentData(): TournamentData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tournament data:', error);
  }
  return { ...defaultData };
}

export function saveTournamentData(data: TournamentData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save tournament data:', error);
  }
}

export function resetTournamentData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset tournament data:', error);
  }
}
