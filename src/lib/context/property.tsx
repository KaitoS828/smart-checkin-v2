'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Property } from '@/lib/supabase/types';

const STORAGE_KEY = 'selected_property_id';

interface PropertyContextValue {
  properties: Property[];
  selectedProperty: Property | null;
  setSelectedPropertyId: (id: string) => void;
  isLoading: boolean;
  reload: () => void;
}

const PropertyContext = createContext<PropertyContextValue>({
  properties: [],
  selectedProperty: null,
  setSelectedPropertyId: () => {},
  isLoading: true,
  reload: () => {},
});

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/properties');
      if (!res.ok) return;
      const data = await res.json();
      const list: Property[] = data.properties ?? [];
      setProperties(list);

      // Restore from localStorage, or auto-select first
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved && list.some((p) => p.id === saved)) {
        setSelectedId(saved);
      } else if (list.length > 0) {
        setSelectedId(list[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setSelectedPropertyId = useCallback((id: string) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null;

  return (
    <PropertyContext.Provider value={{ properties, selectedProperty, setSelectedPropertyId, isLoading, reload: load }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  return useContext(PropertyContext);
}
