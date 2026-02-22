import {
  ClockIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import FormField from '../../../common/FormField'
import Pagination from '../../../common/Pagination'

const SettingsProfileSection = ({
  mustResetPassword,
  profileAvatarUrl,
  avatarLoadError,
  setAvatarLoadError,
  settings,
  currentEmployee,
  formatDateTime,
  user,
  copyText,
  copiedCredentialKey,
  handleJumpToPasswordCard,
  currentRoles,
  getRoleTagClass,
  saveProfile,
  status,
  setSettings,
  avatarUrlError,
  setAvatarUrlError,
  isValidHttpUrl,
  passwordCardRef,
  changePassword,
  currentPasswordInputRef,
  showCurrentPassword,
  setShowCurrentPassword,
  passwordForm,
  setPasswordForm,
  showNextPassword,
  setShowNextPassword,
  permissionSummary,
  settingsActions,
  profileActivityTotalCount,
  profileActivityPageItems,
  formatProfileActivityLabel,
  profileActivityPageSize,
  normalizedProfileActivityOffset,
  setProfileActivityPage,
}) => {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Profile Settings</h2>
      {mustResetPassword ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You must update your password before continuing to other pages.
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col items-start gap-3">
            {profileAvatarUrl && !avatarLoadError ? (
              <img
                src={profileAvatarUrl}
                alt="Profile avatar"
                onError={() => setAvatarLoadError(true)}
                className="h-24 w-24 rounded-full border border-slate-300 bg-white object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-white">
                <UserCircleIcon className="h-12 w-12 text-slate-500" />
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-slate-900">{settings.profile.displayName || '-'}</p>
              <p className="mt-0.5 text-sm text-slate-600">{settings.profile.email || '-'}</p>
              {avatarLoadError ? (
                <p className="mt-1 text-xs text-amber-700">Avatar image could not be loaded.</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">Last sign in {formatDateTime(currentEmployee?.lastLoginAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs">
            <span className="truncate text-slate-600">User ID: {user?.id || '-'}</span>
            <button
              type="button"
              onClick={() => copyText(user?.id || '', 'profile-user-id')}
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
            >
              <DocumentDuplicateIcon className="h-3.5 w-3.5" />
              {copiedCredentialKey === 'profile-user-id' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={handleJumpToPasswordCard}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-white"
            >
              <KeyIcon className="h-4 w-4" />
              Change Password
            </button>
            <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700">
              <ShieldCheckIcon className="h-4 w-4" />
              Account: {currentEmployee?.status || 'active'}
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700">
              <ShieldExclamationIcon className="h-4 w-4" />
              Reset Required: {mustResetPassword ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</p>
            <div className="flex flex-wrap gap-2">
              {currentRoles.length > 0 ? (
                currentRoles.map((role) => (
                  <span
                    key={role.id}
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getRoleTagClass(role)}`}
                  >
                    {role.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No role assigned</span>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
              <button
                type="button"
                onClick={saveProfile}
                disabled={status === 'saving'}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Save Profile
              </button>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <FormField label="Display Name" required>
                <input
                  value={settings.profile.displayName}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, displayName: event.target.value } }))
                  }
                  placeholder="Enter your display name"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Email">
                <input
                  value={settings.profile.email}
                  disabled
                  className="h-10 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-slate-500"
                />
              </FormField>
              <FormField label="Avatar URL" className="md:col-span-2" error={avatarUrlError}>
                <input
                  value={settings.profile.avatarUrl || ''}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, avatarUrl: nextValue } }))
                    setAvatarLoadError(false)
                    if (avatarUrlError && isValidHttpUrl(nextValue)) {
                      setAvatarUrlError('')
                    }
                  }}
                  onBlur={(event) => {
                    const nextValue = event.target.value
                    if (!isValidHttpUrl(nextValue)) {
                      setAvatarUrlError('Avatar URL must start with http:// or https://')
                    } else {
                      setAvatarUrlError('')
                    }
                  }}
                  placeholder="https://..."
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
            </div>
          </section>

          <section ref={passwordCardRef} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Account Security</h3>
              <button
                type="button"
                onClick={changePassword}
                disabled={status === 'saving'}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
              >
                Update Password
              </button>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <FormField label="Current Password" required>
                <div className="relative">
                  <input
                    ref={currentPasswordInputRef}
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    placeholder="Enter current password"
                    className="h-10 w-full rounded-md border border-slate-300 px-3 pr-10 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
              <FormField label="New Password" required>
                <div className="relative">
                  <input
                    type={showNextPassword ? 'text' : 'password'}
                    value={passwordForm.nextPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, nextPassword: event.target.value }))}
                    placeholder="Enter new password"
                    className="h-10 w-full rounded-md border border-slate-300 px-3 pr-10 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNextPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
                    aria-label={showNextPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNextPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Permission Summary</h3>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
                <p className="text-[11px] text-slate-500">Total</p>
                <p className="text-sm font-semibold text-slate-900">{permissionSummary.total}</p>
              </div>
              {[...settingsActions, { key: 'admin', label: 'Full Access' }].map((action) => (
                <div key={action.key} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
                  <p className="text-[11px] uppercase text-slate-500">{action.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{permissionSummary.counters[action.key] ?? 0}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">My Activity</h3>
            </div>
            <div className="mt-3 space-y-2">
              {profileActivityTotalCount > 0 ? (
                profileActivityPageItems.map((log) => (
                  <div key={log.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{formatProfileActivityLabel(log.action)}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No activity yet.</p>
              )}
            </div>
            {profileActivityTotalCount > profileActivityPageSize ? (
              <Pagination
                totalCount={profileActivityTotalCount}
                limit={profileActivityPageSize}
                offset={normalizedProfileActivityOffset}
                onPageChange={(page) => setProfileActivityPage(page)}
              />
            ) : null}
          </section>
        </div>
      </div>
    </section>
  )
}

export default SettingsProfileSection
