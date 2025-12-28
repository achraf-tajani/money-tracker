import { supabase } from '@/lib/supabase';
import type { CycleMensuel, Categorie } from '@/types';

/**
 * Statistics Service
 * Provides analytics and statistics for budget tracking
 */

/**
 * Monthly statistics for a cycle
 */
export interface StatsMensuel {
  salaire: number;
  total_charges: number;
  total_depenses: number;
  reste: number;
  pourcentage_utilise: number;
  taux_epargne: number;
  depenses_par_jour: number;
  jours_restants: number;
  budget_journalier_restant: number;
}

/**
 * Depenses grouped by category with totals and percentages
 */
export interface DepenseParCategorie {
  categorie_id: string;
  categorie_nom: string;
  categorie_couleur: string;
  categorie_icon: string;
  total: number;
  pourcentage: number;
  nombre_depenses: number;
  budget_max?: number;
  is_exceeded: boolean;
}

/**
 * Comparison between two cycles
 */
export interface ComparaisonMois {
  cycle_actuel: CycleMensuel;
  cycle_precedent: CycleMensuel;
  variation_depenses: number;
  variation_reste: number;
  categories_en_hausse: Array<{
    categorie_nom: string;
    variation: number;
  }>;
  categories_en_baisse: Array<{
    categorie_nom: string;
    variation: number;
  }>;
}

/**
 * Evolution of expenses over multiple months
 */
export interface EvolutionDepenses {
  mois: string;
  annee: number;
  total_depenses: number;
  total_charges: number;
  reste: number;
}

/**
 * Get comprehensive monthly statistics for a cycle
 */
