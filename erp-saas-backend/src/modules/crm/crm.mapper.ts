const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export function mapUser(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
} | null | undefined) {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return { id: user.id, name: name || user.email, email: user.email };
}

export const crmUserInclude = {
  assignedTo: { select: userSelect },
  createdBy: { select: userSelect },
};

export { userSelect };
