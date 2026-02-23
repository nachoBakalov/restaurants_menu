export type AuthUser = {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'OWNER' | 'STAFF';
  restaurantId: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: AuthUser;
};
