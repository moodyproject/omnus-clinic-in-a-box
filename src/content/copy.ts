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

export const stateLabels: Record<StateLabel, string> = {
  'working now': 'Working now',
  'now expanding': 'Now expanding',
  'the system we’re building': 'The system we’re building',
}

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
    eyebrow: 'Omnus Labs',
    heading: 'The Clinical AI Workspace',
    headingLevel: 1,
    body: 'Run your complete clinic from home, office, or anywhere with power. Omnus is designed to bring charting, visits, record synthesis, decision support, and physician-approved orders together on your own hardware. We start with hematology.',
    actions: true,
    status: 'Working now: live visits, transcription, and clinical extraction',
  },
  {
    id: 'enter',
    side: 'left',
    heading: 'One physician. A team of AI agents.',
    headingLevel: 2,
    body: 'The doctor and patient are human. The robots represent Omnus AI agents, supporting the work around each visit. Clinical decisions stay with the physician.',
  },
  {
    id: 'before',
    side: 'left',
    heading: 'Triage & intake',
    headingLevel: 2,
    body: 'Agents are designed to bring the patient’s presentation, outside records, referral notes, and previous encounters into one pre-visit summary for physician review.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'during',
    side: 'left',
    heading: 'Real-time AI',
    headingLevel: 2,
    body: 'Stay focused on the patient while Omnus transcribes the conversation and extracts clinical details as the visit unfolds. Note drafting and proposed orders are designed for physician review, not automatic approval.',
    stateLabel: 'working now',
  },
  {
    id: 'review',
    side: 'left',
    heading: 'Physician sign-off',
    headingLevel: 2,
    body: 'Omnus is designed to prepare a note and proposed orders for review before the encounter is finalized. Physician approval determines what is saved to the record and which next steps are authorized. The AI drafts, the doctor decides.',
    stateLabel: 'now expanding',
  },
  {
    id: 'after',
    side: 'left',
    heading: 'Approved. Then follow-through.',
    headingLevel: 2,
    body: 'After physician approval, agents are designed to coordinate follow-up, referrals, prescriptions, laboratory tests, and imaging through connected systems. Nothing proceeds on an AI draft alone.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'ops',
    side: 'left',
    heading: 'One connected clinic.',
    headingLevel: 2,
    body: 'Omnus is designed to bring the patient timeline, live visit, draft note, and proposed orders into one workflow. The physician reviews and approves every clinical decision. The AI drafts, the doctor decides.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'reveal',
    side: 'left',
    eyebrow: 'The clinical AI workspace',
    heading: 'One physician. One complete workspace.',
    headingLevel: 2,
    body: 'Built for independent practices that want to spend less time operating software and more time practicing medicine.',
    actions: true,
  },
]

export const nav = {
  links: [
    { label: 'Product', target: 'product' },
    { label: 'Vision', target: 'vision' },
    { label: 'Contact', target: 'contact' },
  ],
  cta: 'Book a demo',
}

export const actions = {
  primary: 'Book a demo',
  secondary: 'Join the waitlist',
}

export const conversion = {
  heading: 'See Omnus in your clinic.',
  body: 'We start with hematology. Omnus is designed to bring the whole clinic workflow onto your own hardware, with every clinical decision reviewed by the physician. Walk through what works today, or follow along as the workspace grows.',
  status: 'Working today: live video visits, visit transcription, and clinical extraction. The rest of the workspace shown above is in active development.',
}

export const footer = {
  line: 'The clinical AI workspace for independent physicians.',
  fine: '© 2026 Omnus. Product states shown as “The system we’re building” are in development, not deployed.',
}

export const forms = {
  demo: {
    title: 'Book a demo',
    intro: 'Tell us a little about your practice and we’ll set up a walkthrough.',
    fields: {
      name: 'Name',
      email: 'Work email',
      organization: 'Organization or clinic',
      role: 'Role',
      message: 'Anything specific you want to see?',
    },
    submit: 'Request a demo',
    success: 'Thank you. We’ll reach out to schedule your walkthrough.',
  },
  waitlist: {
    title: 'Join the waitlist',
    intro: 'Be first in line as Omnus expands beyond the visit.',
    fields: {
      email: 'Email',
      role: 'Role',
    },
    submit: 'Join the waitlist',
    success: 'You’re on the list. We’ll keep you posted.',
  },
  roles: ['physician', 'clinic owner', 'practice manager', 'clinical staff', 'investor', 'other'],
  localMode: 'Local test mode: nothing was sent. Connect an endpoint to go live.',
  notConfigured:
    'This deployment isn’t connected to a submission endpoint yet, so we can’t receive your request here. Please check back soon.',
  errors: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    network: 'We couldn’t send that right now. Please try again in a moment.',
  },
}

export const misc = {
  scrollCue: 'Scroll to open',
  skip: 'Skip the tour',
  skipToContent: 'Skip to content',
  wordmark: 'Omnus',
  fallbackNote:
    'This page normally opens an Omnus workstation into a miniature clinic. Your browser can’t run that view, so here is the same story, told simply.',
  reducedNote: 'Motion is reduced. The full journey is presented as steps.',
}
