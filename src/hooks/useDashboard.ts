import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  getCycleActif,
  getRecentDepenses,
  getDepensesParCategorie,
  getChargesActives,
} from '@/services';
import type { CycleMensuel, Depense, Categorie } from '@/types';
import type { DepenseParCategorie } from '@/services/stats.service';

/**
 * Extended Depense type with joined category data
 */
export interface DepenseWithCategorie extends Depense {
  categorie?: Categorie;
}

/**
 * Dashboard data and state interface
 */
export interface DashboardData {
  cycle: CycleMensuel | null;
  totalChargesActives: number;
  recentDepenses: DepenseWithCategorie[];
  depensesParCategorie: DepenseParCategorie[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to manage dashboard data and state
 * Centralizes all data fetching logic for the dashboard
 */
export function useDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    cycle: null,
    totalChargesActives: 0,
    recentDepenses: [],
    depensesParCategorie: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        // Fetch active cycle
        const { data: cycle, error: cycleError } = await getCycleActif(user.id);

        if (cycleError) {
          // No active cycle - not an error, just empty state
          setData({
            cycle: null,
            totalChargesActives: 0,
            recentDepenses: [],
            depensesParCategorie: [],
            loading: false,
            error: null,
          });
          return;
        }

        if (!cycle) {
          setData({
            cycle: null,
            totalChargesActives: 0,
            recentDepenses: [],
            depensesParCategorie: [],
            loading: false,
            error: null,
          });
          return;
        }

        // Fetch data in parallel for better performance
        const [chargesResult, depensesResult, categoriesResult] = await Promise.all([
          getChargesActives(user.id),
          getRecentDepenses(cycle.id, 5),
          getDepensesParCategorie(cycle.id),
        ]);

        // Calculate total of active charges
        const totalCharges = chargesResult.data?.reduce((sum, charge) => sum + charge.montant, 0) || 0;

        setData({
          cycle,
          totalChargesActives: totalCharges,
          recentDepenses: depensesResult.data || [],
          depensesParCategorie: categoriesResult.data || [],
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  return data;
}
