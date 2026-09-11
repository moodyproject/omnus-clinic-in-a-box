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
    heading: 'one physician. a team of ai agents.',
    headingLevel: 2,
    body: 'the doctor and patient are human. the robots represent omnus ai agents, supporting the work around each visit. clinical decisions stay with the physician.',
  },
  {
    id: 'before',
    side: 'left',
    heading: 'triage & intake',
    headingLevel: 2,
    body: 'agents are designed to organize intake, flag what needs attention, and assemble the patient’s history before the physician walks in.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'during',
    side: 'left',
    heading: 'real-time ai',
    headingLevel: 2,
    body: 'the doctor focuses on the patient. omnus transcribes the visit and extracts clinical details from the conversation as it happens.',
    stateLabel: 'working now',
  },
  {
    id: 'review',
    side: 'left',
    heading: 'physician sign-off',
    headingLevel: 2,
    body: 'omnus prepares the draft. the physician reviews, corrects, and approves what becomes final. the agents assist; the doctor decides.',
    stateLabel: 'now expanding',
  },
  {
    id: 'after',
    side: 'left',
    heading: 'approved. then follow-through.',
    headingLevel: 2,
    body: 'after physician approval, agents are designed to coordinate referrals and follow-up through connected systems and apis.',
    stateLabel: 'the system we’re building',
  },
  {
    id: 'ops',
    side: 'left',
    heading: 'one connected clinic.',
    headingLevel: 2,
    body: 'from triage to follow-through, one local operating layer connects the agents, the visit, and the work around it. the physician leads the care.',
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
