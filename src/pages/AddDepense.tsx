import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Calendar, Tag, FileText, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { createDepense, getCycleActif, getCategoriesByType } from '@/services';
import type { Categorie } from '@/types';
import { getIconEmoji } from '@/lib/iconMapper';

/**
 * Add Depense Page
 * Form to add a new expense to the current cycle
 */

const depenseSchema = z.object({
  montant: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  categorie_id: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  date: z.string().min(1, 'La date est requise'),
  description: z.string().optional(),
});

type DepenseFormData = z.infer<typeof depenseSchema>;

export default function AddDepense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepenseFormData>({
    resolver: zodResolver(depenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Load categories and active cycle
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get active cycle
        const { data: cycle } = await getCycleActif(user.id);
        if (!cycle) {
          toast.error('Aucun cycle actif. Créez un cycle d\'abord.');
          navigate('/configuration');
          return;
        }
        setCycleId(cycle.id);

        // Get categories for depenses
        const { data: cats } = await getCategoriesByType(user.id, 'depense');
        if (cats) {
          setCategories(cats);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement');
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, navigate]);

  const onSubmit = async (data: DepenseFormData) => {
    if (!user || !cycleId) {
      toast.error('Utilisateur non connecté ou aucun cycle actif');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createDepense(user.id, cycleId, {
        montant: data.montant,
        categorie_id: data.categorie_id,
        date: new Date(data.date),
        description: data.description || undefined,
      });

      if (error) {
        toast.error('Erreur lors de l\'ajout de la dépense');
        setIsSubmitting(false);
        return;
      }

      toast.success('Dépense ajoutée avec succès !');
      setTimeout(() => navigate('/dashboard', { replace: true }), 500);
    } catch (error) {
      console.error('Error adding depense:', error);
      toast.error('Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

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
                Nouvelle dépense
              </h1>
              <p className="text-slate-300 text-sm">
                Ajoutez une dépense à votre budget
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label
                htmlFor="montant"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Montant
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Wallet className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  id="montant"
                  type="number"
                  step="0.01"
                  autoFocus
                  {...register('montant', { valueAsNumber: true })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="25.00"
                />
              </div>
              {errors.montant && (
                <p className="mt-1 text-sm text-rose-400">
                  {errors.montant.message}
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label
                htmlFor="categorie_id"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Catégorie
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="w-5 h-5 text-slate-300" />
                </div>
                <select
                  id="categorie_id"
                  {...register('categorie_id')}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getIconEmoji(cat.icon)} {cat.nom}
                    </option>
                  ))}
                </select>
              </div>
              {errors.categorie_id && (
                <p className="mt-1 text-sm text-rose-400">
                  {errors.categorie_id.message}
                </p>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  id="date"
                  type="date"
                  {...register('date')}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-rose-400">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Description Input (Optional) */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Description (optionnel)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="w-5 h-5 text-slate-300" />
                </div>
                <input
                  id="description"
                  type="text"
                  {...register('description')}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Ex: Courses du mois"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Ajouter la dépense
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
