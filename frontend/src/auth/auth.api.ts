import { apiClient } from '../api/apiClient';
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterOwnerRequest,
  RegisterOwnerResponse,
} from './auth.types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const payload: LoginRequest = { email, password };
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function registerOwner(dto: RegisterOwnerRequest): Promise<RegisterOwnerResponse> {
  const { data } = await apiClient.post<RegisterOwnerResponse>('/auth/register-owner', dto);
  return data;
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const payload: RefreshRequest = { refreshToken };
  const { data } = await apiClient.post<RefreshResponse>('/auth/refresh', payload);
  return data;
}

export async function me(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}
