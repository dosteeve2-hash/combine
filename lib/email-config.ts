export const verificationEmailConfiguree = Boolean(
  process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
);

export const verificationEmailRequise =
  process.env.NODE_ENV === 'production' || verificationEmailConfiguree;

export const inscriptionDisponible =
  process.env.NODE_ENV !== 'production' || verificationEmailConfiguree;
