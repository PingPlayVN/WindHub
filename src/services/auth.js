const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLocaleLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email) => Boolean(email)
  && adminEmails.includes(email.toLocaleLowerCase());
