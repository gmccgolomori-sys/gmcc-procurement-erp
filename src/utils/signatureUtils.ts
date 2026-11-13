import { UserAccount } from '../types/procurement';
import { SAMPLE_SIGNATURES } from '../data/procurementMock';

/**
 * Utility to resolve a real digital specimen signature linked to Admin User Management.
 * If an admin/user uploads or draws a signature in Master Data / Admin, it will
 * dynamically override any default sample signature across all official documents.
 */
export const getSpecimenSignature = (
  users: UserAccount[] = [],
  identifier?: { name?: string; role?: string; username?: string; id?: string },
  defaultFallback?: string
): string => {
  if (!identifier) return defaultFallback || SAMPLE_SIGNATURES.AGUS_ACCOUNTING;

  // 1. Priority: Direct match by User ID
  if (identifier.id) {
    const found = users.find(u => u.id === identifier.id);
    if (found?.signatureUrl) return found.signatureUrl;
  }

  // 2. Match by exact or partial user name
  if (identifier.name) {
    const cleanName = identifier.name.trim().toLowerCase();
    const found = users.find(u => {
      const uName = u.name.toLowerCase();
      return uName === cleanName || uName.includes(cleanName) || cleanName.includes(uName);
    });
    if (found?.signatureUrl) return found.signatureUrl;
  }

  // 3. Match by username
  if (identifier.username) {
    const cleanUsername = identifier.username.trim().toLowerCase();
    const found = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (found?.signatureUrl) return found.signatureUrl;
  }

  // 4. Match by role designation
  if (identifier.role) {
    const targetRole = identifier.role.trim().toUpperCase();
    const found = users.find(u => {
      const uRole = u.role.toUpperCase();
      if (uRole === targetRole) return true;
      if (targetRole.includes('GM') && (uRole === 'GENERAL_MANAGER' || u.name.toLowerCase().includes('ari'))) return true;
      if (targetRole.includes('ACCOUNTING') && (uRole === 'FINANCE' || uRole === 'ADMIN' || u.name.toLowerCase().includes('agus'))) return true;
      if (targetRole.includes('PURCHASING') && (uRole === 'PURCHASING' || u.name.toLowerCase().includes('putu'))) return true;
      if (targetRole.includes('CHEF') && (uRole === 'CHEF' || uRole === 'HEAD_DEPT' || u.name.toLowerCase().includes('chef') || u.name.toLowerCase().includes('made'))) return true;
      if (targetRole.includes('STOREKEEPER') && (uRole === 'STOREKEEPER' || u.name.toLowerCase().includes('gudang'))) return true;
      return false;
    });
    if (found?.signatureUrl) return found.signatureUrl;
  }

  // 5. Intelligent Fallbacks
  if (identifier.name?.toLowerCase().includes('ari') || identifier.role?.toUpperCase().includes('GM')) {
    return SAMPLE_SIGNATURES.ARI_GM;
  }
  if (identifier.name?.toLowerCase().includes('agus') || identifier.role?.toUpperCase().includes('ACCOUNTING') || identifier.role?.toUpperCase().includes('FINANCE')) {
    return SAMPLE_SIGNATURES.AGUS_ACCOUNTING;
  }
  if (identifier.name?.toLowerCase().includes('putu') || identifier.role?.toUpperCase().includes('PURCHASING') || identifier.role?.toUpperCase().includes('OPERATION')) {
    return SAMPLE_SIGNATURES.PUTU_OPERATION || SAMPLE_SIGNATURES.PURCHASING;
  }
  if (identifier.role?.toUpperCase().includes('CHEF') || identifier.name?.toLowerCase().includes('chef') || identifier.name?.toLowerCase().includes('made')) {
    return SAMPLE_SIGNATURES.CHEF;
  }

  return defaultFallback || SAMPLE_SIGNATURES.AGUS_ACCOUNTING;
};
