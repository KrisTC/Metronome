# Metronome

A small, phone-first metronome web app for steady music practice. It is free, has no ads, and does not require a login.

The app is plain HTML, CSS, and JavaScript. It can be installed to the home screen as a Progressive Web App and works offline after the first successful load.

## Public URL

The app is published at:

https://kristc.github.io/Metronome/

Use that URL for installing the app on a phone or sharing it.

## Installing On iPhone / iPad

iOS does not usually show a browser install prompt for PWAs. Install it from Safari:

1. Open `https://kristc.github.io/Metronome/` in **Safari**.
2. Tap the **Share** button.
3. Scroll and tap **Add to Home Screen**.
4. Confirm the name, usually `Metronome`.
5. Tap **Add**.
6. Launch it from the new home screen icon.

After the first successful load, the app should continue to open offline because the service worker caches the core files.

## Updating On iPhone

The app includes service worker update handling:

- It checks for updates when opened or when returning to the app.
- If a new version is ready and the metronome is idle, it reloads automatically.
- If the metronome is playing, it shows an `Update ready` bar with a `Refresh` button.

If an installed iPhone copy seems stuck on an old version:

1. Open the app from the home screen.
2. Check the tiny version label in the bottom-right corner.
3. Close the app from the app switcher.
4. Reopen it while online.
5. If needed, open the site once in Safari, then reopen the home screen app.

In stubborn cases, remove the home screen icon and install it again from Safari.

## Features

- Tempo range from `30` to `240` BPM.
- Large start/stop control.
- Direct BPM entry.
- Quick tempo buttons: `-5`, `-1`, `+1`, `+5`.
- Beat groupings: `1`, `2`, `3`, `4`, and `6`.
- Optional first-beat accent.
- Optional one-bar count-in.
- Visual beat pulse and beat dots.
- Remembers settings in `localStorage`.
- Keeps the screen awake where the browser supports the Screen Wake Lock API.
- Installable PWA with manifest, icons, and service worker cache.
- Tiny version label in the bottom-right corner to confirm the loaded build.

## Notes And Limitations

- The app is designed for foreground practice. Reliable background playback is not promised.
- Mobile browsers require a user gesture before audio can start.
- Screen wake lock is requested only where supported.
- Offline support works after the first successful online visit.
- Service worker caching can make updates feel delayed; the visible version label is there to make that easier to diagnose.

## Technical Notes

### Audio Approach

The current audio implementation uses Web Audio for timing and click generation.

The important detail is that the app routes Web Audio through a hidden media element:

```text
OscillatorNode / GainNode
  -> MediaStreamAudioDestinationNode
  -> hidden <audio srcObject=stream playsinline>
```

Why:

- Web Audio gives reliable metronome timing because clicks can be scheduled against the audio clock.
- Calling `<audio>.play()` on every beat was unreliable on iPhone.
- Direct Web Audio output could be muted by iPhone silent/vibrate mode.
- Routing the Web Audio graph through a media element keeps the timing benefits and, in testing, still plays on iPhone when the phone is on silent/vibrate.

This is a web workaround, not a native iOS audio-session guarantee. If the behavior changes in Safari/iOS, the fallback would be either direct Web Audio with silent mode off, or a native wrapper/app with an explicit playback audio session.

### Project Files

```text
index.html              App markup and PWA metadata
styles.css              Phone-first responsive styling
app.js                  Metronome logic, Web Audio, settings, update handling
manifest.webmanifest    PWA manifest
service-worker.js       Offline cache and update behavior
robots.txt              Search crawler access rules
sitemap.xml             Public URL submitted to search engines
icons/                  App icons
```

### Deploying

This app is static. It can be hosted on GitHub Pages, Netlify, Cloudflare Pages, or any HTTPS static host.

For PWA installation and service workers, the deployed site must be served over HTTPS.

When changing cached files, bump both:

- `APP_VERSION` in `app.js`
- `CACHE_NAME` in `service-worker.js`

The visible app version should match the service worker cache version, for example `v14` and `metronome-v14`.

## Future Ideas

Possible later additions:

- Tap tempo.
- Subdivisions.
- Named practice presets.
- Gradual speed trainer.
- Practice timer.
- Long-note mode for tone and breath-control practice.
- Phrase or bar-level accent modes.
