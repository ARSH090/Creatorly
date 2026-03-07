export function saleNotificationEmail({
    creatorName, productName, buyerEmail, amount
}: { creatorName: string; productName: string; buyerEmail: string; amount: number }) {
    return {
        subject: `💰 New sale: "${productName}" — ₹${(amount / 100).toLocaleString('en-IN')}`,
        html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:#4F46E5;padding:40px;text-align:center">
        <h1 style="color:white;margin:0">💰 You made a sale!</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1E293B">Hi ${creatorName},</h2>
        <div style="background:#EEF2FF;border:1px solid #A5B4FC;border-radius:8px;padding:20px;margin:16px 0">
          <p style="color:#4338CA;margin:0"><strong>Product:</strong> ${productName}</p>
          <p style="color:#4338CA;margin:8px 0"><strong>Buyer:</strong> ${buyerEmail}</p>
          <p style="color:#4338CA;margin:0;font-size:1.25rem"><strong>Amount: ₹${(amount / 100).toLocaleString('en-IN')}</strong></p>
        </div>
        <div style="text-align:center;margin:32px 0">
          <a href="https://creatorly.in/dashboard/orders"
            style="background:#4F46E5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View Orders →
          </a>
        </div>
      </div>
    </div>`
    };
}
