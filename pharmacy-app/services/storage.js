import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CART_ITEMS: 'cartItems',
};

export const storage = {
  // Auth token
  setAuthToken: async (token) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  getAuthToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  removeAuthToken: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  },

  // User data
  setUserData: async (userData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  removeUserData: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  },

  // Cart items
  setCartItems: async (cartItems) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart items:', error);
    }
  },

  getCartItems: async () => {
    try {
      const cartItems = await AsyncStorage.getItem(STORAGE_KEYS.CART_ITEMS);
      return cartItems ? JSON.parse(cartItems) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  },

  clearCart: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  // Clear all data
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.CART_ITEMS,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
};
