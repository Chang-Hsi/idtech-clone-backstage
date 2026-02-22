import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider'
import StatusMessage from '../../common/StatusMessage'
import CredentialsDialog from '../../dialog/CredentialsDialog'
import ConfirmDialog from '../../dialog/ConfirmDialog'
import RemindDialog from '../../dialog/RemindDialog'
import RolePermissionRadarDialog from '../../dialog/RolePermissionRadarDialog'
import SettingsAuditSection from './sections/SettingsAuditSection'
import SettingsEmployeesSection from './sections/SettingsEmployeesSection'
import SettingsProfileSection from './sections/SettingsProfileSection'
import SettingsRolesSection from './sections/SettingsRolesSection'
import SettingsSecuritySection from './sections/SettingsSecuritySection'
import {
  fetchBackstageSettings,
  fetchBackstageSettingsAuditLogs,
  resetBackstageEmployeePassword,
  updateBackstageSettingsEmployees,
  updateBackstageSettingsPassword,
  updateBackstageSettingsProfile,
  updateBackstageSettingsRoles,
  updateBackstageSettingsSecurityPolicies,
} from '../../../api/backstageSettingsApi'
import { formatDateTime } from '../../../utils/formatters'

const SETTINGS_ACTIONS = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
  { key: 'delete', label: 'Archive' },
]

const SETTINGS_RESOURCES = [
  { group: 'Core', key: 'pages', label: 'Pages', state: 'enforced' },
  { group: 'Content', key: 'content.products', label: 'Products', state: 'enforced' },
  { group: 'Content', key: 'content.collections', label: 'Collections', state: 'enforced' },
  { group: 'Content', key: 'content.useCases', label: 'Use Cases', state: 'enforced' },
  { group: 'Content', key: 'content.resources', label: 'Resources', state: 'enforced' },
  { group: 'Content', key: 'content.company', label: 'Company', state: 'enforced' },
  { group: 'Publishing', key: 'seo', label: 'SEO', state: 'enforced' },
  { group: 'Settings', key: 'settings.profile', label: 'Profile', state: 'enforced' },
  { group: 'Settings', key: 'settings.rbac', label: 'RBAC', state: 'enforced' },
  { group: 'Settings', key: 'settings.employees', label: 'Employees', state: 'enforced' },
  { group: 'Settings', key: 'settings.security', label: 'Security', state: 'enforced' },
  { group: 'Settings', key: 'settings.audit', label: 'Audit Logs', state: 'enforced' },
]

const emptySettings = {
  profile: { displayName: '', email: '', avatarUrl: '', lastLoginAt: null },
  roles: [],
  employees: [],
  securityPolicies: {
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
    passwordExpireDays: 90,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
    sessionTimeoutMinutes: 120,
  },
  auditLogs: [],
}

const ACTIVE_SECTIONS = {
  '/settings/profile': 'profile',
  '/settings/roles': 'roles',
  '/settings/employees': 'employees',
  '/settings/security': 'security',
  '/settings/audit': 'audit',
}

const SECTION_META = {
  profile: {
    title: 'Profile Settings',
    subtitle: 'Manage your profile information and password.',
  },
  roles: {
    title: 'Roles & Permissions',
    subtitle: 'Configure RBAC roles and permission matrix.',
  },
  employees: {
    title: 'Employees',
    subtitle: 'Manage employee accounts and temporary credentials.',
  },
  security: {
    title: 'Security Policies',
    subtitle: 'Define password and account security baseline.',
  },
  audit: {
    title: 'Audit Logs',
    subtitle: 'Review settings and authorization changes.',
  },
}

const PROFILE_ACTIVITY_ACTIONS = new Set([
  'settings.auth.login.success',
  'settings.auth.login.failed',
  'settings.profile.password.change',
  'pages.home.update',
])

const PROFILE_ACTIVITY_LABELS = {
  'settings.auth.login.success': 'Login Success',
  'settings.auth.login.failed': 'Login Failed',
  'settings.profile.password.change': 'Password Changed',
  'pages.home.update': 'Home Content Updated',
}

