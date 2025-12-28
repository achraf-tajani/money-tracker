import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { getAllCycles, getDepenses, getDepensesParCategorie } from '@/services';
import type { CycleMensuel, Depense, Categorie } from '@/types';
import type { DepenseParCategorie } from '@/services/stats.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getIconEmoji } from '@/lib/iconMapper';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Extended Depense type with joined category data
 */
interface DepenseWithCategorie extends Depense {
  categorie?: Categorie;
}

/**
 * History Page Component
 * Shows all past cycles with their expenses and statistics
 */
export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cycles, setCycles] = useState<CycleMensuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [cycleDepenses, setCycleDepenses] = useState<Record<string, DepenseWithCategorie[]>>({});
  const [cycleStats, setCycleStats] = useState<Record<string, DepenseParCategorie[]>>({});

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    return months[month - 1];
  };

  // Load all cycles
  useEffect(() => {
    const loadCycles = async () => {
      if (!user) return;

      setLoading(true);
      const { data, error } = await getAllCycles(user.id);

      if (error) {
        toast.error('Erreur lors du chargement de l\'historique');
        setLoading(false);
        return;
      }

      if (data) {
        setCycles(data);
      }
      setLoading(false);
    };

    loadCycles();
  }, [user]);

  // Load cycle details when expanded
  const handleToggleCycle = async (cycleId: string) => {
    if (expandedCycle === cycleId) {
      setExpandedCycle(null);
      return;
    }

    setExpandedCycle(cycleId);

    // Load depenses if not already loaded
    if (!cycleDepenses[cycleId]) {
      const { data: depensesData } = await getDepenses(cycleId);
      const { data: statsData } = await getDepensesParCategorie(cycleId);

      if (depensesData) {
        setCycleDepenses((prev) => ({ ...prev, [cycleId]: depensesData }));
      }
      if (statsData) {
        setCycleStats((prev) => ({ ...prev, [cycleId]: statsData }));
      }
    }
  };

  // Calculate global stats
  const totalDepenses = cycles.reduce((sum, cycle) => sum + (cycle.total_depenses || 0), 0);
  const avgDepenses = cycles.length > 0 ? totalDepenses / cycles.length : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <Toaster />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="w-12 h-12 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-600 hover:border-primary-400 flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-slate-200 hover:text-white" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Historique
            </h1>
            <p className="text-slate-300 text-sm md:text-base">
              Consultez vos cycles mensuels passés
            </p>
          </div>
        </motion.div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Cycles */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-primary-400" />
              <span className="text-slate-300 text-sm font-semibold">Cycles</span>
            </div>
            <div className="text-3xl font-bold text-white">{cycles.length}</div>
            <p className="text-slate-400 text-sm">Mois enregistrés</p>
          </motion.div>

          {/* Total Spent */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-8 h-8 text-rose-400" />
              <span className="text-slate-300 text-sm font-semibold">Total dépensé</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(totalDepenses)}</div>
            <p className="text-slate-400 text-sm">Sur tous les cycles</p>
          </motion.div>

          {/* Average */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <span className="text-slate-300 text-sm font-semibold">Moyenne</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatCurrency(avgDepenses)}</div>
            <p className="text-slate-400 text-sm">Par mois</p>
          </motion.div>
        </div>

        {/* Cycles List */}
        <div className="space-y-4">
          {cycles.length === 0 ? (
            <motion.div
              className="glass-morphism rounded-xl p-8 bg-slate-900/50 border border-slate-700/50 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 mb-2">Aucun historique</p>
              <p className="text-slate-400 text-sm">
                Vos cycles passés apparaîtront ici
              </p>
            </motion.div>
          ) : (
            cycles.map((cycle, index) => {
              const salaire = typeof cycle.salaire_reel === 'string' ? parseFloat(cycle.salaire_reel) : cycle.salaire_reel;
              const depenses = cycle.total_depenses || 0;
              const reste = salaire - depenses;
              const devise = cycle.devise || 'EUR'; // Get currency from cycle
              const isExpanded = expandedCycle === cycle.id;
              const stats = cycleStats[cycle.id] || [];
              const depensesList = cycleDepenses[cycle.id] || [];

              return (
                <motion.div
                  key={cycle.id}
                  className="glass-morphism rounded-xl bg-slate-900/50 border border-slate-700/50 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  {/* Cycle Header */}
                  <button
                    onClick={() => handleToggleCycle(cycle.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        reste >= 0 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-rose-500/20 border border-rose-500/30'
                      }`}>
                        <Calendar className={`w-6 h-6 ${reste >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white">
                          {getMonthName(cycle.mois)} {cycle.annee}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-slate-300 text-sm">
                            {formatCurrency(salaire, devise)} salaire
                          </span>
                          <span className="text-rose-400 text-sm">
                            -{formatCurrency(depenses, devise)} dépensé
                          </span>
                          <span className={`text-sm font-semibold ${reste >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {reste >= 0 ? '+' : ''}{formatCurrency(reste, devise)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-slate-700/50"
                      >
                        <div className="p-6">
                          {/* Stats and Chart */}
                          {stats.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                              {/* Chart */}
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-4">
                                  Répartition par catégorie
                                </h4>
                                <ResponsiveContainer width="100%" height={200}>
                                  <PieChart>
                                    <Pie
                                      data={stats as any}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="total"
                                    >
                                      {stats.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.categorie_couleur} />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                              <p className="text-white font-semibold">
                                                {data.categorie_nom}
                                              </p>
                                              <p className="text-primary-400">
                                                {formatCurrency(data.total, devise)}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Categories List */}
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-4">
                                  Par catégorie
                                </h4>
                                <div className="space-y-2">
                                  {stats.map((cat) => (
                                    <div key={cat.categorie_id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: cat.categorie_couleur }}
                                        />
                                        <span className="text-slate-200 text-sm">{cat.categorie_nom}</span>
                                      </div>
                                      <span className="text-white font-semibold">{formatCurrency(cat.total, devise)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {/* Depenses List */}
                          {depensesList.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-white mb-4">
                                Toutes les dépenses ({depensesList.length})
                              </h4>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {depensesList.map((depense) => (
                                  <div
                                    key={depense.id}
                                    className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-lg">
                                        {depense.categorie?.icon ? getIconEmoji(depense.categorie.icon) : '💰'}
                                      </div>
                                      <div>
                                        <p className="text-white font-medium text-sm">
                                          {depense.categorie?.nom || 'Divers'}
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                          {formatDate(depense.date)}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-rose-400 font-semibold">
                                      -{formatCurrency(depense.montant, devise)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
