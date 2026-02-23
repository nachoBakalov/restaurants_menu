export type UserRole = 'SUPERADMIN' | 'OWNER' | 'STAFF';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  restaurantId: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RegisterOwnerRequest = {
  email: string;
  password: string;
  restaurantName: string;
  slug: string;
};

export type RegisterOwnerResponse = LoginResponse | { ok: true } | unknown;

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};
