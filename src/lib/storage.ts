import AsyncStorage from '@react-native-async-storage/async-storage';

export const store = {
  set: async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  get: async <T>(key: string): Promise<T | null> => {
    const val = await AsyncStorage.getItem(key);
    if (!val) return null;
    try { return JSON.parse(val) as T; }
    catch { return null; }
  },

  delete: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },

  clear: async () => {
    await AsyncStorage.clear();
  },
};
