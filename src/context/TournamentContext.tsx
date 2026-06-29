import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  TournamentData,
  Player,
  DoublesPair,
  Match,
  MatchScore,
  Toast,
  generateId,
} from '../types';
import { loadTournamentData, saveTournamentData, resetTournamentData } from '../utils/storage';
import {
  loadTournamentDataFromDB,
  savePlayerToDB,
  updatePlayerInDB,
  deletePlayerFromDB,
  importPlayersToDB,
  saveDoublesPairsToDB,
  saveMatchesToDB,
  updateTournamentState,
  clearTournamentData,
} from '../utils/supabaseStorage';
import { createDoublesPairs } from '../utils/pairing';
import { generateDoublesBracket, generateSinglesBracket, scheduleMatches } from '../utils/bracket';

interface TournamentContextType {
  data: TournamentData;
  toasts: Toast[];
  isLoading: boolean;
  useDatabase: boolean;
  toggleDatabaseMode: (useDb: boolean) => void;
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  updatePlayer: (player: Player) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  importPlayers: (players: Omit<Player, 'id'>[]) => Promise<void>;
  startDraw: () => Promise<void>;
  generateSchedule: () => Promise<void>;
  updateMatchScore: (matchId: string, scores: MatchScore[]) => Promise<void>;
  simulateMatch: (matchId: string) => Promise<void>;
  simulateAllMatches: () => Promise<void>;
  resetTournament: () => Promise<void>;
  showToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TournamentData>({
    players: [],
    doublesPairs: [],
    womenSinglePlayers: [],
    matches: [],
    schedules: [],
    currentWeek: 1,
    drawCompleted: false,
    scheduleGenerated: false,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (useDatabase) {
        const dbData = await loadTournamentDataFromDB();
        setData(dbData);
      } else {
        const localData = loadTournamentData();
        setData(localData);
      }
      setIsLoading(false);
    }
    loadData();
  }, [useDatabase]);

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const toast: Toast = { id: generateId(), message, type };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleDatabaseMode = useCallback((useDb: boolean) => {
    setUseDatabase(useDb);
    showToast(
      useDb ? 'Mode Database aktif - Data tersimpan permanen' : 'Mode Simulasi aktif - Data tersimpan lokal',
      'info'
    );
  }, [showToast]);

  const addPlayer = useCallback(async (playerData: Omit<Player, 'id'>) => {
    const player: Player = { ...playerData, id: generateId() };

    if (useDatabase) {
      const saved = await savePlayerToDB(player);
      if (saved) {
        setData(prev => ({ ...prev, players: [...prev.players, saved] }));
        showToast('Peserta berhasil ditambahkan', 'success');
      } else {
        showToast('Gagal menambahkan peserta', 'error');
      }
    } else {
      setData(prev => {
        const newData = { ...prev, players: [...prev.players, player] };
        saveTournamentData(newData);
        return newData;
      });
      showToast('Peserta berhasil ditambahkan', 'success');
    }
  }, [useDatabase, showToast]);

  const updatePlayer = useCallback(async (player: Player) => {
    if (useDatabase) {
      const success = await updatePlayerInDB(player);
      if (success) {
        setData(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === player.id ? player : p),
        }));
        showToast('Peserta berhasil diperbarui', 'success');
      } else {
        showToast('Gagal memperbarui peserta', 'error');
      }
    } else {
      setData(prev => {
        const newData = { ...prev, players: prev.players.map(p => p.id === player.id ? player : p) };
        saveTournamentData(newData);
        return newData;
      });
      showToast('Peserta berhasil diperbarui', 'success');
    }
  }, [useDatabase, showToast]);

  const deletePlayer = useCallback(async (id: string) => {
    if (useDatabase) {
      const success = await deletePlayerFromDB(id);
      if (success) {
        setData(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
        showToast('Peserta berhasil dihapus', 'success');
      } else {
        showToast('Gagal menghapus peserta', 'error');
      }
    } else {
      setData(prev => {
        const newData = { ...prev, players: prev.players.filter(p => p.id !== id) };
        saveTournamentData(newData);
        return newData;
      });
      showToast('Peserta berhasil dihapus', 'success');
    }
  }, [useDatabase, showToast]);

  const importPlayers = useCallback(async (players: Omit<Player, 'id'>[]) => {
    if (useDatabase) {
      const saved = await importPlayersToDB(players);
      if (saved.length > 0) {
        setData(prev => ({ ...prev, players: [...prev.players, ...saved] }));
        showToast(`${saved.length} peserta berhasil diimpor`, 'success');
      } else {
        showToast('Gagal mengimpor peserta', 'error');
      }
    } else {
      const newPlayers = players.map(p => ({ ...p, id: generateId() }));
      setData(prev => {
        const newData = { ...prev, players: [...prev.players, ...newPlayers] };
        saveTournamentData(newData);
        return newData;
      });
      showToast(`${newPlayers.length} peserta berhasil diimpor`, 'success');
    }
  }, [useDatabase, showToast]);

  const startDraw = useCallback(async () => {
    setData(prev => {
      const gandaPutra = prev.players.filter(p => p.category === 'Ganda Putra');
      const singlePutri = prev.players.filter(p => p.category === 'Single Putri');

      const { pairs } = createDoublesPairs(gandaPutra);
      const doublesMatches = generateDoublesBracket(pairs);
      const singlesMatches = generateSinglesBracket(singlePutri);

      const allMatches = [...doublesMatches, ...singlesMatches];

      const newData = {
        ...prev,
        doublesPairs: pairs,
        womenSinglePlayers: singlePutri,
        matches: allMatches,
        drawCompleted: true,
      };

      // Save to database or local storage
      if (useDatabase) {
        saveDoublesPairsToDB(pairs);
        saveMatchesToDB(allMatches);
        updateTournamentState({ drawCompleted: true });
      } else {
        saveTournamentData(newData);
      }

      return newData;
    });
    showToast('Undian berhasil dibuat', 'success');
  }, [useDatabase, showToast]);

  const generateSchedule = useCallback(async () => {
    setData(prev => {
      const scheduledMatches = scheduleMatches(prev.matches, prev.currentWeek);
      const newData = {
        ...prev,
        matches: scheduledMatches,
        scheduleGenerated: true,
      };

      if (useDatabase) {
        saveMatchesToDB(scheduledMatches);
        updateTournamentState({ scheduleGenerated: true });
      } else {
        saveTournamentData(newData);
      }

      return newData;
    });
    showToast('Jadwal berhasil dibuat', 'success');
  }, [useDatabase, showToast]);

  const simulateMatch = useCallback(async (matchId: string) => {
    setData(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match || match.status === 'completed') return prev;

      const scores: MatchScore = generateRealisticScores();

      const updatedMatches = prev.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            scores: [scores],
            status: 'completed' as const,
            winner: determineWinner(m, scores),
          };
        }
        return m;
      });

      propagateWinner(updatedMatches, matchId);

      const newData = { ...prev, matches: updatedMatches };

      if (useDatabase) {
        saveMatchesToDB(updatedMatches);
      } else {
        saveTournamentData(newData);
      }

      return newData;
    });
    showToast('Pertandingan berhasil disimulasikan', 'success');
  }, [useDatabase, showToast]);

  const simulateAllMatches = useCallback(async () => {
    setData(prev => {
      const updatedMatches = [...prev.matches];

      // Simulate all pending/scheduled matches round by round
      const roundOrder = ['Preliminary', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'];

      for (const round of roundOrder) {
        const roundMatches = updatedMatches.filter(m => m.round === round);

        for (const match of roundMatches) {
          if (match.status === 'completed') continue;

          // Only simulate if both teams are determined
          if (!match.team1 || !match.team2) continue;

          const scores: MatchScore = generateRealisticScores();
          match.scores = [scores];
          match.status = 'completed';
          match.winner = determineWinner(match, scores);

          // Propagate to next round
          propagateWinner(updatedMatches, match.id);
        }
      }

      const newData = { ...prev, matches: updatedMatches };

      if (useDatabase) {
        saveMatchesToDB(updatedMatches);
      } else {
        saveTournamentData(newData);
      }

      return newData;
    });
    showToast('Semua pertandingan berhasil disimulasikan', 'success');
  }, [useDatabase, showToast]);

  const updateMatchScore = useCallback(async (matchId: string, scores: MatchScore[]) => {
    setData(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;

      const updatedMatches = prev.matches.map(m => {
        if (m.id === matchId) {
          const isComplete = determineMatchComplete(scores[0]);
          return {
            ...m,
            scores,
            status: (isComplete ? 'completed' : m.status) as 'pending' | 'scheduled' | 'completed',
            winner: isComplete ? determineWinner(m, scores[0]) : undefined,
          };
        }
        return m;
      });

      if (determineMatchComplete(scores[0])) {
        propagateWinner(updatedMatches, matchId);
      }

      const newData = { ...prev, matches: updatedMatches };

      if (useDatabase) {
        saveMatchesToDB(updatedMatches);
      } else {
        saveTournamentData(newData);
      }

      return newData;
    });
    showToast('Hasil pertandingan berhasil disimpan', 'success');
  }, [useDatabase, showToast]);

  const resetTournament = useCallback(async () => {
    if (useDatabase) {
      const success = await clearTournamentData();
      if (success) {
        const freshData: TournamentData = {
          players: [],
          doublesPairs: [],
          womenSinglePlayers: [],
          matches: [],
          schedules: [],
          currentWeek: 1,
          drawCompleted: false,
          scheduleGenerated: false,
        };
        setData(freshData);
        showToast('Turnamen berhasil direset', 'success');
      } else {
        showToast('Gagal mereset turnamen', 'error');
      }
    } else {
      resetTournamentData();
      const freshData: TournamentData = {
        players: [],
        doublesPairs: [],
        womenSinglePlayers: [],
        matches: [],
        schedules: [],
        currentWeek: 1,
        drawCompleted: false,
        scheduleGenerated: false,
      };
      setData(freshData);
      showToast('Turnamen berhasil direset', 'success');
    }
  }, [useDatabase, showToast]);

  const value: TournamentContextType = {
    data,
    toasts,
    isLoading,
    useDatabase,
    toggleDatabaseMode,
    addPlayer,
    updatePlayer,
    deletePlayer,
    importPlayers,
    startDraw,
    generateSchedule,
    updateMatchScore,
    simulateMatch,
    simulateAllMatches,
    resetTournament,
    showToast,
    removeToast,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}

