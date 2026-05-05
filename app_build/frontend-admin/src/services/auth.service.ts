import { api } from '../api/axios';
import type { AuthResponse } from '../types/models';

export const authService = {
  login: async (numero_documento: string, password: string): Promise<AuthResponse> => {
    // We don't use the standard `api` instance here for login because it might have interceptors 
    // that expect a token, or we might just want to keep it clean. But `api` is fine as long as 
    // it doesn't fail if token is null.
    const response = await api.post<AuthResponse>('/auth/token/', {
      numero_documento,
      password,
    });
    return response.data;
  },
};
