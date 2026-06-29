import { Match, DoublesPair, Player, TournamentRound, ShiftGroup, generateId, getNightShiftGroup, getWeekStartDate, TOURNAMENT_INFO } from '../types';

interface MatchWithPriority {
  match: Match;
  priority: number;
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
  // If we have 26 pairs: need to reduce to 16
  // Preliminary: 20 pairs play (10 matches) -> 10 winners
  // BYE: 6 pairs advance directly
  // 10 + 6 = 16 for Ro16

  // Formula: pairs playing preliminary = 2 * (totalPairs - 16)
  // BYE = totalPairs - pairs playing preliminary
  let pairsPlayingPrelim = 0;
  let byeCount = 0;

  if (totalPairs > targetRo16Count) {
    // Need preliminary rounds
    pairsPlayingPrelim = 2 * (totalPairs - targetRo16Count);
    byeCount = totalPairs - pairsPlayingPrelim;
  } else if (totalPairs < targetRo16Count) {
    // Fewer than 16, some Ro16 matches will have BYE
    byeCount = 0;
    pairsPlayingPrelim = 0;
  } else {
    // Exactly 16 pairs
    byeCount = 0;
    pairsPlayingPrelim = 0;
  }

  // Assign BYE positions - seeded get priority
  const byePairs: DoublesPair[] = [];
  const prelimPairs: DoublesPair[] = [];

  // All seeded pairs get BYE first (up to byeCount)
  const seededForBye = seededPairs.slice(0, byeCount);
  const remainingSeeded = seededPairs.slice(byeCount);

  byePairs.push(...seededForBye);

  // Fill remaining BYE slots with non-seeded if needed
  const nonSeededForBye = nonSeededPairs.slice(0, Math.max(0, byeCount - seededForBye.length));
  byePairs.push(...nonSeededForBye);

  // Remaining pairs play preliminary
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

  // Create Round of 16 bracket
  // Position seeded/BYE pairs strategically in bracket
  // Seeded pairs should be spread apart

  const ro16Teams: (DoublesPair | undefined)[] = new Array(16).fill(undefined);

  // Position BYE pairs - spread them across bracket
  // Position 0-1: top bracket, Position 14-15: bottom bracket (final would be opposite)
  // Seed 1 at position 0 or 1, Seed 2 at position 15 or 14
  const byePositions = [
    0, 15,  // For top 2 seeds (opposite sides of bracket)
    7, 8,   // For next 2 seeds
    3, 12,  // For next 2
    4, 11   // For next 2
  ];

  // Place BYE pairs in their positions
  for (let i = 0; i < byePairs.length && i < byePositions.length; i++) {
    ro16Teams[byePositions[i]] = byePairs[i];
  }

  // Place preliminary winners in remaining positions (as TBD)
  // These will be filled after preliminary matches complete
  // For now, we just need the structure
  const prelimWinnerOrder = [1, 2, 5, 6, 9, 10, 13, 14, 3, 4, 11, 12].filter(pos => {
    // Exclude positions already taken by BYE
    return !byePairs.some((_, i) => byePositions[i] === pos);
  });

  // Round of 16 matches (8 matches)
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
    };

    // Store link to next match (QF)
    match.nextMatchId = `qf-${Math.floor(i / 2)}`;
    match.nextMatchSlot = (i % 2 === 0) ? 1 : 2;

    ro16Matches.push(match);
  }

  matches.push(...ro16Matches);

  // Quarter Finals (4 matches)
  const qfMatches: Match[] = [];
  for (let i = 0; i < 4; i++) {
    const match: Match = {
      id: `qf-${i}`,
      matchNumber: matchNumber++,
      category: 'Ganda Putra',
      round: 'Quarter Final',
      scores: [],
      status: 'pending',
      nextMatchId: `sf-${Math.floor(i / 2)}`,
      nextMatchSlot: (i % 2 === 0) ? 1 : 2,
    };
    qfMatches.push(match);
  }

  matches.push(...qfMatches);

  // Semi Finals (2 matches)
  const sfMatches: Match[] = [];
  for (let i = 0; i < 2; i++) {
    const match: Match = {
      id: `sf-${i}`,
      matchNumber: matchNumber++,
      category: 'Ganda Putra',
      round: 'Semi Final',
      scores: [],
      status: 'pending',
      nextMatchId: 'final',
      nextMatchSlot: (i === 0) ? 1 : 2,
    };
    sfMatches.push(match);
  }

  matches.push(...sfMatches);

  // Final (1 match)
  matches.push({
    id: 'final',
    matchNumber: matchNumber,
    category: 'Ganda Putra',
    round: 'Final',
    scores: [],
    status: 'pending',
  });

  return matches;
}

