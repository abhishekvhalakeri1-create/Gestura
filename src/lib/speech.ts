/** Thin wrapper around the Web Speech API with graceful absence. */

export const speechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (!speechSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const preferred =
    voices.find((voice) => /Samantha|Ava|Serena|Jenny|Google US English/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.startsWith('en-US')) ??
    voices.find((voice) => voice.lang.startsWith('en')) ??
    voices[0];

  cachedVoice = preferred;
  return preferred;
}

export function speak(
  text: string,
  options: { rate?: number; onEnd?: () => void } = {},
) {
  if (!speechSupported() || !text.trim()) {
    options.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

if (typeof window !== 'undefined' && speechSupported()) {
  // Voices load asynchronously in Chromium.
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}
