import type { DetectedSign, TranscriptToken } from '../types';

let counter = 0;
const nextId = () => `${Date.now().toString(36)}-${(counter += 1)}`;

const endsWithSpace = (tokens: TranscriptToken[]) =>
  tokens.length === 0 || tokens[tokens.length - 1].kind === 'space';

const isSentenceStart = (tokens: TranscriptToken[]) =>
  tokens.length === 0 || /[.!?]\s*$/.test(transcriptText(tokens));

/** Append a recognised sign, keeping fingerspelling tight and words spaced. */
export function appendSign(
  tokens: TranscriptToken[],
  sign: DetectedSign,
  now: number,
): TranscriptToken[] {
  const isWord = !/^[A-Za-z]$/.test(sign.label);

  if (!isWord) {
    return [
      ...tokens,
      { id: nextId(), kind: 'letter', value: sign.label.toUpperCase(), at: now, confidence: sign.confidence },
    ];
  }

  const next = [...tokens];
  if (!endsWithSpace(tokens)) {
    next.push({ id: nextId(), kind: 'space', value: ' ', at: now });
  }

  const label = isSentenceStart(tokens)
    ? sign.label
    : sign.label.toLowerCase();

  next.push({
    id: nextId(),
    kind: 'word',
    value: label,
    at: now,
    confidence: sign.confidence,
  });
  next.push({ id: nextId(), kind: 'space', value: ' ', at: now });
  return next;
}

export function addSpace(tokens: TranscriptToken[], now: number): TranscriptToken[] {
  if (endsWithSpace(tokens)) return tokens;
  return [...tokens, { id: nextId(), kind: 'space', value: ' ', at: now }];
}

/** One press removes one token: a letter, a space, or a whole spoken word. */
export function backspace(tokens: TranscriptToken[]): TranscriptToken[] {
  return tokens.length === 0 ? tokens : tokens.slice(0, -1);
}

export function transcriptText(tokens: TranscriptToken[]): string {
  return tokens
    .map((token) => (token.kind === 'space' ? ' ' : token.value))
    .join('')
    .replace(/\s+$/g, '');
}
