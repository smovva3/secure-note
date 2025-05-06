import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const readValue = (): T => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  useEffect(() => {
    if (isClient) {
      setStoredValue(readValue());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, key]); // Added key to dependencies


  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    if (!isClient) {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client. State will be updated in memory but not persisted.`
      );
      // Update local component state even if not client, to avoid UI discrepancies
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);
      } catch (e) {
         console.error("Error computing new state value for localStorage (SSR context):", e);
      }
      return;
    }
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
      throw new Error(`Failed to save to local storage for key "${key}". This could be due to storage limits or other browser restrictions.`);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;

