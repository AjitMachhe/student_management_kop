export const STANDARDS_LIST = [
  '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

export const MEDIUMS_LIST = [
  'Marathi',
  'English',
  'Semi-English',
];

export const ACADEMIC_YEARS_LIST = [
  '2022-23',    
  '2023-24',
  '2025-26',
  '2026-27',
  '2027-28',
  '2028-29',
  '2029-30',
];

export function isValidIndianMobile(phone, required = true) {
  if (!phone || !String(phone).trim()) {
    return !required;
  }
  const cleaned = String(phone).replace(/[\s-]/g, '');
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

export function isValidSchoolPhone(phone) {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[\s-]/g, '');
  return /^[0-9]{10,12}$/.test(cleaned);
}

export function isValidPinCode(pin) {
  if (!pin) return false;
  return /^[1-9][0-9]{5}$/.test(String(pin).trim());
}

export function isValidEmail(email) {
  if (!email || !email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}