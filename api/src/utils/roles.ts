const ROLE_ALIASES: Record<string, string> = {
  admin: 'admin',
  seller: 'seller',
  agent: 'seller',
  guest: 'guest',
  user: 'guest',
};

export const normalizeRole = (role?: string | null) => {
  const key = role?.trim().toLowerCase();
  return key ? ROLE_ALIASES[key] || key : 'guest';
};

export const isAdminRole = (role?: string | null) => normalizeRole(role) === 'admin';

export const isSellerRole = (role?: string | null) => normalizeRole(role) === 'seller';

export const hasRole = (actualRole: string | null | undefined, allowedRoles: string[]) => {
  const actual = normalizeRole(actualRole);
  return allowedRoles.map(normalizeRole).includes(actual);
};
