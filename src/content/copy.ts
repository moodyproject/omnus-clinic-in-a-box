/**
 * every piece of marketing copy on the site lives here.
 * scenes map 1:1 onto the scroll journey defined in src/scroll/journey.ts.
 */

export type SceneId =
  | 'object'
  | 'enter'
  | 'before'
  | 'during'
  | 'review'
  | 'after'
  | 'ops'
  | 'reveal'

export type StateLabel = 'working now' | 'now expanding' | 'the system we’re building'

export interface SceneCopy {
  id: SceneId
  /** which side of the frame the copy column occupies on desktop */
  side: 'left' | 'right'
  eyebrow?: string
  heading: string
  headingLevel: 1 | 2
  body: string
  stateLabel?: StateLabel
  /** show the primary and secondary conversion actions */
  actions?: boolean
  /** small status line under the actions */
  status?: string
}

export const scenes: SceneCopy[] = [
  {
    id: 'object',
    side: 'left',
    eyebrow: 'the clinic operating system',
    heading: 'everything your clinic needs. inside one box.',
    headingLevel: 1,
    body: 'omnus brings the work of an independent clinic into one operating layer, so doctors can focus on being doctors.',
    actions: true,
    status: 'working now: live visits, transcription, and clinical extraction',
  },
  {
    id: 'enter',
    side: 'left',
    heading: 'a clinic, restructured around the physician.',
    headingLevel: 2,
    body: 'one continuous system across the patient journey and the work behind it.',
  },
  {
    id: 'before',
    side: 'right',
    heading: 'before the visit',
    headingLevel: 2,
    body: 'intake, scheduling, referrals, and context arrive in one place before the physician walks in.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'during',
    side: 'left',
    heading: 'during the visit',
    headingLevel: 2,
    body: 'video, transcription, and clinical extraction turn the conversation into structured context as the visit happens.',
    stateLabel: 'working now',
  },
  {
    id: 'review',
    side: 'left',
    heading: 'the physician stays in control',
    headingLevel: 2,
    body: 'omnus prepares the clinical draft. the physician decides what becomes final.',
    stateLabel: 'now expanding',
  },
  {
    id: 'after',
    side: 'right',
    heading: 'after the visit',
    headingLevel: 2,
    body: 'summaries, prescriptions, referrals, and follow-up move from decisions to action.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'ops',
    side: 'left',
    heading: 'the work behind the care',
    headingLevel: 2,
    body: 'omnus coordinates the administrative load around the visit, not just the note inside it.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'reveal',
    side: 'left',
    eyebrow: 'clinic in a box',
    heading: 'one physician. one clinic operating system.',
    headingLevel: 2,
    body: 'built for independent practices that want to spend less time operating software and more time practicing medicine.',
    actions: true,
  },
]

export const nav = {
  links: [
    { label: 'product', target: 'product' },
    { label: 'vision', target: 'vision' },
    { label: 'contact', target: 'contact' },
  ],
  cta: 'book a demo',
}

export const actions = {
  primary: 'book a demo',
  secondary: 'join the waitlist',
}

export const conversion = {
  heading: 'see omnus in your clinic.',
  body: 'omnus gives independent physicians everything they need so a doctor can focus on being a doctor. walk through the system with us, or follow along as it grows.',
  status: 'working today: live video visits, visit transcription, and clinical extraction. the rest of the operating system shown above is in active development.',
}

export const footer = {
  line: 'the local intelligence layer for independent clinics.',
  fine: '© 2026 omnus. product states shown as “the system we’re building” are in development, not deployed.',
}

export const forms = {
  demo: {
    title: 'book a demo',
    intro: 'tell us a little about your practice and we’ll set up a walkthrough.',
    fields: {
      name: 'name',
      email: 'work email',
      organization: 'organization or clinic',
      role: 'role',
      message: 'anything specific you want to see?',
    },
    submit: 'request a demo',
    success: 'thank you. we’ll reach out to schedule your walkthrough.',
  },
  waitlist: {
    title: 'join the waitlist',
    intro: 'be first in line as omnus expands beyond the visit.',
    fields: {
      email: 'email',
      role: 'role',
    },
    submit: 'join the waitlist',
    success: 'you’re on the list. we’ll keep you posted.',
  },
  roles: ['physician', 'clinic owner', 'practice manager', 'clinical staff', 'investor', 'other'],
  localMode: 'local test mode: nothing was sent. connect an endpoint to go live.',
  notConfigured:
    'this deployment isn’t connected to a submission endpoint yet, so we can’t receive your request here. please check back soon.',
  errors: {
    required: 'this field is required.',
    email: 'please enter a valid email address.',
    network: 'we couldn’t send that right now. please try again in a moment.',
  },
}

export const misc = {
  scrollCue: 'scroll to open',
  skip: 'skip the tour',
  skipToContent: 'skip to content',
  wordmark: 'omnus',
  fallbackNote:
    'this page normally opens the omnus appliance into a miniature clinic. your browser can’t run that view, so here is the same story, told simply.',
  reducedNote: 'motion is reduced. the full journey is presented as steps.',
}
