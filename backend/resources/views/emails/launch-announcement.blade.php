<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <title>TurboStore Is Officially Live</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .card  { width: 100% !important; border-radius: 0 !important; }
      .pad   { padding-left: 24px !important; padding-right: 24px !important; }
      .hero  { font-size: 26px !important; line-height: 34px !important; }
      .btn a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased;">

  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    The wait is over — TurboStore is live, and as an early supporter your access starts today.
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#F1F5F9;">
    <tr>
      <td align="center" style="padding:40px 12px;">

        @if($isTest)
        <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="card" style="max-width:600px; width:100%;">
          <tr>
            <td style="background-color:#FEF3C7; color:#92400E; font-size:13px; font-weight:700; text-align:center; padding:10px; border-radius:10px;">
              TEST EMAIL — preview of the "{{ $mode }}" variant. The button below is a placeholder.
            </td>
          </tr>
          <tr><td style="height:12px; font-size:0; line-height:0;">&nbsp;</td></tr>
        </table>
        @endif

        <table class="card" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:16px; overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td style="background-color:#030C06; padding:30px 40px; text-align:center;">
              <a href="{{ $websiteUrl }}" style="text-decoration:none;">
                <img src="{{ $logoUrl }}" alt="TurboStore" width="220"
                     style="display:block; margin:0 auto; width:220px; max-width:220px; height:auto; border:0; color:#4ADE80; font-size:26px; font-weight:800;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="height:3px; background-color:#16A34A; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="pad" style="background-color:#030C06; padding:36px 48px 40px; text-align:center;">
              <p style="margin:0 0 12px; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#4ADE80;">&#128640; Officially live</p>
              <h1 class="hero" style="margin:0; font-size:32px; line-height:40px; font-weight:800; color:#FFFFFF; letter-spacing:-0.5px;">
                The wait is over.<br />TurboStore is open.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="pad" style="padding:40px 48px 8px;">
              <p style="margin:0 0 16px; font-size:18px; font-weight:700; color:#0F172A;">Hello {{ $name }},</p>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#475569;">
                We're excited to share that TurboStore is officially live — and because you joined our waitlist before launch, you're one of the very first people to get access.
              </p>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#475569;">
                Thank you for believing in us early. Your interest helped shape what we've built.
              </p>
              <p style="margin:0 0 28px; font-size:15px; line-height:1.7; color:#475569;">
                You can now get virtual numbers on demand: pick your preferred country, choose the service you need, and receive your verification codes in seconds — all from one app.
              </p>
            </td>
          </tr>

          <!-- Account access -->
          <tr>
            <td class="pad" style="padding:0 48px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="background-color:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px; font-size:12px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#15803D;">Your account access</p>
                    @if($mode === 'activate')
                      <p style="margin:0; font-size:14px; line-height:1.65; color:#14532D;">
                        We've reserved a TurboStore account for <strong>{{ $email }}</strong>. Click the button below to choose your password and activate it — it only takes a moment.
                      </p>
                    @elseif($mode === 'verify')
                      <p style="margin:0; font-size:14px; line-height:1.65; color:#14532D;">
                        You already have a TurboStore account with <strong>{{ $email }}</strong>. Click the button below to confirm your email address, then sign in with your existing password.
                      </p>
                    @else
                      <p style="margin:0; font-size:14px; line-height:1.65; color:#14532D;">
                        You already have a TurboStore account. Simply sign in with <strong>{{ $email }}</strong> and your existing password.
                      </p>
                    @endif
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="pad btn" align="center" style="padding:32px 48px 12px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $ctaUrl }}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="20%" fillcolor="#16A34A" stroke="f">
                <w:anchorlock/>
                <center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Access TurboStore</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="{{ $ctaUrl }}"
                 style="display:inline-block; background-color:#16A34A; color:#FFFFFF; text-decoration:none; font-size:16px; font-weight:700; padding:16px 44px; border-radius:10px; letter-spacing:0.2px;">
                Access TurboStore &rarr;
              </a>
              <!--<![endif]-->
            </td>
          </tr>

          @if($expiresAt && $mode !== 'login')
          <tr>
            <td class="pad" align="center" style="padding:0 48px 8px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#94A3B8; text-align:center;">
                For your security this link is personal to you{{ $mode === 'activate' ? ', can be used once,' : '' }} and expires on {{ $expiresAt }}. Please don't forward this email.
                @if($mode === 'activate')
                  If it expires, use <a href="{{ $forgotUrl }}" style="color:#16A34A;">Forgot password</a> with this email address to set your password.
                @else
                  If it expires, sign in and request a new verification email from your dashboard.
                @endif
              </p>
            </td>
          </tr>
          @endif

          <!-- Sign-off -->
          <tr>
            <td class="pad" style="padding:28px 48px 36px;">
              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#475569;">
                We're thrilled to have you on board and can't wait for you to experience TurboStore.
              </p>
              <p style="margin:0; font-size:15px; line-height:1.7; color:#475569;">
                Best regards,<br />
                <strong style="color:#0F172A;">The TurboStore Team</strong><br />
                <a href="{{ $websiteUrl }}" style="color:#16A34A; text-decoration:none;">{{ preg_replace('#^https?://#', '', $websiteUrl) }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="pad" style="background-color:#F8FAFC; padding:20px 48px; text-align:center; border-top:1px solid #E2E8F0;">
              <p style="margin:0 0 6px; font-size:12px; line-height:1.6; color:#94A3B8;">
                You're receiving this because you joined the TurboStore waitlist with {{ $email }}.
                We'll never ask for your password by email.
              </p>
              <p style="margin:0; font-size:12px; color:#94A3B8;">
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
