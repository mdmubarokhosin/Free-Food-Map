'use client';

import { useEffect, useCallback, useSyncExternalStore, useRef, useMemo } from 'react';

const FAVORITES_STORAGE_KEY = 'free-food-map-favorites';

// Cache for the snapshot to avoid infinite loops
let cachedSnapshot: string[] = [];
let cachedSnapshotString = '';

// Subscribe to storage events for cross-tab sync
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  // Also listen for custom event for same-tab updates
  window.addEventListener('favorites-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('favorites-changed', callback);
  };
}

function getSnapshot(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    // Only parse if the string has changed
    if (stored === cachedSnapshotString) {
      return cachedSnapshot;
    }
    cachedSnapshotString = stored || '';
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        cachedSnapshot = parsed;
        return cachedSnapshot;
      }
    }
    cachedSnapshot = [];
    return cachedSnapshot;
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
    cachedSnapshot = [];
    return cachedSnapshot;
  }
}

function getServerSnapshot(): string[] {
  return [];
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLoadedRef = useRef(false);

  // Mark as loaded after initial mount
  useEffect(() => {
    isLoadedRef.current = true;
  }, []);

  const addFavorite = useCallback((spotId: string) => {
    try {
      const current = getSnapshot();
      if (!current.includes(spotId)) {
        const updated = [...current, spotId];
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
        // Invalidate cache
        cachedSnapshotString = JSON.stringify(updated);
        cachedSnapshot = updated;
        // Dispatch custom event to trigger re-render in same tab
        window.dispatchEvent(new CustomEvent('favorites-changed'));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }, []);

  const removeFavorite = useCallback((spotId: string) => {
    try {
      const current = getSnapshot();
      const updated = current.filter((id) => id !== spotId);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      // Invalidate cache
      cachedSnapshotString = JSON.stringify(updated);
      cachedSnapshot = updated;
      // Dispatch custom event to trigger re-render in same tab
      window.dispatchEvent(new CustomEvent('favorites-changed'));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, []);

  const isFavorite = useCallback(
    (spotId: string) => {
      return favorites.includes(spotId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (spotId: string) => {
      if (isFavorite(spotId)) {
        removeFavorite(spotId);
      } else {
        addFavorite(spotId);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const clearFavorites = useCallback(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([]));
      // Invalidate cache
      cachedSnapshotString = '[]';
      cachedSnapshot = [];
      // Dispatch custom event to trigger re-render in same tab
      window.dispatchEvent(new CustomEvent('favorites-changed'));
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  }, []);

  return {
    favorites,
    favoritesCount: favorites.length,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
