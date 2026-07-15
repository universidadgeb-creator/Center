import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Rp } from '../lib/types';

/** Shared, staff-editable roster of RP names — every user sees the same list, and adding one
 * from the "+ dar de alta" button persists it for everyone instead of just the local browser. */
export function useRps() {
  const [rps, setRps] = useState<Rp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('rps').select('*').order('name', { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setRps(data as Rp[]);
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
      .channel('rps-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rps' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const addRp = useCallback(async (name: string) => {
    try {
      const { error } = await supabase.from('rps').insert({ name });
      if (error) {
        setError(error.message);
      } else {
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de alta el RP.');
    }
  }, [refetch]);

  return { rps, loading, error, addRp, refetch };
}
