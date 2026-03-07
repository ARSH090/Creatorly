export function trialExpiredEmail({ name, plan }: { name: string; plan: string }) {
    return {
        subject: `Your ${plan} trial has ended — Upgrade to continue`,
        html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:#DC2626;padding:40px;text-align:center">
        <h1 style="color:white;margin:0">Trial Ended</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1E293B">Hi ${name},</h2>
        <p style="color:#475569;line-height:1.6">
          Your <strong>${plan}</strong> trial has ended.
          Your storefront premium features are currently paused and downgraded to Free tier.
        </p>
        <p style="color:#475569;line-height:1.6">Upgrade now to reactivate your automations and products.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="https://creatorly.in/dashboard/settings/billing"
            style="background:#4F46E5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Reactivate Account →
          </a>
        </div>
      </div>
    </div>`
    };
}
