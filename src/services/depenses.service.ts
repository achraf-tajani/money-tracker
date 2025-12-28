import { supabase } from '@/lib/supabase';
import type { Depense, DepenseFormData } from '@/types';

/**
 * Depenses Service
 * Manages expenses within monthly cycles
 */

interface DepenseResponse {
  data: Depense | null;
  error: Error | null;
}

interface DepensesResponse {
  data: Depense[] | null;
  error: Error | null;
}

/**
 * Get all depenses for a specific cycle
 */
export async function getDepenses(cycleId: string): Promise<DepensesResponse> {
  try {
    const { data, error } = await supabase
      .from('depenses')
      .select('*, categorie:categories(*)')
      .eq('cycle_id', cycleId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching depenses:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching depenses:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get depenses by category for a specific cycle
 */
export async function getDepensesByCategorie(
  cycleId: string,
  categorieId: string
): Promise<DepensesResponse> {
  try {
    const { data, error } = await supabase
      .from('depenses')
      .select('*, categorie:categories(*)')
      .eq('cycle_id', cycleId)
      .eq('categorie_id', categorieId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching depenses by category:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching depenses by category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get recent depenses (last N depenses)
 */
export async function getRecentDepenses(
  cycleId: string,
  limit = 10
): Promise<DepensesResponse> {
  try {
    const { data, error } = await supabase
      .from('depenses')
      .select('*, categorie:categories(*)')
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent depenses:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching recent depenses:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get depenses by date range
 */
export async function getDepensesByDateRange(
  cycleId: string,
  startDate: Date,
  endDate: Date
): Promise<DepensesResponse> {
  try {
    const { data, error } = await supabase
      .from('depenses')
      .select('*, categorie:categories(*)')
      .eq('cycle_id', cycleId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching depenses by date range:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching depenses by date range:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new depense
 */
export async function createDepense(
  userId: string,
  cycleId: string,
  data: DepenseFormData
): Promise<DepenseResponse> {
  try {
    const newDepense = {
      user_id: userId,
      cycle_id: cycleId,
      montant: data.montant,
      categorie_id: data.categorie_id,
      date: data.date.toISOString(),
      description: data.description || null,
      tags: data.tags || null,
    };

    const { data: depense, error } = await supabase
      .from('depenses')
      .insert(newDepense)
      .select('*, categorie:categories(*)')
      .single();

    if (error) {
      console.error('Error creating depense:', error);
      return { data: null, error };
    }

    // Update cycle total_depenses
    await updateCycleTotalDepenses(cycleId);

    return { data: depense, error: null };
  } catch (error) {
    console.error('Unexpected error creating depense:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an existing depense
 */
export async function updateDepense(
  depenseId: string,
  updates: Partial<DepenseFormData>
): Promise<DepenseResponse> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.montant !== undefined) updateData.montant = updates.montant;
    if (updates.categorie_id !== undefined)
      updateData.categorie_id = updates.categorie_id;
    if (updates.date !== undefined)
      updateData.date = updates.date.toISOString();
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { data, error } = await supabase
      .from('depenses')
      .update(updateData)
      .eq('id', depenseId)
      .select('*, categorie:categories(*)')
      .single();

    if (error) {
      console.error('Error updating depense:', error);
      return { data: null, error };
    }

    // Update cycle total_depenses if montant changed
    if (updates.montant !== undefined && data) {
      await updateCycleTotalDepenses(data.cycle_id);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating depense:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a depense
 */
export async function deleteDepense(
  depenseId: string
): Promise<DepenseResponse> {
  try {
    // Get the depense first to know which cycle to update
    const { data: depenseToDelete } = await supabase
      .from('depenses')
      .select('cycle_id')
      .eq('id', depenseId)
      .single();

    const { data, error } = await supabase
      .from('depenses')
      .delete()
      .eq('id', depenseId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting depense:', error);
      return { data: null, error };
    }

    // Update cycle total_depenses
    if (depenseToDelete) {
      await updateCycleTotalDepenses(depenseToDelete.cycle_id);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error deleting depense:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get total of all depenses for a cycle
 */
export async function getTotalDepenses(
  cycleId: string
): Promise<{ data: number | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('depenses')
      .select('montant')
      .eq('cycle_id', cycleId);

    if (error) {
      console.error('Error calculating total depenses:', error);
      return { data: null, error };
    }

    const total = data?.reduce((sum, depense) => sum + depense.montant, 0) || 0;

    return { data: total, error: null };
  } catch (error) {
    console.error('Unexpected error calculating total depenses:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Helper function to update cycle total_depenses after CRUD operations
 */
async function updateCycleTotalDepenses(cycleId: string): Promise<void> {
  try {
    const { data: total } = await getTotalDepenses(cycleId);

    if (total !== null) {
      // Get current cycle data to recalculate reste
      const { data: cycle } = await supabase
        .from('cycles_mensuels')
        .select('salaire_reel, total_charges')
        .eq('id', cycleId)
        .single();

      if (cycle) {
        const reste = cycle.salaire_reel - cycle.total_charges - total;

        await supabase
          .from('cycles_mensuels')
          .update({
            total_depenses: total,
            reste,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycleId);
      }
    }
  } catch (error) {
    console.error('Error updating cycle total_depenses:', error);
  }
}

/**
 * Search depenses by description or tags
 */
export async function searchDepenses(
  cycleId: string,
  searchTerm: string
): Promise<DepensesResponse> {
  try {
    const { data, error } = await supabase
      .from('depenses')
      .select('*, categorie:categories(*)')
      .eq('cycle_id', cycleId)
      .or(`description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error searching depenses:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error searching depenses:', error);
    return { data: null, error: error as Error };
  }
}
