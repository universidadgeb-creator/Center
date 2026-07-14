import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Lead, LeadInsert, LeadPatch } from '../lib/types';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setLeads(data as Lead[]);
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
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const addLead = useCallback(async (lead: LeadInsert) => {
    try {
      const { error } = await supabase.from('leads').insert(lead);
      if (error) {
        setError(error.message);
      } else {
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el lead.');
    }
  }, [refetch]);

  const updateLead = useCallback(async (id: string, patch: LeadPatch) => {
    // optimistic update
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
    try {
      const { error } = await supabase.from('leads').update(patch).eq('id', id);
      if (error) {
        setError(error.message);
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio.');
      refetch();
    }
  }, [refetch]);

  return { leads, loading, error, addLead, updateLead, refetch };
}
