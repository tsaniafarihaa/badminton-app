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
  // SUDAH DIPERBAIKI: Menggunakan UUID standar yang diterima Supabase
  return crypto.randomUUID();
}

/**
 * Generate doubles bracket with proper BYE handling
 * - Seeded pairs get BYE (advance directly to Round of 16)
 * - Remaining pairs play preliminary
 * - Winners of preliminary + BYE pairs = 16 for Round of 16
 */
export function generateDoublesBracket(pairs: DoublesPair[]): Match[] {
  const matches: Match[] = [];
  let matchNumber = 1;

  if (pairs.length === 0) return matches;

  // Separate seeded and non-seeded
  const seededPairs = pairs.filter(p => p.seed);
  const nonSeededPairs = pairs.filter(p => !p.seed);

  // Calculate bracket structure
  const totalPairs = pairs.length;
  const targetRo16Count = 16;

  // Calculate how many pairs get BYE
  let pairsPlayingPrelim = 0;
  let byeCount = 0;

  if (totalPairs > targetRo16Count) {
    pairsPlayingPrelim = 2 * (totalPairs - targetRo16Count);
    byeCount = totalPairs - pairsPlayingPrelim;
  } else if (totalPairs < targetRo16Count) {
    byeCount = 0;
    pairsPlayingPrelim = 0;
  } else {
    byeCount = 0;
    pairsPlayingPrelim = 0;
  }

  // Assign BYE positions - seeded get priority
  const byePairs: DoublesPair[] = [];
  const prelimPairs: DoublesPair[] = [];

  const seededForBye = seededPairs.slice(0, byeCount);
  const remainingSeeded = seededPairs.slice(byeCount);

  byePairs.push(...seededForBye);

  const nonSeededForBye = nonSeededPairs.slice(0, Math.max(0, byeCount - seededForBye.length));
  byePairs.push(...nonSeededForBye);

  const remainingNonSeeded = nonSeededPairs.slice(nonSeededForBye.length);
  prelimPairs.push(...remainingSeeded, ...remainingNonSeeded);

  // Shuffle prelim pairs for randomness
  const shuffledPrelim = prelimPairs.sort(() => Math.random() - 0.5);

  // Create preliminary matches
  const prelimMatches: Match[] = [];
  for (let i = 0; i < shuffledPrelim.length; i += 2) {
    const team1 = shuffledPrelim[i];
    const team2 = shuffledPrelim[i + 1];
    if (team1 && team2) {
      prelimMatches.push({
        id: generateId(),
        matchNumber: matchNumber++,
        category: 'Ganda Putra',
        round: 'Preliminary',
        team1,
        team2,
        scores: [],
        status: 'pending',
      });
    }
  }

  matches.push(...prelimMatches);

  // --- SUDAH DIPERBAIKI: PRE-GENERATE UUIDs UNTUK BRACKET GANDA PUTRA ---
  const finalId = generateId();
  const sfIds = [generateId(), generateId()];
  const qfIds = [generateId(), generateId(), generateId(), generateId()];

  // Create Round of 16 bracket
  const ro16Teams: (DoublesPair | undefined)[] = new Array(16).fill(undefined);

  const byePositions = [
    0, 15,  // For top 2 seeds
    7, 8,   // For next 2 seeds
    3, 12,  // For next 2
    4, 11   // For next 2
  ];

  for (let i = 0; i < byePairs.length && i < byePositions.length; i++) {
    ro16Teams[byePositions[i]] = byePairs[i];
  }

  const prelimWinnerOrder = [1, 2, 5, 6, 9, 10, 13, 14, 3, 4, 11, 12].filter(pos => {
    return !byePairs.some((_, i) => byePositions[i] === pos);
  });

  const ro16Matches: Match[] = [];
  for (let i = 0; i < 8; i++) {
    const team1 = ro16Teams[i * 2];
    const team2 = ro16Teams[i * 2 + 1];

    const match: Match = {
      id: generateId(),
      matchNumber: matchNumber++,
      category: 'Ganda Putra',
      round: 'Round of 16',
      team1,
      team2,
      scores: [],
      status: 'pending',
      nextMatchId: qfIds[Math.floor(i / 2)],
      nextMatchSlot: (i % 2 === 0) ? 1 : 2,
    };

    ro16Matches.push(match);
  }

  matches.push(...ro16Matches);

  // Quarter Finals (4 matches)
  const qfMatches: Match[] = [];
  for (let i = 0; i < 4; i++) {
    const match: Match = {
      id: qfIds[i],
      matchNumber: matchNumber++,
      category: 'Ganda Putra',
      round: 'Quarter Final',
      scores: [],
      status: 'pending',
      nextMatchId: sfIds[Math.floor(i / 2)],
      nextMatchSlot: (i % 2 === 0) ? 1 : 2,
    };
    qfMatches.push(match);
  }

  matches.push(...qfMatches);

  // Semi Finals (2 matches)
  const sfMatches: Match[] = [];
  for (let i = 0; i < 2; i++) {
    const match: Match = {
      id: sfIds[i],
      matchNumber: matchNumber++,
      category: 'Ganda Putra',
      round: 'Semi Final',
      scores: [],
      status: 'pending',
      nextMatchId: finalId,
      nextMatchSlot: (i === 0) ? 1 : 2,
    };
    sfMatches.push(match);
  }

  matches.push(...sfMatches);

  // Final (1 match)
  matches.push({
    id: finalId,
    matchNumber: matchNumber,
    category: 'Ganda Putra',
    round: 'Final',
    scores: [],
    status: 'pending',
  });

  return matches;
}

