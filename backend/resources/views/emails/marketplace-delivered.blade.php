<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Your Account Has Been Delivered – TurboStore</title>
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .card  { width: 100% !important; border-radius: 0 !important; }
      .pad   { padding-left: 24px !important; padding-right: 24px !important; }
      .row td{ display: block !important; width: 100% !important; text-align: left !important; }
      .row .v{ padding-top: 2px !important; padding-bottom: 12px !important; }
      .btn a { display: block !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased;">

  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your {{ $serviceName }} account credentials are ready. Order {{ $reference }}.
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#F1F5F9; padding:40px 12px;">
    <tr>
      <td align="center">
        <table class="card" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#030C06; padding:28px 40px; text-align:center;">
              <a href="{{ $websiteUrl }}" style="text-decoration:none;">
                <img src="{{ $logoUrl }}" alt="TurboStore" width="220"
                     style="display:block; margin:0 auto; max-width:220px; width:220px; height:auto; border:0; color:#4ADE80; font-size:24px; font-weight:800;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="height:3px; background-color:#16A34A; background:linear-gradient(90deg,#063B2D,#16A34A,#4ADE80,#16A34A,#063B2D); font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="pad" style="padding:40px 48px 8px; text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:0 auto 20px;">
                <tr>
                  <td width="64" height="64" align="center" valign="middle"
                      style="width:64px; height:64px; background-color:#F0FDF4; border:2px solid #BBF7D0; border-radius:32px; font-size:30px; line-height:60px; color:#16A34A; font-weight:700;">
                    &#128274;
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px; font-size:13px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#16A34A;">Account Delivered</p>
              <p style="margin:0; font-size:26px; font-weight:800; color:#0F172A; letter-spacing:-0.5px;">{{ $serviceName }}</p>
              <p style="margin:6px 0 0; font-size:14px; color:#64748B;">Your account is ready to use</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="pad" style="padding:28px 48px 8px;">
              <h2 style="margin:0 0 12px; font-size:20px; font-weight:700; color:#0F172A;">Hello {{ $buyerName }},</h2>
              <p style="margin:0 0 14px; font-size:15px; line-height:1.65; color:#475569;">
                Great news! The vendor has delivered your <strong>{{ $serviceName }}</strong> account.
                Your login credentials are below — please keep them safe and change the password as soon as you log in.
              </p>
            </td>
          </tr>

          <!-- Credentials box -->
          <tr>
            <td class="pad" style="padding:0 48px 8px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="background-color:#0F172A; border:1px solid #1E293B; border-radius:12px;">
                <tr>
                  <td style="padding:16px 22px 6px; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4ADE80;">
                    Account Login Details
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 22px 18px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding:8px 0; font-size:12px; color:#94A3B8; border-bottom:1px solid #1E293B; width:38%;">Login / Email</td>
                        <td style="padding:8px 0; font-size:14px; font-weight:700; color:#F8FAFC; font-family:'SFMono-Regular',Consolas,Menlo,monospace; word-break:break-all; border-bottom:1px solid #1E293B;">{{ $login }}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; font-size:12px; color:#94A3B8; border-bottom:1px solid #1E293B;">Password</td>
                        <td style="padding:8px 0; font-size:14px; font-weight:700; color:#F8FAFC; font-family:'SFMono-Regular',Consolas,Menlo,monospace; word-break:break-all; border-bottom:1px solid #1E293B;">{{ $password }}</td>
                      </tr>
                      @if($recoveryEmail)
                      <tr>
                        <td style="padding:8px 0; font-size:12px; color:#94A3B8; border-bottom:1px solid #1E293B;">Recovery Email</td>
                        <td style="padding:8px 0; font-size:14px; font-weight:600; color:#F8FAFC; font-family:'SFMono-Regular',Consolas,Menlo,monospace; word-break:break-all; border-bottom:1px solid #1E293B;">{{ $recoveryEmail }}</td>
                      </tr>
                      @endif
                      @if($notes)
                      <tr>
                        <td style="padding:8px 0; font-size:12px; color:#94A3B8;">Notes</td>
                        <td style="padding:8px 0; font-size:14px; color:#CBD5E1; line-height:1.5;">{{ $notes }}</td>
                      </tr>
                      @endif
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td class="pad" style="padding:16px 48px 8px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="background-color:#FFFBEB; border:1px solid #FDE68A; border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px; font-size:13px; color:#92400E; line-height:1.55;">
                    &#9888;&nbsp; <strong>Important:</strong> Change the account password immediately after logging in. Do not share these credentials with anyone.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order info -->
          <tr>
            <td class="pad" style="padding:16px 48px 8px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px;">
                <tr>
                  <td style="padding:14px 22px 6px; font-size:12px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#0F172A;">Order Details</td>
                </tr>
                <tr>
                  <td style="padding:0 22px 14px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr class="row">
                        <td style="padding:8px 0; font-size:14px; color:#64748B; border-bottom:1px solid #E2E8F0;">Order Reference</td>
                        <td class="v" align="right" style="padding:8px 0; font-size:13px; font-weight:600; color:#0F172A; font-family:'SFMono-Regular',Consolas,Menlo,monospace; border-bottom:1px solid #E2E8F0;">{{ $reference }}</td>
                      </tr>
                      <tr class="row">
                        <td style="padding:8px 0; font-size:14px; color:#64748B; border-bottom:1px solid #E2E8F0;">Service</td>
                        <td class="v" align="right" style="padding:8px 0; font-size:14px; font-weight:600; color:#0F172A; border-bottom:1px solid #E2E8F0;">{{ $serviceName }}</td>
                      </tr>
                      <tr class="row">
                        <td style="padding:8px 0; font-size:14px; color:#64748B;">Delivered by</td>
                        <td class="v" align="right" style="padding:8px 0; font-size:14px; font-weight:600; color:#0F172A;">{{ $vendorName }}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="pad btn" align="center" style="padding:24px 48px 8px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center">
                <tr>
                  <td align="center" style="border-radius:12px; background-color:#16A34A;">
                    <a href="{{ $orderUrl }}" target="_blank"
                       style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:12px;">
                      View Order &amp; Confirm
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:16px 48px 32px;">
              <p style="margin:0; font-size:14px; line-height:1.65; color:#475569;">
                Once you've verified the account works, please confirm the order in your dashboard. If there's an issue, you can open a dispute within 72 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC; padding:24px 40px; text-align:center; border-top:1px solid #E2E8F0;">
              <p style="margin:0 0 6px; font-size:13px; color:#64748B;">TurboStore &mdash; Fast. Verified. Trusted.</p>
              <p style="margin:0; font-size:12px; color:#94A3B8;">
                <a href="{{ $websiteUrl }}" style="color:#16A34A; text-decoration:none;">turbostores.store</a>
                &nbsp;&middot;&nbsp; This email was sent because you placed an order on TurboStore.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
