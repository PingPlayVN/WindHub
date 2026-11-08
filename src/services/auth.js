// src/services/auth.js

export const DEFAULT_ADMIN_EMAIL = 'trinhgiaphong2k9@gmail.com';

const envAdminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLocaleLowerCase())
  .filter(Boolean);

export const adminEmails = Array.from(
  new Set([DEFAULT_ADMIN_EMAIL.toLocaleLowerCase(), ...envAdminEmails])
);

export const isAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLocaleLowerCase();
  return adminEmails.includes(normalized);
};
