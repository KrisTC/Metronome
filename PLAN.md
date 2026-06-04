# Metronome Web App Plan

## Goal

Build a small, reliable metronome web app using plain HTML, CSS, and JavaScript. It should work well on a phone and be installable to the home screen as a Progressive Web App, so it feels like a simple app without needing the App Store.

The first version should prioritize clarity, stable timing, and ease of use over lots of advanced features.

## Target Users

- Primary user: Elowen, a child practicing flute on a phone or tablet.
- Secondary user: a parent helping configure or install the app.

The interface should be simple enough to use without reading instructions.

## Core Requirements

### Metronome Playback

- Start and stop the metronome with one large control.
- Set tempo in beats per minute.
- Support a practical tempo range, likely `30-240 BPM`.
- Keep timing accurate enough for practice.
- Continue playing while the screen stays awake and the browser tab remains active.
- Use clear beat sounds that are not harsh over long practice sessions.

### Tempo Controls

- Provide plus and minus controls for small adjustments.
- Provide larger step controls, such as `-5` and `+5`, if useful.
- Allow direct BPM entry.
- Consider a tap tempo control after the first version if it does not complicate the UI.

### Beat and Accent Controls

- Support common time signatures or beat groupings:
  - `1`
  - `2`
  - `3`
  - `4`
  - `6`
- Accent the first beat of each bar.
- Show the current beat visually.

### Flute Practice Support

The app should favor the kinds of practice a young flute player is likely to do:

- Make steady pulse practice feel central, because flute tone, breathing, tonguing, and finger coordination all depend on consistent timing.
- Include beat groupings that cover common beginner flute material, especially `2`, `3`, `4`, and `6`.
- Make `3` and `6` easy to reach, since flute pieces and studies often use waltz-like `3/4`, compound `6/8`, or lilting rhythms.
- Support a gentle accent on the first beat without making it too loud, so it helps phrasing without overpowering the flute.
- Offer a visual pulse strong enough to use when the metronome volume is low.
- Consider a quieter click sound by default, because flute practice can involve sustained notes where a harsh click becomes distracting.
- Consider a "count-in" option before playback starts, such as one bar of clicks before she begins playing.
- Consider a "long-note mode" later, where the app marks whole bars instead of every beat for tone and breath-control practice.
- Consider a "scale trainer" later, where the tempo can increase gradually after each successful repeat.

### Visual Design

- Design for phone-first use.
- Use large touch targets.
- Make the current BPM obvious.
- Make start/stop state visually obvious.
- Avoid clutter and advanced controls on the main screen.
- Work in portrait orientation first.
- Support light and dark mode if it remains simple.

### Installable Web App

- Include a web app manifest.
- Include app icons for home screen installation.
- Include a service worker so the app can load offline after first visit.
- Make the app usable from the home screen on iOS and Android.
- Include Apple-specific metadata for better iPhone home screen behavior.

## Technical Approach

### Project Shape

Keep the app dependency-free:

```text
/
  index.html
  styles.css
  app.js
  manifest.webmanifest
  service-worker.js
  icons/
    icon-192.png
    icon-512.png
```

Optional files later:

```text
  README.md
  favicon.ico
  apple-touch-icon.png
```

### Audio Timing

Use the Web Audio API instead of relying on `setInterval` alone.

Planned approach:

- Create an `AudioContext` after the user taps Start.
- Schedule short click sounds slightly ahead of time.
- Use a JavaScript timer only as a scheduler loop.
- Track beat position and bar accents in JavaScript.
- Avoid loading audio files for the first version by generating simple oscillator clicks.

This should be more accurate than playing sounds directly inside `setInterval`.

### PWA Behavior

The app should include:

- `manifest.webmanifest` with name, short name, icons, theme color, start URL, and display mode.
- `service-worker.js` to cache core files.
- `<link rel="manifest">` in `index.html`.
- `<meta name="theme-color">`.
- `<meta name="apple-mobile-web-app-capable" content="yes">`.
- `<meta name="apple-mobile-web-app-title">`.
- Apple touch icon link.

Important limitation: iPhone users usually install this kind of app through Safari using Share -> Add to Home Screen.

## Suggested First Version

Version 1 should include:

