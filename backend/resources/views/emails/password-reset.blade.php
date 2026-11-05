<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#16A34A;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">TurboStore</h1>
              <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Virtual Number Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 12px;">Hi {{ $name }},</h2>
              <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 28px;">
                We received a request to reset your TurboStore password. Click the button below to set a new one.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="{{ $resetUrl }}"
                       style="display:inline-block;background:#16A34A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#94A3B8;line-height:1.6;margin:0 0 8px;">
                This link expires in <strong>60 minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your account is not at risk.
              </p>

              <p style="font-size:12px;color:#CBD5E1;margin:24px 0 0;word-break:break-all;">
                Or copy this URL: {{ $resetUrl }}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="font-size:12px;color:#94A3B8;margin:0;">
                &copy; {{ date('Y') }} TurboStore &mdash; Automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