// Helper functions
function generateRealisticScores(): MatchScore {
  const winner = Math.random() > 0.5 ? 1 : 2;

  const g1Winner = Math.floor(Math.random() * 5) + 21;
  const g1Loser = Math.floor(Math.random() * 10) + 10;

  const g2Winner = Math.floor(Math.random() * 5) + 21;
  const g2Loser = Math.floor(Math.random() * 10) + 10;

  // Check if 3rd game needed (split first two games)
  if ((winner === 1 && g1Loser > g1Winner) || (winner === 2 && g1Winner > g1Loser)) {
    const g3Winner = Math.floor(Math.random() * 5) + 21;
    const g3Loser = Math.floor(Math.random() * 10) + 13;

    return {
      game1Team1: winner === 1 ? g1Winner : g1Loser,
      game1Team2: winner === 1 ? g1Loser : g1Winner,
      game2Team1: winner === 1 ? g2Loser : g2Winner,
      game2Team2: winner === 1 ? g2Winner : g2Loser,
      game3Team1: winner === 1 ? g3Winner : g3Loser,
      game3Team2: winner === 1 ? g3Loser : g3Winner,
    };
  }

  return {
    game1Team1: winner === 1 ? g1Winner : g1Loser,
    game1Team2: winner === 1 ? g1Loser : g1Winner,
    game2Team1: winner === 1 ? g2Winner : g2Loser,
    game2Team2: winner === 1 ? g2Loser : g2Winner,
  };
}

