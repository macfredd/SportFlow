export function ageInYearsFromIsoDate(isoDate: string | null | undefined): number | null {
  if (isoDate == null || String(isoDate).trim() === '') {
    return null;
  }
  const parts = String(isoDate).trim().split('-').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }
  const [y, month, day] = parts;
  const birth = new Date(y, month - 1, day);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}
