import { store } from './storage';

const QUEUE_KEY = 'offline_queue';

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  createdAt: number;
}

export const offlineQueue = {
  add: async (type: string, payload: any) => {
    const queue = await offlineQueue.getAll();
    const item: QueuedAction = {
      id: Math.random().toString(36).slice(2),
      type,
      payload,
      createdAt: Date.now(),
    };
    queue.push(item);
    await store.set(QUEUE_KEY, queue);
  },

  getAll: async (): Promise<QueuedAction[]> => {
    const res = await store.get<QueuedAction[]>(QUEUE_KEY);
    return res ?? [];
  },

  remove: async (id: string) => {
    const queue = (await offlineQueue.getAll()).filter(i => i.id !== id);
    await store.set(QUEUE_KEY, queue);
  },

  clear: async () => {
    await store.delete(QUEUE_KEY);
  },
}; 