/**
 * Generate singles bracket
 */
export function generateSinglesBracket(players: Player[]): Match[] {
  const matches: Match[] = [];
  let matchNumber = 1;

  if (players.length === 0) return matches;

  // Separate seeded and non-seeded
  const seededPlayers = players.filter(p => p.seed);
  const nonSeededPlayers = players.filter(p => !p.seed);

  // For 8 player bracket
  const qfTeams: (Player | undefined)[] = new Array(8).fill(undefined);

  // Position seeded players
  // Seed 1 at position 0 (top), Seed 2 at position 7 (bottom)
  if (seededPlayers.length >= 1) qfTeams[0] = seededPlayers[0];
  if (seededPlayers.length >= 2) qfTeams[7] = seededPlayers[1];
  if (seededPlayers.length >= 3) qfTeams[3] = seededPlayers[2];
  if (seededPlayers.length >= 4) qfTeams[4] = seededPlayers[3];

  // Fill remaining with non-seeded
  let nonSeededIdx = 0;
  for (let i = 0; i < 8; i++) {
    if (qfTeams[i] === undefined && nonSeededIdx < nonSeededPlayers.length) {
      qfTeams[i] = nonSeededPlayers[nonSeededIdx++];
    }
  }

  // Quarter Finals (4 matches)
  for (let i = 0; i < 4; i++) {
    const team1 = qfTeams[i * 2];
    const team2 = qfTeams[i * 2 + 1];

    matches.push({
      id: generateId(),
      matchNumber: matchNumber++,
      category: 'Single Putri',
      round: 'Quarter Final',
      team1,
      team2,
      scores: [],
      status: 'pending',
      nextMatchId: `sf-s-${Math.floor(i / 2)}`,
      nextMatchSlot: (i % 2 === 0) ? 1 : 2,
    });
  }

  // Semi Finals (2 matches)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `sf-s-${i}`,
      matchNumber: matchNumber++,
      category: 'Single Putri',
      round: 'Semi Final',
      scores: [],
      status: 'pending',
      nextMatchId: 'final-s',
      nextMatchSlot: (i === 0) ? 1 : 2,
    });
  }

  // Final (1 match)
  matches.push({
    id: 'final-s',
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
      // Take up to 6 matches for this week
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
  // Schedule both Semi Finals and Final together
  const semiFinals = matchesByRound['Semi Final'];
  const finals = matchesByRound['Final'];

  if (semiFinals.length > 0 || finals.length > 0) {
    currentWeek++; // Move to a new week for Semi Final + Final

    // Combine Semi Final and Final matches
    const championshipMatches = [...semiFinals, ...finals];

    // Schedule them on the same week
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
  // Sort: night shift priority first
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

  // Sort: Semi Finals first (they need to complete before Final)
  const roundOrder: TournamentRound[] = ['Semi Final', 'Final'];
  matches.sort((a, b) => {
    return roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
  });

  // Schedule Semi Finals at earlier times, Final at later time
  // Both categories (Ganda Putra and Single Putri) Semi Finals + Finals on same day
  const times = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  // Night shift priority for earlier matches
  matches.sort((a, b) => {
    // Keep Semi Finals before Finals
    const roundDiff = roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
    if (roundDiff !== 0) return roundDiff;

    // Within same round, night shift first
    const priorityA = getMatchPriority(a, week);
    const priorityB = getMatchPriority(b, week);
    return priorityA - priorityB;
  });

  let semiCount = 0;
  const semiMatches = matches.filter(m => m.round === 'Semi Final');
  const finalMatches = matches.filter(m => m.round === 'Final');

  // Schedule Semi Finals first (earlier time slots)
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

  // Schedule Finals after Semi Finals (later time slots)
  finalMatches.forEach((match, index) => {
    // Finals start after Semi Finals
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
