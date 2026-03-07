export function welcomeEmail({ name, username }: { name: string; username: string }) {
    return {
        subject: `Welcome to Creatorly, ${name}! 🚀`,
        html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:40px;text-align:center">
        <h1 style="color:white;margin:0;font-size:2rem">🚀 Welcome to Creatorly!</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1E293B">Hi ${name},</h2>
        <p style="color:#475569;line-height:1.6">
          Your creator storefront is ready at
          <a href="https://creatorly.in/u/${username}" style="color:#4F46E5;font-weight:bold">
            creatorly.in/u/${username}
          </a>
        </p>
        <p style="color:#475569;line-height:1.6">Here's what you can do next:</p>
        <ul style="color:#475569;line-height:2">
          <li>📦 Create your first digital product</li>
          <li>🎨 Customize your storefront</li>
          <li>🤖 Set up Instagram AutoDM</li>
          <li>📧 Send your first email campaign</li>
        </ul>
        <div style="text-align:center;margin:32px 0">
          <a href="https://creatorly.in/dashboard"
            style="background:#4F46E5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Go to Dashboard →
          </a>
        </div>
      </div>
      <div style="background:#F8FAFC;padding:20px;text-align:center;color:#94A3B8;font-size:0.875rem">
        Creatorly · India's Creator Commerce Platform<br>
        <a href="https://creatorly.in/unsubscribe" style="color:#94A3B8">Unsubscribe</a>
      </div>
    </div>`
    };
}