const formatProfileActivityLabel = (action) => {
  const key = String(action ?? '').trim()
  if (!key) return 'Unknown Action'
  if (PROFILE_ACTIVITY_LABELS[key]) return PROFILE_ACTIVITY_LABELS[key]
  if (key.startsWith('backstage.')) {
    const cleaned = key.replace(/^backstage\./, '').replace(/\.+/g, ' ')
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
  }
  return key
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]
const PROFILE_ACTIVITY_PAGE_SIZE = 5
const EMPLOYEE_PAGE_SIZE = 10
const SECURITY_NUMERIC_FIELDS = [
  { key: 'passwordMinLength', label: 'Minimum password length', min: 8 },
  { key: 'passwordExpireDays', label: 'Password expiry period (days)', min: 0 },
  { key: 'maxLoginAttempts', label: 'Maximum failed login attempts', min: 3 },
  { key: 'lockoutMinutes', label: 'Account lockout duration (minutes)', min: 1 },
  { key: 'sessionTimeoutMinutes', label: 'Session timeout (minutes)', min: 5 },
]
const SECURITY_BOOLEAN_FIELDS = [
  { key: 'requireUppercase', label: 'Require uppercase letters' },
  { key: 'requireLowercase', label: 'Require lowercase letters' },
  { key: 'requireNumber', label: 'Require numeric characters' },
  { key: 'requireSymbol', label: 'Require special characters' },
]

const getActiveSection = (pathname) => {
  const matched = Object.keys(ACTIVE_SECTIONS).find((route) => pathname.startsWith(route))
  return matched ? ACTIVE_SECTIONS[matched] : 'profile'
}

const uniquePermissions = (permissions) => Array.from(new Set((permissions ?? []).map((item) => String(item).trim()).filter(Boolean)))

const hasPermission = (permissions, resource, action) => {
  const all = uniquePermissions(permissions)
  return all.includes('*:*') || all.includes(`${resource}:${action}`) || all.includes(`${resource}:admin`)
}

const togglePermission = (permissions, resource, action, checked) => {
  const key = `${resource}:${action}`
  const next = new Set(uniquePermissions(permissions))
  if (checked) {
    next.add(key)
  } else {
    next.delete(key)
  }
  return Array.from(next)
}

const getRoleTagClass = (role) =>
  role?.status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-200 text-slate-600'

const isValidHttpUrl = (value) => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const normalizeEmployeesForWrite = (employees) =>
  (Array.isArray(employees) ? employees : []).map((employee) => {
    const normalized = {
      id: String(employee?.id ?? '').trim(),
      email: String(employee?.email ?? '').trim(),
      displayName: String(employee?.displayName ?? '').trim(),
      avatarUrl: String(employee?.avatarUrl ?? '').trim(),
      status: employee?.status === 'archived' ? 'archived' : 'active',
      roleIds: Array.isArray(employee?.roleIds)
        ? employee.roleIds.map((roleId) => String(roleId ?? '').trim()).filter(Boolean)
        : [],
      forcePasswordReset: Boolean(employee?.forcePasswordReset),
    }
    const lastLoginAt = employee?.lastLoginAt
    if (typeof lastLoginAt === 'string' && lastLoginAt.trim()) {
      normalized.lastLoginAt = lastLoginAt.trim()
    }
    return normalized
  })

const SettingsManagerPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const activeSection = getActiveSection(location.pathname)

  const { user, permissions, logout, mustResetPassword } = useAuth()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [settings, setSettings] = useState(emptySettings)
  const [issuedCredentials, setIssuedCredentials] = useState([])
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [copiedCredentialKey, setCopiedCredentialKey] = useState('')
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [avatarUrlError, setAvatarUrlError] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [updatedBy, setUpdatedBy] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', nextPassword: '' })
  const passwordCardRef = useRef(null)
  const currentPasswordInputRef = useRef(null)
  const isMountedRef = useRef(true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNextPassword, setShowNextPassword] = useState(false)
  const [profileActivityPage, setProfileActivityPage] = useState(1)
  const [roleRadarDialog, setRoleRadarDialog] = useState({ isOpen: false, roleId: '' })
  const [employeeQueryInput, setEmployeeQueryInput] = useState('')
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('all')
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('all')
  const [employeePage, setEmployeePage] = useState(1)
  const [savedSecurityPolicies, setSavedSecurityPolicies] = useState(emptySettings.securityPolicies)
  const [employeeDialog, setEmployeeDialog] = useState({
    isOpen: false,
    mode: 'create',
    targetId: '',
    displayName: '',
    email: '',
    roleId: '',
    status: 'active',
  })
  const [employeeDialogErrors, setEmployeeDialogErrors] = useState({
    displayName: '',
    email: '',
    roleId: '',
  })
  const [employeeActionTarget, setEmployeeActionTarget] = useState(null)
  const [employeeActionRemind, setEmployeeActionRemind] = useState({
    isOpen: false,
    title: '',
    description: '',
  })
  const [employeeResetTarget, setEmployeeResetTarget] = useState(null)

  const selectedRole = useMemo(
    () => settings.roles.find((role) => role.id === selectedRoleId) ?? settings.roles[0] ?? null,
    [selectedRoleId, settings.roles],
  )
  const roleForRadarDialog = useMemo(
    () => settings.roles.find((role) => role.id === roleRadarDialog.roleId) ?? null,
    [roleRadarDialog.roleId, settings.roles],
  )
  const sectionMeta = SECTION_META[activeSection] ?? SECTION_META.profile
  const currentEmployee = useMemo(() => {
    const target = String(user?.email ?? '').toLowerCase()
    return settings.employees.find((employee) => String(employee.email ?? '').toLowerCase() === target) ?? null
  }, [settings.employees, user?.email])
  const currentRoles = useMemo(() => {
    const roleIdSet = new Set(currentEmployee?.roleIds ?? [])
    return settings.roles.filter((role) => roleIdSet.has(role.id))
  }, [currentEmployee?.roleIds, settings.roles])
  const permissionSummary = useMemo(() => {
    const resolvedPermissions = Array.isArray(permissions) ? permissions : []
    const total = SETTINGS_RESOURCES.reduce(
      (sum, resource) =>
        sum +
        SETTINGS_ACTIONS.filter((action) =>
          hasPermission(resolvedPermissions, resource.key, action.key),
        ).length,
      0,
    )
    const counters = SETTINGS_ACTIONS.reduce(
      (acc, action) => ({ ...acc, [action.key]: 0 }),
      { admin: 0 },
    )
    for (const action of SETTINGS_ACTIONS) {
      counters[action.key] = SETTINGS_RESOURCES.filter((resource) =>
        hasPermission(resolvedPermissions, resource.key, action.key),
      ).length
    }
    counters.admin = SETTINGS_RESOURCES.filter((resource) =>
      hasPermission(resolvedPermissions, resource.key, 'admin'),
    ).length
    return { total, counters }
  }, [permissions])
  const profileActivities = useMemo(() => {
    const actorEmail = String(user?.email ?? '').toLowerCase()
    return (settings.auditLogs ?? [])
      .filter(
        (log) =>
          String(log?.actorId ?? '').toLowerCase() === actorEmail &&
          (PROFILE_ACTIVITY_ACTIONS.has(String(log?.action ?? '')) ||
            String(log?.action ?? '').startsWith('backstage.')),
      )
  }, [settings.auditLogs, user?.email])
  const profileActivityTotalCount = profileActivities.length
  const profileActivityTotalPages = Math.max(
    1,
    Math.ceil(profileActivityTotalCount / PROFILE_ACTIVITY_PAGE_SIZE),
  )
  const normalizedProfileActivityPage =
    profileActivityPage > profileActivityTotalPages ? profileActivityTotalPages : profileActivityPage
  const normalizedProfileActivityOffset =
    (normalizedProfileActivityPage - 1) * PROFILE_ACTIVITY_PAGE_SIZE
  const profileActivityPageItems = useMemo(
    () =>
      profileActivities.slice(
        normalizedProfileActivityOffset,
        normalizedProfileActivityOffset + PROFILE_ACTIVITY_PAGE_SIZE,
      ),
    [normalizedProfileActivityOffset, profileActivities],
  )
  const profileAvatarUrl = String(settings.profile?.avatarUrl ?? '').trim()

  const load = async ({ startLoading = true } = {}) => {
    if (!isMountedRef.current) return
    if (startLoading) {
      setStatus('loading')
      setErrorMessage('')
    }

    try {
      const payload = await fetchBackstageSettings()
      if (!isMountedRef.current) return
      const responseSettings = payload?.data?.settings ?? emptySettings
      setSettings({ ...emptySettings, ...responseSettings, auditLogs: [] })
      setSavedSecurityPolicies({
        ...emptySettings.securityPolicies,
        ...(responseSettings?.securityPolicies ?? {}),
      })
      setUpdatedAt(payload?.data?.updatedAt ?? '')
      setUpdatedBy(payload?.data?.updatedBy ?? '')

      const firstRole = Array.isArray(responseSettings?.roles) ? responseSettings.roles[0] : null
      setSelectedRoleId((prev) => prev || firstRole?.id || '')

      const auditPayload = await fetchBackstageSettingsAuditLogs()
      if (!isMountedRef.current) return
      const logs = Array.isArray(auditPayload?.data?.auditLogs) ? auditPayload.data.auditLogs : []
      setSettings((prev) => ({ ...prev, auditLogs: logs }))
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to load settings.')
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    const frameId = window.requestAnimationFrame(() => {
      load({ startLoading: false })
    })
    return () => {
      window.cancelAnimationFrame(frameId)
      isMountedRef.current = false
    }
  }, [])

  const saveProfile = async () => {
    const avatarValue = String(settings.profile.avatarUrl ?? '').trim()
    if (!isValidHttpUrl(avatarValue)) {
      setAvatarUrlError('Avatar URL must start with http:// or https://')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateBackstageSettingsProfile({
        displayName: settings.profile.displayName,
        avatarUrl: avatarValue,
        updatedBy: editorId,
      })
      await load()
      if (!isMountedRef.current) return
      setSuccessMessage('Profile settings saved.')
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to save profile settings.')
      setStatus('error')
    }
  }

  const changePassword = async () => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const response = await updateBackstageSettingsPassword({
        currentPassword: passwordForm.currentPassword,
        nextPassword: passwordForm.nextPassword,
        updatedBy: editorId,
      })
      setPasswordForm({ currentPassword: '', nextPassword: '' })
      if (response?.data?.requireReauth) {
        await logout()
        if (!isMountedRef.current) return
        navigate('/auth/login', {
          replace: true,
          state: { reason: 'password-updated' },
        })
        return
      }
      await load()
      if (!isMountedRef.current) return
      setSuccessMessage('Password changed.')
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to change password.')
      setStatus('error')
    }
  }

  const saveRoles = async () => {
    if (settings.roles.length === 0) {
      setErrorMessage('At least one role is required.')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateBackstageSettingsRoles({ roles: settings.roles, updatedBy: editorId })
      await load()
      if (!isMountedRef.current) return
      setSuccessMessage('Roles updated.')
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to update roles.')
      setStatus('error')
    }
  }

  const persistEmployees = async (nextEmployees, successText = 'Employees updated.') => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    setIssuedCredentials([])
    try {
      const response = await updateBackstageSettingsEmployees({
        employees: normalizeEmployeesForWrite(nextEmployees),
        updatedBy: editorId,
      })
      const credentials = Array.isArray(response?.data?.issuedCredentials) ? response.data.issuedCredentials : []
      if (!isMountedRef.current) return
      setIssuedCredentials(credentials)
      setCredentialsDialogOpen(credentials.length > 0)
      await load()
      if (!isMountedRef.current) return
      setSuccessMessage(successText)
      setStatus('success')
      return true
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to update employees.')
      setStatus('error')
      return false
    }
  }

  const resetEmployeePassword = async (employee) => {
    if (!employee?.id) return
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    setIssuedCredentials([])
    try {
      const response = await resetBackstageEmployeePassword(employee.id, { updatedBy: editorId })
      const email = response?.data?.email ?? employee.email
      const temporaryPassword = response?.data?.temporaryPassword ?? ''
      const nextCredentials = temporaryPassword
        ? [{ employeeId: employee.id, email, temporaryPassword }]
        : []
      if (!isMountedRef.current) return
      setIssuedCredentials(nextCredentials)
      setCredentialsDialogOpen(nextCredentials.length > 0)
      await load()
      if (!isMountedRef.current) return
      setSuccessMessage(`Temporary password reset for ${email}.`)
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to reset employee password.')
      setStatus('error')
    }
  }

  const requestResetEmployeePassword = (employee) => {
    if (!employee?.id) return
    setEmployeeResetTarget({
      id: employee.id,
      displayName: employee.displayName || '-',
      email: employee.email || '-',
    })
  }

  const confirmResetEmployeePassword = async () => {
    if (!employeeResetTarget?.id) return
    const employee = settings.employees.find((item) => item.id === employeeResetTarget.id)
    setEmployeeResetTarget(null)
    if (!employee) {
      setErrorMessage('Employee not found.')
      return
    }
    await resetEmployeePassword(employee)
  }

  const saveSecurity = async () => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateBackstageSettingsSecurityPolicies({
        securityPolicies: settings.securityPolicies,
        updatedBy: editorId,
      })
      await load()
      if (!isMountedRef.current) return
      setSavedSecurityPolicies({ ...settings.securityPolicies })
      setSuccessMessage('Security policies updated.')
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to update security policies.')
      setStatus('error')
    }
  }
  const resetSecurity = () => {
    setSettings((prev) => ({
      ...prev,
      securityPolicies: { ...savedSecurityPolicies },
    }))
  }

  const resetSecurityToDefault = () => {
    setSettings((prev) => ({
      ...prev,
      securityPolicies: { ...emptySettings.securityPolicies },
    }))
  }

  const updateSelectedRole = (updater) => {
    if (!selectedRole) return
    setSettings((prev) => ({
      ...prev,
      roles: prev.roles.map((role) => (role.id === selectedRole.id ? updater(role) : role)),
    }))
  }

  const removeSelectedRole = () => {
    if (!selectedRole) return
    setSettings((prev) => ({ ...prev, roles: prev.roles.filter((role) => role.id !== selectedRole.id) }))
    setSelectedRoleId((prev) => (prev === selectedRole.id ? '' : prev))
  }

  const activeRoleOptions = settings.roles
    .filter((role) => role.status === 'active')
    .map((role) => ({ value: role.id, label: role.name }))
  const employeeRoleOptions = settings.roles.map((role) => ({
    value: role.id,
    label: role.name,
  }))
  const employeeRoleMap = useMemo(
    () => new Map(settings.roles.map((role) => [role.id, role])),
    [settings.roles],
  )
  const filteredEmployees = useMemo(() => {
    const keyword = employeeQuery.trim().toLowerCase()
    return (settings.employees ?? [])
      .filter((employee) => {
        if (employeeStatusFilter !== 'all' && employee.status !== employeeStatusFilter) return false
        if (employeeRoleFilter !== 'all' && !employee.roleIds.includes(employeeRoleFilter)) return false
        if (!keyword) return true
        const haystack = `${employee.displayName} ${employee.email} ${employee.id}`.toLowerCase()
        return haystack.includes(keyword)
      })
      .sort((a, b) => {
        const aTime = Number.isFinite(Date.parse(a?.lastLoginAt ?? '')) ? Date.parse(a.lastLoginAt) : 0
        const bTime = Number.isFinite(Date.parse(b?.lastLoginAt ?? '')) ? Date.parse(b.lastLoginAt) : 0
        return bTime - aTime || String(a.displayName).localeCompare(String(b.displayName))
      })
  }, [settings.employees, employeeQuery, employeeStatusFilter, employeeRoleFilter])
  const employeeTotalCount = filteredEmployees.length
  const employeeTotalPages = Math.max(1, Math.ceil(employeeTotalCount / EMPLOYEE_PAGE_SIZE))
  const normalizedEmployeePage = employeePage > employeeTotalPages ? employeeTotalPages : employeePage
  const employeeOffset = (normalizedEmployeePage - 1) * EMPLOYEE_PAGE_SIZE
  const pagedEmployees = useMemo(
    () => filteredEmployees.slice(employeeOffset, employeeOffset + EMPLOYEE_PAGE_SIZE),
    [filteredEmployees, employeeOffset],
  )
  const copyText = async (value, key) => {
    try {
      await navigator.clipboard.writeText(String(value ?? ''))
      setCopiedCredentialKey(key)
      setTimeout(() => setCopiedCredentialKey(''), 1200)
    } catch {
      setErrorMessage('Unable to copy to clipboard.')
    }
  }

  const copyAllCredentials = async () => {
    const lines = issuedCredentials.map((item) => `${item.email}: ${item.temporaryPassword}`)
    await copyText(lines.join('\n'), 'all')
  }

  const handleJumpToPasswordCard = () => {
    passwordCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      currentPasswordInputRef.current?.focus()
    }, 320)
  }

  const handleEmployeeSearchSubmit = (event) => {
    event.preventDefault()
    setEmployeeQuery(employeeQueryInput.trim())
    setEmployeePage(1)
  }

  const openCreateEmployeeDialog = () => {
    setEmployeeDialogErrors({ displayName: '', email: '', roleId: '' })
    setEmployeeDialog({
      isOpen: true,
      mode: 'create',
      targetId: '',
      displayName: '',
      email: '',
      roleId: activeRoleOptions[0]?.value ?? '',
      status: 'active',
    })
  }

  const openEditEmployeeDialog = (employee) => {
    setEmployeeDialogErrors({ displayName: '', email: '', roleId: '' })
    setEmployeeDialog({
      isOpen: true,
      mode: 'edit',
      targetId: employee.id,
      displayName: employee.displayName ?? '',
      email: employee.email ?? '',
      roleId: employee.roleIds?.[0] ?? '',
      status: employee.status === 'archived' ? 'archived' : 'active',
    })
  }

  const closeEmployeeDialog = () => {
    setEmployeeDialogErrors({ displayName: '', email: '', roleId: '' })
    setEmployeeDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const validateEmployeeDialog = () => {
    const displayName = String(employeeDialog.displayName ?? '').trim()
    const email = String(employeeDialog.email ?? '').trim()
    const roleId = String(employeeDialog.roleId ?? '').trim()

    const nextErrors = {
      displayName: displayName ? '' : 'Display name is required.',
      email: '',
      roleId: roleId ? '' : 'Role is required.',
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!emailRegex.test(email)) {
      nextErrors.email = 'Email format is invalid.'
    } else {
      const duplicate = settings.employees.find(
        (employee) =>
          String(employee.email ?? '').toLowerCase() === email.toLowerCase() &&
          employee.id !== employeeDialog.targetId,
      )
      if (duplicate) nextErrors.email = 'Email already exists.'
    }

    setEmployeeDialogErrors(nextErrors)
    return !nextErrors.displayName && !nextErrors.email && !nextErrors.roleId
  }

  const saveEmployeeDialog = async () => {
    if (!validateEmployeeDialog()) return
    const nowId = `emp-${Date.now()}`
    const nextEmployee = {
      id: employeeDialog.mode === 'create' ? nowId : employeeDialog.targetId,
      email: String(employeeDialog.email ?? '').trim(),
      displayName: String(employeeDialog.displayName ?? '').trim(),
      avatarUrl: '',
      status: employeeDialog.status === 'archived' ? 'archived' : 'active',
      roleIds: employeeDialog.roleId ? [employeeDialog.roleId] : [],
      lastLoginAt: null,
      forcePasswordReset: employeeDialog.mode === 'create',
    }
    const nextEmployees =
      employeeDialog.mode === 'create'
        ? [...settings.employees, nextEmployee]
        : settings.employees.map((employee) =>
            employee.id === employeeDialog.targetId
              ? {
                  ...employee,
                  displayName: nextEmployee.displayName,
                  email: nextEmployee.email,
                  status: nextEmployee.status,
                  roleIds: nextEmployee.roleIds,
                }
              : employee,
          )

    const success = await persistEmployees(
      nextEmployees,
      employeeDialog.mode === 'create' ? 'Employee created.' : 'Employee updated.',
    )
    if (!success) return
    setEmployeePage(1)
    closeEmployeeDialog()
  }

  const toggleEmployeeArchive = (employee) => {
    const nextStatus = employee?.status === 'archived' ? 'active' : 'archived'
    const currentUserEmail = String(user?.email ?? '').trim().toLowerCase()
    const targetEmail = String(employee?.email ?? '').trim().toLowerCase()
    if (nextStatus === 'archived' && currentUserEmail && targetEmail && currentUserEmail === targetEmail) {
      setEmployeeActionRemind({
        isOpen: true,
        title: 'Action blocked',
        description: 'You cannot archive your own account while you are logged in.',
      })
      return
    }
    setEmployeeActionTarget({
      id: employee?.id,
      displayName: employee?.displayName || employee?.email || 'Employee',
      nextStatus,
    })
  }

  const confirmToggleEmployeeArchive = async () => {
    if (!employeeActionTarget?.id) return
    const nextEmployees = settings.employees.map((item) =>
      item.id === employeeActionTarget.id ? { ...item, status: employeeActionTarget.nextStatus } : item,
    )
    await persistEmployees(
      nextEmployees,
      employeeActionTarget.nextStatus === 'archived' ? 'Employee archived.' : 'Employee restored.',
    )
    setEmployeeActionTarget(null)
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{sectionMeta.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{sectionMeta.subtitle}</p>
        {updatedAt ? (
          <p className="mt-1 text-xs text-slate-500">
            Last updated: {formatDateTime(updatedAt)}
            {updatedBy ? ` by ${updatedBy}` : ''}
          </p>
        ) : null}
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      {activeSection === 'profile' ? (
        <SettingsProfileSection
          mustResetPassword={mustResetPassword}
          profileAvatarUrl={profileAvatarUrl}
          avatarLoadError={avatarLoadError}
          setAvatarLoadError={setAvatarLoadError}
          settings={settings}
          currentEmployee={currentEmployee}
          formatDateTime={formatDateTime}
          user={user}
          copyText={copyText}
          copiedCredentialKey={copiedCredentialKey}
          handleJumpToPasswordCard={handleJumpToPasswordCard}
          currentRoles={currentRoles}
          getRoleTagClass={getRoleTagClass}
          saveProfile={saveProfile}
          status={status}
          setSettings={setSettings}
          avatarUrlError={avatarUrlError}
          setAvatarUrlError={setAvatarUrlError}
          isValidHttpUrl={isValidHttpUrl}
          passwordCardRef={passwordCardRef}
          changePassword={changePassword}
          currentPasswordInputRef={currentPasswordInputRef}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          showNextPassword={showNextPassword}
          setShowNextPassword={setShowNextPassword}
          permissionSummary={permissionSummary}
          settingsActions={SETTINGS_ACTIONS}
          profileActivityTotalCount={profileActivityTotalCount}
          profileActivityPageItems={profileActivityPageItems}
          formatProfileActivityLabel={formatProfileActivityLabel}
          profileActivityPageSize={PROFILE_ACTIVITY_PAGE_SIZE}
          normalizedProfileActivityOffset={normalizedProfileActivityOffset}
          setProfileActivityPage={setProfileActivityPage}
        />
      ) : null}

      {activeSection === 'roles' ? (
        <SettingsRolesSection
          settings={settings}
          selectedRole={selectedRole}
          selectedRoleId={selectedRoleId}
          setSelectedRoleId={setSelectedRoleId}
          setRoleRadarDialog={setRoleRadarDialog}
          setSettings={setSettings}
          saveRoles={saveRoles}
          status={status}
          updateSelectedRole={updateSelectedRole}
          removeSelectedRole={removeSelectedRole}
          statusOptions={statusOptions}
          settingsActions={SETTINGS_ACTIONS}
          settingsResources={SETTINGS_RESOURCES}
          hasPermission={hasPermission}
          togglePermission={togglePermission}
          getRoleTagClass={getRoleTagClass}
        />
      ) : null}

      {activeSection === 'employees' ? (
        <SettingsEmployeesSection
          openCreateEmployeeDialog={openCreateEmployeeDialog}
          handleEmployeeSearchSubmit={handleEmployeeSearchSubmit}
          employeeQueryInput={employeeQueryInput}
          setEmployeeQueryInput={setEmployeeQueryInput}
          employeeRoleFilter={employeeRoleFilter}
          employeeRoleOptions={employeeRoleOptions}
          setEmployeeRoleFilter={setEmployeeRoleFilter}
          employeeStatusFilter={employeeStatusFilter}
          setEmployeeStatusFilter={setEmployeeStatusFilter}
          setEmployeePage={setEmployeePage}
          pagedEmployees={pagedEmployees}
          employeeOffset={employeeOffset}
          employeeRoleMap={employeeRoleMap}
          formatDateTime={formatDateTime}
          openEditEmployeeDialog={openEditEmployeeDialog}
          requestResetEmployeePassword={requestResetEmployeePassword}
          status={status}
          toggleEmployeeArchive={toggleEmployeeArchive}
          employeeTotalCount={employeeTotalCount}
          employeePageSize={EMPLOYEE_PAGE_SIZE}
          employeeDialog={employeeDialog}
          closeEmployeeDialog={closeEmployeeDialog}
          employeeDialogErrors={employeeDialogErrors}
          setEmployeeDialog={setEmployeeDialog}
          setEmployeeDialogErrors={setEmployeeDialogErrors}
          activeRoleOptions={activeRoleOptions}
          statusOptions={statusOptions}
          saveEmployeeDialog={saveEmployeeDialog}
        />
      ) : null}

      {activeSection === 'security' ? (
        <SettingsSecuritySection
          securityPolicies={settings.securityPolicies}
          setSettings={setSettings}
          securityNumericFields={SECURITY_NUMERIC_FIELDS}
          securityBooleanFields={SECURITY_BOOLEAN_FIELDS}
          saveSecurity={saveSecurity}
          resetSecurity={resetSecurity}
          resetSecurityToDefault={resetSecurityToDefault}
          status={status}
        />
      ) : null}

      {activeSection === 'audit' ? (
        <SettingsAuditSection auditLogs={settings.auditLogs} formatDateTime={formatDateTime} />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(employeeResetTarget)}
        title="Reset employee password?"
        description={
          employeeResetTarget
            ? `Reset password for "${employeeResetTarget.displayName}" (${employeeResetTarget.email}) and issue a new temporary password?`
            : ''
        }
        confirmLabel="Reset Password"
        onCancel={() => setEmployeeResetTarget(null)}
        onConfirm={confirmResetEmployeePassword}
      />

      <ConfirmDialog
        isOpen={Boolean(employeeActionTarget)}
        title={employeeActionTarget?.nextStatus === 'archived' ? 'Archive employee?' : 'Restore employee?'}
        description={
          employeeActionTarget
            ? `"${employeeActionTarget.displayName}" will be moved to ${employeeActionTarget.nextStatus === 'archived' ? 'Archived' : 'Active'} state.`
            : ''
        }
        confirmLabel={employeeActionTarget?.nextStatus === 'archived' ? 'Archive' : 'Restore'}
        onCancel={() => setEmployeeActionTarget(null)}
        onConfirm={confirmToggleEmployeeArchive}
      />

      <RemindDialog
        isOpen={employeeActionRemind.isOpen}
        title={employeeActionRemind.title}
        description={employeeActionRemind.description}
        ackLabel="OK"
        onAcknowledge={() =>
          setEmployeeActionRemind({ isOpen: false, title: '', description: '' })
        }
      />

      <RolePermissionRadarDialog
        isOpen={roleRadarDialog.isOpen}
        role={roleForRadarDialog}
        resources={SETTINGS_RESOURCES}
        actions={SETTINGS_ACTIONS}
        hasPermission={hasPermission}
        onClose={() => setRoleRadarDialog({ isOpen: false, roleId: '' })}
      />

      <CredentialsDialog
        isOpen={credentialsDialogOpen}
        title="Temporary Passwords Issued"
        description="Share these temporary passwords securely. Users must reset password after login."
        credentials={issuedCredentials}
        copiedKey={copiedCredentialKey}
        onCopy={copyText}
        onCopyAll={copyAllCredentials}
        onClose={() => {
          setCredentialsDialogOpen(false)
          setCopiedCredentialKey('')
        }}
      />
    </section>
  )
}

export default SettingsManagerPage
