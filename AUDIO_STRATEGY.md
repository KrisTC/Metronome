# Audio Strategy

## Short Version

The `<audio>` file approach fixes the iPhone silent/vibrate problem, but it is not reliable enough for a metronome. The old `OscillatorNode` / Web Audio approach had much better timing because Web Audio can schedule sounds ahead of time against the audio clock.

Primary recommendation:

Use Web Audio for the click generation and scheduling again, but try routing the Web Audio graph through a hidden media element using `MediaStreamAudioDestinationNode`.

That means:

```text
OscillatorNode / GainNode
  -> MediaStreamAudioDestinationNode
  -> hidden <audio srcObject=stream playsinline>
  -> iOS media playback route
```

This is the most promising web-only hybrid:

- Web Audio keeps precise scheduling.
- The hidden `<audio>` element may keep the iPhone silent/vibrate behavior that worked with media playback.
- We avoid repeated `audio.play()` calls on every beat, which is the part that behaves badly on the phone.

This is still an iOS workaround, not a guaranteed platform feature.

## What Is Probably Happening

There are two separate issues:

1. **Audio route / silent mode**

   On iPhone, different audio APIs can be treated differently by the OS. Media playback, such as Music, YouTube, and apparently our `<audio>` sample playback, can play while the phone is on silent/vibrate.

   Web Audio output directly to `audioContext.destination` can be treated more like app/game/sound-effect audio, so iOS may mute it when the silent switch is on.

2. **Timing**

   A metronome needs very consistent timing.

   Web Audio is good at this because it has its own audio clock. We can say “start this sound at audio time 12.340” and the browser schedules it accurately.

   `<audio>.play()` is not that kind of API. It means “please start/resume this media element.” The returned promise tells us playback was allowed/started by the media element, but it does not give us precise beat scheduling. On iPhone, this can be delayed or reordered enough to sound awful.

## Why The Current `<audio>` Pool Still Fails

The app already does several useful things:

- Uses cropped WAV files with no leading silence.
- Creates a pool of audio elements so fast tempos do not always restart the same element.
- Sets `preload = "auto"`.
- Calls `load()`.
- Waits for load-ish readiness.
- Unlocks the audio elements after the user taps Start.
- Tracks busy/loaded state to avoid reusing an element that is still settling.
- Drops stale beats if the phone delayed timers.

Those are all reasonable mitigations, but they do not fix the core problem: each beat still depends on a JavaScript timer firing and then `audio.play()` starting promptly. That is not reliable enough on mobile Safari for metronome timing.

## Can An Oscillator Use The Media Destination?

Not directly.

An `OscillatorNode` connects inside a Web Audio graph. Normally it connects to:

```text
audioContext.destination
```

That destination is not the same thing as an `<audio>` element. The web platform does not let us say “connect this oscillator directly into the private output destination used by this media element.”

But there is a possible bridge:

```js
const audioContext = new AudioContext();
const streamDestination = audioContext.createMediaStreamDestination();
const mediaElement = new Audio();

mediaElement.srcObject = streamDestination.stream;
mediaElement.playsInline = true;
await mediaElement.play();

// Then connect scheduled click nodes to streamDestination instead of
// audioContext.destination.
```

This turns the Web Audio graph into a `MediaStream`, then plays that stream through an `<audio>` element.

The hope is that iOS treats the hidden media element like media playback, while the click timing still comes from Web Audio.

## Proposed Implementation

Try this next:

1. Revert the beat sound engine to Web Audio scheduling.
2. Keep the optimized WAV samples if desired, but decode them into `AudioBuffer`s and schedule them with `AudioBufferSourceNode`.
3. Alternatively, go back to `OscillatorNode` clicks if they sounded better and were simpler.
4. Create one hidden media element:

   ```js
   const mediaElement = new Audio();
   mediaElement.playsInline = true;
   mediaElement.muted = false;
   mediaElement.srcObject = streamDestination.stream;
   ```

5. On Start, inside the user tap handler:

   ```js
   await audioContext.resume();
   await mediaElement.play();
   ```

6. Route all click nodes to `streamDestination`, not `audioContext.destination`.
7. Keep the visual scheduler as before, but use `audioContext.currentTime` for the audio clock.

Expected result if the workaround works:

- iPhone silent/vibrate still produces sound.
- Beat timing returns to Web Audio quality.
- No per-beat `audio.play()` calls.

## Fallback If The Hybrid Does Not Work

If iOS still mutes the Web Audio stream or adds unacceptable latency, the honest options are:

1. Use Web Audio and tell the user silent mode must be off.
2. Use `<audio>` and accept poor timing.
3. Build a native iOS wrapper/app and set the native audio session to playback.

For a real metronome, option 1 is musically better than option 2. A metronome with unreliable timing is worse than one that requires the silent switch to be off.

## Useful Docs

- `AudioContext.destination`: the normal Web Audio output destination.
- `OscillatorNode`: generated Web Audio source.
- `AudioBufferSourceNode`: scheduled playback of decoded samples.
- `MediaStreamAudioDestinationNode`: turns a Web Audio graph into a `MediaStream`.
- `HTMLMediaElement.srcObject`: lets an `<audio>` element play a `MediaStream`.
- `HTMLMediaElement.play()`: starts media playback, but is not a precise scheduling primitive.

