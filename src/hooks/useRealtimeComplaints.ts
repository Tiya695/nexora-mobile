import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Complaint } from '../lib/complaints';

export function useRealtimeComplaints(city: string) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchComplaints = async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('city', city)
        .order('created_at', { ascending: false });

      if (!error && data) setComplaints(data);
      setLoading(false);
    };

    fetchComplaints();

    // Realtime subscription with a unique channel name to prevent callback collisions
    const channelName = `complaints-changes-${city}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComplaints(prev => [payload.new as Complaint, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setComplaints(prev =>
              prev.map(c => c.id === payload.new.id ? payload.new as Complaint : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [city]);

  return { complaints, loading };
}
