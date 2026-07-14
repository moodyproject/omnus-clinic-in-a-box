import type { PersonSpec } from './Person'
import type { Seg } from './tracks'

/**
 * the cast: five people who inhabit the clinic, plus their wardrobe mapping
 * from source material names to the site's restrained palette. skin and hair
 * tones vary across the cast; clothing stays within graphite, porcelain,
 * warm neutrals, and one sage staff accent.
 */

const PI = Math.PI

/** shared clothing tones */
const TONES = {
  graphite: '#33363b',
  charcoal: '#26282c',
  porcelain: '#efece4',
  warmGray: '#8b857b',
  slate: '#5c6367',
  clay: '#a98a74',
  sageWear: '#7d938a',
  coat: '#d9d5cb',
  shoe: '#2a2c2f',
}

/** patient: arrives, checks in, is seen, checks out */
const patientTrack: Seg[] = [
  { kind: 'stand', a: 0.0, b: 0.145, at: [0.07, 0.635], face: PI, clip: 'Idle_Neutral' },
  {
    kind: 'walk',
    a: 0.145,
    b: 0.24,
    path: [
      [0.07, 0.635],
      [0.05, 0.5],
      [-0.02, 0.42],
      [-0.165, 0.215],
    ],
    endFace: -0.88,
  },
  {
    kind: 'stand',
    a: 0.24,
    b: 0.345,
    at: [-0.165, 0.215],
    face: -0.88,
    clip: 'Interact',
    look: [-0.31, 0.33],
  },
  {
    kind: 'walk',
    a: 0.345,
    b: 0.425,
    path: [
      [-0.165, 0.215],
      [-0.02, 0.38],
      [0.06, 0.3],
      [0.1, 0.22],
      [0.2, 0.2],
      [0.265, 0.3],
      [0.265, 0.42],
    ],
    endFace: PI,
  },
  {
    kind: 'sit',
    a: 0.425,
    b: 0.72,
    at: [0.265, 0.45],
    face: PI,
    clip: 'Idle_Neutral',
    look: [0.265, 0.19],
  },
  {
    kind: 'walk',
    a: 0.72,
    b: 0.82,
    path: [
      [0.265, 0.42],
      [0.24, 0.28],
      [0.16, 0.22],
      [0.05, 0.3],
      [-0.02, 0.4],
      [-0.165, 0.225],
    ],
    endFace: -0.88,
  },
  {
    kind: 'stand',
    a: 0.82,
    b: 1.0,
    at: [-0.165, 0.225],
    face: -0.88,
    clip: 'Idle_Neutral',
    look: [-0.31, 0.33],
  },
]

/** receptionist: holds the front desk, then organizes scheduling during ops */
const receptionistTrack: Seg[] = [
  { kind: 'sit', a: 0.0, b: 0.24, at: [-0.305, 0.33], face: PI / 2, clip: 'Idle_Neutral' },
  {
    kind: 'sit',
    a: 0.24,
    b: 0.32,
    at: [-0.305, 0.33],
    face: PI / 2,
    clip: 'Interact',
    look: [-0.165, 0.215],
  },
  { kind: 'sit', a: 0.32, b: 0.5, at: [-0.305, 0.33], face: PI / 2, clip: 'Idle_Neutral' },
  { kind: 'sit', a: 0.5, b: 0.745, at: [-0.305, 0.33], face: PI / 2, clip: 'Interact' },
  {
    kind: 'walk',
    a: 0.745,
    b: 0.795,
    path: [
      [-0.305, 0.33],
      [-0.22, 0.26],
      [-0.14, 0.21],
      [-0.06, 0.16],
      [-0.06, 0.04],
      [-0.44, 0.03],
    ],
    endFace: -PI / 2,
  },
  { kind: 'stand', a: 0.795, b: 0.86, at: [-0.44, 0.03], face: -PI / 2, clip: 'Interact' },
  { kind: 'stand', a: 0.86, b: 1.0, at: [-0.44, 0.03], face: -PI / 2, clip: 'Idle_Neutral' },
]

/** physician: prepares, sees the patient, reviews and approves */
const physicianTrack: Seg[] = [
  { kind: 'sit', a: 0.0, b: 0.3, at: [0.425, 0.2], face: PI / 2, clip: 'Interact' },
  {
    kind: 'walk',
    a: 0.3,
    b: 0.385,
    path: [
      [0.425, 0.2],
      [0.34, 0.19],
      [0.28, 0.2],
    ],
    endFace: 0,
  },
  {
    kind: 'sit',
    a: 0.385,
    b: 0.52,
    at: [0.265, 0.2],
    face: 0,
    clip: 'Idle_Neutral',
    look: [0.265, 0.46],
  },
  {
    kind: 'walk',
    a: 0.52,
    b: 0.578,
    path: [
      [0.265, 0.22],
      [0.2, 0.17],
      [0.21, 0.02],
      [0.21, -0.08],
      [0.24, -0.18],
      [0.32, -0.26],
      [0.34, -0.34],
    ],
    endFace: PI + 0.25,
  },
  { kind: 'sit', a: 0.578, b: 0.6, at: [0.34, -0.375], face: PI + 0.25, clip: 'Idle_Neutral' },
  { kind: 'sit', a: 0.6, b: 0.64, at: [0.34, -0.375], face: PI + 0.25, clip: 'Interact' },
  { kind: 'sit', a: 0.64, b: 1.0, at: [0.34, -0.375], face: PI + 0.25, clip: 'Idle_Neutral' },
]

