import { supabase } from '@/lib/supabase';
import type { ChargeFix, ChargeFormData } from '@/types';

/**
 * Charges Service
 * Manages fixed monthly charges (loyer, assurances, abonnements, etc.)
 */

interface ChargeResponse {
  data: ChargeFix | null;
  error: Error | null;
}

interface ChargesResponse {
  data: ChargeFix[] | null;
  error: Error | null;
}

/**
 * Get all charges for a user
 */
export async function getCharges(userId: string): Promise<ChargesResponse> {
  try {
    const { data, error } = await supabase
      .from('charges_fixes')
      .select('*, categorie:categories(*)')
      .eq('user_id', userId)
      .order('montant', { ascending: false });

    if (error) {
      console.error('Error fetching charges:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching charges:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get only active charges (actif = true)
 */
export async function getChargesActives(
  userId: string
): Promise<ChargesResponse> {
  try {
    const { data, error } = await supabase
      .from('charges_fixes')
      .select('*, categorie:categories(*)')
      .eq('user_id', userId)
      .eq('actif', true)
      .order('jour_prelevement', { ascending: true });

    if (error) {
      console.error('Error fetching active charges:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching active charges:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get charges by category
 */
export async function getChargesByCategorie(
  userId: string,
  categorieId: string
): Promise<ChargesResponse> {
  try {
    const { data, error } = await supabase
      .from('charges_fixes')
      .select('*, categorie:categories(*)')
      .eq('user_id', userId)
      .eq('categorie_id', categorieId)
      .order('montant', { ascending: false });

    if (error) {
      console.error('Error fetching charges by category:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching charges by category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new charge
 */
export async function createCharge(
  userId: string,
  data: ChargeFormData
): Promise<ChargeResponse> {
  try {
    const newCharge = {
      user_id: userId,
      nom: data.nom,
      montant: data.montant,
      categorie_id: data.categorie_id,
      jour_prelevement: data.jour_prelevement,
      actif: data.actif ?? true,
    };

    const { data: charge, error } = await supabase
      .from('charges_fixes')
      .insert(newCharge)
      .select('*, categorie:categories(*)')
      .single();

    if (error) {
      console.error('Error creating charge:', error);
      return { data: null, error };
    }

    return { data: charge, error: null };
  } catch (error) {
    console.error('Unexpected error creating charge:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an existing charge
 */
export async function updateCharge(
  chargeId: string,
  updates: Partial<ChargeFormData>
): Promise<ChargeResponse> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.nom !== undefined) updateData.nom = updates.nom;
    if (updates.montant !== undefined) updateData.montant = updates.montant;
    if (updates.categorie_id !== undefined)
      updateData.categorie_id = updates.categorie_id;
    if (updates.jour_prelevement !== undefined)
      updateData.jour_prelevement = updates.jour_prelevement;
    if (updates.actif !== undefined) updateData.actif = updates.actif;

    const { data, error } = await supabase
      .from('charges_fixes')
      .update(updateData)
      .eq('id', chargeId)
      .select('*, categorie:categories(*)')
      .single();

    if (error) {
      console.error('Error updating charge:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating charge:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a charge
 */
export async function deleteCharge(chargeId: string): Promise<ChargeResponse> {
  try {
    const { data, error } = await supabase
      .from('charges_fixes')
      .delete()
      .eq('id', chargeId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting charge:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error deleting charge:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Toggle charge active status
 */
export async function toggleChargeActive(
  chargeId: string,
  actif: boolean
): Promise<ChargeResponse> {
  try {
    const { data, error } = await supabase
      .from('charges_fixes')
      .update({ actif, updated_at: new Date().toISOString() })
      .eq('id', chargeId)
      .select('*, categorie:categories(*)')
      .single();

    if (error) {
      console.error('Error toggling charge active status:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error toggling charge active status:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Calculate total of all active charges
 */
export async function getTotalCharges(
  userId: string
): Promise<{ data: number | null; error: Error | null }> {
  try {
    const { data, error } = await getChargesActives(userId);

    if (error || !data) {
      return { data: null, error };
    }

    const total = data.reduce((sum, charge) => sum + charge.montant, 0);

    return { data: total, error: null };
  } catch (error) {
    console.error('Unexpected error calculating total charges:', error);
    return { data: null, error: error as Error };
  }
}
