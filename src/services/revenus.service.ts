import { supabase } from '@/lib/supabase';
import type { Revenu, RevenuFormData } from '@/types';

/**
 * Revenus Service
 * Manages income sources (salaire, primes, aides, etc.)
 */

interface RevenuResponse {
  data: Revenu | null;
  error: Error | null;
}

interface RevenusResponse {
  data: Revenu[] | null;
  error: Error | null;
}

/**
 * Get all revenus for a user
 */
export async function getRevenus(userId: string): Promise<RevenusResponse> {
  try {
    const { data, error } = await supabase
      .from('revenus')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching revenus:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching revenus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get active revenus (no end date or end date in the future)
 */
export async function getRevenusActifs(
  userId: string
): Promise<RevenusResponse> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('revenus')
      .select('*')
      .eq('user_id', userId)
      .or(`date_fin.is.null,date_fin.gte.${now}`)
      .order('montant', { ascending: false });

    if (error) {
      console.error('Error fetching active revenus:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching active revenus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get recurrent revenus only
 */
export async function getRevenusRecurrents(
  userId: string
): Promise<RevenusResponse> {
  try {
    const { data, error } = await supabase
      .from('revenus')
      .select('*')
      .eq('user_id', userId)
      .eq('recurrent', true)
      .order('montant', { ascending: false });

    if (error) {
      console.error('Error fetching recurrent revenus:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching recurrent revenus:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new revenu
 */
export async function createRevenu(
  userId: string,
  data: RevenuFormData
): Promise<RevenuResponse> {
  try {
    const newRevenu = {
      user_id: userId,
      nom: data.nom,
      montant: data.montant,
      recurrent: data.recurrent,
      date_debut: data.date_debut.toISOString(),
      date_fin: data.date_fin ? data.date_fin.toISOString() : null,
    };

    const { data: revenu, error } = await supabase
      .from('revenus')
      .insert(newRevenu)
      .select()
      .single();

    if (error) {
      console.error('Error creating revenu:', error);
      return { data: null, error };
    }

    return { data: revenu, error: null };
  } catch (error) {
    console.error('Unexpected error creating revenu:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an existing revenu
 */
export async function updateRevenu(
  revenuId: string,
  updates: Partial<RevenuFormData>
): Promise<RevenuResponse> {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.nom !== undefined) updateData.nom = updates.nom;
    if (updates.montant !== undefined) updateData.montant = updates.montant;
    if (updates.recurrent !== undefined)
      updateData.recurrent = updates.recurrent;
    if (updates.date_debut !== undefined)
      updateData.date_debut = updates.date_debut.toISOString();
    if (updates.date_fin !== undefined)
      updateData.date_fin = updates.date_fin
        ? updates.date_fin.toISOString()
        : null;

    const { data, error } = await supabase
      .from('revenus')
      .update(updateData)
      .eq('id', revenuId)
      .select()
      .single();

    if (error) {
      console.error('Error updating revenu:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating revenu:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a revenu
 */
export async function deleteRevenu(revenuId: string): Promise<RevenuResponse> {
  try {
    const { data, error } = await supabase
      .from('revenus')
      .delete()
      .eq('id', revenuId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting revenu:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error deleting revenu:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Calculate total monthly revenus (only recurrent and active)
 */
export async function getTotalRevenusActifs(
  userId: string
): Promise<{ data: number | null; error: Error | null }> {
  try {
    const { data, error } = await getRevenusActifs(userId);

    if (error || !data) {
      return { data: null, error };
    }

    const total = data
      .filter((revenu) => revenu.recurrent)
      .reduce((sum, revenu) => sum + revenu.montant, 0);

    return { data: total, error: null };
  } catch (error) {
    console.error('Unexpected error calculating total revenus:', error);
    return { data: null, error: error as Error };
  }
}
