import { useEffect, useMemo, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { useAuth } from '../../../features/auth/AuthProvider'
import FormField from '../../common/FormField'
import DatePickerField from '../../common/DatePickerField'
import StatusMessage from '../../common/StatusMessage'
import {
  fetchBackstagePrivacyPolicyPage,
  updateBackstagePrivacyPolicyPage,
} from '../../../api/backstageLegalApi'

const buildInitialForm = () => ({
  title: 'Privacy Policy',
  markdown: '',
  effectiveDate: '',
  version: '',
  status: 'published',
})

const PrivacyPolicyPageEditor = () => {
  const { user } = useAuth()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [form, setForm] = useState(buildInitialForm)

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setErrorMessage('')

      try {
        const payload = await fetchBackstagePrivacyPolicyPage()
        const policy = payload?.data?.privacyPolicy

        if (!policy) throw new Error('Privacy policy content not found')

        setForm({
          title: policy.title ?? 'Privacy Policy',
          markdown: policy.markdown ?? '',
          effectiveDate: policy.effectiveDate ?? '',
          version: policy.version ?? '',
          status: policy.status ?? 'published',
        })
        setUpdatedAt(payload?.data?.updatedAt ?? '')
        setStatus('success')
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load privacy policy content.')
      }
    }

    load()
  }, [])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const save = async () => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = await updateBackstagePrivacyPolicyPage({
        ...form,
        updatedBy: editorId,
      })

      setUpdatedAt(payload?.data?.updatedAt ?? '')
      setSuccessMessage('Privacy policy saved.')
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save privacy policy content.')
    }
  }

  return (
    <section className="space-y-4" data-color-mode="light">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
            <p className="mt-1 text-sm text-slate-500">Edit markdown content for the frontend privacy policy page.</p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={status === 'saving'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving...' : 'Save'}
          </button>
        </div>
        {updatedAt ? <p className="mt-2 text-xs text-slate-500">Last updated: {updatedAt}</p> : null}
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Document Meta</h2>
        <div className="mt-4 grid gap-4 md:max-w-[320px]">
          <FormField label="Effective Date">
            <DatePickerField
              value={form.effectiveDate}
              onChange={(nextValue) => updateField('effectiveDate', nextValue)}
            />
          </FormField>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-1">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Markdown Editor</h2>
            <p className="text-xs text-slate-500">{form.markdown.length} chars</p>
          </div>
          <MDEditor
            value={form.markdown}
            onChange={(value) => updateField('markdown', value ?? '')}
            preview="live"
            visibleDragbar={false}
            height={720}
            textareaProps={{ placeholder: '# Privacy Policy' }}
            previewOptions={{
              className: 'md-prose',
            }}
          />
        </div>
      </section>
    </section>
  )
}

export default PrivacyPolicyPageEditor
