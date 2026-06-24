import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Prescription {
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  notes: string;
}

export function usePrescription() {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyse = async (complaintId: string, photoUrl: string) => {
    setLoading(true);
    setError('');

    try {
      const { data, error: err } = await supabase.functions.invoke('analyse-photo', {
        body: { complaintId, photoUrl },
      });

      if (err) throw err;
      setPrescription(data as Prescription);
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return { prescription, loading, error, analyse };
}
