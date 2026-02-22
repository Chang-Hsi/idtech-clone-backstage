import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ClockIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider'
import DropdownSelect from '../../common/DropdownSelect'
import FormField from '../../common/FormField'
import Pagination from '../../common/Pagination'
import StatusMessage from '../../common/StatusMessage'
import CredentialsDialog from '../../dialog/CredentialsDialog'
import ConfirmDialog from '../../dialog/ConfirmDialog'
import RemindDialog from '../../dialog/RemindDialog'
import RolePermissionRadarDialog from '../../dialog/RolePermissionRadarDialog'
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
      setSuccessMessage('Security policies updated.')
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      setErrorMessage(error?.message || 'Unable to update security policies.')
      setStatus('error')
    }
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
                  <p className="mt-1 text-xs text-slate-500">
                    Last sign in {formatDateTime(currentEmployee?.lastLoginAt)}
                  </p>
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
                  {[...SETTINGS_ACTIONS, { key: 'admin', label: 'Full Access' }].map((action) => (
                    <div key={action.key} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
                      <p className="text-[11px] uppercase text-slate-500">{action.label}</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {permissionSummary.counters[action.key] ?? 0}
                      </p>
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
                        <p className="text-sm font-medium text-slate-900">
                          {formatProfileActivityLabel(log.action)}
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No activity yet.</p>
                  )}
                </div>
                {profileActivityTotalCount > PROFILE_ACTIVITY_PAGE_SIZE ? (
                  <Pagination
                    totalCount={profileActivityTotalCount}
                    limit={PROFILE_ACTIVITY_PAGE_SIZE}
                    offset={normalizedProfileActivityOffset}
                    onPageChange={(page) => setProfileActivityPage(page)}
                  />
                ) : null}
              </section>
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === 'roles' ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Roles & Permissions</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextRole = {
                    id: `role-${Date.now()}`,
                    name: 'New Role',
                    description: '',
                    status: 'active',
                    permissions: ['pages:read'],
                  }
                  setSettings((prev) => ({ ...prev, roles: [...prev.roles, nextRole] }))
                  setSelectedRoleId(nextRole.id)
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <PlusIcon className="h-4 w-4" />
                Add Role
              </button>
              <button
                type="button"
                onClick={saveRoles}
                disabled={status === 'saving'}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Save Roles
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {settings.roles.length === 0 ? (
                <p className="text-sm text-slate-500">No roles yet. Create one to start permission setup.</p>
              ) : null}
              {settings.roles.map((role) => (
                <div key={role.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full rounded-md border px-3 py-2 pr-10 text-left text-sm ${
                      selectedRole?.id === role.id
                        ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium">{role.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{role.description || 'No description'}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getRoleTagClass(role)}`}>
                      {role.status}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setRoleRadarDialog({ isOpen: true, roleId: role.id })
                    }}
                    className="absolute right-2 top-2 rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                    aria-label={`Open ${role.name} radar chart`}
                  >
                    <PresentationChartLineIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </aside>

            {selectedRole ? (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                    enforced
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_180px_40px]">
                  <div className="space-y-2">
                    <input
                      value={selectedRole.name}
                      onChange={(event) => updateSelectedRole((role) => ({ ...role, name: event.target.value }))}
                      placeholder="Role name"
                      className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                    />
                    <textarea
                      value={selectedRole.description}
                      onChange={(event) => updateSelectedRole((role) => ({ ...role, description: event.target.value }))}
                      rows={2}
                      placeholder="Role description"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>

                  <DropdownSelect
                    value={selectedRole.status}
                    options={statusOptions}
                    onChange={(nextValue) => updateSelectedRole((role) => ({ ...role, status: nextValue || 'active' }))}
                  />

                  <button
                    type="button"
                    onClick={removeSelectedRole}
                    className="mb-auto pt-2 text-slate-500 hover:bg-slate-50"
                    aria-label="remove role"
                  >
                    <TrashIcon className="mx-auto h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-auto rounded-md border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="w-[260px] px-3 py-2 text-left">Resource</th>
                        <th className="w-[120px] px-3 py-2 text-left">Group</th>
                        {SETTINGS_ACTIONS.map((action) => (
                          <th key={action.key} className="px-3 py-2 text-center uppercase">
                            {action.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center">Full Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SETTINGS_RESOURCES.map((resource) => {
                        const fullAccessChecked = hasPermission(selectedRole.permissions, resource.key, 'admin')

                        return (
                          <tr key={resource.key} className="border-t border-slate-200">
                            <td className="px-3 py-2 font-medium text-slate-700">
                              <div className="flex items-center gap-2">
                                <span>{resource.label}</span>
                                <span
                                  className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                    resource.state === 'enforced'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {resource.state}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-slate-500">{resource.group}</td>
                            {SETTINGS_ACTIONS.map((action) => {
                              const checked = hasPermission(selectedRole.permissions, resource.key, action.key)
                              return (
                                <td key={`${resource.key}:${action.key}`} className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={fullAccessChecked}
                                    onChange={(event) =>
                                      updateSelectedRole((role) => ({
                                        ...role,
                                        permissions: togglePermission(
                                          role.permissions,
                                          resource.key,
                                          action.key,
                                          event.target.checked,
                                        ),
                                      }))
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled"
                                  />
                                </td>
                              )
                            })}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={fullAccessChecked}
                                onChange={(event) =>
                                  updateSelectedRole((role) => ({
                                    ...role,
                                    permissions: togglePermission(
                                      role.permissions,
                                      resource.key,
                                      'admin',
                                      event.target.checked,
                                    ),
                                  }))
                                }
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Select a role from the left panel.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeSection === 'employees' ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Employees</h2>
            <button
              type="button"
              onClick={openCreateEmployeeDialog}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <PlusIcon className="h-4 w-4" />
              Add Employee
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <form onSubmit={handleEmployeeSearchSubmit} className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_180px_180px_96px]">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={employeeQueryInput}
                  onChange={(event) => setEmployeeQueryInput(event.target.value)}
                  placeholder="Search by name, email, or employee id"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <DropdownSelect
                value={employeeRoleFilter}
                options={[{ value: 'all', label: 'All Roles' }, ...employeeRoleOptions]}
                onChange={(nextValue) => {
                  setEmployeeRoleFilter(nextValue || 'all')
                  setEmployeePage(1)
                }}
              />
              <DropdownSelect
                value={employeeStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
                onChange={(nextValue) => {
                  setEmployeeStatusFilter(nextValue || 'all')
                  setEmployeePage(1)
                }}
              />
              <button
                type="submit"
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-100"
              >
                Search
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] table-auto border-collapse text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[64px] px-4 py-3">ID</th>
                    <th className="w-[180px] px-4 py-3">Name</th>
                    <th className="w-[220px] px-4 py-3">Email</th>
                    <th className="w-[220px] px-4 py-3">Employee ID</th>
                    <th className="w-[180px] px-4 py-3">Role</th>
                    <th className="w-[140px] px-4 py-3">Status</th>
                    <th className="w-[180px] px-4 py-3">Last Login</th>
                    <th className="w-[260px] pr-8 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    pagedEmployees.map((employee, index) => {
                      const primaryRoleId = employee.roleIds?.[0] ?? ''
                      const primaryRole = employeeRoleMap.get(primaryRoleId)
                      return (
                        <tr key={employee.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 align-middle text-slate-500">{employeeOffset + index + 1}</td>
                          <td className="px-4 py-3 align-middle">
                            <p className="font-medium text-slate-900">{employee.displayName || '-'}</p>
                            {employee.forcePasswordReset ? (
                              <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                Must reset password
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 align-middle text-slate-600">{employee.email || '-'}</td>
                          <td className="px-4 py-3 align-middle text-slate-600">{employee.id}</td>
                          <td className="px-4 py-3 align-middle text-slate-600">{primaryRole?.name ?? '-'}</td>
                          <td className="px-4 py-3 align-middle">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                employee.status === 'archived'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {employee.status === 'archived' ? 'Archived' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle text-slate-600">
                            {formatDateTime(employee.lastLoginAt)}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <div className="group relative">
                                <button
                                  type="button"
                                  onClick={() => openEditEmployeeDialog(employee)}
                                  aria-label="Edit"
                                  className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                                  Edit
                                </span>
                              </div>

                              <div className="group relative">
                                <button
                                  type="button"
                                  onClick={() => requestResetEmployeePassword(employee)}
                                  disabled={status === 'saving'}
                                  aria-label="Reset Password"
                                  className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
                                >
                                  <KeyIcon className="h-4 w-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                                  Reset Password
                                </span>
                              </div>

                              <div className="group relative">
                                <button
                                  type="button"
                                  onClick={() => toggleEmployeeArchive(employee)}
                                  aria-label={employee.status === 'archived' ? 'Restore' : 'Archive'}
                                  className={`rounded-md p-1.5 transition ${
                                    employee.status === 'archived'
                                      ? 'text-emerald-700 hover:bg-emerald-50'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  {employee.status === 'archived' ? (
                                    <ArrowPathIcon className="h-4 w-4" />
                                  ) : (
                                    <ArchiveBoxIcon className="h-4 w-4" />
                                  )}
                                </button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                                  {employee.status === 'archived' ? 'Restore' : 'Archive'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              totalCount={employeeTotalCount}
              limit={EMPLOYEE_PAGE_SIZE}
              offset={employeeOffset}
              onPageChange={(page) => setEmployeePage(page)}
            />
          </div>

          {employeeDialog.isOpen ? (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/55 p-4">
              <div className="fade-up-in z-[301] w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {employeeDialog.mode === 'create' ? 'Add Employee' : 'Edit Employee'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeEmployeeDialog}
                    className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                    aria-label="Close employee dialog"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField label="Display Name" required error={employeeDialogErrors.displayName}>
                    <input
                      value={employeeDialog.displayName}
                      onChange={(event) => {
                        setEmployeeDialog((prev) => ({ ...prev, displayName: event.target.value }))
                        if (employeeDialogErrors.displayName) {
                          setEmployeeDialogErrors((prev) => ({ ...prev, displayName: '' }))
                        }
                      }}
                      placeholder="Enter display name"
                      className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                    />
                  </FormField>
                  <FormField label="Email" required error={employeeDialogErrors.email}>
                    <input
                      value={employeeDialog.email}
                      onChange={(event) => {
                        setEmployeeDialog((prev) => ({ ...prev, email: event.target.value }))
                        if (employeeDialogErrors.email) {
                          setEmployeeDialogErrors((prev) => ({ ...prev, email: '' }))
                        }
                      }}
                      placeholder="name@company.com"
                      className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                    />
                  </FormField>
                  <FormField label="Role" required error={employeeDialogErrors.roleId}>
                    <DropdownSelect
                      value={employeeDialog.roleId}
                      options={activeRoleOptions}
                      onChange={(nextValue) => {
                        setEmployeeDialog((prev) => ({ ...prev, roleId: nextValue || '' }))
                        if (employeeDialogErrors.roleId) {
                          setEmployeeDialogErrors((prev) => ({ ...prev, roleId: '' }))
                        }
                      }}
                      placeholder="Select role"
                    />
                  </FormField>
                  <FormField label="Status" required>
                    <DropdownSelect
                      value={employeeDialog.status}
                      options={statusOptions}
                      onChange={(nextValue) =>
                        setEmployeeDialog((prev) => ({ ...prev, status: nextValue || 'active' }))
                      }
                    />
                  </FormField>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEmployeeDialog}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEmployeeDialog}
                    disabled={status === 'saving'}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSection === 'security' ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Security Policies</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(settings.securityPolicies).map(([key, value]) => {
              const isBool = typeof value === 'boolean'
              return (
                <FormField key={key} label={key}>
                  {isBool ? (
                    <label className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            securityPolicies: {
                              ...prev.securityPolicies,
                              [key]: event.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      Enabled
                    </label>
                  ) : (
                    <input
                      type="number"
                      value={value}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          securityPolicies: {
                            ...prev.securityPolicies,
                            [key]: Number(event.target.value),
                          },
                        }))
                      }
                      className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                    />
                  )}
                </FormField>
              )
            })}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveSecurity}
              disabled={status === 'saving'}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Save Security Policies
            </button>
          </div>
        </section>
      ) : null}

      {activeSection === 'audit' ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Audit Logs</h2>
          <div className="space-y-2">
            {settings.auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No audit logs yet.</p>
            ) : (
              settings.auditLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-900">{log.action}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatDateTime(log.createdAt)} | actor: {log.actorId || '-'} | target: {log.targetType}:{log.targetId}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
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