/**
 * Generate singles bracket with dynamic sizing and BYE handling
 */
export function generateSinglesBracket(players: Player[]): Match[] {
  const matches: Match[] = [];
  let matchNumber = 1;

  if (players.length === 0) return matches;

  // Separate seeded and non-seeded
  const seededPlayers = players.filter(p => p.seed);
  const nonSeededPlayers = players.filter(p => !p.seed);

  // Determine bracket size based on participants
  const isSmallBracket = players.length <= 8;
  const targetBaseCount = isSmallBracket ? 8 : 16;

  let playersPlayingPrelim = 0;
  let byeCount = 0;

  if (players.length > targetBaseCount) {
    playersPlayingPrelim = 2 * (players.length - targetBaseCount);
    byeCount = players.length - playersPlayingPrelim;
  } else {
    byeCount = players.length; 
    playersPlayingPrelim = 0;
  }

  const byePlayers: Player[] = [];
  const prelimPlayers: Player[] = [];

  const seededForBye = seededPlayers.slice(0, byeCount);
  const remainingSeeded = seededPlayers.slice(byeCount);

  byePlayers.push(...seededForBye);

  const nonSeededForBye = nonSeededPlayers.slice(0, Math.max(0, byeCount - seededForBye.length));
  byePlayers.push(...nonSeededForBye);

  const remainingNonSeeded = nonSeededPlayers.slice(nonSeededForBye.length);
  prelimPlayers.push(...remainingSeeded, ...remainingNonSeeded);

  const shuffledPrelim = prelimPlayers.sort(() => Math.random() - 0.5);

  // 1. PRELIMINARY MATCHES (If players > 16)
  const prelimMatches: Match[] = [];
  for (let i = 0; i < shuffledPrelim.length; i += 2) {
    const team1 = shuffledPrelim[i];
    const team2 = shuffledPrelim[i + 1];
    if (team1 && team2) {
      prelimMatches.push({
        id: generateId(),
        matchNumber: matchNumber++,
        category: 'Single Putri',
        round: 'Preliminary',
        team1,
        team2,
        scores: [],
        status: 'pending',
      });
    }
  }
  matches.push(...prelimMatches);

  // --- SUDAH DIPERBAIKI: PRE-GENERATE UUIDs UNTUK BRACKET SINGLE PUTRI ---
  const finalIdS = generateId();
  const sfIdsS = [generateId(), generateId()];
  const qfIdsS = [generateId(), generateId(), generateId(), generateId()];

  // 2. MAIN BRACKET
  if (!isSmallBracket) {
    // --- LARGE BRACKET (Starts at Round of 16) ---
    const ro16Teams: (Player | undefined)[] = new Array(16).fill(undefined);
    
    const byePositions = [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10];
    for (let i = 0; i < byePlayers.length && i < byePositions.length; i++) {
      ro16Teams[byePositions[i]] = byePlayers[i];
    }

    // Round of 16 (8 Matches)
    for (let i = 0; i < 8; i++) {
      matches.push({
        id: generateId(),
        matchNumber: matchNumber++,
        category: 'Single Putri',
        round: 'Round of 16',
        team1: ro16Teams[i * 2],
        team2: ro16Teams[i * 2 + 1],
        scores: [],
        status: 'pending',
        nextMatchId: qfIdsS[Math.floor(i / 2)],
        nextMatchSlot: (i % 2 === 0) ? 1 : 2,
      });
    }
    
    // Empty Quarter Finals slots (4 Matches)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: qfIdsS[i],
        matchNumber: matchNumber++,
        category: 'Single Putri',
        round: 'Quarter Final',
        scores: [],
        status: 'pending',
        nextMatchId: sfIdsS[Math.floor(i / 2)],
        nextMatchSlot: (i % 2 === 0) ? 1 : 2,
      });
    }
  } else {
    // --- SMALL BRACKET (Starts at Quarter Final) ---
    const qfTeams: (Player | undefined)[] = new Array(8).fill(undefined);
    
    const byePositions = [0, 7, 3, 4, 1, 6, 2, 5];
    for (let i = 0; i < byePlayers.length && i < byePositions.length; i++) {
      qfTeams[byePositions[i]] = byePlayers[i];
    }

    // Quarter Final (4 Matches)
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: qfIdsS[i],
        matchNumber: matchNumber++,
        category: 'Single Putri',
        round: 'Quarter Final',
        team1: qfTeams[i * 2],
        team2: qfTeams[i * 2 + 1],
        scores: [],
        status: 'pending',
        nextMatchId: sfIdsS[Math.floor(i / 2)],
        nextMatchSlot: (i % 2 === 0) ? 1 : 2,
      });
    }
  }

  // 3. SEMI FINAL (2 Matches)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: sfIdsS[i],
      matchNumber: matchNumber++,
      category: 'Single Putri',
      round: 'Semi Final',
      scores: [],
      status: 'pending',
      nextMatchId: finalIdS,
      nextMatchSlot: (i === 0) ? 1 : 2,
    });
  }

  // 4. FINAL (1 Match)
  matches.push({
    id: finalIdS,
    matchNumber: matchNumber,
    category: 'Single Putri',
    round: 'Final',
    scores: [],
    status: 'pending',
  });

  return matches;
}

