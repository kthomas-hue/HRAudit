import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../content/ContentProvider'
import type { ActionItem, CategoryGuidance, ResourceLink } from '../content/types'
import type { Category, ChoiceOption, Question, QuestionType } from '../data/questions'
import { Logo } from './Logo'
import { ResponsesPanel } from './ResponsesPanel'

type AdminTab = 'responses' | 'settings' | 'categories' | 'questions' | 'report' | 'import'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function AdminPortal() {
  const {
    content,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    updateSettings,
    updateCategory,
    addCategory,
    removeCategory,
    updateQuestion,
    addQuestion,
    removeQuestion,
    updateGuidance,
    updateFeedback,
    exportJson,
    importJson,
    resetToDefault,
  } = useContent()

  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<AdminTab>('responses')
  const [selectedCategoryId, setSelectedCategoryId] = useState(content.categories[0]?.id ?? '')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const [status, setStatus] = useState('')

  const categoryQuestions = useMemo(
    () => content.questions.filter((q) => q.categoryId === selectedCategoryId),
    [content.questions, selectedCategoryId],
  )

  const selectedQuestion = content.questions.find((q) => q.id === selectedQuestionId) ?? null
  const selectedGuidance =
    content.guidance[selectedCategoryId] ??
    ({
      categoryId: selectedCategoryId,
      stakes: '',
      riskIfWeak: '',
      nextMove: '',
      partnerAngle: '',
      reportDetail: '',
      actions: [],
      resources: [],
    } satisfies CategoryGuidance)

  if (!isAdmin) {
    return (
      <div className="admin-shell">
        <div className="admin-login">
          <Logo size="md" />
          <h1>Content admin</h1>
          <p>Edit questions, report content, and review client responses.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const ok = loginAdmin(password)
              setLoginError(ok ? '' : 'Incorrect password')
            }}
          >
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </label>
            {loginError && <p className="field-error">{loginError}</p>}
            <button type="submit" className="btn btn--lime">
              Enter admin
            </button>
          </form>
          <Link to="/" className="text-link">
            ← Back to Health Check
          </Link>
          <p className="admin-hint">Default password: <code>dreamstone</code> (change it in Settings)</p>
        </div>
      </div>
    )
  }

  const downloadExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dreamstone-hr-content-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Content pack downloaded.')
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div>
          <Logo size="sm" />
          <h1>Health Check admin</h1>
          <p>Last updated {new Date(content.updatedAt).toLocaleString()}</p>
        </div>
        <div className="admin-top__actions">
          <Link to="/" className="btn btn--ghost">
            View live tool
          </Link>
          <button type="button" className="btn btn--teal" onClick={logoutAdmin}>
            Log out
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {(
          [
            ['responses', 'Responses'],
            ['settings', 'Settings'],
            ['categories', 'Categories'],
            ['questions', 'Questions'],
            ['report', 'Report content'],
            ['import', 'Import / Export'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`admin-tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {status && <p className="admin-status">{status}</p>}

      {tab === 'responses' && <ResponsesPanel onStatus={setStatus} />}

      {tab === 'settings' && (
        <section className="admin-panel">
          <h2>Site & report settings</h2>
          <div className="admin-grid">
            {(
              [
                ['productName', 'Product name'],
                ['tagline', 'Landing eyebrow / tagline'],
                ['landingHeadline', 'Landing headline'],
                ['landingLead', 'Landing lead paragraph'],
                ['reportTitle', 'Report title'],
                ['contactEmail', 'Contact email'],
                ['contactPhone', 'Contact phone'],
                ['websiteUrl', 'Website URL'],
                ['privacyUrl', 'Privacy policy URL'],
                ['partnerCtaLabel', 'Partner CTA button label'],
                ['adminPassword', 'Admin password'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="field">
                <span>{label}</span>
                {key === 'landingLead' ? (
                  <textarea
                    rows={3}
                    value={content.settings[key]}
                    onChange={(e) => updateSettings({ [key]: e.target.value })}
                  />
                ) : (
                  <input
                    type={key === 'adminPassword' ? 'text' : 'text'}
                    value={content.settings[key]}
                    onChange={(e) => updateSettings({ [key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      )}

      {tab === 'categories' && (
        <section className="admin-panel">
          <div className="admin-panel__row">
            <h2>Categories ({content.categories.length})</h2>
            <button
              type="button"
              className="btn btn--lime"
              onClick={() => {
                const id = uid('cat')
                const cat: Category = {
                  id,
                  name: 'New category',
                  shortName: 'New',
                  description: '',
                  accent: '#8B6CE7',
                }
                addCategory(cat)
                setSelectedCategoryId(id)
                setStatus('Category added.')
              }}
            >
              Add category
            </button>
          </div>
          <div className="admin-split">
            <ul className="admin-list">
              {content.categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={selectedCategoryId === c.id ? 'is-active' : ''}
                    onClick={() => setSelectedCategoryId(c.id)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
            {content.categories
              .filter((c) => c.id === selectedCategoryId)
              .map((c) => (
                <div key={c.id} className="admin-editor">
                  <label className="field">
                    <span>Name</span>
                    <input
                      value={c.name}
                      onChange={(e) => updateCategory({ ...c, name: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Short name</span>
                    <input
                      value={c.shortName}
                      onChange={(e) => updateCategory({ ...c, shortName: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Description</span>
                    <textarea
                      rows={3}
                      value={c.description}
                      onChange={(e) => updateCategory({ ...c, description: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Accent colour</span>
                    <input
                      value={c.accent}
                      onChange={(e) => updateCategory({ ...c, accent: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>ID (advanced)</span>
                    <input value={c.id} disabled />
                  </label>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      if (confirm(`Delete category “${c.name}” and its questions?`)) {
                        removeCategory(c.id)
                        setSelectedCategoryId(content.categories.find((x) => x.id !== c.id)?.id ?? '')
                      }
                    }}
                  >
                    Delete category
                  </button>
                </div>
              ))}
          </div>
        </section>
      )}

      {tab === 'questions' && (
        <section className="admin-panel">
          <div className="admin-panel__row">
            <h2>Questions</h2>
            <div className="admin-inline">
              <label className="field field--inline">
                <span>Category</span>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value)
                    setSelectedQuestionId(null)
                  }}
                >
                  {content.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn--lime"
                onClick={() => {
                  const q: Question = {
                    id: uid('q'),
                    categoryId: selectedCategoryId,
                    type: 'yesno',
                    prompt: 'New question',
                    yesScore: 100,
                    noScore: 0,
                  }
                  addQuestion(q)
                  setSelectedQuestionId(q.id)
                }}
              >
                Add question
              </button>
            </div>
          </div>
          <div className="admin-split">
            <ul className="admin-list">
              {categoryQuestions.map((q, i) => (
                <li key={q.id}>
                  <button
                    type="button"
                    className={selectedQuestionId === q.id ? 'is-active' : ''}
                    onClick={() => setSelectedQuestionId(q.id)}
                  >
                    {i + 1}. {q.prompt.slice(0, 60)}
                    {q.prompt.length > 60 ? '…' : ''}
                  </button>
                </li>
              ))}
            </ul>
            {selectedQuestion && (
              <QuestionEditor
                question={selectedQuestion}
                categories={content.categories}
                onChange={updateQuestion}
                onDelete={() => {
                  removeQuestion(selectedQuestion.id)
                  setSelectedQuestionId(null)
                }}
              />
            )}
          </div>
          <div className="admin-editor" style={{ marginTop: '1.5rem' }}>
            <h3>Optional feedback question</h3>
            <label className="field">
              <span>Prompt</span>
              <textarea
                rows={3}
                value={content.feedbackPrompt}
                onChange={(e) => updateFeedback(e.target.value, content.feedbackPlaceholder)}
              />
            </label>
            <label className="field">
              <span>Placeholder</span>
              <input
                value={content.feedbackPlaceholder}
                onChange={(e) => updateFeedback(content.feedbackPrompt, e.target.value)}
              />
            </label>
          </div>
        </section>
      )}

      {tab === 'report' && (
        <section className="admin-panel">
          <div className="admin-panel__row">
            <h2>Report content by category</h2>
            <label className="field field--inline">
              <span>Category</span>
              <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                {content.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <GuidanceEditor guidance={selectedGuidance} onChange={updateGuidance} />
        </section>
      )}

      {tab === 'import' && (
        <section className="admin-panel">
          <h2>Import / Export</h2>
          <p>
            Edits save automatically in this browser. Download a JSON pack to back up, share with your team, or
            commit into the repo later.
          </p>
          <div className="admin-inline" style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn btn--lime" onClick={downloadExport}>
              Download JSON pack
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (confirm('Reset all content to the built-in DreamStone defaults?')) {
                  resetToDefault()
                  setStatus('Reset to defaults.')
                }
              }}
            >
              Reset to defaults
            </button>
          </div>
          <label className="field">
            <span>Paste JSON to import</span>
            <textarea rows={12} value={importText} onChange={(e) => setImportText(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn--teal"
            onClick={() => {
              const result = importJson(importText)
              setStatus(result.ok ? 'Import successful.' : result.error)
            }}
          >
            Import JSON
          </button>
        </section>
      )}
    </div>
  )
}

function QuestionEditor({
  question,
  categories,
  onChange,
  onDelete,
}: {
  question: Question
  categories: Category[]
  onChange: (q: Question) => void
  onDelete: () => void
}) {
  const setType = (type: QuestionType) => {
    const next: Question = { ...question, type }
    if (type === 'scale' && !next.scale) {
      next.scale = { min: 1, max: 10, minLabel: 'Low', maxLabel: 'High' }
    }
    if ((type === 'single' || type === 'multi') && !next.options?.length) {
      next.options = [
        { id: uid('opt'), label: 'Option A', score: 100 },
        { id: uid('opt'), label: 'Option B', score: 50 },
      ]
    }
    onChange(next)
  }

  const updateOption = (opt: ChoiceOption) => {
    onChange({
      ...question,
      options: (question.options ?? []).map((o) => (o.id === opt.id ? opt : o)),
    })
  }

  return (
    <div className="admin-editor">
      <label className="field">
        <span>Prompt</span>
        <textarea rows={4} value={question.prompt} onChange={(e) => onChange({ ...question, prompt: e.target.value })} />
      </label>
      <label className="field">
        <span>Help text</span>
        <textarea
          rows={2}
          value={question.helpText ?? ''}
          onChange={(e) => onChange({ ...question, helpText: e.target.value })}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Type</span>
          <select value={question.type} onChange={(e) => setType(e.target.value as QuestionType)}>
            <option value="scale">Scale 1–10</option>
            <option value="yesno">Yes / No</option>
            <option value="single">Single choice</option>
            <option value="multi">Multi select</option>
            <option value="text">Text</option>
          </select>
        </label>
        <label className="field">
          <span>Category</span>
          <select
            value={question.categoryId}
            onChange={(e) => onChange({ ...question, categoryId: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {question.type === 'scale' && question.scale && (
        <div className="field-row">
          <label className="field">
            <span>Min label</span>
            <input
              value={question.scale.minLabel}
              onChange={(e) =>
                onChange({ ...question, scale: { ...question.scale!, minLabel: e.target.value } })
              }
            />
          </label>
          <label className="field">
            <span>Max label</span>
            <input
              value={question.scale.maxLabel}
              onChange={(e) =>
                onChange({ ...question, scale: { ...question.scale!, maxLabel: e.target.value } })
              }
            />
          </label>
        </div>
      )}

      {question.type === 'yesno' && (
        <div className="field-row">
          <label className="field">
            <span>Yes score (0–100)</span>
            <input
              type="number"
              value={question.yesScore ?? 100}
              onChange={(e) => onChange({ ...question, yesScore: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span>No score (0–100)</span>
            <input
              type="number"
              value={question.noScore ?? 0}
              onChange={(e) => onChange({ ...question, noScore: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      {(question.type === 'single' || question.type === 'multi') && (
        <div className="admin-options">
          <div className="admin-panel__row">
            <h3>Options</h3>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                onChange({
                  ...question,
                  options: [
                    ...(question.options ?? []),
                    { id: uid('opt'), label: 'New option', score: 50 },
                  ],
                })
              }
            >
              Add option
            </button>
          </div>
          {(question.options ?? []).map((opt) => (
            <div key={opt.id} className="admin-option-row">
              <input
                value={opt.label}
                onChange={(e) => updateOption({ ...opt, label: e.target.value })}
                placeholder="Label"
              />
              <input
                type="number"
                value={opt.score}
                onChange={(e) => updateOption({ ...opt, score: Number(e.target.value) })}
                title="Score"
              />
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={!!opt.isGap}
                  onChange={(e) => updateOption({ ...opt, isGap: e.target.checked })}
                />
                <span>Gap</span>
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  onChange({
                    ...question,
                    options: (question.options ?? []).filter((o) => o.id !== opt.id),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <label className="field">
          <span>Placeholder</span>
          <input
            value={question.placeholder ?? ''}
            onChange={(e) => onChange({ ...question, placeholder: e.target.value })}
          />
        </label>
      )}

      <button type="button" className="btn btn--ghost" onClick={onDelete}>
        Delete question
      </button>
    </div>
  )
}

function GuidanceEditor({
  guidance,
  onChange,
}: {
  guidance: CategoryGuidance
  onChange: (g: CategoryGuidance) => void
}) {
  const updateAction = (action: ActionItem) => {
    onChange({
      ...guidance,
      actions: guidance.actions.map((a) => (a.id === action.id ? action : a)),
    })
  }
  const updateResource = (resource: ResourceLink) => {
    onChange({
      ...guidance,
      resources: guidance.resources.map((r) => (r.id === resource.id ? resource : r)),
    })
  }

  return (
    <div className="admin-editor">
      <label className="field">
                    <span>Stakes (section intro)</span>
        <textarea
          rows={2}
          value={guidance.stakes}
          onChange={(e) => onChange({ ...guidance, stakes: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Risk if weak</span>
        <textarea
          rows={2}
          value={guidance.riskIfWeak}
          onChange={(e) => onChange({ ...guidance, riskIfWeak: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Primary next move</span>
        <textarea
          rows={2}
          value={guidance.nextMove}
          onChange={(e) => onChange({ ...guidance, nextMove: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Partner conversation angle</span>
        <textarea
          rows={2}
          value={guidance.partnerAngle}
          onChange={(e) => onChange({ ...guidance, partnerAngle: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Detailed report narrative</span>
        <textarea
          rows={5}
          value={guidance.reportDetail}
          onChange={(e) => onChange({ ...guidance, reportDetail: e.target.value })}
        />
      </label>

      <div className="admin-panel__row">
        <h3>Action plan items</h3>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            onChange({
              ...guidance,
              actions: [
                ...guidance.actions,
                {
                  id: uid('act'),
                  title: 'New action',
                  detail: '',
                  timeframe: '30 days',
                },
              ],
            })
          }
        >
          Add action
        </button>
      </div>
      {guidance.actions.map((a) => (
        <div key={a.id} className="admin-action-block">
          <input
            value={a.title}
            onChange={(e) => updateAction({ ...a, title: e.target.value })}
            placeholder="Title"
          />
          <select
            value={a.timeframe}
            onChange={(e) =>
              updateAction({ ...a, timeframe: e.target.value as ActionItem['timeframe'] })
            }
          >
            <option>This week</option>
            <option>30 days</option>
            <option>90 days</option>
          </select>
          <textarea
            rows={2}
            value={a.detail}
            onChange={(e) => updateAction({ ...a, detail: e.target.value })}
            placeholder="Detail"
          />
          <button
            type="button"
            className="text-link"
            onClick={() =>
              onChange({ ...guidance, actions: guidance.actions.filter((x) => x.id !== a.id) })
            }
          >
            Remove action
          </button>
        </div>
      ))}

      <div className="admin-panel__row" style={{ marginTop: '1.25rem' }}>
        <h3>Resource links</h3>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            onChange({
              ...guidance,
              resources: [
                ...guidance.resources,
                { id: uid('res'), label: 'New resource', url: 'https://', description: '' },
              ],
            })
          }
        >
          Add resource
        </button>
      </div>
      {guidance.resources.map((r) => (
        <div key={r.id} className="admin-action-block">
          <input
            value={r.label}
            onChange={(e) => updateResource({ ...r, label: e.target.value })}
            placeholder="Label"
          />
          <input
            value={r.url}
            onChange={(e) => updateResource({ ...r, url: e.target.value })}
            placeholder="https://..."
          />
          <input
            value={r.description ?? ''}
            onChange={(e) => updateResource({ ...r, description: e.target.value })}
            placeholder="Description"
          />
          <button
            type="button"
            className="text-link"
            onClick={() =>
              onChange({
                ...guidance,
                resources: guidance.resources.filter((x) => x.id !== r.id),
              })
            }
          >
            Remove resource
          </button>
        </div>
      ))}
    </div>
  )
}