export async function getStatsMensuel(
  cycleId: string
): Promise<{ data: StatsMensuel | null; error: Error | null }> {
  try {
    const { data: cycle, error } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (error || !cycle) {
      console.error('Error fetching cycle for stats:', error);
      return { data: null, error };
    }

    // Calculate statistics
    const totalUtilise = cycle.total_charges + cycle.total_depenses;
    const pourcentageUtilise =
      cycle.salaire_reel > 0
        ? (totalUtilise / cycle.salaire_reel) * 100
        : 0;
    const tauxEpargne =
      cycle.salaire_reel > 0 ? (cycle.reste / cycle.salaire_reel) * 100 : 0;

    // Calculate days
    const dateDebut = new Date(cycle.date_debut);
    const dateFin = new Date(cycle.date_fin);
    const today = new Date();
    const totalJours = Math.ceil(
      (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)
    );
    const joursEcoules = Math.max(
      0,
      Math.ceil((today.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24))
    );
    const joursRestants = Math.max(0, totalJours - joursEcoules);

    const depensesParJour =
      joursEcoules > 0 ? cycle.total_depenses / joursEcoules : 0;
    const budgetJournalierRestant =
      joursRestants > 0 ? cycle.reste / joursRestants : cycle.reste;

    const stats: StatsMensuel = {
      salaire: cycle.salaire_reel,
      total_charges: cycle.total_charges,
      total_depenses: cycle.total_depenses,
      reste: cycle.reste,
      pourcentage_utilise: pourcentageUtilise,
      taux_epargne: tauxEpargne,
      depenses_par_jour: depensesParJour,
      jours_restants: joursRestants,
      budget_journalier_restant: budgetJournalierRestant,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Unexpected error calculating monthly stats:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get depenses grouped by category for a cycle
 */
export async function getDepensesParCategorie(
  cycleId: string
): Promise<{ data: DepenseParCategorie[] | null; error: Error | null }> {
  try {
    // Get all depenses with categories
    const { data: depenses, error: depensesError } = await supabase
      .from('depenses')
      .select('montant, categorie_id, categorie:categories(*)')
      .eq('cycle_id', cycleId);

    if (depensesError) {
      console.error('Error fetching depenses for stats:', depensesError);
      return { data: null, error: depensesError };
    }

    if (!depenses || depenses.length === 0) {
      return { data: [], error: null };
    }

    // Calculate total
    const totalDepenses = depenses.reduce(
      (sum, depense) => sum + depense.montant,
      0
    );

    // Group by category
    const grouped = depenses.reduce(
      (acc, depense) => {
        const catId = depense.categorie_id;
        const categorie = depense.categorie as unknown as Categorie | null;

        if (!acc[catId]) {
          acc[catId] = {
            categorie_id: catId,
            categorie_nom: categorie?.nom || 'Unknown',
            categorie_couleur: categorie?.couleur || '#64748B',
            categorie_icon: categorie?.icon || 'MoreHorizontal',
            total: 0,
            nombre_depenses: 0,
            budget_max: categorie?.budget_max,
          };
        }
        acc[catId].total += depense.montant;
        acc[catId].nombre_depenses += 1;
        return acc;
      },
      {} as Record<string, Omit<DepenseParCategorie, 'pourcentage' | 'is_exceeded'>>
    );

    // Convert to array and add percentages
    const result: DepenseParCategorie[] = Object.values(grouped).map(
      (cat) => ({
        ...cat,
        pourcentage: totalDepenses > 0 ? (cat.total / totalDepenses) * 100 : 0,
        is_exceeded: cat.budget_max ? cat.total > cat.budget_max : false,
      })
    );

    // Sort by total (highest first)
    result.sort((a, b) => b.total - a.total);

    return { data: result, error: null };
  } catch (error) {
    console.error('Unexpected error grouping depenses by category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Compare current cycle with previous cycle
 */
export async function getComparaisonMois(
  cycleId: string,
  cycleIdPrecedent: string
): Promise<{ data: ComparaisonMois | null; error: Error | null }> {
  try {
    // Get both cycles
    const { data: cycleActuel, error: errorActuel } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('id', cycleId)
      .single();

    const { data: cyclePrecedent, error: errorPrecedent } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('id', cycleIdPrecedent)
      .single();

    if (errorActuel || errorPrecedent || !cycleActuel || !cyclePrecedent) {
      console.error('Error fetching cycles for comparison:', {
        errorActuel,
        errorPrecedent,
      });
      return { data: null, error: errorActuel || errorPrecedent };
    }

    // Calculate variations
    const variationDepenses =
      cyclePrecedent.total_depenses > 0
        ? ((cycleActuel.total_depenses - cyclePrecedent.total_depenses) /
            cyclePrecedent.total_depenses) *
          100
        : 0;

    const variationReste =
      cyclePrecedent.reste > 0
        ? ((cycleActuel.reste - cyclePrecedent.reste) / cyclePrecedent.reste) *
          100
        : 0;

    // Get depenses by category for both cycles
    const { data: statsActuel } = await getDepensesParCategorie(cycleId);
    const { data: statsPrecedent } = await getDepensesParCategorie(
      cycleIdPrecedent
    );

    const categoriesEnHausse: Array<{ categorie_nom: string; variation: number }> = [];
    const categoriesEnBaisse: Array<{ categorie_nom: string; variation: number }> = [];

    if (statsActuel && statsPrecedent) {
      statsActuel.forEach((catActuel) => {
        const catPrecedent = statsPrecedent.find(
          (c) => c.categorie_id === catActuel.categorie_id
        );
        if (catPrecedent) {
          const variation =
            catPrecedent.total > 0
              ? ((catActuel.total - catPrecedent.total) / catPrecedent.total) *
                100
              : 0;

          if (variation > 5) {
            categoriesEnHausse.push({
              categorie_nom: catActuel.categorie_nom,
              variation,
            });
          } else if (variation < -5) {
            categoriesEnBaisse.push({
              categorie_nom: catActuel.categorie_nom,
              variation: Math.abs(variation),
            });
          }
        }
      });
    }

    const comparaison: ComparaisonMois = {
      cycle_actuel: cycleActuel,
      cycle_precedent: cyclePrecedent,
      variation_depenses: variationDepenses,
      variation_reste: variationReste,
      categories_en_hausse: categoriesEnHausse.sort(
        (a, b) => b.variation - a.variation
      ),
      categories_en_baisse: categoriesEnBaisse.sort(
        (a, b) => b.variation - a.variation
      ),
    };

    return { data: comparaison, error: null };
  } catch (error) {
    console.error('Unexpected error comparing months:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get evolution of expenses over the last N months
 */
export async function getEvolutionDepenses(
  userId: string,
  nbMois = 6
): Promise<{ data: EvolutionDepenses[] | null; error: Error | null }> {
  try {
    const { data: cycles, error } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('user_id', userId)
      .order('annee', { ascending: false })
      .order('mois', { ascending: false })
      .limit(nbMois);

    if (error) {
      console.error('Error fetching cycles for evolution:', error);
      return { data: null, error };
    }

    if (!cycles || cycles.length === 0) {
      return { data: [], error: null };
    }

    const moisNoms = [
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

    const evolution: EvolutionDepenses[] = cycles.map((cycle) => ({
      mois: moisNoms[cycle.mois - 1],
      annee: cycle.annee,
      total_depenses: cycle.total_depenses,
      total_charges: cycle.total_charges,
      reste: cycle.reste,
    }));

    // Reverse to get chronological order
    evolution.reverse();

    return { data: evolution, error: null };
  } catch (error) {
    console.error('Unexpected error getting expense evolution:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get top spending categories for a cycle
 */
export async function getTopCategories(
  cycleId: string,
  limit = 5
): Promise<{ data: DepenseParCategorie[] | null; error: Error | null }> {
  try {
    const { data, error } = await getDepensesParCategorie(cycleId);

    if (error || !data) {
      return { data: null, error };
    }

    return { data: data.slice(0, limit), error: null };
  } catch (error) {
    console.error('Unexpected error getting top categories:', error);
    return { data: null, error: error as Error };
  }
}
