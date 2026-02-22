import FloatingLabelInput from '../../../common/FloatingLabelInput'

const SettingsSecuritySection = ({
  securityPolicies,
  setSettings,
  securityNumericFields,
  securityBooleanFields,
  saveSecurity,
  resetSecurity,
  resetSecurityToDefault,
  status,
}) => {
  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Password Policy</h2>
        <p className="text-sm text-slate-600">
          A password policy defines rules to improve account security and enforce stronger passwords.
        </p>
      </div>

      <div className="max-w-2xl space-y-4">
        {securityNumericFields.map((field) => (
          <FloatingLabelInput
            key={field.key}
            id={`security-${field.key}`}
            label={field.label}
            type="number"
            min={field.min}
            value={
              securityPolicies?.[field.key] === '' ||
              securityPolicies?.[field.key] === null ||
              securityPolicies?.[field.key] === undefined
                ? ''
                : String(securityPolicies?.[field.key])
            }
            onValueChange={(nextValue) =>
              setSettings((prev) => ({
                ...prev,
                securityPolicies: {
                  ...prev.securityPolicies,
                  [field.key]: nextValue === '' ? '' : Number(nextValue),
                },
              }))
            }
          />
        ))}

        <div className="space-y-4 rounded-lg bg-white px-4 py-3">
          {securityBooleanFields.map((field) => (
            <label key={field.key} className="flex items-center gap-6 text-base tracking-wide text-slate-900">
              <input
                type="checkbox"
                checked={Boolean(securityPolicies?.[field.key])}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    securityPolicies: {
                      ...prev.securityPolicies,
                      [field.key]: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              {field.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={saveSecurity}
          disabled={status === 'saving'}
          className="rounded-md bg-indigo-500 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          Update
        </button>
        <button
          type="button"
          onClick={resetSecurity}
          disabled={status === 'saving'}
          className="rounded-md border border-slate-300 bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={resetSecurityToDefault}
          disabled={status === 'saving'}
          className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Reset To Default
        </button>
      </div>
    </section>
  )
}

export default SettingsSecuritySection
