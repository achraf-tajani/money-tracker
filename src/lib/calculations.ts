import type { CycleMensuel } from '@/types';

/**
 * Calculate the remaining amount for a cycle
 */
export function calculerReste(cycle: CycleMensuel): number {
  const { salaire_reel, total_charges, total_depenses } = cycle;
  return salaire_reel - total_charges - total_depenses;
}

/**
 * Calculate the percentage of budget used
 */
export function calculerPourcentageUtilise(
  salaire: number,
  charges: number,
  depenses: number
): number {
  const total = charges + depenses;
  if (salaire === 0) return 0;
  return (total / salaire) * 100;
}

/**
 * Check if budget is exceeded
 */
export function isBudgetExceeded(
  salaire: number,
  charges: number,
  depenses: number
): boolean {
  return charges + depenses > salaire;
}

/**
 * Calculate savings rate
 */
export function calculerTauxEpargne(reste: number, salaire: number): number {
  if (salaire === 0) return 0;
  return (reste / salaire) * 100;
}
