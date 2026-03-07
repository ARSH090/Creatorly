export function trialWarningEmail({ name, daysLeft, plan }: { name: string; daysLeft: number; plan: string }) {
    return {
        subject: `⏰ Your ${plan} trial ends in ${daysLeft} days`,
        html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:#D97706;padding:40px;text-align:center">
        <h1 style="color:white;margin:0">⏰ Trial Ending Soon</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1E293B">Hi ${name},</h2>
        <p style="color:#475569;line-height:1.6">
          Your <strong>${plan}</strong> trial ends in <strong>${daysLeft} days</strong>.
          Upgrade now to keep access to all your premium features.
        </p>
        <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:24px 0">
          <p style="color:#92400E;margin:0;font-weight:bold">
            ⚠️ After trial ends: your products will be hidden and AutoDM rules will pause.
          </p>
        </div>
        <div style="text-align:center;margin:32px 0">
          <a href="https://creatorly.in/dashboard/settings/billing"
            style="background:#D97706;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Upgrade Now →
          </a>
        </div>
      </div>
    </div>`
    };
}
