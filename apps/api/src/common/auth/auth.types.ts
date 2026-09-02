export type AuthPrincipal = {
  userId: string;
  jwtRole: string;
};

export type AuthenticatedRequest = {
  auth?: AuthPrincipal;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};
