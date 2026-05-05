import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (apiCall: Promise<any>, options?: UseApiOptions) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall;
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
      return data;
    } catch (err: any) {
      console.error('API Error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error en la operación';
      setError(errorMessage);
      if (options?.onError) {
        options.onError(err);
      } else {
        toast.error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, request };
}
