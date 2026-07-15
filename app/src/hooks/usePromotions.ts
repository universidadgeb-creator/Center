import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Promotion } from '../lib/types';

/** Palette offered when staff give a brand-new promotion a color from the "+ dar de alta" form. */
export const NEW_PROMOTION_COLOR_CHOICES = ['#B42318', '#C4791A', '#946200', '#15803D', '#0891B2', '#1D4ED8', '#9D174D', '#4D7C0F'];

/** Shared, staff-editable list of promotions — same rationale as useRps: one list everyone sees. */
export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('promotions').select('*').order('label', { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setPromotions(data as Promotion[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar a la base de datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel('promotions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const addPromotion = useCallback(async (label: string, color: string) => {
    try {
      const { error } = await supabase.from('promotions').insert({ label, color });
      if (error) {
        setError(error.message);
      } else {
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de alta la promoción.');
    }
  }, [refetch]);

  return { promotions, loading, error, addPromotion, refetch };
}
