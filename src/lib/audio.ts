import { stripStress } from '../domain/text'

let audioCtx: AudioContext | null = null

/** Speak Bulgarian text with the browser voice (fallback until pre-generated audio exists). */
export function speak(text: string, opts: { slow?: boolean } = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(stripStress(text))
  u.lang = 'bg-BG'
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('bg'))
  if (voice) u.voice = voice
  u.rate = opts.slow ? 0.55 : 0.85
  synth.speak(u)
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}

/** Tiny synthesized sound effects, no audio files needed. */
export function sfx(kind: 'ok' | 'bad' | 'done'): void {
  try {
    audioCtx ??= new AudioContext()
    const ctx = audioCtx
    const notes = kind === 'ok' ? [660, 880] : kind === 'bad' ? [220, 180] : [523, 659, 784, 1046]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = kind === 'bad' ? 'sawtooth' : 'sine'
      o.frequency.value = f
      const t = ctx.currentTime + i * 0.11
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.2)
    })
  } catch {
    /* audio not available */
  }
}