function determineMatchComplete(score: MatchScore): boolean {
  let wins1 = 0;
  let wins2 = 0;

  if (score.game1Team1 > score.game1Team2) wins1++;
  else wins2++;

  if (score.game2Team1 > score.game2Team2) wins1++;
  else wins2++;

  if (wins1 >= 2 || wins2 >= 2) return true;

  if (score.game3Team1 !== undefined && score.game3Team2 !== undefined) {
    return true;
  }

  return false;
}

function determineWinner(match: Match, score: MatchScore): string {
  let wins1 = 0;
  let wins2 = 0;

  if (score.game1Team1 > score.game1Team2) wins1++;
  else wins2++;

  if (score.game2Team1 > score.game2Team2) wins1++;
  else wins2++;

  if (wins1 >= 2) return match.team1 ? (match.team1 as DoublesPair).id || (match.team1 as Player).id : '';
  if (wins2 >= 2) return match.team2 ? (match.team2 as DoublesPair).id || (match.team2 as Player).id : '';

  if (score.game3Team1 !== undefined && score.game3Team2 !== undefined) {
    if (score.game3Team1 > score.game3Team2) wins1++;
    else wins2++;

    if (wins1 >= 2) return match.team1 ? (match.team1 as DoublesPair).id || (match.team1 as Player).id : '';
    return match.team2 ? (match.team2 as DoublesPair).id || (match.team2 as Player).id : '';
  }

  return '';
}

function propagateWinner(matches: Match[], completedMatchId: string): void {
  const match = matches.find(m => m.id === completedMatchId);
  if (!match || !match.winner) return;

  const roundOrder = ['Preliminary', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'];
  const currentRoundIndex = roundOrder.indexOf(match.round);
  const nextRound = roundOrder[currentRoundIndex + 1];

  if (!nextRound) return;

  const nextMatchId = match.nextMatchId;
  if (!nextMatchId) {
    // Fallback: find next match manually
    const nextRoundMatches = matches.filter(m => m.round === nextRound);
    for (const nextMatch of nextRoundMatches) {
      if (!nextMatch.team1) {
        const winnerPair = match.team1 && (match.team1 as DoublesPair).id === match.winner ? match.team1 : match.team2;
        nextMatch.team1 = winnerPair;
        break;
      }
      if (!nextMatch.team2) {
        const winnerPair = match.team1 && (match.team1 as DoublesPair).id === match.winner ? match.team1 : match.team2;
        nextMatch.team2 = winnerPair;
        break;
      }
    }
    return;
  }

  const nextMatch = matches.find(m => m.id === nextMatchId);
  if (nextMatch) {
    const winnerPair = match.team1 && (match.team1 as DoublesPair).id === match.winner ? match.team1 : match.team2;

    if (match.nextMatchSlot === 1 && !nextMatch.team1) {
      nextMatch.team1 = winnerPair;
    } else if (match.nextMatchSlot === 2 && !nextMatch.team2) {
      nextMatch.team2 = winnerPair;
    } else {
      if (!nextMatch.team1) {
        nextMatch.team1 = winnerPair;
      } else if (!nextMatch.team2) {
        nextMatch.team2 = winnerPair;
      }
    }
  }
}
