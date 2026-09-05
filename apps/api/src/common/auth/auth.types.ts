export type VerifiedSupabaseToken = {
  providerUserId: string;
  jwtRole: string;
};

export type AuthPrincipal = {
  /** Cypher-owned User.id — never the auth provider id */
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
