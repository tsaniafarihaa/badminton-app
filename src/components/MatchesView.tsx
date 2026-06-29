import React, { useState } from 'react';
import { Play, Pause, Trophy, Edit, X, Check, Loader2 } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Match, DoublesPair, Player, MatchScore } from '../types';

export function MatchesView() {
  const { data, updateMatchScore, simulateMatch, simulateAllMatches } = useTournament();
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);

  const pendingMatches = data.matches.filter(m => m.status !== 'completed');

  const handleSimulate = async (matchId: string) => {
    setSimulating(matchId);
    await simulateMatch(matchId);
    setSimulating(null);
  };

  const handleSimulateAll = async () => {
    if (window.confirm('Simulasikan semua pertandingan yang tersisa?')) {
      setSimulating('all');
      await simulateAllMatches();
      setSimulating(null);
    }
  };

  if (!data.drawCompleted) {
    return (
      <div className="p-6">
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Pertandingan</h3>
          <p className="text-gray-400">
            Silakan lakukan pengundian terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  // Group matches by status
  const completedMatches = data.matches.filter(m => m.status === 'completed');
  const scheduledMatches = data.matches.filter(m => m.status === 'scheduled' || m.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-navy-800 rounded-lg border border-navy-700">
            <span className="text-sm text-gray-400">Selesai: </span>
            <span className="text-lg font-bold text-emerald-400">{completedMatches.length}</span>
          </div>
          <div className="px-4 py-2 bg-navy-800 rounded-lg border border-navy-700">
            <span className="text-sm text-gray-400">Tersisa: </span>
            <span className="text-lg font-bold text-amber-400">{pendingMatches.length}</span>
          </div>
        </div>

        {pendingMatches.length > 0 && (
          <button
            onClick={handleSimulateAll}
            disabled={simulating !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {simulating === 'all' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Simulasi Semua
          </button>
        )}
      </div>

      {/* Pending Matches */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 overflow-hidden">
        <div className="p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-white">Pertandingan Tersisa</h3>
        </div>

        {scheduledMatches.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            Semua pertandingan telah selesai!
          </div>
        ) : (
          <div className="divide-y divide-navy-700">
            {scheduledMatches.map(match => (
              <MatchRow
                key={match.id}
                match={match}
                isEditing={editingMatch === match.id}
                isSimulating={simulating === match.id}
                onEdit={() => setEditingMatch(match.id)}
                onCancel={() => setEditingMatch(null)}
                onSave={(scores) => {
                  updateMatchScore(match.id, [scores]);
                  setEditingMatch(null);
                }}
                onSimulate={() => handleSimulate(match.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Matches */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 overflow-hidden">
        <div className="p-4 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-white">Pertandingan Selesai</h3>
        </div>

        {completedMatches.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            Belum ada pertandingan selesai
          </div>
        ) : (
          <div className="divide-y divide-navy-700">
            {completedMatches.map(match => (
              <CompletedMatchRow key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchRowProps {
  match: Match;
  isEditing: boolean;
  isSimulating: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (scores: MatchScore) => void;
  onSimulate: () => void;
}

function MatchRow({ match, isEditing, isSimulating, onEdit, onCancel, onSave, onSimulate }: MatchRowProps) {
  const [scores, setScores] = useState<MatchScore>({
    game1Team1: 0,
    game1Team2: 0,
    game2Team1: 0,
    game2Team2: 0,
    game3Team1: undefined,
    game3Team2: undefined,
  });

  const team1Name = match.team1 ? getTeamName(match.team1) : 'TBD';
  const team2Name = match.team2 ? getTeamName(match.team2) : 'TBD';

  const handleSubmit = () => {
    onSave(scores);
  };

  const validateScore = (team1: number, team2: number): boolean => {
    // At least one team must reach 21, or deuce situation
    if (team1 === 30 && team2 < 30) return true;
    if (team2 === 30 && team1 < 30) return true;
    if (team1 >= 21 && team2 <= 19) return true;
    if (team2 >= 21 && team1 <= 19) return true;
    // Deuce situation
    if (team1 >= 20 && team2 >= 20 && Math.abs(team1 - team2) >= 2) return true;
    return false;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-500">M{match.matchNumber}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            match.category === 'Ganda Putra'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gold-500/20 text-gold-400'
          }`}>
            {match.category}
          </span>
          <span className="text-xs text-gray-500">{match.round}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-sm text-white font-medium transition-colors"
              >
                <Edit className="w-3 h-3" />
                Input Skor
              </button>
              <button
                onClick={onSimulate}
                disabled={isSimulating || !match.team1 || !match.team2}
                className="flex items-center gap-1 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 rounded text-sm text-gray-300 font-medium transition-colors disabled:opacity-50"
              >
                {isSimulating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                Simulate
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="bg-navy-900/50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <p className="text-sm text-gray-400 mb-2 truncate">{team1Name}</p>
            </div>
            <div></div>
            <div>
              <p className="text-sm text-gray-400 mb-2 truncate">{team2Name}</p>
            </div>
          </div>

          {/* Game 1 */}
          <div className="grid grid-cols-3 gap-4 items-center mb-3">
            <input
              type="number"
              min="0"
              max="30"
              value={scores.game1Team1}
              onChange={(e) => setScores({ ...scores, game1Team1: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <div className="text-center">
              <span className="text-xs text-gray-500">Game 1</span>
            </div>
            <input
              type="number"
              min="0"
              max="30"
              value={scores.game1Team2}
              onChange={(e) => setScores({ ...scores, game1Team2: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Game 2 */}
          <div className="grid grid-cols-3 gap-4 items-center mb-3">
            <input
              type="number"
              min="0"
              max="30"
              value={scores.game2Team1}
              onChange={(e) => setScores({ ...scores, game2Team1: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <div className="text-center">
              <span className="text-xs text-gray-500">Game 2</span>
            </div>
            <input
              type="number"
              min="0"
              max="30"
              value={scores.game2Team2}
              onChange={(e) => setScores({ ...scores, game2Team2: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Game 3 (optional) */}
          <div className="grid grid-cols-3 gap-4 items-center mb-4">
            <input
              type="number"
              min="0"
              max="30"
              value={scores.game3Team1 || ''}
              onChange={(e) => setScores({ ...scores, game3Team1: parseInt(e.target.value) || undefined })}
              placeholder="-"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <div className="text-center">
              <span className="text-xs text-gray-500">Game 3 (opsional)</span>
            </div>
            <input
              type="number"
              min="0"
              max="30"
              value={scores.game3Team2 || ''}
              onChange={(e) => setScores({ ...scores, game3Team2: parseInt(e.target.value) || undefined })}
              placeholder="-"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-4 py-2 bg-navy-700 hover:bg-navy-600 rounded text-sm text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm text-white font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-white truncate">{team1Name}</p>
          </div>
          <div className="px-4 text-center">
            <span className="text-xs text-gray-500 font-medium">VS</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white truncate text-right">{team2Name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CompletedMatchRow({ match }: { match: Match }) {
  const team1Name = match.team1 ? getTeamName(match.team1) : 'TBD';
  const team2Name = match.team2 ? getTeamName(match.team2) : 'TBD';

  const team1Id = match.team1 && 'player1' in match.team1 ? match.team1.id : match.team1 && 'name' in match.team1 ? match.team1.id : '';
  const team2Id = match.team2 && 'player1' in match.team2 ? match.team2.id : match.team2 && 'name' in match.team2 ? match.team2.id : '';

  const team1Won = match.winner === team1Id;
  const team2Won = match.winner === team2Id;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-mono text-gray-500">M{match.matchNumber}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          match.category === 'Ganda Putra'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-gold-500/20 text-gold-400'
        }`}>
          {match.category}
        </span>
        <span className="text-xs text-gray-500">{match.round}</span>
      </div>

      <div className="flex items-center justify-between bg-navy-900/50 rounded-lg p-3">
        <div className="flex-1">
          <p className={`text-sm truncate ${
            team1Won ? 'text-emerald-400 font-semibold' : 'text-gray-400'
          }`}>
            {team1Won && <Trophy className="w-3 h-3 inline mr-1" />}
            {team1Name}
          </p>
        </div>

        <div className="px-4 flex items-center gap-3">
          {match.scores[0] && (
            <>
              <ScoreDisplay
                score={match.scores[0].game1Team1}
                opponentScore={match.scores[0].game1Team2}
                won={match.scores[0].game1Team1 > match.scores[0].game1Team2}
              />
              <span className="text-gray-600">-</span>
              <ScoreDisplay
                score={match.scores[0].game1Team2}
                opponentScore={match.scores[0].game1Team1}
                won={match.scores[0].game1Team2 > match.scores[0].game1Team1}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {match.scores[0] && (
            <>
              <ScoreDisplay
                score={match.scores[0].game2Team1}
                opponentScore={match.scores[0].game2Team2}
                won={match.scores[0].game2Team1 > match.scores[0].game2Team2}
              />
              <span className="text-gray-600">-</span>
              <ScoreDisplay
                score={match.scores[0].game2Team2}
                opponentScore={match.scores[0].game2Team1}
                won={match.scores[0].game2Team2 > match.scores[0].game2Team1}
              />
            </>
          )}
        </div>

        {match.scores[0]?.game3Team1 !== undefined && (
          <div className="px-4 flex items-center gap-3">
            <ScoreDisplay
              score={match.scores[0].game3Team1}
              opponentScore={match.scores[0].game3Team2!}
              won={match.scores[0].game3Team1! > match.scores[0].game3Team2!}
            />
            <span className="text-gray-600">-</span>
            <ScoreDisplay
              score={match.scores[0].game3Team2}
              opponentScore={match.scores[0].game3Team1!}
              won={match.scores[0].game3Team2! > match.scores[0].game3Team1!}
            />
          </div>
        )}

        <div className="flex-1">
          <p className={`text-sm truncate text-right ${
            team2Won ? 'text-emerald-400 font-semibold' : 'text-gray-400'
          }`}>
            {team2Name}
            {team2Won && <Trophy className="w-3 h-3 inline ml-1" />}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreDisplay({ score, opponentScore, won }: { score: number; opponentScore: number; won: boolean }) {
  return (
    <span className={`text-sm font-mono font-bold ${
      won ? 'text-emerald-400' : 'text-gray-500'
    }`}>
      {score}
    </span>
  );
}

function getTeamName(team: DoublesPair | Player): string {
  if ('player1' in team) {
    return `${team.player1.name} / ${team.player2.name}`;
  }
  return team.name;
}
