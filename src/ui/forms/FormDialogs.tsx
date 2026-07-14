import { useId, useState, type FormEvent } from 'react'
import { forms } from '../../content/copy'
import { Modal } from './Modal'
import { isValidEmail, submitForm, type FormKind, type SubmitResult } from './submit'

type Phase = 'editing' | 'pending' | 'done'

interface FieldErrors {
  [key: string]: string | undefined
}

function useFormFlow(kind: FormKind) {
  const [phase, setPhase] = useState<Phase>('editing')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const submit = async (payload: Record<string, string>, validate: () => FieldErrors) => {
    if (phase !== 'editing') return
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return
    setPhase('pending')
    const r = await submitForm(kind, payload)
    setResult(r)
    if (r.status === 'error' || r.status === 'unconfigured') {
      setPhase('editing')
    } else {
      setPhase('done')
    }
  }

  return { phase, result, errors, submit, setErrors }
}

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string
  label: string
  error?: string
  optional?: boolean
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => React.ReactNode
}) {
  const errorId = `${id}-error`
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

function ResultNote({ result }: { result: SubmitResult | null }) {
  if (!result) return null
  if (result.status === 'error') {
    return (
      <div className="form-alert" data-tone="error" role="alert">
        {forms.errors.network}
      </div>
    )
  }
  if (result.status === 'unconfigured') {
    return (
      <div className="form-alert" role="alert">
        {forms.notConfigured}
      </div>
    )
  }
  return null
}

function SuccessState({ message, local }: { message: string; local: boolean }) {
  return (
    <div className="form-success" role="status">
      <span className="success-rule" aria-hidden="true" />
      <p>{message}</p>
      {local && (
        <span className="state-chip" data-state="the system we’re building">
          <span className="dot" aria-hidden="true" />
          {forms.localMode}
        </span>
      )}
    </div>
  )
}

function RoleSelect({
  value,
  onChange,
  fieldProps,
}: {
  value: string
  onChange: (v: string) => void
  fieldProps: Record<string, unknown>
}) {
  return (
    <select {...fieldProps} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">select a role</option>
      {forms.roles.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  )
}

export function DemoDialog({ onClose }: { onClose: () => void }) {
  const labelId = useId()
  const base = useId()
  const copy = forms.demo
  const flow = useFormFlow('demo')
  const [values, setValues] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    message: '',
  })

  const set = (key: keyof typeof values) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void flow.submit(values, () => ({
      name: values.name.trim() ? undefined : forms.errors.required,
      email: !values.email.trim()
        ? forms.errors.required
        : isValidEmail(values.email)
          ? undefined
          : forms.errors.email,
      organization: values.organization.trim() ? undefined : forms.errors.required,
      role: values.role ? undefined : forms.errors.required,
    }))
  }

  return (
    <Modal title={copy.title} intro={copy.intro} onClose={onClose} labelId={labelId}>
      {flow.phase === 'done' ? (
        <SuccessState message={copy.success} local={flow.result?.status === 'local'} />
      ) : (
        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <Field id={`${base}-name`} label={copy.fields.name} error={flow.errors.name}>
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={(e) => set('name')(e.target.value)}
              />
            )}
          </Field>
          <Field id={`${base}-email`} label={copy.fields.email} error={flow.errors.email}>
            {(p) => (
              <input
                {...p}
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => set('email')(e.target.value)}
              />
            )}
          </Field>
          <Field
            id={`${base}-org`}
            label={copy.fields.organization}
            error={flow.errors.organization}
          >
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="organization"
                value={values.organization}
                onChange={(e) => set('organization')(e.target.value)}
              />
            )}
          </Field>
          <Field id={`${base}-role`} label={copy.fields.role} error={flow.errors.role}>
            {(p) => <RoleSelect value={values.role} onChange={set('role')} fieldProps={p} />}
          </Field>
          <Field id={`${base}-message`} label={copy.fields.message} optional>
            {(p) => (
              <textarea
                {...p}
                value={values.message}
                onChange={(e) => set('message')(e.target.value)}
              />
            )}
          </Field>
          <div className="form-footer">
            <ResultNote result={flow.result} />
            <button className="btn btn-primary" type="submit" disabled={flow.phase === 'pending'}>
              {flow.phase === 'pending' ? <span className="spinner" aria-label="sending" /> : copy.submit}
            </button>
            <p className="form-note">we only use this to set up your walkthrough.</p>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function WaitlistDialog({ onClose }: { onClose: () => void }) {
  const labelId = useId()
  const base = useId()
  const copy = forms.waitlist
  const flow = useFormFlow('waitlist')
  const [values, setValues] = useState({ email: '', role: '' })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void flow.submit(values, () => ({
      email: !values.email.trim()
        ? forms.errors.required
        : isValidEmail(values.email)
          ? undefined
          : forms.errors.email,
      role: values.role ? undefined : forms.errors.required,
    }))
  }

  return (
    <Modal title={copy.title} intro={copy.intro} onClose={onClose} labelId={labelId}>
      {flow.phase === 'done' ? (
        <SuccessState message={copy.success} local={flow.result?.status === 'local'} />
      ) : (
        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <Field id={`${base}-email`} label={copy.fields.email} error={flow.errors.email}>
            {(p) => (
              <input
                {...p}
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              />
            )}
          </Field>
          <Field id={`${base}-role`} label={copy.fields.role} error={flow.errors.role}>
            {(p) => (
              <RoleSelect
                value={values.role}
                onChange={(role) => setValues((v) => ({ ...v, role }))}
                fieldProps={p}
              />
            )}
          </Field>
          <div className="form-footer">
            <ResultNote result={flow.result} />
            <button className="btn btn-primary" type="submit" disabled={flow.phase === 'pending'}>
              {flow.phase === 'pending' ? <span className="spinner" aria-label="sending" /> : copy.submit}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
