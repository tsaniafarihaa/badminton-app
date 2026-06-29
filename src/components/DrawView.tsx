import React, { useState, useEffect, useCallback } from 'react';
import { Shuffle, Users, AlertTriangle, CheckCircle, Loader2, UserCircle } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { DoublesPair, Player, getNightShiftGroup } from '../types';

export function DrawView() {
  const { data, startDraw, showToast } = useTournament();
  const [isDrawing, setIsDrawing] = useState(false);
  const [shownPairs, setShownPairs] = useState<DoublesPair[]>([]);
  const [shownSingles, setShownSingles] = useState<Player[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffleAnimation, setShuffleAnimation] = useState(false);

  const gandaPutraPlayers = data.players.filter(p => p.category === 'Ganda Putra');
  const singlePutriPlayers = data.players.filter(p => p.category === 'Single Putri');
  const canDraw = (gandaPutraPlayers.length >= 2 || singlePutriPlayers.length >= 2) && !data.drawCompleted;

  const handleStartDraw = useCallback(() => {
    if (!canDraw) return;

    setIsDrawing(true);
    setShuffleAnimation(true);
    setShownPairs([]);
    setCurrentIndex(0);

    // Start drawing after shuffle animation
    setTimeout(() => {
      setShuffleAnimation(false);
      startDraw();
    }, 2000);
  }, [canDraw, startDraw]);

  // Animate pairs appearing one by one
  useEffect(() => {
    if (isDrawing && data.drawCompleted && !shuffleAnimation) {
      const pairs = data.doublesPairs;
      const singles = data.womenSinglePlayers;

      // First show doubles pairs
      if (currentIndex < pairs.length) {
        const timer = setTimeout(() => {
          setShownPairs(prev => [...prev, pairs[currentIndex]]);
          setCurrentIndex(prev => prev + 1);
        }, 200);
        return () => clearTimeout(timer);
      }
      // Then show singles
      else if (currentIndex < pairs.length + singles.length) {
        const singleIndex = currentIndex - pairs.length;
        const timer = setTimeout(() => {
          setShownSingles(prev => [...prev, singles[singleIndex]]);
          setCurrentIndex(prev => prev + 1);
        }, 200);
        return () => clearTimeout(timer);
      }
      else if (currentIndex >= pairs.length + singles.length) {
        setIsDrawing(false);
        setCurrentIndex(0);
      }
    }
  }, [isDrawing, data.drawCompleted, shuffleAnimation, currentIndex, data.doublesPairs, data.womenSinglePlayers]);

  // Initialize shown pairs when draw is already completed
  useEffect(() => {
    if (data.drawCompleted && data.doublesPairs.length > 0 && shownPairs.length === 0) {
      setShownPairs(data.doublesPairs);
    }
    if (data.drawCompleted && data.womenSinglePlayers.length > 0 && shownSingles.length === 0) {
      setShownSingles(data.womenSinglePlayers);
    }
  }, [data.drawCompleted, data.doublesPairs, data.womenSinglePlayers, shownPairs.length, shownSingles.length]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shuffle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pengundian Turnamen</h2>
            <p className="text-sm text-gray-400">
              Pembuatan pasangan dan bracket otomatis
            </p>
          </div>
        </div>

        {!data.drawCompleted && (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                gandaPutraPlayers.length >= 2
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Users className="w-4 h-4" />
                <span className="font-medium">Ganda Putra: {gandaPutraPlayers.length} Peserta</span>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                singlePutriPlayers.length >= 2
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                <UserCircle className="w-4 h-4" />
                <span className="font-medium">Single Putri: {singlePutriPlayers.length} Peserta</span>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                canDraw
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {canDraw ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Siap Diundi</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Min. 2 Peserta per Kategori</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleStartDraw}
              disabled={!canDraw || isDrawing}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${
                canDraw && !isDrawing
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isDrawing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sedang Mengundi...
                </>
              ) : (
                <>
                  <Shuffle className="w-5 h-5" />
                  Mulai Pengundian
                </>
              )}
            </button>
          </>
        )}

        {data.drawCompleted && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Ganda Putra: {data.doublesPairs.length} Pasangan</span>
            </div>
            <div className="flex items-center gap-2 text-gold-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Single Putri: {data.womenSinglePlayers.length} Peserta</span>
            </div>
          </div>
        )}
      </div>

      {/* Shuffle Animation */}
      {isDrawing && shuffleAnimation && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-20 bg-navy-800 rounded-lg border border-emerald-500/30 flex items-center justify-center animate-shuffle"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
              ))}
            </div>
            <p className="text-lg text-white font-medium">Mengacak Peserta...</p>
          </div>
        </div>
      )}

      {/* Pairing Rules */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Aturan Pairing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm font-medium text-emerald-400 mb-2">Prioritas Utama</p>
            <p className="text-xs text-gray-400">Shift Sama (A+A, B+B, C+C, Non+Non)</p>
          </div>
          <div className="p-4 bg-gold-500/10 border border-gold-500/30 rounded-lg">
            <p className="text-sm font-medium text-gold-400 mb-2">Alternatif</p>
            <p className="text-xs text-gray-400">Non Shift + Grup A/B/C</p>
          </div>
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <p className="text-sm font-medium text-rose-400 mb-2">Dihindari</p>
            <p className="text-xs text-gray-400">Campuran Grup (A+B, B+C, A+C)</p>
          </div>
        </div>
      </div>

      {/* Pairs Grid */}
      {shownPairs.length > 0 && (
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Hasil Pengundian ({shownPairs.length} Pasangan)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shownPairs.map((pair, index) => (
              <div
                key={pair.id}
                className="p-4 bg-navy-900/50 border border-navy-700 rounded-lg animate-reveal"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-400">Pasangan #{index + 1}</span>
                  {pair.seed && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                      Seed
                    </span>
                  )}
                </div>

                <PlayerCard player={pair.player1} />
                <div className="flex items-center justify-center my-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">
                    &
                  </span>
                </div>
                <PlayerCard player={pair.player2} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Women's Singles */}
      {shownSingles.length > 0 && (
        <div className="bg-navy-800/50 rounded-xl border border-gold-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserCircle className="w-6 h-6 text-gold-400" />
            <h3 className="text-lg font-semibold text-white">
              Pengundian Single Putri
            </h3>
            <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs font-medium">
              {shownSingles.length} Peserta
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {shownSingles.map((player, index) => (
              <div
                key={player.id}
                className="p-4 bg-navy-900/50 border border-navy-700 rounded-lg animate-reveal"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{player.name}</span>
                  {player.seed && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                      Seed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <ShiftBadge shift={player.shiftGroup} />
                  <CompanyBadge company={player.company} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-navy-800/50 rounded">
      <div>
        <p className="text-sm font-medium text-white">{player.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <CompanyBadge company={player.company} />
        </div>
      </div>
      <ShiftBadge shift={player.shiftGroup} />
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

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[shift] || 'bg-gray-500/20 text-gray-400'}`}>
      {shift}
    </span>
  );
}

function CompanyBadge({ company }: { company: string }) {
  return (
    <span className="px-2 py-0.5 bg-navy-700 text-gray-300 rounded text-xs">
      {company}
    </span>
  );
}
