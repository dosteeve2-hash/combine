interface Destinataire {
  email: string;
  name: string;
}

export async function envoyerLienVerification(
  utilisateur: Destinataire,
  url: string,
): Promise<void> {
  const cle = process.env.RESEND_API_KEY?.trim();
  const expediteur = process.env.RESEND_FROM_EMAIL?.trim();

  if (!cle || !expediteur) {
    throw new Error('La vérification par e-mail n’est pas configurée.');
  }

  const reponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: expediteur,
      to: [utilisateur.email],
      subject: 'Confirmez votre adresse e-mail — COMBINE',
      text: `Bonjour ${utilisateur.name},\n\nConfirmez votre adresse e-mail pour activer votre compte COMBINE :\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`,
    }),
  });

  if (!reponse.ok) {
    throw new Error(`Resend a refusé l’envoi du lien (HTTP ${reponse.status}).`);
  }
}
