

## Add Per-Figure Audio Narration in FigurePanel

**What it does:** Adds a "Listen to Story" button inside the figure detail panel that reads aloud that figure's biography using browser TTS. Includes play/pause/stop controls and auto-stops when the panel closes.

### Changes

**`src/components/FigurePanel.tsx`**
- Add a play/pause button row below the "Full Story" divider (before the biography text)
- Use `window.speechSynthesis` to speak the figure's biography
- Track local state: idle / playing / paused
- Cancel speech on panel close (cleanup in `useEffect`)
- Style controls to match the existing gold/parchment theme

No new files or dependencies needed — reuses the same browser TTS API already used by the walkthrough.

