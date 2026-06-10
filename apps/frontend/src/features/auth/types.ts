export type User = {
  id: number;
  email: string;
  is_active: boolean;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};