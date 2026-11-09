<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Your Email - TurboStore</title>
</head>
<body style="margin:0; padding:0; background-color:#0A0F0A; font-family:Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased;">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#0A0F0A; padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" border="0" cellpadding="0" cellspacing="0"
               style="max-width:600px; width:100%; background-color:#0D150D; border-radius:16px; overflow:hidden; border:1px solid rgba(74,222,128,0.12);">

          <!-- ─── HEADER: Logo Banner ─── -->
          <tr>
            <td style="background-color:#030C06; padding:28px 40px; text-align:center; border-bottom:1px solid rgba(74,222,128,0.1);">
              <img
                src="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/logo-banner.png"
                alt="TurboStore — Digital Services · Virtual Numbers · More"
                width="260"
                style="display:block; margin:0 auto; max-width:260px; height:auto; border:0;"
              />
            </td>
          </tr>

          <!-- ─── GREEN ACCENT LINE ─── -->
          <tr>
            <td style="height:3px; background:linear-gradient(90deg,#063B2D,#16A34A,#4ADE80,#16A34A,#063B2D); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- ─── BODY ─── -->
          <tr>
            <td style="padding:44px 48px 36px;">

              <!-- Mail icon -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:60px; height:60px; background:linear-gradient(135deg,#16A34A,#063B2D); border-radius:50%; text-align:center; vertical-align:middle; border:1.5px solid rgba(74,222,128,0.3);">
                    <span style="font-size:26px; line-height:60px; display:block;">&#9993;</span>
                  </td>
                </tr>
              </table>

              <h1 style="color:#ffffff; font-size:28px; font-weight:800; margin:0 0 16px; line-height:1.2; font-family:Arial,Helvetica,sans-serif; letter-spacing:-0.5px;">
                Confirm Your Email Address
              </h1>

              <p style="color:rgba(255,255,255,0.75); font-size:16px; font-weight:400; margin:0 0 10px; font-family:Arial,Helvetica,sans-serif;">
                Hi {{ $user->name }},
              </p>

              <p style="color:rgba(255,255,255,0.5); font-size:15px; line-height:1.75; margin:0 0 36px; font-family:Arial,Helvetica,sans-serif;">
                Welcome to TurboStore! You're one step away from accessing instant virtual phone numbers from 180+ countries.
                Click the button below to verify your email and activate your account.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <a href="{{ $url }}"
                       style="display:inline-block; background:linear-gradient(135deg,#16A34A,#15803D); color:#ffffff; text-align:center; padding:16px 48px; font-size:16px; font-weight:700; text-decoration:none; border-radius:10px; font-family:Arial,Helvetica,sans-serif; letter-spacing:0.3px; box-shadow:0 8px 24px rgba(22,163,74,0.35);">
                      &#10003; &nbsp; Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info pills -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:rgba(22,163,74,0.08); border:1px solid rgba(22,163,74,0.2); border-radius:10px; padding:16px 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px; vertical-align:top; padding-top:2px;">
                          <span style="font-size:14px;">&#8987;</span>
                        </td>
                        <td>
                          <span style="color:rgba(255,255,255,0.65); font-size:13px; line-height:1.6; font-family:Arial,Helvetica,sans-serif;">
                            This link expires in <strong style="color:#4ADE80;">24 hours</strong>. If it expires, you can request a new one from the login page.
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.07); height:1px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="color:rgba(255,255,255,0.3); font-size:12px; line-height:1.7; margin:0 0 10px; font-family:Arial,Helvetica,sans-serif;">
                If the button doesn't work, copy and paste this URL into your browser:
              </p>
              <a href="{{ $url }}"
                 style="color:#4ADE80; font-size:12px; word-break:break-all; text-decoration:none; font-family:Arial,Helvetica,sans-serif; line-height:1.6;">
                {{ $url }}
              </a>

            </td>
          </tr>

          <!-- ─── FOOTER ─── -->
          <tr>
            <td style="background-color:#080E08; border-top:1px solid rgba(255,255,255,0.06); padding:24px 48px; text-align:center;">

              <p style="color:rgba(255,255,255,0.25); font-size:12px; line-height:1.7; margin:0 0 12px; font-family:Arial,Helvetica,sans-serif;">
                If you did not create an account with TurboStore, you can safely ignore this email.
              </p>

              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:12px;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="mailto:support@turbostores.store"
                       style="color:rgba(74,222,128,0.6); font-size:12px; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
                      Contact Support
                    </a>
                  </td>
                  <td style="color:rgba(255,255,255,0.1); font-size:12px;">|</td>
                  <td style="padding:0 8px;">
                    <a href="#"
                       style="color:rgba(74,222,128,0.6); font-size:12px; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
                      Privacy Policy
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:rgba(255,255,255,0.15); font-size:11px; margin:0; font-family:Arial,Helvetica,sans-serif;">
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
