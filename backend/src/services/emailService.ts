import nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import { getEnv } from '../common/util';
import { logger } from '../common/logger';
/**
 * Create reusable transporter with nodemailer settings.
 */
const transporter = nodemailer.createTransport({
    host: getEnv('SMTP_HOST'),
    port: parseInt(getEnv('SMTP_PORT'), 10),
    secure: getEnv('SMTP_PORT') === '465',
    auth: {
        user: getEnv('SMTP_USER'),
        pass: getEnv('SMTP_PASS'),
    }
});

/**
 * Compose the email content.
 */
const composeEmail = (username: string, password: string): { text: string; html: string } => {
    const textContent = `
    Hallo,
    willkommen bei unserer Vereinsinfrastruktur! Hier sind deine Zugangsdaten:
    Benutzername: ${username}
    Passwort: ${password}
    Bei Fragen melde dich gerne im Slack-Kanal beim Infrastructure Manager.
    Beste Grüße,
    Dein Infrastructure-Team
  `;

    const htmlContent = `<p>Hallo,</p>
  <p>Willkommen bei unserer Vereinsinfrastruktur! Hier sind deine Zugangsdaten:</p>
  <ul>
    <li>Benutzername: <strong>${username}</strong></li>
    <li>Passwort: <strong>${password}</strong></li>
  </ul>
  <p>Bei Fragen melde dich gerne im Slack-Kanal beim Infrastructure Manager.</p>
  <p>Beste Grüße,<br/>
  Dein Infrastructure-Team</p>`;

    return { text: textContent, html: htmlContent };
};

/**
 * Send an email with specified parameters.
 */
export const sendEmail = async (email: string, username: string, password: string): Promise<SentMessageInfo> => {
    const { text, html } = composeEmail(username, password);

    try {
        const info = await transporter.sendMail({
            from: `"${getEnv('SMTP_FROM_NAME')}" <${getEnv('SMTP_FROM_EMAIL')}>`,
            to: email,
            subject: 'Deine Zugangsdaten für die Vereinsinfrastruktur',
            text,
            html,
            headers: {
                'X-Mailer': 'nodemailer',
                'Reply-To': getEnv('SMTP_REPLY_TO'),
            }
        });

        logger.info('E-Mail erfolgreich gesendet', { info: String(info) });
        return info;
    } catch (error) {
        logger.error('Fehler beim E-Mail-Versand', { err: String(error) });
        throw new Error('E-Mail-Versand fehlgeschlagen');
    }
};