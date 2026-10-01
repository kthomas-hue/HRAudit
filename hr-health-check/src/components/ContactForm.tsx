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
  const [form, setForm] = useState<ContactInfo>(initial)
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
      <p className="eyebrow">Almost ready</p>
      <h1>
        So we can build <span className="highlight-lime">your report</span>
      </h1>
      <p className="lead">
        This Health Check is a leadership self-audit. We’ll personalise your PDF report and action plan with these
        details — take it seriously and answer as things are today, not as you wish they were.
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
          <span>Email address</span>
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
            Phone <small>(optional)</small>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Enter your phone number"
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

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => onPrivacyChange(e.target.checked)}
          />
          <span>
            By requesting your assessment results, you agree to our{' '}
            <a href={privacyUrl} target="_blank" rel="noreferrer">
              privacy policy
            </a>
            .
          </span>
        </label>
        {touched && errors.privacy && <em className="field-error">{errors.privacy}</em>}

        <div className="form-actions">
          <button type="submit" className="btn btn--lime">
            Start the assessment
            <span className="btn__arrow" aria-hidden>
              ↗
            </span>
          </button>
        </div>
      </form>
    </section>
  )
}
