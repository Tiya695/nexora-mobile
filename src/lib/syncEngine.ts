import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from './offlineQueue';
import { supabase } from './supabase';

let unsubscribe: (() => void) | null = null;

export function startSyncEngine() {
  if (unsubscribe) return;

  unsubscribe = NetInfo.addEventListener(async (state) => {
    if (!state.isConnected) return;

    const queue = await offlineQueue.getAll();
    if (queue.length === 0) return;

    console.log(`[Sync] Online — syncing ${queue.length} queued items`);

    for (const item of queue) {
      try {
        if (item.type === 'SUBMIT_COMPLAINT') {
          const { error } = await supabase
            .from('complaints')
            .insert(item.payload);
          if (!error) {
            await offlineQueue.remove(item.id);
            console.log(`[Sync] Synced complaint ${item.id}`);
          }
        }
      } catch (e) {
        console.error(`[Sync] Failed to sync item ${item.id}:`, e);
      }
    }
  });
}

export function stopSyncEngine() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
