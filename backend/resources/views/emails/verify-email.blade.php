<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Email - TurboStore</title>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F1; font-family:Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#F1F5F1; padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" border="0" cellpadding="0" cellspacing="0"
               style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ─── HEADER ─── -->
          <tr>
            <td style="background-color:#063B2D; padding:30px 40px; text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <!-- Icon box -->
                  <td style="padding-right:12px; vertical-align:middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:44px; height:44px; background:linear-gradient(145deg,#16A34A,#063B2D); border-radius:12px; text-align:center; vertical-align:middle; border:1.5px solid rgba(74,222,128,0.35);">
                          <span style="color:#4ADE80; font-size:22px; font-weight:900; line-height:44px; display:block;">&#9889;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Brand -->
                  <td style="vertical-align:middle;">
                    <span style="font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; font-family:Arial,Helvetica,sans-serif;">Turbo</span><span style="font-size:26px; font-weight:800; color:#4ADE80; letter-spacing:-0.5px; font-family:Arial,Helvetica,sans-serif;">Store</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── BODY ─── -->
          <tr>
            <td style="background-color:#ffffff; padding:44px 48px 32px;">

              <h1 style="color:#063B2D; font-size:30px; font-weight:800; margin:0 0 22px; line-height:1.25; font-family:Arial,Helvetica,sans-serif;">
                Confirm Your Email Address
              </h1>

              <p style="color:#111827; font-size:16px; font-weight:400; margin:0 0 14px; font-family:Arial,Helvetica,sans-serif;">
                Hi {{ $user->name }},
              </p>

              <p style="color:#6B7280; font-size:15px; line-height:1.7; margin:0 0 32px; font-family:Arial,Helvetica,sans-serif;">
                Welcome to TurboStore! We're excited to have you join us.
                Please confirm your email address to activate your account
                and access your virtual numbers.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="{{ $url }}"
                       style="display:block; background-color:#063B2D; color:#ffffff; text-align:center; padding:17px 24px; font-size:16px; font-weight:700; text-decoration:none; border-radius:8px; font-family:Arial,Helvetica,sans-serif; letter-spacing:0.2px;">
                      Confirm Email
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ─── DIVIDER ─── -->
          <tr>
            <td style="background-color:#ffffff; padding:4px 48px 0;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #E5E7EB; height:1px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── FOOTER NOTE ─── -->
          <tr>
            <td style="background-color:#ffffff; padding:28px 48px 36px; text-align:center;">

              <p style="color:#9CA3AF; font-size:13px; line-height:1.7; margin:0 0 18px; font-family:Arial,Helvetica,sans-serif;">
                If you did not sign up for this account, you can ignore this email.<br />
                This link will expire in <strong>24 hours</strong>.
              </p>

              <p style="color:#9CA3AF; font-size:13px; margin:0 0 8px; font-family:Arial,Helvetica,sans-serif;">
                Alternatively, copy and paste this link into your browser:
              </p>
              <a href="{{ $url }}"
                 style="color:#16A34A; font-size:12px; word-break:break-all; text-decoration:underline; font-family:Arial,Helvetica,sans-serif; line-height:1.6;">
                {{ $url }}
              </a>

            </td>
          </tr>

          <!-- ─── BOTTOM BAR ─── -->
          <tr>
            <td style="background-color:#F9FAFB; border-top:1px solid #E5E7EB; padding:20px 48px 22px; text-align:center;">

              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:10px;">
                <tr>
                  <!-- Lock icon circle -->
                  <td style="padding-right:6px; vertical-align:middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:22px; height:22px; border:1.5px solid #D1D5DB; border-radius:50%; text-align:center; vertical-align:middle; font-size:10px; color:#9CA3AF; line-height:20px;">
                          &#128274;
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Help icon circle -->
                  <td style="padding-right:10px; vertical-align:middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:22px; height:22px; border:1.5px solid #D1D5DB; border-radius:50%; text-align:center; vertical-align:middle; font-size:11px; color:#9CA3AF; line-height:20px; font-weight:700; font-family:Arial,Helvetica,sans-serif;">
                          ?
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#9CA3AF; font-size:12px; font-family:Arial,Helvetica,sans-serif;">Need Help?&nbsp;</span>
                    <a href="mailto:support@turbostore.com"
                       style="color:#6B7280; font-size:12px; text-decoration:underline; font-family:Arial,Helvetica,sans-serif;">Contact Support</a>
                    <span style="color:#D1D5DB; font-size:12px; margin:0 6px;">|</span>
                    <a href="#"
                       style="color:#6B7280; font-size:12px; text-decoration:underline; font-family:Arial,Helvetica,sans-serif;">Privacy Policy</a>
                  </td>
                </tr>
              </table>

              <p style="color:#D1D5DB; font-size:12px; margin:0; font-family:Arial,Helvetica,sans-serif;">
                &copy; {{ date('Y') }} TurboStore. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
