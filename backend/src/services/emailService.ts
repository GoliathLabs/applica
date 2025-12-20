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
 * Compose membership application confirmation email.
 */
const composeMembershipConfirmationEmail = (firstName: string, lastName: string): { text: string; html: string } => {
    const textContent = `
    Hallo ${firstName} ${lastName},
    
    vielen Dank für deinen Mitgliedsantrag! Wir haben deine Bewerbung erhalten und werden sie zeitnah prüfen.
    
    Du erhältst eine weitere E-Mail, sobald dein Antrag bearbeitet wurde.
    
    Bei Fragen stehen wir dir gerne zur Verfügung.
    
    Beste Grüße,
    Dein Vereins-Team
  `;

    const htmlContent = `
    <p>Hallo ${firstName} ${lastName},</p>
    <p>vielen Dank für deinen Mitgliedsantrag! Wir haben deine Bewerbung erhalten und werden sie zeitnah prüfen.</p>
    <p>Du erhältst eine weitere E-Mail, sobald dein Antrag bearbeitet wurde.</p>
    <p>Bei Fragen stehen wir dir gerne zur Verfügung.</p>
    <p>Beste Grüße,<br/>Dein Vereins-Team</p>
  `;

    return { text: textContent, html: htmlContent };
};

/**
 * Compose membership application status update email.
 */
const composeMembershipStatusEmail = (
    firstName: string,
    lastName: string,
    status: 'approved' | 'rejected'
): { text: string; html: string } => {
    const isApproved = status === 'approved';
    const textContent = isApproved
        ? `
    Hallo ${firstName} ${lastName},
    
    dein Mitgliedsantrag wurde genehmigt! Herzlich willkommen in unserem Verein!
    
    Weitere Informationen zu deiner Mitgliedschaft erhältst du in Kürze.
    
    Beste Grüße,
    Dein Vereins-Team
  `
        : `
    Hallo ${firstName} ${lastName},
    
    leider müssen wir dir mitteilen, dass dein Mitgliedsantrag abgelehnt wurde.
    
    Bei Fragen kannst du dich gerne an uns wenden.
    
    Beste Grüße,
    Dein Vereins-Team
  `;

    const htmlContent = isApproved
        ? `
    <p>Hallo ${firstName} ${lastName},</p>
    <p>dein Mitgliedsantrag wurde <strong>genehmigt</strong>! Herzlich willkommen in unserem Verein!</p>
    <p>Weitere Informationen zu deiner Mitgliedschaft erhältst du in Kürze.</p>
    <p>Beste Grüße,<br/>Dein Vereins-Team</p>
  `
        : `
    <p>Hallo ${firstName} ${lastName},</p>
    <p>leider müssen wir dir mitteilen, dass dein Mitgliedsantrag <strong>abgelehnt</strong> wurde.</p>
    <p>Bei Fragen kannst du dich gerne an uns wenden.</p>
    <p>Beste Grüße,<br/>Dein Vereins-Team</p>
  `;

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

/**
 * Send membership application confirmation email.
 */
export const sendMembershipConfirmationEmail = async (
    email: string,
    firstName: string,
    lastName: string
): Promise<SentMessageInfo> => {
    const { text, html } = composeMembershipConfirmationEmail(firstName, lastName);

    try {
        const info = await transporter.sendMail({
            from: `"${getEnv('SMTP_FROM_NAME')}" <${getEnv('SMTP_FROM_EMAIL')}>`,
            to: email,
            subject: 'Bestätigung deines Mitgliedsantrags',
            text,
            html,
            headers: {
                'X-Mailer': 'nodemailer',
                'Reply-To': getEnv('SMTP_REPLY_TO'),
            }
        });

        logger.info('Mitgliedsantrag-Bestätigungs-E-Mail gesendet', { email });
        return info;
    } catch (error) {
        logger.error('Fehler beim Versand der Bestätigungs-E-Mail', { err: String(error) });
        throw new Error('E-Mail-Versand fehlgeschlagen');
    }
};

/**
 * Send membership application status update email.
 */
export const sendMembershipStatusEmail = async (
    email: string,
    firstName: string,
    lastName: string,
    status: 'approved' | 'rejected'
): Promise<SentMessageInfo> => {
    const { text, html } = composeMembershipStatusEmail(firstName, lastName, status);

    try {
        const info = await transporter.sendMail({
            from: `"${getEnv('SMTP_FROM_NAME')}" <${getEnv('SMTP_FROM_EMAIL')}>`,
            to: email,
            subject: status === 'approved' 
                ? 'Dein Mitgliedsantrag wurde genehmigt' 
                : 'Update zu deinem Mitgliedsantrag',
            text,
            html,
            headers: {
                'X-Mailer': 'nodemailer',
                'Reply-To': getEnv('SMTP_REPLY_TO'),
            }
        });

        logger.info('Mitgliedsantrag-Status-E-Mail gesendet', { email, status });
        return info;
    } catch (error) {
        logger.error('Fehler beim Versand der Status-E-Mail', { err: String(error) });
        throw new Error('E-Mail-Versand fehlgeschlagen');
    }
};