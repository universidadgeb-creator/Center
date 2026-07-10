import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StaffComment } from '../lib/types';

export function useComments(memberId: string | null) {
  const [comments, setComments] = useState<StaffComment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!memberId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: true });
      if (!error) setComments(data as StaffComment[]);
    } catch {
      // swallow — VistaSocio shows the "no comments" empty state either way
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addComment = useCallback(async (staff: string, text: string) => {
    if (!memberId || !text.trim()) return;
    const comment_date = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ member_id: memberId, staff, comment_date, text: text.trim() })
        .select()
        .single();
      if (!error && data) {
        setComments(prev => [...prev, data as StaffComment]);
      }
      return error;
    } catch (err) {
      return err;
    }
  }, [memberId]);

  return { comments, loading, addComment };
}
