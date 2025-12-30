// server/util/emails.ts
import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

export const sendInviteEmail = async ({
  to,
  projectName,
  inviteUrl,
}: {
  to: string;
  projectName: string;
  inviteUrl: string;
}) => {
  const htmlBody = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.5;">
    <p>Hi there,</p>

    <p>
      You have been invited to join the project
      <strong>${projectName}</strong> on OpenDream.
    </p>

    <p>
      Click the button below to accept your invitation:
    </p>

    <p>
      <a href="${inviteUrl}" style="font-weight: bold;">
        Accept Invitation
      </a>
    </p>

    <p>
      This invitation will expire in 7 days.
    </p>

    <p>
      If you were not expecting this invitation, you can safely ignore this email.
    </p>

    <p>
      — The OpenDream Team
    </p>
  </body>
</html>
`.trim();

  const textBody = `
Hi there,

You have been invited to join the project "${projectName}" on OpenDream.

Accept your invitation:
${inviteUrl}

This invitation will expire in 7 days.

If you were not expecting this invitation, you can safely ignore this email.

— The OpenDream Team
`.trim();

  await sendEmail({
    to,
    subject: `You’ve been invited to ${projectName}`,
    html: htmlBody,
    text: textBody,
  });
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: `"OpenDream" <${process.env.RESEND_EMAIL}>`,
    to,
    subject,
    html,
    text,
  });
};