/** care coordinator: follow-through room, referrals and instructions */
const coordinatorTrack: Seg[] = [
  { kind: 'stand', a: 0.0, b: 0.63, at: [-0.42, -0.44], face: PI, clip: 'Interact' },
  {
    kind: 'walk',
    a: 0.63,
    b: 0.675,
    path: [
      [-0.42, -0.44],
      [-0.33, -0.47],
      [-0.25, -0.48],
    ],
    endFace: PI,
  },
  {
    kind: 'stand',
    a: 0.675,
    b: 0.745,
    at: [-0.25, -0.48],
    face: PI,
    clip: 'Interact',
    look: [-0.22, -0.545],
  },
  {
    kind: 'walk',
    a: 0.745,
    b: 0.8,
    path: [
      [-0.25, -0.48],
      [-0.35, -0.42],
      [-0.46, -0.3],
    ],
    endFace: -PI / 2,
  },
  { kind: 'stand', a: 0.8, b: 0.86, at: [-0.46, -0.3], face: -PI / 2, clip: 'Interact' },
  { kind: 'stand', a: 0.86, b: 1.0, at: [-0.46, -0.3], face: -PI / 2, clip: 'Idle_Neutral' },
]

/** administrator: inbox nook, then the coding queue during ops */
const adminTrack: Seg[] = [
  { kind: 'stand', a: 0.0, b: 0.4, at: [0.455, 0.02], face: PI / 2, clip: 'Interact' },
  { kind: 'stand', a: 0.4, b: 0.745, at: [0.455, 0.02], face: PI / 2, clip: 'Idle_Neutral' },
  {
    kind: 'walk',
    a: 0.745,
    b: 0.785,
    path: [
      [0.455, 0.02],
      [0.32, 0.035],
      [0.23, -0.02],
    ],
    endFace: PI,
  },
  { kind: 'stand', a: 0.785, b: 0.845, at: [0.23, -0.02], face: PI, clip: 'Interact' },
  {
    kind: 'walk',
    a: 0.845,
    b: 0.885,
    path: [
      [0.23, -0.02],
      [0.32, 0.035],
      [0.44, 0.02],
    ],
    endFace: PI / 2,
  },
  { kind: 'stand', a: 0.885, b: 1.0, at: [0.44, 0.02], face: PI / 2, clip: 'Idle_Neutral' },
]

const REAL_CAST: PersonSpec[] = [
  {
    outfit: 'w_casual',
    colors: {
      Skin: '#c99872',
      White: '#626c74',
      Grey: '#6e6963',
      Hair_Brown: '#3a322b',
      Hair_Blond: '#3a322b',
      Brown: TONES.shoe,
      Orange: '#8b857b',
    },
    fallback: TONES.warmGray,
    track: patientTrack,
    phase: 0.35,
    height: 0.985,
  },
  {
    outfit: 'm_casual2',
    colors: {
      Skin: '#7a4a30',
      Skin_Darker: '#6b3f28',
      LightBlue: TONES.sageWear,
      Red_Dark: TONES.graphite,
      White: TONES.porcelain,
      LightBrown: '#8a6a4e',
      Hair: '#1f1b18',
      Eyebrows: '#1f1b18',
      Eye: '#17181a',
    },
    fallback: TONES.warmGray,
    track: receptionistTrack,
    phase: 1.1,
    height: 1.0,
  },
  {
    outfit: 'w_suit',
    colors: {
      Skin: '#e6c1a3',
      Black: TONES.coat,
      White: TONES.slate,
      Hair_Brown: '#4a3a2a',
      Hair_Blond: '#4a3a2a',
      Brown: TONES.shoe,
    },
    fallback: TONES.warmGray,
    track: physicianTrack,
    phase: 2.2,
    height: 1.0,
  },
  {
    outfit: 'w_formal',
    colors: {
      Skin: '#a97050',
      Brown: '#33291f',
      Red: '#4a3527',
      LimeGreen: '#5f6a70',
      Gold: TONES.shoe,
    },
    fallback: TONES.warmGray,
    track: coordinatorTrack,
    phase: 3.0,
    height: 0.97,
  },
  {
    outfit: 'm_suit',
    colors: {
      Skin: '#e8c9ab',
      Suit: '#6a6e66',
      Tie: '#575b54',
      White: TONES.porcelain,
      Grey: '#8d8781',
      Black: TONES.shoe,
      DarkBrown: '#4a4038',
      Hair: '#8d8781',
      Eyebrows: '#7c766f',
      Eye: '#17181a',
    },
    fallback: TONES.warmGray,
    track: adminTrack,
    phase: 4.4,
    height: 1.01,
  },
]

/** dev-only lineups for auditing outfits and poses: ?cast=audit|sit|walk */
function auditCast(mode: string): PersonSpec[] {
  const outfits = ['w_casual', 'w_formal', 'w_suit', 'm_casual2', 'm_suit'] as const
  return outfits.map((outfit, i) => ({
    outfit,
    colors: {},
    fallback: '#a08c78',
    track: [
      mode === 'sit'
        ? { kind: 'sit', a: 0, b: 1, at: [0.2 + (i % 4) * 0.09, 0.3 + Math.floor(i / 4) * 0.16], face: 0, clip: 'Idle_Neutral' }
        : mode === 'walk'
          ? {
              kind: 'walk',
              a: 0,
              b: 1,
              path: [
                [-0.49 + i * 0.14, -0.3],
                [-0.49 + i * 0.14, 0.5],
              ],
            }
          : { kind: 'stand', a: 0, b: 1, at: [-0.49 + i * 0.14, 0.02], face: 0, clip: 'Idle' },
    ] as Seg[],
    phase: i * 0.8,
  }))
}

const castParam = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('cast')
  : null

export const CAST: PersonSpec[] = castParam ? auditCast(castParam) : REAL_CAST
