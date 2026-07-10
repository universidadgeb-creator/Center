import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, MemberPatch } from '../lib/types';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setMembers(data as Member[]);
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
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const updateMember = useCallback(async (id: string, patch: MemberPatch) => {
    // optimistic update
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
    try {
      const { error } = await supabase.from('members').update(patch).eq('id', id);
      if (error) {
        setError(error.message);
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cambio.');
      refetch();
    }
  }, [refetch]);

  return { members, loading, error, updateMember, refetch };
}
