import type { AuthResponse } from '../api/types';

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  restaurantName: string;
  slug: string;
};

export async function loginRequest(_input: LoginInput): Promise<AuthResponse> {
  throw new Error('API логиката ще се имплементира в следваща стъпка.');
}

export async function registerRequest(_input: RegisterInput): Promise<AuthResponse> {
  throw new Error('API логиката ще се имплементира в следваща стъпка.');
}
