export async function sendDiscordAlert(title: string, message: string, color: number = 0x3498db) {
    const webhookUrl = process.env.DISCORD_ALERTS_WEBHOOK;
    if (!webhookUrl) return;

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title,
                    description: message,
                    color,
                    timestamp: new Date().toISOString(),
                }]
            })
        });
    } catch (err) {
        console.error('Failed to send Discord alert:', err);
    }
}

export async function sendCriticalAlert(message: string, context?: any) {
    console.error(`[CRITICAL ALERT] ${message}`, context);
    await sendDiscordAlert('🚨 CRITICAL ERROR', `${message}\n\nContext: ${JSON.stringify(context || {})}`, 0xff0000);
}

export async function sendFinancialAlert(message: string, value: number) {
    await sendDiscordAlert('💰 High-Value Transaction', `${message}\nValue: ₹${value}`, 0x2ecc71);
}