/**
 * Get shift groups from a team
 */
function getTeamShiftGroups(team: DoublesPair | Player | undefined): ShiftGroup[] {
  if (!team) return [];
  if ('player1' in team) {
    return [team.player1.shiftGroup, team.player2.shiftGroup];
  }
  return [team.shiftGroup];
}

/**
 * Get match priority based on night shift
 * Priority 1 = night shift match (should play first)
 * Priority 2 = non-night shift match
 */
export function getMatchPriority(match: Match, week: number): number {
  const nightShift = getNightShiftGroup(week);

  const team1Shifts = getTeamShiftGroups(match.team1);
  const team2Shifts = getTeamShiftGroups(match.team2);

  if (team1Shifts.includes(nightShift) || team2Shifts.includes(nightShift)) {
    return 1;
  }

  return 2;
}

/**
 * Schedule matches with night shift priority
 * Semi Final and Final are scheduled on the SAME day
 */
export function scheduleMatches(matches: Match[], startWeek: number): Match[] {
  const scheduled: Match[] = [];
  let currentWeek = startWeek;

  const roundOrder: TournamentRound[] = ['Preliminary', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'];

  // Get pending matches sorted by round
  const pendingMatches = matches.filter(m => m.status !== 'completed');
  pendingMatches.sort((a, b) => {
    return roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
  });

  // Group matches by round
  const matchesByRound: Record<TournamentRound, Match[]> = {
    'Preliminary': [],
    'Round of 16': [],
    'Quarter Final': [],
    'Semi Final': [],
    'Final': []
  };

  for (const match of pendingMatches) {
    matchesByRound[match.round].push(match);
  }

  // Schedule Preliminary, Round of 16, Quarter Final normally (max 6 matches per week)
  const earlyRounds: TournamentRound[] = ['Preliminary', 'Round of 16', 'Quarter Final'];

  for (const round of earlyRounds) {
    const roundMatches = matchesByRound[round];

    while (roundMatches.length > 0) {
      // Take up to max matches for this week
      const weekMatches = roundMatches.splice(0, TOURNAMENT_INFO.maxMatchesPerWeek);

      scheduleWeekMatches(weekMatches, currentWeek);
      scheduled.push(...weekMatches);

      // If there are more matches, move to next week
      if (roundMatches.length > 0) {
        currentWeek++;
      }
    }
  }

  // IMPORTANT: Semi Final and Final on the SAME day/week
  const semiFinals = matchesByRound['Semi Final'];
  const finals = matchesByRound['Final'];

  if (semiFinals.length > 0 || finals.length > 0) {
    currentWeek++; // Move to a new week for Semi Final + Final

    const championshipMatches = [...semiFinals, ...finals];
    scheduleChampionshipMatches(championshipMatches, currentWeek);
    scheduled.push(...championshipMatches);
  }

  // Add completed matches back
  scheduled.push(...matches.filter(m => m.status === 'completed'));

  return scheduled;
}

/**
 * Schedule matches for a specific week
 * Night shift matches get priority (earlier times)
 */
function scheduleWeekMatches(matches: Match[], week: number): void {
  matches.sort((a, b) => {
    const priorityA = getMatchPriority(a, week);
    const priorityB = getMatchPriority(b, week);
    return priorityA - priorityB;
  });

  const startDate = getWeekStartDate(week);
  const times = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  matches.forEach((match, index) => {
    const court = (index % 2) + 1;
    const timeIndex = Math.floor(index / 2);
    const time = times[timeIndex] || '21:00';

    match.scheduledDate = startDate;
    match.scheduledTime = time;
    match.court = court;
    match.week = week;
    match.status = 'scheduled';
  });
}

/**
 * Schedule Semi Final and Final on the same day
 * Semi Finals first, then Final
 */
function scheduleChampionshipMatches(matches: Match[], week: number): void {
  const startDate = getWeekStartDate(week);
  const roundOrder: TournamentRound[] = ['Semi Final', 'Final'];
  
  matches.sort((a, b) => {
    return roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
  });

  const times = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  matches.sort((a, b) => {
    const roundDiff = roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
    if (roundDiff !== 0) return roundDiff;

    const priorityA = getMatchPriority(a, week);
    const priorityB = getMatchPriority(b, week);
    return priorityA - priorityB;
  });

  let semiCount = 0;
  const semiMatches = matches.filter(m => m.round === 'Semi Final');
  const finalMatches = matches.filter(m => m.round === 'Final');

  semiMatches.forEach((match, index) => {
    const court = (index % 2) + 1;
    const timeIndex = Math.floor(index / 2);
    const time = times[timeIndex] || '20:00';

    match.scheduledDate = startDate;
    match.scheduledTime = time;
    match.court = court;
    match.week = week;
    match.status = 'scheduled';
    semiCount++;
  });

  finalMatches.forEach((match, index) => {
    const adjustedIndex = semiCount + index;
    const court = (adjustedIndex % 2) + 1;
    const timeIndex = Math.floor(adjustedIndex / 2);
    const time = times[timeIndex] || '21:00';

    match.scheduledDate = startDate;
    match.scheduledTime = time;
    match.court = court;
    match.week = week;
    match.status = 'scheduled';
  });
}