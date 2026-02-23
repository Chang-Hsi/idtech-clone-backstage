import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
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
  uploadBackstageSettingsImage,
  updateBackstageSettingsEmployees,
  updateBackstageSettingsPassword,
  updateBackstageSettingsProfile,
  updateBackstageSettingsRoles,
  updateBackstageSettingsSecurityPolicies,
} from '../../../api/backstageSettingsApi'
import { fetchBackstageCompanyCareers } from '../../../api/backstageCompanyCareersApi'
import { formatDateTime } from '../../../utils/formatters'
import { buildSettingsEmployeesWritePayload } from '../../../utils/payloadNormalizers'

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
  employeeFilters: {
    regions: [],
    careersByRegion: {},
  },
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
const DEFAULT_EMPLOYEE_REGION_CODE = 'tw'
const DEFAULT_EMPLOYEE_CAREER_TITLE = 'Senior SRE Engineer'

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
  const [avatarUploadError, setAvatarUploadError] = useState('')
  const [avatarInputMode, setAvatarInputMode] = useState('url')
  const [avatarUploadFile, setAvatarUploadFile] = useState(null)
  const [avatarUploadPreviewUrl, setAvatarUploadPreviewUrl] = useState('')
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
  const [employeeRegionFilter, setEmployeeRegionFilter] = useState('all')
  const [employeeCareerFilter, setEmployeeCareerFilter] = useState('all')
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
    regionCode: DEFAULT_EMPLOYEE_REGION_CODE,
    careerTitle: DEFAULT_EMPLOYEE_CAREER_TITLE,
  })
  const [employeeDialogErrors, setEmployeeDialogErrors] = useState({
    displayName: '',
    email: '',
    roleId: '',
    regionCode: '',
    careerTitle: '',
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
  const profileAvatarUrl =
    avatarInputMode === 'upload' && avatarUploadPreviewUrl
      ? avatarUploadPreviewUrl
      : String(settings.profile?.avatarUrl ?? '').trim()

  useEffect(() => {
    return () => {
      if (avatarUploadPreviewUrl) {
        window.URL.revokeObjectURL(avatarUploadPreviewUrl)
      }
    }
  }, [avatarUploadPreviewUrl])

  const load = async ({ startLoading = true } = {}) => {
    if (!isMountedRef.current) return
    if (startLoading) {
      setStatus('loading')
      setErrorMessage('')
    }

    try {
      const [payload, careersPayload] = await Promise.all([
        fetchBackstageSettings(),
        fetchBackstageCompanyCareers(),
      ])
      if (!isMountedRef.current) return
      const responseSettings = payload?.data?.settings ?? emptySettings
      const careersPage = careersPayload?.data?.careersPage ?? {}
      const careersTabs = Array.isArray(careersPage?.tabs) ? careersPage.tabs : []
      const careersJobs = Array.isArray(careersPage?.jobs) ? careersPage.jobs : []
      const normalizedRegionCodeSet = new Set(
        careersTabs
          .map((tab) => String(tab?.key ?? '').trim().toLowerCase())
          .filter((key) => key && key !== 'all'),
      )
      const regionFallback = normalizedRegionCodeSet.has(DEFAULT_EMPLOYEE_REGION_CODE)
        ? DEFAULT_EMPLOYEE_REGION_CODE
        : (Array.from(normalizedRegionCodeSet)[0] ?? DEFAULT_EMPLOYEE_REGION_CODE)
      const careersByRegion = careersJobs.reduce((acc, job) => {
        const code = String(job?.countryCode ?? '').trim().toLowerCase()
        const title = String(job?.title ?? '').trim()
        if (!code || !title) return acc
        if (!acc[code]) acc[code] = new Set()
        acc[code].add(title)
        return acc
      }, {})
      const employeeDefaults = (Array.isArray(responseSettings?.employees) ? responseSettings.employees : []).map((employee) => {
        const normalizedRegionCode = String(employee?.regionCode ?? '').trim().toLowerCase()
        const regionCode = normalizedRegionCodeSet.has(normalizedRegionCode) ? normalizedRegionCode : regionFallback
        const regionCareerSet = careersByRegion[regionCode] ?? new Set()
        const preferredCareer = String(employee?.careerTitle ?? '').trim()
        const fallbackCareer = regionCareerSet.has(DEFAULT_EMPLOYEE_CAREER_TITLE)
          ? DEFAULT_EMPLOYEE_CAREER_TITLE
          : (Array.from(regionCareerSet)[0] ?? DEFAULT_EMPLOYEE_CAREER_TITLE)
        return {
          ...employee,
          regionCode,
          careerTitle: regionCareerSet.has(preferredCareer) ? preferredCareer : fallbackCareer,
        }
      })
      setSettings({
        ...emptySettings,
        ...responseSettings,
        employees: employeeDefaults,
        careersPage: {
          tabs: careersTabs,
          jobs: careersJobs,
        },
        auditLogs: [],
      })
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

  const handleAvatarInputModeChange = (mode) => {
    if (mode === avatarInputMode) return
    setAvatarInputMode(mode)
    setAvatarLoadError(false)
    if (mode === 'url') {
      if (avatarUploadPreviewUrl) {
        window.URL.revokeObjectURL(avatarUploadPreviewUrl)
      }
      setAvatarUploadPreviewUrl('')
      setAvatarUploadFile(null)
      setAvatarUploadError('')
      return
    }
    setAvatarUrlError('')
    setSettings((prev) => ({ ...prev, profile: { ...prev.profile, avatarUrl: '' } }))
  }

  const handleAvatarUploadFileChange = (file) => {
    if (avatarUploadPreviewUrl) {
      window.URL.revokeObjectURL(avatarUploadPreviewUrl)
    }
    if (!file) {
      setAvatarUploadFile(null)
      setAvatarUploadPreviewUrl('')
      setAvatarUploadError('')
      return
    }
    const nextPreviewUrl = window.URL.createObjectURL(file)
    setAvatarUploadFile(file)
    setAvatarUploadPreviewUrl(nextPreviewUrl)
    setAvatarUploadError('')
    setAvatarLoadError(false)
  }

  const clearAvatarUploadSelection = () => {
    if (avatarUploadPreviewUrl) {
      window.URL.revokeObjectURL(avatarUploadPreviewUrl)
    }
    setAvatarUploadPreviewUrl('')
    setAvatarUploadFile(null)
    setAvatarUploadError('')
  }

  const saveProfile = async () => {
    const avatarValue = String(settings.profile.avatarUrl ?? '').trim()
    if (avatarInputMode === 'url' && !isValidHttpUrl(avatarValue)) {
      setAvatarUrlError('Avatar URL must start with http:// or https://')
      return
    }
    if (avatarInputMode === 'upload' && !avatarUploadFile) {
      setAvatarUploadError('Please choose an image file before saving profile.')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')
    try {
      let resolvedAvatarUrl = avatarValue
      if (avatarInputMode === 'upload' && avatarUploadFile) {
        const uploadResponse = await uploadBackstageSettingsImage({
          file: avatarUploadFile,
          category: 'profile',
          updatedBy: editorId,
        })
        resolvedAvatarUrl = String(uploadResponse?.data?.url ?? '').trim()
        if (!resolvedAvatarUrl) {
          throw new Error('Image upload did not return a valid URL.')
        }
      }
      await updateBackstageSettingsProfile({
        displayName: settings.profile.displayName,
        avatarUrl: resolvedAvatarUrl,
        updatedBy: editorId,
      })
      await load()
      if (!isMountedRef.current) return
      if (avatarInputMode === 'upload') {
        clearAvatarUploadSelection()
        setAvatarInputMode('url')
      }
      setSuccessMessage('Profile settings saved.')
      setStatus('success')
    } catch (error) {
      if (!isMountedRef.current) return
      if (avatarInputMode === 'upload') {
        setAvatarUploadError(error?.message || 'Unable to upload avatar image.')
      }
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
      const payload = buildSettingsEmployeesWritePayload({
        employees: nextEmployees,
        updatedBy: editorId,
      })
      const response = await updateBackstageSettingsEmployees(payload)
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
  const careersPage = settings?.careersPage
  const settingsEmployeeFilters = settings?.employeeFilters
  const employeeRegionOptions = useMemo(() => {
    const tabs = Array.isArray(careersPage?.tabs) ? careersPage.tabs : []
    return tabs
      .filter((tab) => String(tab?.key ?? '').trim().toLowerCase() !== 'all')
      .map((tab) => ({
        value: String(tab?.key ?? '').trim().toLowerCase(),
        label: String(tab?.label ?? '').trim() || String(tab?.key ?? '').trim().toUpperCase(),
      }))
      .filter((option) => option.value)
  }, [careersPage])
  const employeeRegionFilterOptions = useMemo(() => {
    const rawOptions = Array.isArray(settingsEmployeeFilters?.regions) ? settingsEmployeeFilters.regions : []
    const fromSettings = rawOptions
      .map((option) => ({
        value: String(option?.value ?? '').trim().toLowerCase(),
        label: String(option?.label ?? '').trim(),
      }))
      .filter((option) => option.value)
    if (fromSettings.length > 0) return fromSettings
    return employeeRegionOptions
  }, [settingsEmployeeFilters, employeeRegionOptions])
  const employeeCareerOptionsByRegion = useMemo(() => {
    const jobs = Array.isArray(careersPage?.jobs) ? careersPage.jobs : []
    return jobs.reduce((acc, job) => {
      const regionCode = String(job?.countryCode ?? '').trim().toLowerCase()
      const title = String(job?.title ?? '').trim()
      if (!regionCode || !title) return acc
      if (!acc[regionCode]) acc[regionCode] = new Set()
      acc[regionCode].add(title)
      return acc
    }, {})
  }, [careersPage])
  const employeeCareerFilterOptionsByRegion = useMemo(() => {
    const fromSettings = settingsEmployeeFilters?.careersByRegion
    if (!fromSettings || typeof fromSettings !== 'object') return {}
    return Object.entries(fromSettings).reduce((acc, [regionCode, titles]) => {
      const normalizedRegionCode = String(regionCode ?? '').trim().toLowerCase()
      if (!normalizedRegionCode) return acc
      const titleSet = new Set(
        (Array.isArray(titles) ? titles : []).map((title) => String(title ?? '').trim()).filter(Boolean),
      )
      if (titleSet.size > 0) {
        acc[normalizedRegionCode] = titleSet
      }
      return acc
    }, {})
  }, [settingsEmployeeFilters])
  const employeeCareerFilterOptions = useMemo(() => {
    const sourceMap = Object.keys(employeeCareerFilterOptionsByRegion).length > 0
      ? employeeCareerFilterOptionsByRegion
      : employeeCareerOptionsByRegion
    if (employeeRegionFilter === 'all') {
      const allCareers = new Set()
      Object.values(sourceMap).forEach((titles) => {
        ;(titles ?? []).forEach((title) => {
          const normalizedTitle = String(title ?? '').trim()
          if (normalizedTitle) allCareers.add(normalizedTitle)
        })
      })
      return Array.from(allCareers).map((title) => ({ value: title, label: title }))
    }
    const selectedCareers = sourceMap[employeeRegionFilter] ?? new Set()
    return Array.from(selectedCareers).map((title) => ({ value: title, label: title }))
  }, [employeeCareerFilterOptionsByRegion, employeeCareerOptionsByRegion, employeeRegionFilter])
  const selectedRegionCode = String(employeeDialog.regionCode ?? '').trim().toLowerCase()
  const employeeCareerOptions = useMemo(() => {
    const careerSet = employeeCareerOptionsByRegion[selectedRegionCode] ?? new Set()
    return Array.from(careerSet).map((title) => ({ value: title, label: title }))
  }, [employeeCareerOptionsByRegion, selectedRegionCode])
  const filteredEmployees = useMemo(() => {
    const keyword = employeeQuery.trim().toLowerCase()
    return (settings.employees ?? [])
      .filter((employee) => {
        if (employeeStatusFilter !== 'all' && employee.status !== employeeStatusFilter) return false
        if (employeeRoleFilter !== 'all' && !employee.roleIds.includes(employeeRoleFilter)) return false
        if (employeeRegionFilter !== 'all' && String(employee.regionCode ?? '').trim().toLowerCase() !== employeeRegionFilter) return false
        if (employeeCareerFilter !== 'all' && String(employee.careerTitle ?? '').trim() !== employeeCareerFilter) return false
        if (!keyword) return true
        const haystack = `${employee.displayName} ${employee.email} ${employee.id} ${employee.regionCode ?? ''} ${employee.careerTitle ?? ''}`.toLowerCase()
        return haystack.includes(keyword)
      })
      .sort((a, b) => {
        const aTime = Number.isFinite(Date.parse(a?.lastLoginAt ?? '')) ? Date.parse(a.lastLoginAt) : 0
        const bTime = Number.isFinite(Date.parse(b?.lastLoginAt ?? '')) ? Date.parse(b.lastLoginAt) : 0
        return bTime - aTime || String(a.displayName).localeCompare(String(b.displayName))
      })
  }, [settings.employees, employeeQuery, employeeStatusFilter, employeeRoleFilter, employeeRegionFilter, employeeCareerFilter])
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
    const defaultRegionCode = employeeRegionOptions.find((item) => item.value === DEFAULT_EMPLOYEE_REGION_CODE)?.value
      ?? employeeRegionOptions[0]?.value
      ?? DEFAULT_EMPLOYEE_REGION_CODE
    const defaultCareerSet = employeeCareerOptionsByRegion[defaultRegionCode] ?? new Set()
    const defaultCareerTitle = defaultCareerSet.has(DEFAULT_EMPLOYEE_CAREER_TITLE)
      ? DEFAULT_EMPLOYEE_CAREER_TITLE
      : (Array.from(defaultCareerSet)[0] ?? DEFAULT_EMPLOYEE_CAREER_TITLE)
    setEmployeeDialogErrors({ displayName: '', email: '', roleId: '', regionCode: '', careerTitle: '' })
    setEmployeeDialog({
      isOpen: true,
      mode: 'create',
      targetId: '',
      displayName: '',
      email: '',
      roleId: activeRoleOptions[0]?.value ?? '',
      status: 'active',
      regionCode: defaultRegionCode,
      careerTitle: defaultCareerTitle,
    })
  }

  const openEditEmployeeDialog = (employee) => {
    const regionFromEmployee = String(employee?.regionCode ?? '').trim().toLowerCase()
    const safeRegionCode = employeeRegionOptions.some((option) => option.value === regionFromEmployee)
      ? regionFromEmployee
      : (employeeRegionOptions.find((item) => item.value === DEFAULT_EMPLOYEE_REGION_CODE)?.value
        ?? employeeRegionOptions[0]?.value
        ?? DEFAULT_EMPLOYEE_REGION_CODE)
    const editCareerSet = employeeCareerOptionsByRegion[safeRegionCode] ?? new Set()
    const employeeCareerTitle = String(employee?.careerTitle ?? '').trim()
    const safeCareerTitle = editCareerSet.has(employeeCareerTitle)
      ? employeeCareerTitle
      : (editCareerSet.has(DEFAULT_EMPLOYEE_CAREER_TITLE)
        ? DEFAULT_EMPLOYEE_CAREER_TITLE
        : (Array.from(editCareerSet)[0] ?? DEFAULT_EMPLOYEE_CAREER_TITLE))
    setEmployeeDialogErrors({ displayName: '', email: '', roleId: '', regionCode: '', careerTitle: '' })
    setEmployeeDialog({
      isOpen: true,
      mode: 'edit',
      targetId: employee.id,
      displayName: employee.displayName ?? '',
      email: employee.email ?? '',
      roleId: employee.roleIds?.[0] ?? '',
      status: employee.status === 'archived' ? 'archived' : 'active',
      regionCode: safeRegionCode,
      careerTitle: safeCareerTitle,
    })
  }

  const closeEmployeeDialog = () => {
    setEmployeeDialogErrors({ displayName: '', email: '', roleId: '', regionCode: '', careerTitle: '' })
    setEmployeeDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const validateEmployeeDialog = () => {
    const displayName = String(employeeDialog.displayName ?? '').trim()
    const email = String(employeeDialog.email ?? '').trim()
    const roleId = String(employeeDialog.roleId ?? '').trim()
    const regionCode = String(employeeDialog.regionCode ?? '').trim().toLowerCase()
    const careerTitle = String(employeeDialog.careerTitle ?? '').trim()
    const careerSet = employeeCareerOptionsByRegion[regionCode] ?? new Set()

    const nextErrors = {
      displayName: displayName ? '' : 'Display name is required.',
      email: '',
      roleId: roleId ? '' : 'Role is required.',
      regionCode: regionCode ? '' : 'Region is required.',
      careerTitle: '',
    }
    if (!regionCode) {
      nextErrors.careerTitle = 'Select region first.'
    } else if (!careerTitle) {
      nextErrors.careerTitle = 'Career is required.'
    } else if (!careerSet.has(careerTitle)) {
      nextErrors.careerTitle = 'Selected career is not available in this region.'
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
    return !nextErrors.displayName && !nextErrors.email && !nextErrors.roleId && !nextErrors.regionCode && !nextErrors.careerTitle
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
      regionCode: String(employeeDialog.regionCode ?? '').trim().toLowerCase(),
      careerTitle: String(employeeDialog.careerTitle ?? '').trim(),
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
                  regionCode: nextEmployee.regionCode,
                  careerTitle: nextEmployee.careerTitle,
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
          avatarUploadError={avatarUploadError}
          avatarInputMode={avatarInputMode}
          setAvatarInputMode={handleAvatarInputModeChange}
          avatarUploadFile={avatarUploadFile}
          handleAvatarUploadFileChange={handleAvatarUploadFileChange}
          clearAvatarUploadSelection={clearAvatarUploadSelection}
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
          employeeRegionFilter={employeeRegionFilter}
          employeeRegionFilterOptions={employeeRegionFilterOptions}
          setEmployeeRegionFilter={setEmployeeRegionFilter}
          employeeCareerFilter={employeeCareerFilter}
          employeeCareerFilterOptions={employeeCareerFilterOptions}
          setEmployeeCareerFilter={setEmployeeCareerFilter}
          employeeStatusFilter={employeeStatusFilter}
          setEmployeeStatusFilter={setEmployeeStatusFilter}
          setEmployeePage={setEmployeePage}
          pagedEmployees={pagedEmployees}
          employeeOffset={employeeOffset}
          employeeRoleMap={employeeRoleMap}
          employeeRegionOptions={employeeRegionOptions}
          employeeCareerOptions={employeeCareerOptions}
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
