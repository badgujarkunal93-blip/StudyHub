# StudyHub Mobile Install Guide

StudyHub now has two install paths:

1. PWA install from a browser
2. Unofficial Android APK build with Capacitor

## PWA Install

### Android
1. Open the hosted app URL in Chrome, Edge, or Brave.
2. Tap the browser menu.
3. Choose `Install app` or `Add to Home screen`.

### iPhone or iPad
1. Open the hosted app URL in Safari.
2. Tap `Share`.
3. Choose `Add to Home Screen`.

## Unofficial Android APK

The repo now includes Capacitor setup so you can wrap the current web app as a real Android app and share the APK directly with friends.

### Repo commands

Run these from `c:\Users\kunal badgujar\Desktop\Projects\daily app`:

```powershell
npm.cmd run android:sync
```

This command:
- copies the StudyHub web files into `www/`
- syncs them into the native Android project

To open the Android project in Android Studio:

```powershell
npm.cmd run android:open
```

### What you still need on this PC

- Java JDK
- Android Studio
- Android SDK platform tools

Without those, the repo is prepared but the APK itself cannot be built yet.

### Build the shareable APK

1. Run `npm.cmd run android:open`
2. Let Android Studio finish Gradle sync
3. Open `Build > Build APK(s)` for a quick test APK
4. Find the generated file under `android\app\build\outputs\apk\debug\app-debug.apk`
5. Send that APK to your phone or to your friends

### Build a proper signed APK

Use this when you want to update the app later without install issues:

1. Open Android Studio
2. Go to `Build > Generate Signed Bundle / APK`
3. Choose `APK`
4. Create and save a keystore
5. Build the `release` APK
6. Share `android\app\build\outputs\apk\release\app-release.apk`

### After every StudyHub change

Whenever you edit `StudyHub.html`, `app.js`, `styles.css`, or `assets`, run:

```powershell
npm.cmd run android:sync
```

That refreshes the Android app with the latest StudyHub UI and logic.

## Notes

- StudyHub data is still stored locally on each phone
- Friends can install the APK as a third-party app by allowing `Install unknown apps`
- Browser-only install still works separately through the existing PWA files
