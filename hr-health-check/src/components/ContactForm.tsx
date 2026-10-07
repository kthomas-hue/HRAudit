import { useState } from 'react'
import type { ContactInfo } from '../hooks/useAssessmentState'
import { Logo } from './Logo'

interface ContactFormProps {
  initial: ContactInfo
  privacyAccepted: boolean
  privacyUrl?: string
  onPrivacyChange: (v: boolean) => void
  onSubmit: (contact: ContactInfo) => void
  onBack: () => void
}

const TEAM_SIZES = [
  { value: '', label: 'Select team size (optional)' },
  { value: '1-5', label: '1–5 people' },
  { value: '6-19', label: '6–19 people' },
  { value: '20-49', label: '20–49 people' },
  { value: '50-99', label: '50–99 people' },
  { value: '100+', label: '100+ people' },
]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function ContactForm({
  initial,
  privacyAccepted,
  privacyUrl = 'https://www.dreamstonehr.com.au',
  onPrivacyChange,
  onSubmit,
  onBack,
}: ContactFormProps) {
  const [form, setForm] = useState<ContactInfo>({ teamSize: '', ...initial })
  const [touched, setTouched] = useState(false)

  const errors = {
    firstName: !form.firstName.trim() ? 'First name is required' : '',
    lastName: !form.lastName.trim() ? 'Last name is required' : '',
    email: !form.email.trim()
      ? 'Email is required'
      : !isValidEmail(form.email)
        ? 'Enter a valid email address'
        : '',
    company: !form.company.trim() ? 'Company name is required' : '',
    privacy: !privacyAccepted ? 'Please accept the privacy policy to continue' : '',
  }

  const valid = !Object.values(errors).some(Boolean)

  const update = (key: keyof ContactInfo, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    onSubmit(form)
  }

  return (
    <section className="panel contact-panel">
      <div className="contact-panel__brand">
        <Logo size="sm" />
      </div>
      <button type="button" className="text-link" onClick={onBack}>
        ← Back
      </button>
      <p className="eyebrow">Personalise your report</p>
      <h1>
        So your roadmap fits <span className="highlight-lime">your business</span>
      </h1>
      <p className="lead">
        We use these details to personalise your leadership report and 30–90 day action plan — and so DreamStoneHR
        can follow up with practical help if you want it. Answer the Health Check as things are today, not as you
        wish they were.
      </p>

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="field-row">
          <label className="field">
            <span>First name</span>
            <input
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              aria-invalid={touched && !!errors.firstName}
            />
            {touched && errors.firstName && <em className="field-error">{errors.firstName}</em>}
          </label>
          <label className="field">
            <span>Last name</span>
            <input
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              aria-invalid={touched && !!errors.lastName}
            />
            {touched && errors.lastName && <em className="field-error">{errors.lastName}</em>}
          </label>
        </div>

        <label className="field">
          <span>Work email</span>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={touched && !!errors.email}
          />
          {touched && errors.email && <em className="field-error">{errors.email}</em>}
        </label>

        <label className="field">
          <span>
            Phone <small>(optional — helpful if you’d like a debrief)</small>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Best number to reach you"
          />
        </label>

        <label className="field">
          <span>Company name</span>
          <input
            autoComplete="organization"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            aria-invalid={touched && !!errors.company}
          />
          {touched && errors.company && <em className="field-error">{errors.company}</em>}
        </label>

        <label className="field">
          <span>
            Team size <small>(optional)</small>
          </span>
          <select value={form.teamSize ?? ''} onChange={(e) => update('teamSize', e.target.value)}>
            {TEAM_SIZES.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => onPrivacyChange(e.target.checked)}
          />
          <span>
            I agree to DreamStoneHR using these details to deliver my Health Check results and relevant follow-up,
            as described in the{' '}
            <a href={privacyUrl} target="_blank" rel="noreferrer">
              privacy policy
            </a>
            .
          </span>
        </label>
        {touched && errors.privacy && <em className="field-error">{errors.privacy}</em>}

        <div className="form-actions">
          <button type="submit" className="btn btn--lime">
            Continue to the assessment
            <span className="btn__arrow" aria-hidden>
              ↗
            </span>
          </button>
        </div>
      </form>
    </section>
  )
}
