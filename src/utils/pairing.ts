import { Player, DoublesPair, ShiftGroup, generateId } from '../types';

const SHIFT_PRIORITY: ShiftGroup[] = ['Grup A', 'Grup B', 'Grup C', 'Non Shift'];

function canPair(shift1: ShiftGroup, shift2: ShiftGroup): boolean {
  if (shift1 === shift2) return true;

  if (shift1 === 'Non Shift' || shift2 === 'Non Shift') return true;

  return false;
}

function getPairingPriority(shift1: ShiftGroup, shift2: ShiftGroup): number {
  // Same shift - highest priority
  if (shift1 === shift2) return 1;

  // Non Shift with any group - medium priority
  if (shift1 === 'Non Shift' || shift2 === 'Non Shift') return 2;

  // Different letter groups (A+B, B+C, A+C) - lowest priority, try to avoid
  return 3;
}

export function createDoublesPairs(players: Player[]): {
  pairs: DoublesPair[];
  unpaired: Player[];
} {
  const eligiblePlayers = [...players.filter(p => p.category === 'Ganda Putra')];
  const pairs: DoublesPair[] = [];
  const unpaired: Player[] = [];

  // Separate seeded and non-seeded players
  const seededPlayers = eligiblePlayers.filter(p => p.seed);
  const nonSeededPlayers = eligiblePlayers.filter(p => !p.seed);

  const paired = new Set<string>();

  // CRITICAL RULE: Seeded players CANNOT be paired with other seeded players
  // Seeded players must be paired with non-seed players only

  // First: Pair seeded players with non-seeded players
  // Sort both groups by shift group for optimal matching
  seededPlayers.sort((a, b) => {
    const aIndex = SHIFT_PRIORITY.indexOf(a.shiftGroup);
    const bIndex = SHIFT_PRIORITY.indexOf(b.shiftGroup);
    return aIndex - bIndex;
  });

  nonSeededPlayers.sort((a, b) => {
    const aIndex = SHIFT_PRIORITY.indexOf(a.shiftGroup);
    const bIndex = SHIFT_PRIORITY.indexOf(b.shiftGroup);
    return aIndex - bIndex;
  });

  // Pair seeded with non-seeded (prefer same shift or Non Shift)
  for (const seeded of seededPlayers) {
    if (paired.has(seeded.id)) continue;

    // Find best non-seeded partner
    // Priority: same shift > Non Shift > other shifts
    let bestPartner: Player | null = null;
    let bestPriority = 999;

    for (const nonSeeded of nonSeededPlayers) {
      if (paired.has(nonSeeded.id)) continue;

      const priority = getPairingPriority(seeded.shiftGroup, nonSeeded.shiftGroup);
      if (priority < bestPriority) {
        bestPriority = priority;
        bestPartner = nonSeeded;
      }
    }

    if (bestPartner) {
      pairs.push({
        id: generateId(),
        player1: seeded,
        player2: bestPartner,
        seed: true, // Pair is seeded because it has a seeded player
      });
      paired.add(seeded.id);
      paired.add(bestPartner.id);
    }
  }

  // Second: Pair remaining non-seeded players with each other
  const remainingNonSeeded = nonSeededPlayers.filter(p => !paired.has(p.id));

  // Sort by shift group
  remainingNonSeeded.sort((a, b) => {
    const aIndex = SHIFT_PRIORITY.indexOf(a.shiftGroup);
    const bIndex = SHIFT_PRIORITY.indexOf(b.shiftGroup);
    return aIndex - bIndex;
  });

  // Pair same shifts first
  for (const shift of SHIFT_PRIORITY) {
    const shiftPlayers = remainingNonSeeded.filter(
      p => p.shiftGroup === shift && !paired.has(p.id)
    );

    for (let i = 0; i < shiftPlayers.length - 1; i += 2) {
      if (!paired.has(shiftPlayers[i].id) && !paired.has(shiftPlayers[i + 1].id)) {
        pairs.push({
          id: generateId(),
          player1: shiftPlayers[i],
          player2: shiftPlayers[i + 1],
          seed: false,
        });
        paired.add(shiftPlayers[i].id);
        paired.add(shiftPlayers[i + 1].id);
      }
    }
  }

  // Third: Pair Non Shift with letter groups
  const stillRemainingNonSeeded = nonSeededPlayers.filter(p => !paired.has(p.id));
  const nonShift = stillRemainingNonSeeded.filter(p => p.shiftGroup === 'Non Shift');
  const letterGroups = SHIFT_PRIORITY.slice(0, 3);

  for (const shift of letterGroups) {
    const shiftPlayers = stillRemainingNonSeeded.filter(
      p => p.shiftGroup === shift && !paired.has(p.id)
    );

    const pairsToMake = Math.min(
      nonShift.filter(p => !paired.has(p.id)).length,
      shiftPlayers.length
    );

    const availableNonShift = nonShift.filter(p => !paired.has(p.id));
    for (let i = 0; i < pairsToMake; i++) {
      if (!paired.has(availableNonShift[i].id) && !paired.has(shiftPlayers[i].id)) {
        pairs.push({
          id: generateId(),
          player1: availableNonShift[i],
          player2: shiftPlayers[i],
          seed: false,
        });
        paired.add(availableNonShift[i].id);
        paired.add(shiftPlayers[i].id);
      }
    }
  }

  // Fourth: Pair any remaining non-seeded players together (mixed shifts)
  const finalRemainingNonSeeded = nonSeededPlayers.filter(p => !paired.has(p.id));

  for (let i = 0; i < finalRemainingNonSeeded.length - 1; i += 2) {
    if (!paired.has(finalRemainingNonSeeded[i].id) &&
        !paired.has(finalRemainingNonSeeded[i + 1].id)) {
      pairs.push({
        id: generateId(),
        player1: finalRemainingNonSeeded[i],
        player2: finalRemainingNonSeeded[i + 1],
        seed: false,
      });
      paired.add(finalRemainingNonSeeded[i].id);
      paired.add(finalRemainingNonSeeded[i + 1].id);
    }
  }

  // Collect unpaired players
  for (const player of eligiblePlayers) {
    if (!paired.has(player.id)) {
      unpaired.push(player);
    }
  }

  return { pairs, unpaired };
}
