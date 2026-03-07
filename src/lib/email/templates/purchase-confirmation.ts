export function purchaseConfirmationEmail({
    buyerName, productName, creatorName, amount, downloadUrl
}: { buyerName: string; productName: string; creatorName: string; amount: number; downloadUrl?: string }) {
    return {
        subject: `✅ You got access to "${productName}"`,
        html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:#059669;padding:40px;text-align:center">
        <h1 style="color:white;margin:0">✅ Purchase Confirmed!</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1E293B">Hi ${buyerName},</h2>
        <p style="color:#475569">You've successfully purchased:</p>
        <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:16px;margin:16px 0">
          <strong style="color:#166534;font-size:1.1rem">${productName}</strong><br>
          <span style="color:#15803D">by ${creatorName}</span><br>
          <span style="color:#166534;font-weight:bold">₹${(amount / 100).toLocaleString('en-IN')}</span>
        </div>
        ${downloadUrl ? `
        <div style="text-align:center;margin:32px 0">
          <a href="${downloadUrl}"
            style="background:#059669;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Download Now →
          </a>
        </div>` : ''}
        <p style="color:#94A3B8;font-size:0.875rem;text-align:center">
          Order processed securely by Creatorly.
        </p>
      </div>
    </div>`
    };
}
