// shared/definitions/email_templates/manageSubscription.template.ts

interface ManageSubscriptionEmailProps {
  businessName: string;
  customerName: string | null;
  logoUrl: string;
  manageSubscriptionUrl: string;
  getNewLinkPage: string;
  primaryColor?: string;
  phoneNumber: string;
}

export function manageSubscriptionEmail({
  businessName,
  customerName,
  logoUrl,
  manageSubscriptionUrl,
  getNewLinkPage,
  primaryColor = "#5CADD8",
  phoneNumber,
}: ManageSubscriptionEmailProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Manage Your Subscription</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

<!-- HEADER -->
<tr>
<td align="center" style="background:#ffffff;padding:30px;">
<img 
  src="${logoUrl}" 
  alt="${businessName} logo" 
  width="220" 
  style="display:block;border:0;outline:none;text-decoration:none;height:auto;"
/>
</td>
</tr>

<!-- DIVIDER -->
<tr>
<td style="padding:0 35px;">
<div style="height:1px;background-color:#eeeeee;"></div>
</td>
</tr>

<!-- MAIN CONTENT -->
<tr>
<td style="padding:40px 35px;color:#333333;">

<h1 style="margin-top:0;font-size:26px;color:#111111;text-align:center;">
Manage Your Subscription
</h1>

<p style="font-size:16px;line-height:1.6;margin:20px 0 10px 0;">
${customerName ? `Hi <strong>${customerName}</strong>,` : "Hello,"}
</p>

<p style="font-size:16px;line-height:1.6;margin:0 0 25px 0;">
You can manage your cleaning subscription at any time using the secure Stripe customer portal. 
Use the button below to update payment details, view invoices, or switch / cancel your plan.
</p>

<!-- CTA BUTTON -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
<tr>
<td align="center">
<a
  href="${manageSubscriptionUrl}"
  style="
    display:inline-block;
    background:${primaryColor};
    color:#ffffff;
    text-decoration:none;
    padding:16px 40px;
    border-radius:8px;
    font-size:16px;
    font-weight:bold;
  "
>
  Manage Subscription
</a>
</td>
</tr>
</table>

<p style="font-size:16px;line-height:1.6;margin:5px 0 25px 0;">
This link will expire after 24 hours. To receive a new link, visit our <a href="${getNewLinkPage}">website</a>.
</p>

<p style="font-size:14px;line-height:1.6;color:#666666;margin-top:10px;">
If you have any questions, call us at <strong>${phoneNumber}</strong>.
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td align="center" style="background:#fafafa;padding:25px;font-size:12px;color:#888888;">
© ${new Date().getFullYear()} ${businessName}. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
}