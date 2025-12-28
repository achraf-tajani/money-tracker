import { supabase } from '@/lib/supabase';
import type { CycleMensuel } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Cycles Service
 * Manages monthly budget cycles (création, clôture, récupération)
 */

interface CycleResponse {
  data: CycleMensuel | null;
  error: Error | null;
}

interface CyclesResponse {
  data: CycleMensuel[] | null;
  error: Error | null;
}

/**
 * Get the active cycle for a user
 * Returns the cycle with statut='actif'
 */
export async function getCycleActif(userId: string): Promise<CycleResponse> {
  try {
    const { data, error } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('user_id', userId)
      .eq('statut', 'actif')
      .maybeSingle();

    if (error) {
      console.error('Error fetching active cycle:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching active cycle:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all cycles for a user, ordered by date (most recent first)
 */
export async function getAllCycles(userId: string): Promise<CyclesResponse> {
  try {
    const { data, error } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('user_id', userId)
      .order('annee', { ascending: false })
      .order('mois', { ascending: false });

    if (error) {
      console.error('Error fetching all cycles:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching all cycles:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a specific cycle by ID
 */
export async function getCycleById(cycleId: string): Promise<CycleResponse> {
  try {
    const { data, error } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (error) {
      console.error('Error fetching cycle by ID:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching cycle by ID:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new monthly cycle
 * Automatically calculates total_charges and sets dates
 */
export async function createCycle(
  userId: string,
  salaire: number,
  annee: number,
  mois: number,
  totalCharges = 0,
  devise: 'EUR' | 'USD' | 'MAD' = 'EUR'
): Promise<CycleResponse> {
  try {
    // Calculate cycle dates
    const cycleDate = new Date(annee, mois - 1, 1);
    const dateDebut = startOfMonth(cycleDate);
    const dateFin = endOfMonth(cycleDate);

    const newCycle = {
      user_id: userId,
      annee,
      mois,
      salaire_reel: salaire,
      total_charges: totalCharges,
      total_depenses: 0,
      reste: salaire - totalCharges,
      statut: 'actif' as const,
      devise,
      date_debut: dateDebut.toISOString(),
      date_fin: dateFin.toISOString(),
    };

    const { data, error } = await supabase
      .from('cycles_mensuels')
      .insert(newCycle)
      .select()
      .single();

    if (error) {
      console.error('Error creating cycle:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating cycle:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Close an active cycle
 * Sets statut to 'cloture' and recalculates final totals
 * IMPORTANT: Recalculates total_charges from active charges to freeze the real amount at closure time
 */
export async function closeCycle(cycleId: string): Promise<CycleResponse> {
  try {
    // First, get the current cycle data
    const { data: currentCycle, error: fetchError } = await supabase
      .from('cycles_mensuels')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (fetchError || !currentCycle) {
      console.error('Error fetching cycle to close:', fetchError);
      return { data: null, error: fetchError };
    }

    // Get the REAL total of active charges at the moment of closure
    const { data: activeCharges, error: chargesError } = await supabase
      .from('charges_fixes')
      .select('montant')
      .eq('user_id', currentCycle.user_id)
      .eq('actif', true);

    if (chargesError) {
      console.error('Error fetching charges for closure:', chargesError);
      return { data: null, error: chargesError };
    }

    // Calculate the real total of charges
    const totalCharges = activeCharges?.reduce((sum, charge) => {
      const montant = typeof charge.montant === 'string' ? parseFloat(charge.montant) : charge.montant;
      return sum + montant;
    }, 0) || 0;

    // Calculate final reste with the updated total_charges
    const reste = currentCycle.salaire_reel - totalCharges - currentCycle.total_depenses;

    // Update cycle with final calculations - FREEZE the real values
    const { data, error } = await supabase
      .from('cycles_mensuels')
      .update({
        statut: 'cloture',
        total_charges: totalCharges, // Update with the real total at closure time
        reste,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycleId)
      .select()
      .single();

    if (error) {
      console.error('Error closing cycle:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error closing cycle:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update cycle data (salaire, charges, depenses)
 */
export async function updateCycle(
  cycleId: string,
  updates: Partial<CycleMensuel>
): Promise<CycleResponse> {
  try {
    // Recalculate reste if relevant fields are updated
    if (
      updates.salaire_reel !== undefined ||
      updates.total_charges !== undefined ||
      updates.total_depenses !== undefined
    ) {
      const { data: current } = await supabase
        .from('cycles_mensuels')
        .select('salaire_reel, total_charges, total_depenses')
        .eq('id', cycleId)
        .single();

      if (current) {
        const salaire = updates.salaire_reel ?? current.salaire_reel;
        const charges = updates.total_charges ?? current.total_charges;
        const depenses = updates.total_depenses ?? current.total_depenses;

        updates.reste = salaire - charges - depenses;
      }
    }

    const { data, error } = await supabase
      .from('cycles_mensuels')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cycle:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating cycle:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a cycle (use with caution - will cascade delete related data)
 */
export async function deleteCycle(cycleId: string): Promise<CycleResponse> {
  try {
    const { data, error } = await supabase
      .from('cycles_mensuels')
      .delete()
      .eq('id', cycleId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting cycle:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error deleting cycle:', error);
    return { data: null, error: error as Error };
  }
}
