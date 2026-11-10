<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Payment Received – TurboStore</title>
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .card    { width: 100% !important; border-radius: 0 !important; }
      .pad     { padding-left: 24px !important; padding-right: 24px !important; }
      .amount  { font-size: 30px !important; }
      .row td  { display: block !important; width: 100% !important; text-align: left !important; }
      .row .v  { padding-top: 2px !important; padding-bottom: 12px !important; }
      .btn a   { display: block !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased;">

  <!-- Preheader (inbox preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    {{ $amount }} has been added to your TurboStore wallet. Ref: {{ $reference }}
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#F1F5F9; padding:40px 12px;">
    <tr>
      <td align="center">

        <table class="card" width="600" border="0" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.08);">

          <!-- Header / logo -->
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

          <!-- Success hero -->
          <tr>
            <td class="pad" style="padding:40px 48px 8px; text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin:0 auto 20px;">
                <tr>
                  <td width="64" height="64" align="center" valign="middle"
                      style="width:64px; height:64px; background-color:#F0FDF4; border:2px solid #BBF7D0; border-radius:32px; font-size:30px; line-height:60px; color:#16A34A; font-weight:700;">
                    &#10003;
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px; font-size:13px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#16A34A;">Payment Successful</p>
              <p class="amount" style="margin:0; font-size:36px; font-weight:800; color:#0F172A; letter-spacing:-0.5px;">{{ $amount }}</p>
              <p style="margin:6px 0 0; font-size:14px; color:#64748B;">added to your TurboStore wallet</p>
            </td>
          </tr>

          <!-- Greeting + message -->
          <tr>
            <td class="pad" style="padding:32px 48px 8px;">
              <h1 style="margin:0 0 14px; font-size:20px; font-weight:700; color:#0F172A;">Hello {{ $name }},</h1>
              <p style="margin:0 0 14px; font-size:15px; line-height:1.65; color:#475569;">
                Thank you for choosing TurboStore!
              </p>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.65; color:#475569;">
                We're pleased to inform you that your payment has been successfully acknowledged, and your wallet has been funded.
              </p>
            </td>
          </tr>

          <!-- Payment details -->
          <tr>
            <td class="pad" style="padding:0 48px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                     style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px;">
                <tr>
                  <td style="padding:18px 22px 6px; font-size:13px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:#0F172A;">
                    Payment Details
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 22px 14px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr class="row">
                        <td style="padding:9px 0; font-size:14px; color:#64748B; border-bottom:1px solid #E2E8F0;">Amount Deposited</td>
                        <td class="v" align="right" style="padding:9px 0; font-size:14px; font-weight:700; color:#0F172A; border-bottom:1px solid #E2E8F0;">{{ $amount }}</td>
                      </tr>
                      <tr class="row">
                        <td style="padding:9px 0; font-size:14px; color:#64748B; border-bottom:1px solid #E2E8F0;">Transaction Reference</td>
                        <td class="v" align="right" style="padding:9px 0; font-size:14px; font-weight:600; color:#0F172A; font-family:'SFMono-Regular',Consolas,Menlo,monospace; word-break:break-all; border-bottom:1px solid #E2E8F0;">{{ $reference }}</td>
                      </tr>
                      <tr class="row">
                        <td style="padding:9px 0; font-size:14px; color:#64748B; border-bottom:1px solid #E2E8F0;">Payment Status</td>
                        <td class="v" align="right" style="padding:9px 0; border-bottom:1px solid #E2E8F0;">
                          <span style="display:inline-block; background-color:#F0FDF4; color:#16A34A; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px;">Successful</span>
                        </td>
                      </tr>
                      <tr class="row">
                        <td style="padding:9px 0; font-size:14px; color:#64748B; border-bottom:1px solid #E2E8F0;">Date</td>
                        <td class="v" align="right" style="padding:9px 0; font-size:14px; color:#0F172A; border-bottom:1px solid #E2E8F0;">{{ $paidAt }}</td>
                      </tr>
                      <tr class="row">
                        <td style="padding:9px 0; font-size:14px; color:#64748B;">Wallet Balance</td>
                        <td class="v" align="right" style="padding:9px 0; font-size:15px; font-weight:800; color:#16A34A;">{{ $balance }}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td class="pad" style="padding:28px 48px 8px;">
              <p style="margin:0 0 14px; font-size:15px; line-height:1.65; color:#475569;">
                Your funds are now available in your TurboStore account.
              </p>
              <p style="margin:0 0 14px; font-size:15px; line-height:1.65; color:#475569;">
                You can now explore our available virtual numbers, select your preferred country, choose the service you need, and complete your purchase.
              </p>
              <p style="margin:0 0 8px; font-size:15px; line-height:1.65; color:#475569;">
                You can also explore our other products in the
                <a href="{{ $marketplaceUrl }}" style="color:#16A34A; font-weight:600; text-decoration:none;">TurboStore Marketplace</a>
                &mdash; TurboStore gives you everything you're looking for, in one app.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="pad btn" align="center" style="padding:20px 48px 8px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{ $buyNumberUrl }}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="20%" fillcolor="#16A34A" stroke="f">
                <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Explore Available Numbers</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="{{ $buyNumberUrl }}"
                 style="display:inline-block; background-color:#16A34A; background:linear-gradient(135deg,#16A34A,#15803D); color:#FFFFFF; text-decoration:none; font-size:15px; font-weight:700; padding:15px 40px; border-radius:10px; letter-spacing:0.2px;">
                Explore Available Numbers
              </a>
              <!--<![endif]-->
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td class="pad" style="padding:28px 48px 36px;">
              <p style="margin:0 0 14px; font-size:15px; line-height:1.65; color:#475569;">
                Thank you for trusting TurboStore. We appreciate your business and look forward to serving you.
              </p>
              <p style="margin:0; font-size:15px; line-height:1.65; color:#475569;">
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
                Didn't make this payment? Please contact TurboStore support immediately.
                You can review all deposits on your <a href="{{ $walletUrl }}" style="color:#64748B;">wallet page</a>.
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
