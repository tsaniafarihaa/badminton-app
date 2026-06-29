import React, { useState, useRef } from 'react';
import { Plus, Upload, Trash2, Edit2, Search, Download, X, Check } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Player, COMPANIES, SHIFT_GROUPS, Category, Company, ShiftGroup } from '../types';

export function PlayerManagement() {
  const { data, addPlayer, updatePlayer, deletePlayer, importPlayers } = useTournament();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gandaPutra = data.players.filter(p => p.category === 'Ganda Putra');
  const singlePutri = data.players.filter(p => p.category === 'Single Putri');

  const filteredPlayers = data.players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || player.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      const players: Omit<Player, 'id'>[] = [];

      // Parse header to understand column structure
      const headerLine = lines[0] || '';
      const headerParts = headerLine.toLowerCase().split(',');

      // Find column indices based on header keywords
      const nameIdx = headerParts.findIndex(h =>
        h.includes('nama') || h.includes('name')
      );
      const companyIdx = headerParts.findIndex(h =>
        h.includes('perusahaan') || h.includes('company')
      );
      const shiftIdx = headerParts.findIndex(h =>
        h.includes('shift') || h.includes('grup')
      );
      const categoryIdx = headerParts.findIndex(h =>
        h.includes('kategori') || h.includes('category') || h.includes('kelas')
      );

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Handle quoted CSV properly
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        if (parts.length < 2) continue;

        // Get values using detected indices, fallback to positional
        const name = nameIdx >= 0 ? parts[nameIdx] : (parts[1] || parts[0]);
        const companyRaw = companyIdx >= 0 ? parts[companyIdx] : (parts[2] || '');
        const shiftRaw = shiftIdx >= 0 ? parts[shiftIdx] : (parts[3] || '');
        const categoryRaw = categoryIdx >= 0 ? parts[categoryIdx] : (parts[4] || '');

        if (!name || name.length < 2) continue;

        // Parse company
        const company = COMPANIES.find(c =>
          companyRaw?.toLowerCase().includes(c.toLowerCase())
        ) || 'Jabil';

        // Parse shift group
        const shiftGroup: ShiftGroup = SHIFT_GROUPS.find(s =>
          shiftRaw?.toLowerCase().includes(s.toLowerCase()) ||
          (shiftRaw?.toLowerCase().includes('non') && s === 'Non Shift') ||
          (shiftRaw?.toLowerCase() === 'a' && s === 'Grup A') ||
          (shiftRaw?.toLowerCase() === 'b' && s === 'Grup B') ||
          (shiftRaw?.toLowerCase() === 'c' && s === 'Grup C')
        ) || 'Non Shift';

        // Parse category
        const category: Category =
          categoryRaw?.toLowerCase().includes('single') ||
          categoryRaw?.toLowerCase().includes('putri') ||
          categoryRaw?.toLowerCase().includes('women')
            ? 'Single Putri'
            : 'Ganda Putra';

        players.push({
          name,
          company,
          shiftGroup,
          category,
          seed: false,
        });
      }

      if (players.length > 0) {
        importPlayers(players);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Banyak Ganda Putra</p>
          <p className="text-2xl font-bold text-emerald-400">{gandaPutra.length}/52</p>
        </div>
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Banyak Single Putri</p>
          <p className="text-2xl font-bold text-gold-400">{singlePutri.length}/10</p>
        </div>
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Seeded Players</p>
          <p className="text-2xl font-bold text-blue-400">
            {data.players.filter(p => p.seed).length}
          </p>
        </div>
        <div className="bg-navy-800/50 rounded-xl border border-navy-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Peserta</p>
          <p className="text-2xl font-bold text-white">{data.players.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Peserta
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex-1" />

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari peserta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
          className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="all">Semua Kategori</option>
          <option value="Ganda Putra">Ganda Putra</option>
          <option value="Single Putri">Single Putri</option>
        </select>
      </div>

      {/* Player Table */}
      <div className="bg-navy-800/50 rounded-xl border border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Perusahaan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Shift</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Seed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filteredPlayers.map(player => (
                <tr key={player.id} className="hover:bg-navy-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium">{player.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-navy-900 rounded text-xs text-gray-300">
                      {player.company}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ShiftBadge shift={player.shiftGroup} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      player.category === 'Ganda Putra'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gold-500/20 text-gold-400'
                    }`}>
                      {player.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {player.seed && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        Seed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingPlayer(player)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-navy-600 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada peserta terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPlayer) && (
        <PlayerModal
          player={editingPlayer}
          onClose={() => {
            setShowAddModal(false);
            setEditingPlayer(null);
          }}
          onSave={(player) => {
            if (editingPlayer) {
              updatePlayer({ ...player, id: editingPlayer.id } as Player);
            } else {
              addPlayer(player);
            }
            setShowAddModal(false);
            setEditingPlayer(null);
          }}
        />
      )}
    </div>
  );
}

function ShiftBadge({ shift }: { shift: ShiftGroup }) {
  const colors = {
    'Non Shift': 'bg-gray-500/20 text-gray-400',
    'Grup A': 'bg-amber-500/20 text-amber-400',
    'Grup B': 'bg-rose-500/20 text-rose-400',
    'Grup C': 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[shift]}`}>
      {shift}
    </span>
  );
}

interface PlayerModalProps {
  player?: Player | null;
  onClose: () => void;
  onSave: (player: Omit<Player, 'id'>) => void;
}

function PlayerModal({ player, onClose, onSave }: PlayerModalProps) {
  const [name, setName] = useState(player?.name || '');
  const [company, setCompany] = useState<Company>(player?.company || 'Jabil');
  const [shiftGroup, setShiftGroup] = useState<ShiftGroup>(player?.shiftGroup || 'Non Shift');
  const [category, setCategory] = useState<Category>(player?.category || 'Ganda Putra');
  const [seed, setSeed] = useState(player?.seed || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      company,
      shiftGroup,
      category,
      seed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-navy-900 rounded-xl border border-navy-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {player ? 'Edit Peserta' : 'Tambah Peserta'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Nama peserta"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Perusahaan
            </label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value as Company)}
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {COMPANIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Grup Shift
            </label>
            <select
              value={shiftGroup}
              onChange={(e) => setShiftGroup(e.target.value as ShiftGroup)}
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {SHIFT_GROUPS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="Ganda Putra">Ganda Putra</option>
              <option value="Single Putri">Single Putri</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="seed"
              checked={seed}
              onChange={(e) => setSeed(e.target.checked)}
              className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-emerald-500 focus:ring-emerald-500/50"
            />
            <label htmlFor="seed" className="text-sm text-gray-400">
              Tandai sebagai Seed Player
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded-lg text-gray-300 text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
