import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { createCycle, updateCycle, getCycleActif } from '@/services';
import { getTotalCharges } from '@/services';

/**
 * Configuration Page
 * Create new monthly cycle
 */

const cycleSchema = z.object({
  salaire: z.number().min(0, 'Le salaire doit être positif'),
  mois: z.number().min(1).max(12),
  annee: z.number().min(2020).max(2100),
  devise: z.enum(['EUR', 'USD', 'MAD']),
});

type CycleFormData = z.infer<typeof cycleSchema>;

export default function Configuration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cycleActif, setCycleActif] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CycleFormData>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      mois: currentMonth,
      annee: currentYear,
      salaire: 0,
      devise: 'EUR',
    },
  });

  // Load active cycle on mount
  useEffect(() => {
    const loadCycle = async () => {
      if (!user) return;

      const { data: cycle } = await getCycleActif(user.id);
      if (cycle) {
        setCycleActif(cycle);
        reset({
          salaire: typeof cycle.salaire_reel === 'string' ? parseFloat(cycle.salaire_reel) : cycle.salaire_reel,
          mois: cycle.mois,
          annee: cycle.annee,
          devise: cycle.devise || 'EUR',
        });
      }
      setLoading(false);
    };

    loadCycle();
  }, [user?.id, reset]);

  const onSubmit = async (data: CycleFormData) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setIsSubmitting(true);

    try {
      if (cycleActif) {
        // Update existing cycle
        const { error } = await updateCycle(cycleActif.id, {
          salaire_reel: data.salaire,
        });

        if (error) {
          toast.error('Erreur lors de la mise à jour du cycle');
          setIsSubmitting(false);
          return;
        }

        toast.success('Cycle mis à jour avec succès !');
      } else {
        // Create new cycle
        const { data: totalCharges } = await getTotalCharges(user.id);

        const { error } = await createCycle(
          user.id,
          data.salaire,
          data.annee,
          data.mois,
          totalCharges || 0,
          data.devise
        );

        if (error) {
          // Check if it's a duplicate key error
          if (error.message?.includes('duplicate key') || error.message?.includes('23505')) {
            const monthName = months[data.mois - 1];
            toast.error(`Un cycle pour ${monthName} ${data.annee} existe déjà. Vous ne pouvez pas créer un cycle en double.`);
          } else {
            toast.error('Erreur lors de la création du cycle');
          }
          setIsSubmitting(false);
          return;
        }

        toast.success('Cycle créé avec succès !');
      }

      setTimeout(() => navigate('/dashboard', { replace: true }), 500);
    } catch (error) {
      console.error('Error with cycle:', error);
      toast.error('Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8 flex items-center justify-center">
      <Toaster />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="glass-morphism rounded-2xl p-8 bg-slate-900/50 border border-slate-700/50">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-600 hover:border-primary-400 flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-200 hover:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {loading ? 'Chargement...' : cycleActif ? 'Modifier le cycle' : 'Nouveau cycle mensuel'}
              </h1>
              <p className="text-slate-300 text-sm">
                {loading ? 'Veuillez patienter' : cycleActif ? 'Mettez à jour votre salaire' : 'Configurez votre budget du mois'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Salary Input */}
            <div>
              <label
                htmlFor="salaire"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Salaire mensuel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Wallet className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  id="salaire"
                  type="number"
                  step="0.01"
                  {...register('salaire', { valueAsNumber: true })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="2500.00"
                />
              </div>
              {errors.salaire && (
                <p className="mt-1 text-sm text-rose-400">
                  {errors.salaire.message}
                </p>
              )}
            </div>

            {/* Currency Selection */}
            <div>
              <label
                htmlFor="devise"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Devise
              </label>
              <select
                id="devise"
                {...register('devise')}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer"
              >
                <option value="EUR">🇪🇺 Euro (EUR)</option>
                <option value="USD">🇺🇸 Dollar (USD)</option>
                <option value="MAD">🇲🇦 Dirham (MAD)</option>
              </select>
              {errors.devise && (
                <p className="mt-1 text-sm text-rose-400">
                  {errors.devise.message}
                </p>
              )}
            </div>

            {/* Month Selection - Only show when creating new cycle */}
            {!loading && !cycleActif && (
              <div>
                <label
                  htmlFor="mois"
                  className="block text-sm font-semibold text-slate-200 mb-2"
                >
                  Mois
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-slate-300" />
                  </div>
                  <select
                    id="mois"
                    {...register('mois', { valueAsNumber: true })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.mois && (
                  <p className="mt-1 text-sm text-rose-400">
                    {errors.mois.message}
                  </p>
                )}
              </div>
            )}

            {/* Year Input - Only show when creating new cycle */}
            {!loading && !cycleActif && (
              <div>
                <label
                  htmlFor="annee"
                  className="block text-sm font-semibold text-slate-200 mb-2"
                >
                  Année
                </label>
                <input
                  id="annee"
                  type="number"
                  {...register('annee', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="2025"
                />
                {errors.annee && (
                  <p className="mt-1 text-sm text-rose-400">
                    {errors.annee.message}
                  </p>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <p className="text-primary-300 text-sm">
                💡 Vos charges fixes seront automatiquement prises en compte
                dans le calcul de votre budget disponible.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? cycleActif ? 'Mise à jour...' : 'Création en cours...'
                : cycleActif ? 'Mettre à jour' : 'Créer le cycle'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
