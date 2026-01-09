// src/modules/GoogleModule/GmailModule/_templates/booking.template.ts
interface BookingConfirmationEmailProps {
  businessName: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  location?: string;
  logoUrl: string;
  primaryColor?: string;
  manageBookingUrl?: string;
  phoneNumber: string
}

export function bookingConfirmationEmail({
  businessName,
  customerName,
  serviceName,
  date,
  time,
  location,
  logoUrl,
  primaryColor = "#3BC1F7",  
  manageBookingUrl,
  phoneNumber,
}: BookingConfirmationEmailProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">

        <!-- Email container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header / Logo -->
          <tr>
            <td
              align="center"
              style="
                background-color:#ffffff;
                padding:16px 20px;
                border-radius:10px;
              "
            >
              <img
                src="${logoUrl}"
                alt="${businessName} logo"
                width="240"
                style="
                  margin-top:25px;
                  margin-bottom:25px;
                  display:block;
                  border:0;
                  outline:none;
                  text-decoration:none;
                  width:240px;
                  max-width:260px;
                  height:auto;
                  background-color:#ffffff;
                "
              />
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <div style="height:1px;background-color:#e5e7eb;"></div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:32px 32px 16px;color:#111827;">

              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;text-align:center;">
                Booking Confirmed ☑️
              </h1>

              <p style="margin:0 0 16px;font-size:15px;color:#374151;">
                Hi <strong>${customerName}</strong>,
              </p>

              <p style="margin:0 0 20px;font-size:15px;color:#374151;">
                Your appointment with <strong>${businessName}</strong> has been successfully scheduled.
                Here are the details:
              </p>

              <!-- Booking details box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;padding:16px;">
                <tr>
                  <td style="font-size:14px;color:#111827;padding-bottom:8px;">
                    <strong>Service:</strong> ${serviceName}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#111827;padding-bottom:8px;">
                    <strong>Date:</strong> ${date}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#111827;padding-bottom:8px;">
                    <strong>Time:</strong> ${time}
                  </td>
                </tr>
                ${
                  location
                    ? `<tr>
                        <td style="font-size:14px;color:#111827;">
                          <strong>Location:</strong> ${location}
                        </td>
                      </tr>`
                    : ""
                }
              </table>

              <p style="margin-top:20px; margin-bottom:30px; font-size:15px; color:#374151; text-align:center;">
                If you have any questions about this service call, please reach out to us at:
                <br><br>
                <strong style="font-size:17px;">${phoneNumber}</strong>
                <br><br>
                
              </p>

   

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;color:#6b7280;font-size:12px;">
              <p style="margin:0 0 6px;">
                We look forward to seeing you soon! Feel free to send us an email or give us a call anytime — we're happy to help
              </p>
              <p style="margin:0;">
                © ${new Date().getFullYear()} ${businessName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!-- Spacer -->
        <div style="height:24px;"></div>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}


// To view this booking in our system or request service in the future, create an account in our customer portal using the same email this message was sent to
          //  ${
          //       manageBookingUrl
          //         ? `
          //     <!-- CTA Button -->
          //     <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          //       <tr>
          //         <td align="center">
          //           <a
          //             href="${manageBookingUrl}"
          //             style="
          //               background-color:${primaryColor};
          //               color:#ffffff;
          //               text-decoration:none;
          //               padding:12px 22px;
          //               border-radius:6px;
          //               font-size:14px;
          //               font-weight:bold;
          //               display:inline-block;
          //             "
          //           >
          //             Manage your booking
          //           </a>
          //         </td>
          //       </tr>
          //     </table>
          //     `
          //         : ""
          //     }