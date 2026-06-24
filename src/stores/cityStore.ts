import { create } from 'zustand';
import { store } from '../lib/storage';

const CITIES = [
  { id: 'mumbai',    label: 'Mumbai' },
  { id: 'delhi',     label: 'Delhi' },
  { id: 'bangalore', label: 'Bangalore' },
  { id: 'Chennai',   label: 'chennai' },
  { id: 'hyderabad', label: 'Hyderabad' },
  { id: 'pune',      label: 'Pune' },
];

const DEFAULT_WARDS: Record<string, string> = {
  mumbai: 'Bandra',
  delhi: 'Dwarka',
  bangalore: 'Koramangala',
  chennai: 'Adyar',
  hyderabad: 'Gachibowli',
  pune: 'Kothrud',
};

interface CityState {
  cities: typeof CITIES;
  activeCity: string;
  activeWard: string;
  syncActive: boolean;
  bufferSize: number;
  authStatus: 'SECURE' | 'BYPASS';
  setCity: (cityId: string) => void;
  setWard: (wardName: string) => void;
  setSyncActive: (val: boolean) => void;
  setBufferSize: (val: number) => void;
  setAuthStatus: (val: 'SECURE' | 'BYPASS') => void;
  initialize: () => Promise<void>;
}

export const useCityStore = create<CityState>((set) => ({
  cities: CITIES,
  activeCity: 'mumbai',
  activeWard: 'Bandra',
  syncActive: true,
  bufferSize: 42.8,
  authStatus: 'SECURE',

  setCity: (cityId) => {
    const defaultWard = DEFAULT_WARDS[cityId.toLowerCase()] || 'General';
    store.set('active_city', cityId);
    store.set('active_ward', defaultWard);
    set({ activeCity: cityId, activeWard: defaultWard });
  },

  setWard: (wardName) => {
    store.set('active_ward', wardName);
    set({ activeWard: wardName });
  },

  setSyncActive: async (val) => {
    store.set('telemetry_sync_active', val);
    set({ syncActive: val });
    if (val) {
      try {
        const { syncOfflineQueue } = await import('../lib/complaints');
        await syncOfflineQueue();
      } catch (e) {
        console.log('Offline queue sync failed:', e);
      }
      set({ bufferSize: 0.0 });
      store.set('telemetry_buffer_size', 0.0);
    }
  },

  setBufferSize: (val) => {
    store.set('telemetry_buffer_size', val);
    set({ bufferSize: val });
  },

  setAuthStatus: (val) => {
    store.set('telemetry_auth_status', val);
    set({ authStatus: val });
  },

  initialize: async () => {
    const savedCity = await store.get<string>('active_city');
    const savedWard = await store.get<string>('active_ward');
    const savedSyncActive = await store.get<boolean>('telemetry_sync_active');
    const savedBufferSize = await store.get<number>('telemetry_buffer_size');
    const savedAuthStatus = await store.get<'SECURE' | 'BYPASS'>('telemetry_auth_status');

    set((state) => ({
      activeCity: savedCity ?? state.activeCity,
      activeWard: savedWard ?? (savedCity ? (DEFAULT_WARDS[savedCity.toLowerCase()] ?? 'General') : state.activeWard),
      syncActive: savedSyncActive ?? state.syncActive,
      bufferSize: savedBufferSize ?? state.bufferSize,
      authStatus: savedAuthStatus ?? state.authStatus,
    }));
  },
})); 
