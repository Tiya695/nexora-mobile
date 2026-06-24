import { supabase } from './supabase';
import { offlineQueue } from './offlineQueue';
import NetInfo from '@react-native-community/netinfo';

export interface Complaint {
  id?: string;
  title: string;
  description: string;
  category: string;
  photo_url?: string;
  after_photo_url?: string;
  latitude?: number;
  longitude?: number;
  city: string;
  status?: string;
  created_at?: string;
  severity?: string;
  ward?: string;
}

export async function submitComplaint(complaint: Complaint): Promise<boolean> {
  const net = await NetInfo.fetch();

  if (!net.isConnected) {
    await offlineQueue.add('SUBMIT_COMPLAINT', complaint);
    return true;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData.user?.id;

 const { data, error } = await supabase
    .from('complaints')
    .insert({
      ...complaint,
      user_id,
      severity: 'medium',
      ward: 'General',
    })
    .select();

  console.log('Supabase insert result:', JSON.stringify({ data, error }));

  if (error) {
    await offlineQueue.add('SUBMIT_COMPLAINT', complaint);
    return false;
  }

  return true;
}

export async function syncOfflineQueue(): Promise<void> {
  const net = await NetInfo.fetch();
  if (!net.isConnected) return;

  const { offlineQueue: queue } = await import('./offlineQueue');
  const items = await queue.getAll();

  for (const item of items) {
    if (item.type === 'SUBMIT_COMPLAINT') {
      const { error } = await supabase
        .from('complaints')
        .insert(item.payload);
      if (!error) await queue.remove(item.id);
    }
  }
}