- Start/stop button.
- BPM display.
- Direct BPM input.
- `-5`, `-1`, `+1`, `+5` controls.
- Beat grouping selector.
- Accent first beat toggle.
- Flute-friendly default settings, likely moderate tempo, gentle click, and `4` beats per bar.
- Visual beat indicator.
- Installable PWA metadata.
- Offline cache.
- Memory of current settings in local storage (in device).

Version 1 should avoid:

- Practice routines.
- Presets.
- Sound packs.
- Complex subdivisions.
- Background playback promises.
- Cloud sync.
- Accounts or settings screens.

## Future Ideas

Possible later features:

- Tap tempo.
- Subdivisions: eighth notes, triplets, sixteenth notes.
- Named presets for flute scales, pieces, or exercises.
- Gradual speed trainer, such as increase by `5 BPM` every `8 bars`.
- Practice timer.
- Different click sounds.
- Vibration or silent visual-only mode.
- Landscape layout.
- Count-in before starting.
- Long-note mode for tone and breath-control practice.
- Phrase mode, such as accenting every `2`, `4`, or `8` bars.

## Decisions To Make Before Building

1. What age range should the UI be designed for? A: 10+ She is 14 with 6 years eperince with fife and 2 years with flute.
2. Should the app look playful, minimal, or music-practice focused? A: teen freindly, minimal not too distracting.
3. What BPM range should be allowed? A: I don't know
4. Which beat groupings are needed for her current practice? A: I don't know
5. Should tap tempo be included in version 1 or saved for later? A: It should remember last selection.
6. Should the app remember the last tempo and settings? a: yes
7. Should it prevent the phone from sleeping if possible, using the Screen Wake Lock API where supported? A: yes, if possible.
8. What should the app be called on the home screen? A: Just 'Metronome'
9.  Does Elowen mostly practice scales, exercises, pieces, or a mix? A: mix
10. Does she need support for `6/8` or other compound-time pieces now?  A: I don't know
11. Would a count-in help her start playing in time? A: probably
12. Should the default click be soft and woodblock-like rather than a sharp electronic beep?  A: yes, but would be good to provide basic options.

## Implementation Milestones

### Milestone 1: Static App Shell

- Create `index.html`, `styles.css`, and `app.js`.
- Build the phone-first interface.
- Add controls without audio behavior.
- Make `2`, `3`, `4`, and `6` beat groupings easy to select.
- Check layout on narrow and wider screens.

### Milestone 2: Metronome Engine

- Add Web Audio API click generation.
- Add accurate scheduler loop.
- Add tempo changes while playing.
- Add beat grouping and accent behavior.
- Tune the default click and accent levels for flute practice.
- Add visual beat updates.

### Milestone 3: Persistence and Polish

- Remember last settings in `localStorage`.
- Refine touch targets, colors, and spacing.
- Add accessible labels.
- Handle invalid BPM input cleanly.
- Handle audio context resume behavior on mobile.

### Milestone 4: PWA Installation

- Add manifest.
- Add icons.
- Add service worker.
- Verify offline loading.
- Verify home screen installation behavior on iPhone and Android if devices are available.

### Milestone 5: Testing

- Test on desktop browser.
- Test on iPhone Safari.
- Test on Android Chrome if available.
- Test start/stop responsiveness.
- Test changing tempo while playing.
- Test airplane mode after first load.
- Test home screen launch.

## Known Risks

- Mobile browsers can restrict audio until the user interacts with the page.
- iOS home screen web apps have different behavior from normal Safari tabs.
- Background playback is not reliable for a web metronome and should not be promised.
- Exact audio timing can vary by device, but Web Audio scheduling should be good enough for practice.
- Service worker caching needs care so updates do not get stuck on old files.

## Open Questions

- Should this be a single-screen app only?
- Should the visual beat indicator be dots, a pulsing circle, a swinging pendulum, or something else?
- Should the default tempo be `80`, `100`, or something specific to her practice?
- Does she need common Italian tempo markings, like Andante or Allegro?
- Are there accessibility needs such as larger text, reduced motion, or high contrast?
- What flute grade, book, or pieces is she currently working on?
- Would she benefit more from a simple metronome first, or from practice helpers like count-in and gradual tempo increase?
