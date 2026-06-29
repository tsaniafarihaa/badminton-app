import React from 'react';
import { Trophy, Users, Printer } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Match, DoublesPair, Player } from '../types';

export function BracketView() {
  const { data } = useTournament();

  const gandaPutraMatches = data.matches.filter(m => m.category === 'Ganda Putra');
  const singlePutriMatches = data.matches.filter(m => m.category === 'Single Putri');

  const handlePrint = () => {
    window.print();
  };

  if (!data.drawCompleted) {
    return (
      <div className="p-6">
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Bracket</h3>
          <p className="text-gray-400">
            Silakan lakukan pengundian terlebih dahulu untuk membuat bracket.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Ganda Putra Bracket */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Bracket Ganda Putra</h3>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">
              {data.doublesPairs.length} Pasangan
            </span>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 rounded text-sm text-gray-300 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        <BracketGrid matches={gandaPutraMatches} category="Ganda Putra" />
      </div>

      {/* Single Putri Bracket */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-gold-400" />
          <h3 className="text-lg font-semibold text-white">Bracket Single Putri</h3>
          <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs">
            {data.womenSinglePlayers.length} Peserta
          </span>
        </div>

        <BracketGrid matches={singlePutriMatches} category="Single Putri" />
      </div>
    </div>
  );
}

interface BracketGridProps {
  matches: Match[];
  category: string;
}

function BracketGrid({ matches, category }: BracketGridProps) {
  const rounds = ['Preliminary', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'];
  const roundColors: Record<string, string> = {
    'Preliminary': 'border-gray-600',
    'Round of 16': 'border-gray-500',
    'Quarter Final': 'border-blue-500',
    'Semi Final': 'border-amber-500',
    'Final': 'border-gold-500',
  };

  // Filter to existing rounds only
  const existingRounds = rounds.filter(round =>
    matches.some(m => m.round === round)
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {existingRounds.map((round, roundIndex) => {
          const roundMatches = matches.filter(m => m.round === round);
          return (
            <div key={round} className="flex flex-col flex-1 min-w-[240px]">
              <div className={`text-center mb-4 pb-2 border-b ${roundColors[round]}`}>
                <h4 className="text-sm font-semibold text-white">{round}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {roundMatches.filter(m => m.status === 'completed').length}/{roundMatches.length} Selesai
                </p>
              </div>

              <div className="flex flex-col gap-4 justify-around flex-1">
                {roundMatches.map((match, matchIndex) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    roundIndex={roundIndex}
                    matchIndex={matchIndex}
                    isFinal={round === 'Final'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  roundIndex: number;
  matchIndex: number;
  isFinal: boolean;
}

function MatchCard({ match, roundIndex, matchIndex, isFinal }: MatchCardProps) {
  const team1 = match.team1;
  const team2 = match.team2;
  const isTeam1Winner = match.winner && (team1 as DoublesPair)?.id === match.winner;
  const isTeam2Winner = match.winner && (team2 as DoublesPair)?.id === match.winner;

  return (
    <div
      className={`relative p-3 bg-navy-900/70 rounded-lg border ${
        isFinal ? 'border-gold-500/50 bg-gold-500/5' : 'border-navy-700'
      }`}
    >
      {match.matchNumber && (
        <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-navy-800 text-gray-400 text-xs rounded">
          M{match.matchNumber}
        </span>
      )}

      <div className="space-y-2">
        <TeamSlot team={team1} isWinner={isTeam1Winner} hasScore={match.status === 'completed'} />
        <div className="flex items-center justify-center">
          <span className="text-xs text-gray-500 font-medium">VS</span>
        </div>
        <TeamSlot team={team2} isWinner={isTeam2Winner} hasScore={match.status === 'completed'} />
      </div>

      {match.status === 'completed' && (
        <div className="mt-2 pt-2 border-t border-navy-700">
          <MatchScores scores={match.scores} />
        </div>
      )}
    </div>
  );
}

function TeamSlot({ team, isWinner, hasScore }: { team?: DoublesPair | Player; isWinner?: boolean; hasScore: boolean }) {
  if (!team) {
    return (
      <div className="p-2 bg-navy-800/50 rounded border border-dashed border-navy-600">
        <p className="text-xs text-gray-600 text-center">TBD</p>
      </div>
    );
  }

  const isPair = 'player1' in team;
  const name = isPair
    ? `${(team as DoublesPair).player1.name} / ${(team as DoublesPair).player2.name}`
    : (team as Player).name;

  return (
    <div className={`p-2 rounded ${
      isWinner
        ? 'bg-emerald-500/20 border border-emerald-500/30'
        : hasScore
          ? 'bg-navy-800/50 border border-navy-700'
          : 'bg-navy-800/50 border border-navy-700'
    }`}>
      <p className={`text-xs font-medium ${
        isWinner ? 'text-emerald-400' : 'text-white'
      } truncate`}>
        {name}
      </p>
      {isPair && (
        <div className="flex items-center gap-1 mt-1">
          <ShiftBadge shift={(team as DoublesPair).player1.shiftGroup} />
          <ShiftBadge shift={(team as DoublesPair).player2.shiftGroup} />
        </div>
      )}
    </div>
  );
}

function ShiftBadge({ shift }: { shift: string }) {
  const colors: Record<string, string> = {
    'Non Shift': 'bg-gray-500/20 text-gray-400',
    'Grup A': 'bg-amber-500/20 text-amber-400',
    'Grup B': 'bg-rose-500/20 text-rose-400',
    'Grup C': 'bg-blue-500/20 text-blue-400',
  };

  const shortShift = shift.replace('Grup ', '');

  return (
    <span className={`px-1 py-0. rounded text-[10px] font-medium ${colors[shift] || 'bg-gray-500/20 text-gray-400'}`}>
      {shortShift}
    </span>
  );
}

function MatchScores({ scores }: { scores: Match['scores'] }) {
  if (!scores || scores.length === 0) return null;
  const score = scores[0];

  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        <span className={
          score.game1Team1 > score.game1Team2 ? 'text-emerald-400 font-bold' : 'text-gray-400'
        }>
          {score.game1Team1}
        </span>
        <span className="text-gray-600">-</span>
        <span className={
          score.game1Team2 > score.game1Team1 ? 'text-emerald-400 font-bold' : 'text-gray-400'
        }>
          {score.game1Team2}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className={
          score.game2Team1 > score.game2Team2 ? 'text-emerald-400 font-bold' : 'text-gray-400'
        }>
          {score.game2Team1}
        </span>
        <span className="text-gray-600">-</span>
        <span className={
          score.game2Team2 > score.game2Team1 ? 'text-emerald-400 font-bold' : 'text-gray-400'
        }>
          {score.game2Team2}
        </span>
      </div>
      {score.game3Team1 !== undefined && score.game3Team2 !== undefined && (
        <div className="flex items-center gap-1">
          <span className={
            score.game3Team1 > score.game3Team2 ? 'text-emerald-400 font-bold' : 'text-gray-400'
          }>
            {score.game3Team1}
          </span>
          <span className="text-gray-600">-</span>
          <span className={
            score.game3Team2 > score.game3Team1 ? 'text-emerald-400 font-bold' : 'text-gray-400'
          }>
            {score.game3Team2}
          </span>
        </div>
      )}
    </div>
  );
}
