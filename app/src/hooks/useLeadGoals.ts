import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { LeadGoal } from '../lib/types';

export function useLeadGoals() {
  const [goals, setGoals] = useState<LeadGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('lead_goals').select('*');
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setGoals(data as LeadGoal[]);
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
      .channel('lead-goals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_goals' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const setGoal = useCallback(async (month: string, rp: string, meta_altas: number) => {
    setGoals(prev => {
      const idx = prev.findIndex(g => g.month === month && g.rp === rp);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], meta_altas };
      return next;
    });
    try {
      const { error } = await supabase
        .from('lead_goals')
        .upsert({ month, rp, meta_altas }, { onConflict: 'month,rp' });
      if (error) {
        setError(error.message);
      }
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la meta.');
      refetch();
    }
  }, [refetch]);

  return { goals, loading, error, setGoal, refetch };
}
