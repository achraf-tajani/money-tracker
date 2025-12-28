import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Wallet,
  TrendingDown,
  ShoppingCart,
  Plus,
  Calendar,
  CircleDollarSign,
  Settings,
  X,
  Edit,
  Trash2,
  Save,
  History,
  CheckCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { signOut, getChargesActives, createCharge, updateCharge, deleteCharge, getCategoriesByType, closeCycle, createCycle } from '@/services';
import { useDashboard } from '@/hooks/useDashboard';
import { useCounter } from '@/hooks/useCounter';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getIconEmoji } from '@/lib/iconMapper';
import type { ChargeFix, Categorie } from '@/types';

/**
 * Dashboard Page Component
 * Main app page with financial overview and statistics
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { cycle, totalChargesActives, recentDepenses, depensesParCategorie, loading } =
    useDashboard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuth();

  // Modal state for charges fixes
  const [showChargesModal, setShowChargesModal] = useState(false);
  const [chargesList, setChargesList] = useState<ChargeFix[]>([]);
  const [chargesCategories, setChargesCategories] = useState<Categorie[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ChargeFix | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state for new/edit charge
  const [formData, setFormData] = useState({
    nom: '',
    montant: 0,
    categorie_id: '',
  });

  // Calculate values
  const salaire = cycle?.salaire_reel || 0;
  const devise = cycle?.devise || 'EUR'; // Get currency from cycle

  // Modal state for cycle closure
  const [showCloseCycleModal, setShowCloseCycleModal] = useState(false);
  const [closingCycle, setClosingCycle] = useState(false);
  const [createNewCycle, setCreateNewCycle] = useState(false);
  const [newCycleSalaire, setNewCycleSalaire] = useState(0);
  const [newCycleDevise, setNewCycleDevise] = useState<'EUR' | 'USD' | 'MAD'>('EUR');
  const charges = totalChargesActives;
  const depenses = cycle?.total_depenses || 0;
  const reste = salaire - charges - depenses;
  const percentageUsed = salaire > 0 ? ((charges + depenses) / salaire) * 100 : 0;
  const percentageRemaining = 100 - percentageUsed;

  // Animated counter for the main amount
  const animatedReste = useCounter(reste, 2000, !loading);

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return months[month - 1];
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await signOut();

    if (error) {
      toast.error('Erreur lors de la déconnexion');
      setIsLoggingOut(false);
      return;
    }

    toast.success('Déconnexion réussie');
    setTimeout(() => navigate('/login', { replace: true }), 500);
  };

  // Load charges when modal opens
  useEffect(() => {
    if (showChargesModal && user) {
      loadCharges();
      loadChargesCategories();
    }
  }, [showChargesModal, user]);

  const loadCharges = async () => {
    if (!user) return;
    setLoadingCharges(true);
    const { data } = await getChargesActives(user.id);
    if (data) {
      setChargesList(data);
    }
    setLoadingCharges(false);
  };

  const loadChargesCategories = async () => {
    if (!user) return;
    const { data } = await getCategoriesByType(user.id, 'charge');
    if (data) {
      setChargesCategories(data);
    }
  };

  const handleOpenChargesModal = () => {
    setShowChargesModal(true);
  };

  const handleCloseChargesModal = () => {
    setShowChargesModal(false);
    setEditingCharge(null);
    setIsAddingNew(false);
    setFormData({ nom: '', montant: 0, categorie_id: '' });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingCharge(null);
    setFormData({ nom: '', montant: 0, categorie_id: chargesCategories[0]?.id || '' });
  };

  const handleEdit = (charge: ChargeFix) => {
    setEditingCharge(charge);
    setIsAddingNew(false);
    setFormData({
      nom: charge.nom,
      montant: typeof charge.montant === 'string' ? parseFloat(charge.montant) : charge.montant,
      categorie_id: charge.categorie_id,
    });
  };

  const handleSaveCharge = async () => {
    if (!user || !formData.nom || formData.montant <= 0 || !formData.categorie_id) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (isAddingNew) {
      const { error } = await createCharge(user.id, {
        nom: formData.nom,
        montant: formData.montant,
        categorie_id: formData.categorie_id,
        jour_prelevement: 1,
        actif: true,
      });

      if (error) {
        toast.error('Erreur lors de l\'ajout');
        return;
      }

      toast.success('Charge ajoutée avec succès');
    } else if (editingCharge) {
      const { error } = await updateCharge(editingCharge.id, {
        nom: formData.nom,
        montant: formData.montant,
        categorie_id: formData.categorie_id,
      });

      if (error) {
        toast.error('Erreur lors de la modification');
        return;
      }

      toast.success('Charge modifiée avec succès');
    }

    setIsAddingNew(false);
    setEditingCharge(null);
    setFormData({ nom: '', montant: 0, categorie_id: '' });
    loadCharges();
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) return;

    const { error } = await deleteCharge(chargeId);
    if (error) {
      toast.error('Erreur lors de la suppression');
      return;
    }

    toast.success('Charge supprimée avec succès');
    loadCharges();
  };

  const handleCancelEdit = () => {
    setIsAddingNew(false);
    setEditingCharge(null);
    setFormData({ nom: '', montant: 0, categorie_id: '' });
  };

  // Update new cycle values when cycle changes
  useEffect(() => {
    if (cycle) {
      setNewCycleSalaire(salaire);
      setNewCycleDevise(cycle.devise || 'EUR');
    }
  }, [cycle, salaire]);

  // Cycle closure handlers
  const handleOpenCloseCycleModal = () => {
    setCreateNewCycle(false);
    setShowCloseCycleModal(true);
  };

  const handleCloseCycle = async () => {
    if (!cycle || !user) return;

    setClosingCycle(true);

    // Close the current cycle
    const { error: closeError } = await closeCycle(cycle.id);
    if (closeError) {
      toast.error('Erreur lors de la clôture du cycle');
      setClosingCycle(false);
      return;
    }

    toast.success('Cycle clôturé avec succès !');

    // If user wants to create a new cycle
    if (createNewCycle) {
      const now = new Date();
      // Add 1 month to the current date to get the next month
      const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonth = nextDate.getMonth() + 1; // getMonth() is 0-indexed, we need 1-12
      const nextYear = nextDate.getFullYear();

      const { error: createError } = await createCycle(
        user.id,
        newCycleSalaire,
        nextYear,
        nextMonth,
        totalChargesActives,
        newCycleDevise
      );

      if (createError) {
        // Check if it's a duplicate key error
        if (createError.message?.includes('duplicate key') || createError.message?.includes('23505')) {
          const monthName = getMonthName(nextMonth);
          toast.error(`Un cycle pour ${monthName} ${nextYear} existe déjà. Vous ne pouvez pas créer un cycle en double.`);
        } else {
          toast.error('Erreur lors de la création du nouveau cycle');
        }
        setClosingCycle(false);
        setShowCloseCycleModal(false);
        return;
      }

      toast.success('Nouveau cycle créé !');
    }

    setClosingCycle(false);
    setShowCloseCycleModal(false);

    // Refresh the page to load new data
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Hero Skeleton */}
          <Skeleton className="h-64 w-full rounded-2xl" />

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>

          {/* Bottom Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // No active cycle state
  if (!cycle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <Toaster />
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="glass-morphism rounded-2xl p-8 bg-slate-900/40 border border-white/10">
            <CircleDollarSign className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Aucun cycle actif
            </h2>
            <p className="text-slate-300 mb-6">
              Commencez par créer votre premier cycle mensuel pour suivre vos finances.
            </p>
            <button
              onClick={() => navigate('/configuration')}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              Démarrer mon premier mois
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-4 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 relative overflow-hidden">
      <Toaster />

      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [45, 0, 45],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              👋 Bonjour {user?.user_metadata?.prenom || ''} !
            </h1>
            <p className="text-slate-300 text-sm md:text-base">
              {cycle ? `${getMonthName(cycle.mois)} ${cycle.annee}` : 'Aucun cycle actif'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/add-depense')}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Ajouter dépense</span>
            </button>
            <button
              onClick={handleOpenCloseCycleModal}
              className="px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/50 hover:border-emerald-400 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Clôturer</span>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-600 hover:border-primary-400 text-slate-200 hover:text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">Historique</span>
            </button>
            <button
              onClick={() => navigate('/configuration')}
              className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-600 hover:border-primary-400 text-slate-200 hover:text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Cycle</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-slate-800/70 hover:bg-slate-700 border border-slate-600 hover:border-rose-400 text-slate-200 hover:text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </motion.div>

        {/* Hero Section - IL VOUS RESTE */}
        <motion.div
          className="glass-morphism rounded-2xl p-6 md:p-10 mb-8 text-center bg-slate-900/50 border border-slate-700/50 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Cycle Info */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-primary-400" />
            <span className="text-slate-300">
              {getMonthName(cycle.mois)} {cycle.annee} • Cycle actif
            </span>
          </div>

          {/* Main Amount */}
          <div className="mb-6">
            <h2 className="text-lg md:text-xl text-slate-200 font-semibold tracking-wide mb-3">
              IL VOUS RESTE
            </h2>
            <motion.div
              className={`text-5xl md:text-7xl font-bold mb-2 ${
                reste >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              {formatCurrency(animatedReste, devise)}
            </motion.div>
            <p className="text-slate-300">
              Sur {formatCurrency(salaire, devise)} de salaire
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between text-sm text-slate-300 font-medium mb-2">
              <span>Utilisé {percentageUsed.toFixed(0)}%</span>
              <span>Restant {percentageRemaining.toFixed(0)}%</span>
            </div>
            <div className="h-4 bg-slate-800/70 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                className={`h-full rounded-full ${
                  reste >= 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-rose-500 to-orange-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${percentageRemaining}%` }}
                transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Budget Alert */}
          {reste < 0 && (
            <motion.div
              className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-red-400 font-semibold">
                ⚠️ Attention : Budget dépassé !
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1 - Salaire */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50 hover:border-primary-500/50 hover:bg-slate-900/60 transition-all cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-400" />
              </div>
              <span className="text-primary-300 text-sm font-semibold">
                Revenu
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatCurrency(salaire, devise)}
            </div>
            <p className="text-slate-300 text-sm">Salaire du mois</p>
          </motion.div>

          {/* Card 2 - Charges */}
          <motion.div
            onClick={handleOpenChargesModal}
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-amber-300 text-sm font-semibold">
                Fixes
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              -{formatCurrency(charges, devise)}
            </div>
            <p className="text-slate-300 text-sm">Charges fixes</p>
          </motion.div>

          {/* Card 3 - Dépenses */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50 hover:border-rose-500/50 hover:bg-slate-900/60 transition-all cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-rose-300 text-sm font-semibold">
                Variables
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              -{formatCurrency(depenses, devise)}
            </div>
            <p className="text-slate-300 text-sm">Dépensé ce mois</p>
          </motion.div>
        </div>

        {/* Bottom Section - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Recent Expenses */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Dernières dépenses
              </h3>
            </div>

            {recentDepenses.length > 0 ? (
              <div className="space-y-3">
                {recentDepenses.map((depense, index) => (
                  <motion.div
                    key={depense.id}
                    className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg hover:bg-slate-800/60 hover:border-slate-600/50 transition-all"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-2xl">
                        {depense.categorie?.icon ? getIconEmoji(depense.categorie.icon) : '💰'}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {depense.categorie?.nom || 'Divers'}
                        </p>
                        <p className="text-slate-300 text-sm">
                          {formatDate(depense.date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-rose-400 font-semibold">
                      -{formatCurrency(depense.montant, devise)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-emerald-700 mx-auto mb-4" />
                <p className="text-slate-300 mb-4">
                  Aucune dépense enregistrée ce mois
                </p>
                <button
                  onClick={() => navigate('/add-depense')}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all"
                >
                  Ajouter ma première dépense
                </button>
              </div>
            )}
          </motion.div>

          {/* Right Column - Pie Chart */}
          <motion.div
            className="glass-morphism rounded-xl p-6 bg-slate-900/50 border border-slate-700/50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Dépenses par catégorie
              </h3>
            </div>

            {depensesParCategorie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={depensesParCategorie as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      animationDuration={500}
                    >
                      {depensesParCategorie.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.categorie_couleur}
                        />
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
                              <p className="text-slate-400 text-sm">
                                {data.pourcentage.toFixed(1)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {depensesParCategorie.slice(0, 6).map((cat) => (
                    <div key={cat.categorie_id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.categorie_couleur }}
                      />
                      <span className="text-slate-300 text-sm truncate">
                        {cat.categorie_nom}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">
                  Aucune donnée pour le moment
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Charges Modal */}
      <AnimatePresence>
        {showChargesModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseChargesModal}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="glass-morphism rounded-2xl p-6 bg-slate-900/95 border border-slate-700/50 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingDown className="w-6 h-6 text-amber-400" />
                    Charges fixes
                  </h2>
                  <button
                    onClick={handleCloseChargesModal}
                    className="w-10 h-10 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-600 flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5 text-slate-200" />
                  </button>
                </div>

                {/* Add Button */}
                {!isAddingNew && !editingCharge && (
                  <button
                    onClick={handleAddNew}
                    className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter une charge
                  </button>
                )}

                {/* Add/Edit Form */}
                {(isAddingNew || editingCharge) && (
                  <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      {isAddingNew ? 'Nouvelle charge' : 'Modifier la charge'}
                    </h3>

                    <div className="space-y-4">
                      {/* Nom */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder="Ex: Loyer"
                        />
                      </div>

                      {/* Montant */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Montant
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.montant}
                          onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Catégorie */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Catégorie
                        </label>
                        <select
                          value={formData.categorie_id}
                          onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Sélectionnez une catégorie</option>
                          {chargesCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {getIconEmoji(cat.icon)} {cat.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCharge}
                          className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Enregistrer
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charges List */}
                {loadingCharges ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">Chargement...</p>
                  </div>
                ) : chargesList.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingDown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-300 mb-2">Aucune charge fixe</p>
                    <p className="text-slate-400 text-sm">
                      Ajoutez vos charges mensuelles récurrentes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chargesList.map((charge) => {
                      const category = chargesCategories.find(c => c.id === charge.categorie_id);
                      return (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/30 rounded-lg hover:bg-slate-800/60 hover:border-slate-600/50 transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-xl">
                              {category?.icon ? getIconEmoji(category.icon) : '💰'}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{charge.nom}</p>
                              <p className="text-slate-300 text-sm">
                                {category?.nom || 'Sans catégorie'}
                              </p>
                            </div>
                          </div>

                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-semibold mr-2">
                            -{formatCurrency(typeof charge.montant === 'string' ? parseFloat(charge.montant) : charge.montant, devise)}
                          </span>
                          <button
                            onClick={() => handleEdit(charge)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center transition-all"
                          >
                            <Edit className="w-4 h-4 text-slate-200" />
                          </button>
                          <button
                            onClick={() => handleDeleteCharge(charge.id)}
                            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-rose-600 border border-slate-600 hover:border-rose-500 flex items-center justify-center transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-slate-200" />
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {/* Total */}
                {chargesList.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-200">Total mensuel</span>
                      <span className="text-2xl font-bold text-amber-400">
                        -{formatCurrency(
                          chargesList.reduce((sum, charge) => {
                            const montant = typeof charge.montant === 'string' ? parseFloat(charge.montant) : charge.montant;
                            return sum + montant;
                          }, 0),
                          devise
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Close Cycle Modal */}
        {showCloseCycleModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !closingCycle && setShowCloseCycleModal(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="glass-morphism rounded-2xl p-8 bg-slate-900/95 border border-slate-700/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Clôturer le mois</h2>
                      <p className="text-slate-300 text-sm">
                        {cycle && `${getMonthName(cycle.mois)} ${cycle.annee}`}
                      </p>
                    </div>
                  </div>
                  {!closingCycle && (
                    <button
                      onClick={() => setShowCloseCycleModal(false)}
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5 text-slate-200" />
                    </button>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Résumé du mois</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Salaire</span>
                        <span className="text-white font-semibold">{formatCurrency(salaire, devise)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Charges fixes</span>
                        <span className="text-amber-400 font-semibold">-{formatCurrency(charges, devise)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Dépenses</span>
                        <span className="text-rose-400 font-semibold">-{formatCurrency(depenses, devise)}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-slate-200">Reste</span>
                          <span className={`text-2xl font-bold ${reste >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {reste >= 0 ? '+' : ''}{formatCurrency(reste, devise)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Cycle Option */}
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createNewCycle}
                        onChange={(e) => setCreateNewCycle(e.target.checked)}
                        disabled={closingCycle}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 focus:ring-offset-slate-900 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <span className="text-white font-medium">Démarrer un nouveau cycle</span>
                        <p className="text-slate-400 text-sm">Créer le cycle pour le mois prochain</p>
                      </div>
                    </label>

                    {createNewCycle && (
                      <motion.div
                        className="mt-4 pt-4 border-t border-slate-700/50"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="newSalaire" className="block text-sm font-semibold text-slate-200 mb-2">
                              Salaire pour le prochain mois
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Wallet className="w-5 h-5 text-slate-300" />
                              </div>
                              <input
                                id="newSalaire"
                                type="number"
                                step="0.01"
                                value={newCycleSalaire}
                                onChange={(e) => setNewCycleSalaire(parseFloat(e.target.value) || 0)}
                                disabled={closingCycle}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50"
                                placeholder="2500.00"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="newDevise" className="block text-sm font-semibold text-slate-200 mb-2">
                              Devise
                            </label>
                            <select
                              id="newDevise"
                              value={newCycleDevise}
                              onChange={(e) => setNewCycleDevise(e.target.value as 'EUR' | 'USD' | 'MAD')}
                              disabled={closingCycle}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                              <option value="EUR">🇪🇺 Euro (EUR)</option>
                              <option value="USD">🇺🇸 Dollar (USD)</option>
                              <option value="MAD">🇲🇦 Dirham (MAD)</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCloseCycleModal(false)}
                    disabled={closingCycle}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCloseCycle}
                    disabled={closingCycle}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {closingCycle ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Clôture en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirmer la clôture
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
