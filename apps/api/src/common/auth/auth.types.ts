export type AuthPrincipal = {
  userId: string;
  jwtRole: string;
  platformRole?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'deleted';
};

export type AuthenticatedRequest = {
  auth?: AuthPrincipal;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};
