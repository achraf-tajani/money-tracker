/**
 * Type definitions for the Money Tracker app
 */

export interface CycleMensuel {
  id: string;
  user_id: string;
  annee: number;
  mois: number;
  salaire_reel: number;
  total_charges: number;
  total_depenses: number;
  reste: number;
  statut: 'actif' | 'cloture';
  devise?: 'EUR' | 'USD' | 'MAD';
  date_debut: Date;
  date_fin: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Revenu {
  id: string;
  user_id: string;
  nom: string;
  montant: number;
  recurrent: boolean;
  date_debut: Date;
  date_fin?: Date;
  created_at: Date;
}

export interface ChargeFix {
  id: string;
  user_id: string;
  nom: string;
  montant: number;
  categorie_id: string;
  jour_prelevement: number;
  actif: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Categorie {
  id: string;
  user_id?: string;
  nom: string;
  icon: string;
  couleur: string;
  budget_max?: number;
  type: 'charge' | 'depense';
  created_at: Date;
}

export interface Depense {
  id: string;
  user_id: string;
  cycle_id: string;
  montant: number;
  categorie_id: string;
  date: Date;
  description?: string;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ComparaisonMensuelle {
  cycle_id: string;
  categorie_id: string;
  total_depense: number;
  variation_vs_precedent: number;
}

// Utility types
export type CategorieType = 'charge' | 'depense';
export type CycleStatut = 'actif' | 'cloture';

// Form data types
export interface DepenseFormData {
  montant: number;
  categorie_id: string;
  date: Date;
  description?: string;
  tags?: string[];
}

export interface ChargeFormData {
  nom: string;
  montant: number;
  categorie_id: string;
  jour_prelevement: number;
  actif: boolean;
}

export interface RevenuFormData {
  nom: string;
  montant: number;
  recurrent: boolean;
  date_debut: Date;
  date_fin?: Date;
}

export interface CategorieFormData {
  nom: string;
  icon: string;
  couleur: string;
  budget_max?: number;
  type: CategorieType;
}
