import { supabase } from '@/lib/supabase';
import type { Categorie, CategorieFormData, CategorieType } from '@/types';

/**
 * Categories Service
 * Manages expense and charge categories (both default and user-created)
 */

interface CategorieResponse {
  data: Categorie | null;
  error: Error | null;
}

interface CategoriesResponse {
  data: Categorie[] | null;
  error: Error | null;
}

/**
 * Get all categories for a user (includes default categories with user_id = null)
 */
export async function getCategories(
  userId: string
): Promise<CategoriesResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('type', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get categories by type (charge or depense)
 */
export async function getCategoriesByType(
  userId: string,
  type: CategorieType
): Promise<CategoriesResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('type', type)
      .order('nom', { ascending: true });

    if (error) {
      console.error('Error fetching categories by type:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching categories by type:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get default categories (user_id = null)
 */
export async function getDefaultCategories(): Promise<CategoriesResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('user_id', null)
      .order('type', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      console.error('Error fetching default categories:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching default categories:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get user-created categories only
 */
export async function getUserCategories(
  userId: string
): Promise<CategoriesResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      console.error('Error fetching user categories:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching user categories:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a specific category by ID
 */
export async function getCategorieById(
  categorieId: string
): Promise<CategorieResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categorieId)
      .single();

    if (error) {
      console.error('Error fetching category by ID:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching category by ID:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new custom category
 */
export async function createCategorie(
  userId: string,
  data: CategorieFormData
): Promise<CategorieResponse> {
  try {
    const newCategorie = {
      user_id: userId,
      nom: data.nom,
      icon: data.icon,
      couleur: data.couleur,
      budget_max: data.budget_max || null,
      type: data.type,
    };

    const { data: categorie, error } = await supabase
      .from('categories')
      .insert(newCategorie)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return { data: null, error };
    }

    return { data: categorie, error: null };
  } catch (error) {
    console.error('Unexpected error creating category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an existing category
 * Note: Can only update user-created categories (not default ones)
 */
export async function updateCategorie(
  categorieId: string,
  userId: string,
  updates: Partial<CategorieFormData>
): Promise<CategorieResponse> {
  try {
    // Check that the category belongs to the user
    const { data: existing } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', categorieId)
      .single();

    if (!existing || existing.user_id !== userId) {
      return {
        data: null,
        error: new Error(
          'Cannot update default categories or categories from other users'
        ),
      };
    }

    const updateData: Record<string, unknown> = {};

    if (updates.nom !== undefined) updateData.nom = updates.nom;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.couleur !== undefined) updateData.couleur = updates.couleur;
    if (updates.budget_max !== undefined)
      updateData.budget_max = updates.budget_max;
    if (updates.type !== undefined) updateData.type = updates.type;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categorieId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a category
 * Note: Can only delete user-created categories (not default ones)
 */
export async function deleteCategorie(
  categorieId: string,
  userId: string
): Promise<CategorieResponse> {
  try {
    // Check that the category belongs to the user
    const { data: existing } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', categorieId)
      .single();

    if (!existing || existing.user_id !== userId) {
      return {
        data: null,
        error: new Error(
          'Cannot delete default categories or categories from other users'
        ),
      };
    }

    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categorieId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting category:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error deleting category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Check if a category name already exists for a user
 */
export async function isCategorieNameExists(
  userId: string,
  nom: string,
  excludeId?: string
): Promise<{ data: boolean | null; error: Error | null }> {
  try {
    let query = supabase
      .from('categories')
      .select('id')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .ilike('nom', nom);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking category name:', error);
      return { data: null, error };
    }

    return { data: data && data.length > 0, error: null };
  } catch (error) {
    console.error('Unexpected error checking category name:', error);
    return { data: null, error: error as Error };
  }
}
