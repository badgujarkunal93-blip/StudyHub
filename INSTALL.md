# 📱 StudyHub - Install as Mobile App

Your StudyHub app is now a **Progressive Web App (PWA)** and can be installed on any mobile device!

## Files Created:
- **manifest.json** - App configuration & metadata
- **sw.js** - Service Worker (enables offline mode)
- **StudyHub.html** - Updated with PWA support

## How to Install on Mobile

### 📱 Android (Chrome, Edge, Brave)
1. Open `StudyHub.html` in your browser
2. Tap the **⋮ (menu)** button
3. Select **"Install app"** or **"Add to Home screen"**
4. Confirm the installation

### 🍎 iOS (iPhone/iPad)
1. Open `StudyHub.html` in **Safari**
2. Tap the **Share** button (⬆️)
3. Scroll and select **"Add to Home Screen"**
4. Rename if desired, tap **"Add"**

## Quick Deploy Options

### Option 1: Use GitHub Pages (Free)
```bash
# Create a GitHub repo, push these files
git push origin main
# Enable Pages in Repository Settings → GitHub Pages
# Your app will be at: https://yourusername.github.io/studyhub
```

### Option 2: Use Netlify (Free)
```bash
# Drag and drop your folder to: https://app.netlify.com
# Get a live URL instantly
```

### Option 3: Host Locally
```bash
# Python 3:
python -m http.server 8000

# Node.js (with http-server):
npm install -g http-server
http-server

# Then open: http://localhost:8000/StudyHub.html
```

## Features Enabled ✓

✅ **Installable** - Appears as a native app on home screen
✅ **Offline Mode** - Works without internet (caches your data)
✅ **Standalone** - No browser UI, full screen experience
✅ **Fast Loading** - Service Worker caches files for speed
✅ **Local Storage** - Your data stays on your device
✅ **Share Shortcuts** - Quick access to "New Task" from home screen

## Testing Locally

1. Open PowerShell in your project folder:
   ```powershell
   python -m http.server 8000
   ```

2. Visit `http://localhost:8000/StudyHub.html`

3. **Android/Chrome**: Menu → Install app
4. **iPhone/Safari**: Share → Add to Home Screen
5. **Desktop**: Works in Chrome/Edge/Brave DevTools mobile emulation

## Notes

- All data is stored locally on your device
- Export data by copying localStorage (if needed)
- Service Worker enables offline access to your cached data
- App updates automatically when you refresh

Enjoy your new StudyHub app! 🚀
