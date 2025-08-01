import { useState, useEffect } from "react";

function useDebouncedState(initialValue, delay) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler); // Cleanup timeout on value change
    };
  }, [value, delay]);

  return [value, setValue, debouncedValue];
}

export default useDebouncedState;
