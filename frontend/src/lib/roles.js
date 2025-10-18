export function hasRole(session, allowedRoles = []) {
  if (!session?.user) return false;
  const role = session.user.role;
  if (role === "ADMIN") return true; // admin bypass
  return allowedRoles.includes(role);
}
