import type { SignCategory } from '../types';
import type { HandShape } from '../lib/handPose';

export interface SignEntry {
  id: string;
  /** What lands in the transcript. */
  label: string;
  name: string;
  category: SignCategory;
  /** Three-to-five word descriptor used on the card. */
  blurb: string;
  shape: HandShape;
  /** Plain-English anatomical cues. */
  tips: [string, string];
  /** Present when the sign lives in motion rather than in a frozen handshape. */
  movement?: string;
  /** Whether the live interpreter will auto-commit this sign. */
  recognized: boolean;
  /** Honest note when a sign cannot be read from a static handshape. */
  caveat?: string;
  keywords: string;
}

const f = (curl: number, spread = 0) => ({ curl, spread });

/** A handshape in ASL is orientation-independent; these are canonical, upright. */
export const SIGNS: SignEntry[] = [
  {
    id: 'a',
    label: 'A',
    name: 'A',
    category: 'letter',
    blurb: 'soft fist, thumb alongside',
    shape: { index: f(0.95), middle: f(0.94), ring: f(0.93), pinky: f(0.92), thumb: { abduction: 0.55, curl: 0.05 } },
    tips: [
      'Make a relaxed fist, knuckles facing out.',
      'Rest your thumb alongside your index finger — not across the front.',
    ],
    recognized: true,
    keywords: 'fist thumb side ay',
  },
  {
    id: 'b',
    label: 'B',
    name: 'B',
    category: 'letter',
    blurb: 'flat hand, fingers together',
    shape: { index: f(0.04), middle: f(0.03), ring: f(0.04), pinky: f(0.05), thumb: { abduction: 0.05, curl: 0.25 } },
    tips: [
      'Fingers straight up and pressed gently together.',
      'Fold the thumb across the front of your palm.',
    ],
    recognized: true,
    keywords: 'flat palm fingers together bee',
  },
  {
    id: 'c',
    label: 'C',
    name: 'C',
    category: 'letter',
    blurb: 'curved hand, like holding a fruit',
    shape: { index: f(0.5), middle: f(0.48), ring: f(0.5), pinky: f(0.52), thumb: { abduction: 0.26, curl: 0.4 } },
    tips: [
      "Curve every finger as if you're holding a small orange.",
      'Bring your thumb round so the gap reads as a C, not a claw.',
    ],
    recognized: true,
    keywords: 'curve cee cup',
  },
  {
    id: 'd',
    label: 'D',
    name: 'D',
    category: 'letter',
    blurb: 'index up, thumb meets middle',
    shape: { index: f(0.05), middle: f(0.9), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.3, curl: 0.35 } },
    tips: [
      'Index finger up, tall and calm.',
      'Let your thumb and middle fingertip meet to close the circle.',
    ],
    recognized: true,
    keywords: 'index circle dee',
  },
  {
    id: 'e',
    label: 'E',
    name: 'E',
    category: 'letter',
    blurb: 'fingertips gathered at the thumb',
    shape: { index: f(0.88), middle: f(0.9), ring: f(0.9), pinky: f(0.9), thumb: { abduction: 0.08, curl: 0.5 } },
    tips: [
      'Curl all four fingertips down towards your thumb.',
      'Everything gathers low and close — keep the thumb tucked in.',
    ],
    recognized: true,
    keywords: 'gathered claw ee',
  },
  {
    id: 'f',
    label: 'F',
    name: 'F',
    category: 'letter',
    blurb: 'thumb and index make a circle',
    shape: { index: f(0.6), middle: f(0.05), ring: f(0.05), pinky: f(0.05), thumb: { abduction: 0.22, curl: 0.3 } },
    tips: [
      'Pinch thumb and index into a soft circle.',
      'Let the other three fingers stay long and relaxed.',
    ],
    recognized: true,
    keywords: 'circle ok eff',
  },
  {
    id: 'g',
    label: 'G',
    name: 'G',
    category: 'letter',
    blurb: 'index and thumb point sideways',
    shape: { index: f(0.04), middle: f(0.92), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.5, curl: 0.05 }, rotation: 70 },
    tips: [
      'Index points forward, thumb parallel beside it.',
      'Turn your hand so both fingers aim sideways, like a small pistol.',
    ],
    recognized: true,
    keywords: 'point side gee',
  },
  {
    id: 'h',
    label: 'H',
    name: 'H',
    category: 'letter',
    blurb: 'two fingers, sideways',
    shape: { index: f(0.03), middle: f(0.05), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.5, curl: 0.1 }, rotation: 62 },
    tips: [
      'Index and middle together like a slim blade.',
      'Aim them sideways, with the thumb resting alongside.',
    ],
    caveat: "H shares U's handshape. Gestura reads shape, so it will read as U — rotate your hand and watch for the U reading.",
    recognized: false,
    keywords: 'two fingers sideways aitch',
  },
  {
    id: 'i',
    label: 'I',
    name: 'I',
    category: 'letter',
    blurb: 'pinky up from a fist',
    shape: { index: f(0.95), middle: f(0.94), ring: f(0.93), pinky: f(0.03), thumb: { abduction: 0.08, curl: 0.3 } },
    tips: [
      'Start from a comfortable fist.',
      'Stand your pinky up on its own — no tension in the rest of the hand.',
    ],
    recognized: true,
    keywords: 'pinky eye',
  },
  {
    id: 'j',
    label: 'J',
    name: 'J',
    category: 'letter',
    blurb: 'the I shape, drawn downwards',
    shape: { index: f(0.95), middle: f(0.94), ring: f(0.93), pinky: f(0.03), thumb: { abduction: 0.08, curl: 0.3 } },
    tips: [
      'Begin with the I handshape.',
      'Sweep your pinky down and away in one smooth J-stroke.',
    ],
    movement: 'Movement sign — the handshape is I; the J lives in the arc.',
    caveat: "J is a moving sign, so the live tape will settle on I unless you're tracing the arc.",
    recognized: false,
    keywords: 'jay motion pinky',
  },
  {
    id: 'k',
    label: 'K',
    name: 'K',
    category: 'letter',
    blurb: 'two fingers up, thumb between',
    shape: { index: f(0.04, 0.3), middle: f(0.08, 0.3), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.45, curl: 0.25 } },
    tips: [
      'Index and middle up in a V.',
      'Tuck your thumb between them, resting at the knuckles.',
    ],
    recognized: true,
    keywords: 'kay v thumb between',
  },
  {
    id: 'l',
    label: 'L',
    name: 'L',
    category: 'letter',
    blurb: 'index up, thumb out',
    shape: { index: f(0.02), middle: f(0.94), ring: f(0.94), pinky: f(0.94), thumb: { abduction: 0.95, curl: 0.02 } },
    tips: [
      'Index finger straight up.',
      'Thumb out to the side at a right angle — a generous, open L.',
    ],
    recognized: true,
    keywords: 'ell right angle',
  },
  {
    id: 'm',
    label: 'M',
    name: 'M',
    category: 'letter',
    blurb: 'three fingers over the thumb',
    shape: { index: f(0.85), middle: f(0.85), ring: f(0.85), pinky: f(0.92), thumb: { abduction: 0.04, curl: 0.55 } },
    tips: [
      'Fold three fingers down over your thumb.',
      'The thumb hides underneath, pointing across the palm.',
    ],
    recognized: true,
    keywords: 'em three over thumb',
  },
  {
    id: 'n',
    label: 'N',
    name: 'N',
    category: 'letter',
    blurb: 'two fingers over the thumb',
    shape: { index: f(0.82), middle: f(0.82), ring: f(0.9), pinky: f(0.9), thumb: { abduction: 0.06, curl: 0.5 } },
    tips: [
      'Fold two fingers over your thumb instead of three.',
      'Slightly narrower and lighter than M.',
    ],
    recognized: true,
    keywords: 'en two over thumb',
  },
  {
    id: 'o',
    label: 'O',
    name: 'O',
    category: 'letter',
    blurb: 'all fingertips meet the thumb',
    shape: { index: f(0.62), middle: f(0.6), ring: f(0.62), pinky: f(0.64), thumb: { abduction: 0.24, curl: 0.4 } },
    tips: [
      'Bring every fingertip to meet your thumb.',
      'Keep the shape round like an O — not pinched flat.',
    ],
    recognized: true,
    keywords: 'oh circle',
  },
  {
    id: 'p',
    label: 'P',
    name: 'P',
    category: 'letter',
    blurb: 'the K shape, pointing down',
    shape: { index: f(0.04, 0.3), middle: f(0.08, 0.3), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.45, curl: 0.25 }, rotation: 150 },
    tips: [
      'Start from the K handshape.',
      'Point the whole hand downwards, middle finger towards the floor.',
    ],
    caveat: "P shares K's handshape and differs only by orientation, so it reads as K.",
    recognized: false,
    keywords: 'pee k downward',
  },
  {
    id: 'q',
    label: 'Q',
    name: 'Q',
    category: 'letter',
    blurb: 'the G shape, pointing down',
    shape: { index: f(0.04), middle: f(0.92), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.5, curl: 0.05 }, rotation: 130 },
    tips: [
      'Start from the G handshape.',
      'Point the whole hand down, index and thumb aiming at the floor.',
    ],
    caveat: "Q shares G's handshape and differs only by orientation, so it reads as G.",
    recognized: false,
    keywords: 'cue g downward',
  },
  {
    id: 'r',
    label: 'R',
    name: 'R',
    category: 'letter',
    blurb: 'crossed index and middle',
    shape: { index: f(0.05, -0.45), middle: f(0.05, 0.45), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.12, curl: 0.3 } },
    tips: [
      'Cross your index and middle fingers.',
      'Keep them upright and gently pressed together.',
    ],
    recognized: true,
    keywords: 'ar crossed fingers',
  },
  {
    id: 's',
    label: 'S',
    name: 'S',
    category: 'letter',
    blurb: 'fist with thumb wrapped across',
    shape: { index: f(0.96), middle: f(0.96), ring: f(0.95), pinky: f(0.94), thumb: { abduction: 0.03, curl: 0.45 } },
    tips: [
      'Make a firm fist.',
      'Wrap the thumb across the front of your fingers, not beside them.',
    ],
    recognized: true,
    keywords: 'ess fist thumb across',
  },
  {
    id: 't',
    label: 'T',
    name: 'T',
    category: 'letter',
    blurb: 'thumb peeks between two fingers',
    shape: { index: f(0.8), middle: f(0.82), ring: f(0.9), pinky: f(0.9), thumb: { abduction: 0.34, curl: 0.4 } },
    tips: [
      'Make a fist.',
      'Peek your thumb out between the index and middle fingers.',
    ],
    recognized: true,
    keywords: 'tee thumb between',
  },
  {
    id: 'u',
    label: 'U',
    name: 'U',
    category: 'letter',
    blurb: 'two fingers pressed together',
    shape: { index: f(0.03, -0.05), middle: f(0.05, -0.05), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.08, curl: 0.3 } },
    tips: [
      'Index and middle straight up, side by side.',
      'Thumb rests in front of the palm. Keep the two fingers touching.',
    ],
    recognized: true,
    keywords: 'you two together',
  },
  {
    id: 'v',
    label: 'V',
    name: 'V',
    category: 'letter',
    blurb: 'a clear two-finger V',
    shape: { index: f(0.02, 0.4), middle: f(0.05, 0.4), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.08, curl: 0.28 } },
    tips: [
      'Index and middle up in a clear V.',
      'Let the other fingers close comfortably — no strain.',
    ],
    recognized: true,
    keywords: 'vee peace',
  },
  {
    id: 'w',
    label: 'W',
    name: 'W',
    category: 'letter',
    blurb: 'three fingers up and spread',
    shape: { index: f(0.02, 0.4), middle: f(0.02, 0.35), ring: f(0.03, 0.35), pinky: f(0.9), thumb: { abduction: 0.08, curl: 0.3 } },
    tips: [
      'Three fingers up, spread like the points of a W.',
      'Tuck the pinky and rest the thumb against it.',
    ],
    recognized: true,
    keywords: 'double you three',
  },
  {
    id: 'x',
    label: 'X',
    name: 'X',
    category: 'letter',
    blurb: 'index hooked forward',
    shape: { index: f(0.58), middle: f(0.92), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.1, curl: 0.35 } },
    tips: [
      'Make a fist, then hook your index finger forward.',
      'Think of a small, friendly question mark.',
    ],
    recognized: true,
    keywords: 'ex hook',
  },
  {
    id: 'y',
    label: 'Y',
    name: 'Y',
    category: 'letter',
    blurb: 'thumb and pinky out wide',
    shape: { index: f(0.94), middle: f(0.94), ring: f(0.94), pinky: f(0.02), thumb: { abduction: 0.98, curl: 0.02 } },
    tips: [
      'Thumb and pinky stretched out wide.',
      'Fold the middle three fingers down loosely.',
    ],
    recognized: true,
    keywords: 'why shaka',
  },
  {
    id: 'z',
    label: 'Z',
    name: 'Z',
    category: 'letter',
    blurb: 'index draws a Z in the air',
    shape: { index: f(0.03), middle: f(0.92), ring: f(0.92), pinky: f(0.92), thumb: { abduction: 0.5, curl: 0.4 } },
    tips: [
      'Point your index finger forward.',
      'Draw a Z: across, diagonally down, then across again. Let the wrist lead.',
    ],
    movement: 'Movement sign — the handshape is a simple point; the letter lives in the stroke.',
    caveat: 'Z is a moving sign, so the live tape will not commit it from a still hand.',
    recognized: false,
    keywords: 'zee motion index',
  },
  {
    id: 'hello',
    label: 'Hello',
    name: 'Hello',
    category: 'gesture',
    blurb: 'open palm, easy wave',
    shape: { index: f(0.06, 0.25), middle: f(0.05, 0.2), ring: f(0.06, 0.2), pinky: f(0.07, 0.2), thumb: { abduction: 0.3, curl: 0.05 } },
    tips: [
      'Open your hand at shoulder height, palm out.',
      'Wave gently from the wrist — small, warm, unhurried.',
    ],
    movement: 'Wave: two or three relaxed side-to-side swings.',
    recognized: true,
    keywords: 'hi wave greeting',
  },
  {
    id: 'thank-you',
    label: 'Thank you',
    name: 'Thank you',
    category: 'gesture',
    blurb: 'flat hand, chin outward',
    shape: { index: f(0.04, 0.1), middle: f(0.04, 0.1), ring: f(0.05, 0.1), pinky: f(0.06, 0.1), thumb: { abduction: 0.3, curl: 0.1 } },
    tips: [
      'Flat hand, fingertips near your chin.',
      'Move the hand forward and down, as if blowing a kiss goodbye.',
    ],
    movement: 'A short forward-and-down arc from the chin.',
    recognized: true,
    keywords: 'thanks gratitude',
  },
  {
    id: 'yes',
    label: 'Yes',
    name: 'Yes',
    category: 'gesture',
    blurb: 'a nodding fist',
    shape: { index: f(0.95), middle: f(0.94), ring: f(0.93), pinky: f(0.92), thumb: { abduction: 0.5, curl: 0.08 } },
    tips: [
      'Make a loose fist, knuckles forward.',
      'Nod it up and down at the wrist, like a small hinge.',
    ],
    movement: 'Two clear downward nods of the wrist.',
    recognized: true,
    keywords: 'yeah agree affirmation',
  },
  {
    id: 'no',
    label: 'No',
    name: 'No',
    category: 'gesture',
    blurb: 'two taps of the thumb',
    shape: { index: f(0.5), middle: f(0.5), ring: f(0.9), pinky: f(0.9), thumb: { abduction: 0.24, curl: 0.35 } },
    tips: [
      'Bring index and middle fingertips towards your thumb.',
      'Tap them together twice — a small, polite closing of the hand.',
    ],
    movement: 'Two quick taps of the middle two fingers onto the thumb.',
    recognized: true,
    keywords: 'nope disagree',
  },
  {
    id: 'please',
    label: 'Please',
    name: 'Please',
    category: 'gesture',
    blurb: 'a circle on the heart',
    shape: { index: f(0.04, 0.1), middle: f(0.04, 0.1), ring: f(0.05, 0.1), pinky: f(0.06, 0.1), thumb: { abduction: 0.3, curl: 0.1 } },
    tips: [
      'Place a flat palm on your chest.',
      'Move it in slow, small circles — the motion carries the word.',
    ],
    movement: 'A slow circle, palm flat against the chest.',
    recognized: true,
    keywords: 'kindly manners',
  },
  {
    id: 'help',
    label: 'Help',
    name: 'Help',
    category: 'gesture',
    blurb: 'one fist on an open palm',
    shape: { index: f(0.9), middle: f(0.9), ring: f(0.9), pinky: f(0.88), thumb: { abduction: 0.45, curl: 0.15 } },
    tips: [
      'Hold one flat palm facing up, like a small tray.',
      'Rest your other fist on it and lift both hands together.',
    ],
    movement: 'Fist resting on the flat palm below it.',
    recognized: true,
    keywords: 'assist support',
  },
];

export const LETTER_SIGNS = SIGNS.filter((sign) => sign.category === 'letter');
export const GESTURE_SIGNS = SIGNS.filter((sign) => sign.category === 'gesture');

/** Signs the live interpreter is allowed to auto-commit from a still handshape. */
export const STATIC_SIGNS = SIGNS.filter(
  (sign) => sign.recognized && sign.category === 'letter',
);

export const MOTION_SIGNS = SIGNS.filter(
  (sign) => sign.category === 'gesture' && sign.movement && sign.id !== 'help',
);

export const signById = new Map(SIGNS.map((sign) => [sign.id, sign]));

export const findByLabel = (label: string) =>
  SIGNS.find((sign) => sign.label.toLowerCase() === label.toLowerCase());
