import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Lead, LeadInsert, LeadPatch } from '../lib/types';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      // PostgREST caps a single response at 1000 rows, so page through with
      // .range() until a page comes back short — otherwise leads past the
      // 1000th (ordered by created_at) silently never show up in the portal.
      const PAGE_SIZE = 1000;
      const all: Lead[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) {
          setError(error.message);
          return;
        }
        all.push(...(data as Lead[]));
        if (!data || data.length < PAGE_SIZE) break;
      }
      setError(null);
      setLeads(all);
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

  /** Bulk insert (used by the Excel upload in Pizarra) — one request instead of N. Returns
   * how many rows were actually inserted, so the caller can show an import summary. */
  const addLeads = useCallback(async (newLeads: LeadInsert[]): Promise<number> => {
    if (newLeads.length === 0) return 0;
    try {
      const { error, count } = await supabase.from('leads').insert(newLeads, { count: 'exact' });
      if (error) {
        setError(error.message);
        return 0;
      }
      refetch();
      return count ?? newLeads.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear los leads.');
      return 0;
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

  const deleteLead = useCallback(async (id: string) => {
    const prev = leads;
    setLeads(current => current.filter(l => l.id !== id));
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) {
        setError(error.message);
        setLeads(prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar el lead.');
      setLeads(prev);
    }
  }, [leads]);

  /** Bulk delete (used by "Borrar todos" in Pizarra) — one request instead of N. */
  const deleteLeads = useCallback(async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return true;
    const prev = leads;
    setLeads(current => current.filter(l => !ids.includes(l.id)));
    try {
      const { error } = await supabase.from('leads').delete().in('id', ids);
      if (error) {
        setError(error.message);
        setLeads(prev);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar los leads.');
      setLeads(prev);
      return false;
    }
  }, [leads]);

  return { leads, loading, error, addLead, addLeads, updateLead, deleteLead, deleteLeads, refetch };
}
