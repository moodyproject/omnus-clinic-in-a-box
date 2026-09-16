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
    eyebrow: 'The clinical AI workspace',
    heading: 'Your clinic. Wherever you practice.',
    headingLevel: 1,
    body: 'A complete clinical AI workspace, designed to run on your own hardware. Charting, visits, record synthesis, decision support, and physician-approved orders, starting with hematology.',
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
    body: 'Agents are designed to organize intake, flag what needs attention, and assemble the patient’s history before the physician walks in.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'during',
    side: 'left',
    heading: 'Real-time AI',
    headingLevel: 2,
    body: 'The doctor focuses on the patient. Omnus transcribes the visit and extracts clinical details from the conversation as it happens.',
    stateLabel: 'working now',
  },
  {
    id: 'review',
    side: 'left',
    heading: 'Physician sign-off',
    headingLevel: 2,
    body: 'Omnus prepares the draft. The physician reviews, corrects, and approves what becomes final. The agents assist; the doctor decides.',
    stateLabel: 'now expanding',
  },
  {
    id: 'after',
    side: 'left',
    heading: 'Approved. Then follow-through.',
    headingLevel: 2,
    body: 'After physician approval, agents are designed to coordinate referrals and follow-up through connected systems and APIs.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'ops',
    side: 'left',
    heading: 'One connected clinic.',
    headingLevel: 2,
    body: 'From triage to follow-through, one local operating layer connects the agents, the visit, and the work around it. The physician leads the care.',
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
  body: 'Omnus gives independent physicians everything they need so a doctor can focus on being a doctor. Walk through the system with us, or follow along as it grows.',
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
