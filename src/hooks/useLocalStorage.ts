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
  }, [isClient, key]);


  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    if (!isClient && typeof window !== 'undefined') { // Added typeof window check for safety, though isClient should cover
        // Still update local component state if not client or localStorage fails, to avoid UI discrepancies if possible
        try {
          const newValue = value instanceof Function ? value(storedValue) : value;
          setStoredValue(newValue);
        } catch (e) {
           console.error("Error computing new state value for localStorage (SSR context or LS failure):", e);
        }
        if(!isClient) {
            console.warn(
                `Tried setting localStorage key “${key}” even though environment is not a client. State will be updated in memory but not persisted.`
              );
        }
        return;
      }

    let newValueToSet;
    try {
      newValueToSet = value instanceof Function ? value(storedValue) : value;
    } catch (error) {
        console.error(`Error computing new value for localStorage key “${key}”:`, error);
        // Do not proceed if the value computation itself fails
        return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(newValueToSet));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error, ". The value will be set in memory only for this session if possible.");
      // Do not re-throw. The value will still be updated in the component's state.
    }
    setStoredValue(newValueToSet);
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
