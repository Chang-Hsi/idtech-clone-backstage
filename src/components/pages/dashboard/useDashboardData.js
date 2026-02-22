import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchBackstageDashboardTestingHealth, triggerBackstageDashboardTestingHealthRefresh } from '../../../api/backstageDashboardApi'
import { fetchBackstageProducts } from '../../../api/backstageContentProductsApi'
import { fetchBackstageCollections } from '../../../api/backstageContentCollectionsApi'
import { fetchBackstageUseCases } from '../../../api/backstageContentUseCasesApi'
import { fetchBackstageResources } from '../../../api/backstageContentResourcesApi'
import { fetchBackstageCompanyCards } from '../../../api/backstageCompanyCardsApi'
import { fetchBackstageCompanyCareers } from '../../../api/backstageCompanyCareersApi'
import { fetchBackstageSettings, fetchBackstageSettingsAuditLogs } from '../../../api/backstageSettingsApi'
import { fetchBackstageSeoTargets } from '../../../api/backstageSeoApi'

const WORLD_MAP_PATH = `${import.meta.env.BASE_URL}maps/countries.geojson`

const REGION_NAME_FALLBACK = {
  tw: 'Taiwan',
  jp: 'Japan',
  us: 'USA',
  de: 'Germany',
  id: 'Indonesia',
  ca: 'Canada',
  uy: 'Uruguay',
}

const PERMISSION_GROUPS = [
  { label: 'Content', resources: ['content.products', 'content.collections', 'content.useCases', 'content.resources', 'content.company'] },
  { label: 'SEO', resources: ['seo'] },
  { label: 'Profile', resources: ['settings.profile'] },
  { label: 'RBAC', resources: ['settings.rbac'] },
  { label: 'Employees', resources: ['settings.employees'] },
  { label: 'Security', resources: ['settings.security'] },
  { label: 'Audit', resources: ['settings.audit'] },
]

const ACTIONS = ['read', 'write', 'archive', 'publish', 'admin']

const toLower = (value) => String(value ?? '').trim().toLowerCase()

const toShortTime = (value) => {
  const timestamp = Date.parse(String(value ?? ''))
  if (!Number.isFinite(timestamp)) return '--'
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

const toActionLabel = (action) =>
  String(action ?? '')
    .split('.')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' / ') || 'Unknown Action'

const hasPermission = (allPermissions, resource, action) => {
  const list = new Set((Array.isArray(allPermissions) ? allPermissions : []).map((item) => String(item).trim()).filter(Boolean))
  if (list.has('*:*')) return true
  if (list.has(`${resource}:*`) || list.has(`${resource}:admin`)) return true
  if (list.has(`${resource}:${action}`)) return true
  if (list.has(`*:${action}`) || list.has('*:admin')) return true
  return false
}

const buildPermissionRadarData = (permissions) => {
  return PERMISSION_GROUPS.map((group) => {
    const total = group.resources.length * ACTIONS.length
    if (total === 0) return { group: group.label, value: 0, granted: 0, total: 0 }

    const granted = group.resources.reduce((sum, resource) => {
      return sum + ACTIONS.reduce((actionSum, action) => actionSum + (hasPermission(permissions, resource, action) ? 1 : 0), 0)
    }, 0)

    return {
      group: group.label,
      value: Math.round((granted / total) * 100),
      granted,
      total,
    }
  })
}

const countByStatus = (items) => {
  const active = items.filter((item) => item?.status !== 'archived').length
  const archived = items.filter((item) => item?.status === 'archived').length
  return { active, archived }
}

const getCareerJobStatus = (job) => {
  const explicitStatus = String(job?.status ?? '').trim().toLowerCase()
  if (explicitStatus === 'active' || explicitStatus === 'archived') return explicitStatus
  // Careers payload currently uses `isOpen`; treat closed jobs as archived for dashboard analytics.
  if (job?.isOpen === false) return 'archived'
  return 'active'
}

const toCountryName = (regionCode, regionLabel) => {
  const fallback = REGION_NAME_FALLBACK[toLower(regionCode)]
  const label = String(regionLabel ?? '').trim()
  if (fallback) return fallback
  if (!label) return ''
  if (label.toLowerCase() === 'taiwan') return 'Taiwan'
  if (label.toLowerCase() === 'united states') return 'USA'
  if (label.toLowerCase() === 'united states of america') return 'USA'
  return label
}

export default function useDashboardData({ user, permissions }) {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isTriggering, setIsTriggering] = useState(false)

  const [updatedAt, setUpdatedAt] = useState(null)
  const [testingHealth, setTestingHealth] = useState(null)
  const [triggerInfo, setTriggerInfo] = useState(null)

  const [kpiCards, setKpiCards] = useState([])
  const [contentMixData, setContentMixData] = useState([])
  const [contentStatusData, setContentStatusData] = useState([])

  const [geoFeatures, setGeoFeatures] = useState([])
  const [geoCountryData, setGeoCountryData] = useState([])
  const [regions, setRegions] = useState([])
  const [selectedRegionCode, setSelectedRegionCode] = useState('all')
  const [selectedRegionEmployees, setSelectedRegionEmployees] = useState([])

  const [userProfile, setUserProfile] = useState(null)
  const [permissionRadarData, setPermissionRadarData] = useState([])
  const [recentActions, setRecentActions] = useState([])

  const loadDashboard = useCallback(async ({ preserveStatus = false } = {}) => {
    if (!preserveStatus) setStatus('loading')
    setErrorMessage('')

    try {
      const [
        testingPayload,
        productsPayload,
        collectionsPayload,
        useCasesPayload,
        resourcesPayload,
        companyCardsPayload,
        careersPayload,
        settingsPayload,
        auditPayload,
        seoTargetsPayload,
        worldGeoJson,
      ] = await Promise.all([
        fetchBackstageDashboardTestingHealth(),
        fetchBackstageProducts({ limit: 100, offset: 0, status: 'all' }),
        fetchBackstageCollections({ limit: 100, offset: 0, status: 'all' }),
        fetchBackstageUseCases({ limit: 100, offset: 0, status: 'all' }),
        fetchBackstageResources({ limit: 100, offset: 0, status: 'all' }),
        fetchBackstageCompanyCards({ status: 'all', q: '' }),
        fetchBackstageCompanyCareers(),
        fetchBackstageSettings(),
        fetchBackstageSettingsAuditLogs(),
        fetchBackstageSeoTargets({ limit: 200, offset: 0 }),
        fetch(WORLD_MAP_PATH, { cache: 'force-cache' }).then((response) => {
          if (!response.ok) throw new Error('Unable to load world map data.')
          return response.json()
        }),
      ])

      const products = Array.isArray(productsPayload?.data?.items) ? productsPayload.data.items : []
      const collections = Array.isArray(collectionsPayload?.data?.items) ? collectionsPayload.data.items : []
      const useCases = Array.isArray(useCasesPayload?.data?.items) ? useCasesPayload.data.items : []
      const resources = Array.isArray(resourcesPayload?.data?.items) ? resourcesPayload.data.items : []
      const companyCards = Array.isArray(companyCardsPayload?.data?.items) ? companyCardsPayload.data.items : []
      const careersJobs = Array.isArray(careersPayload?.data?.careersPage?.jobs)
        ? careersPayload.data.careersPage.jobs
        : []
      const settings = settingsPayload?.data?.settings ?? {}
      const employees = Array.isArray(settings?.employees) ? settings.employees : []
      const roles = Array.isArray(settings?.roles) ? settings.roles : []
      const regionOptions = Array.isArray(settings?.employeeFilters?.regions)
        ? settings.employeeFilters.regions
        : []
      const seoTargetsTotal = Number(seoTargetsPayload?.data?.total ?? 0)

      setTestingHealth(testingPayload?.testingHealth ?? null)
      setTriggerInfo(testingPayload?.trigger ?? null)
      setUpdatedAt(testingPayload?.updatedAt ?? null)

      const productsStatus = countByStatus(products)
      const collectionsStatus = countByStatus(collections)
      const useCasesStatus = countByStatus(useCases)
      const resourcesStatus = countByStatus(resources)
      const companyStatus = countByStatus(companyCards)
      const careersStatus = {
        active: careersJobs.filter((job) => getCareerJobStatus(job) === 'active').length,
        archived: careersJobs.filter((job) => getCareerJobStatus(job) === 'archived').length,
      }

      const totalManagedContent =
        products.length + collections.length + useCases.length + resources.length + companyCards.length + careersJobs.length
      const archivedTotal =
        productsStatus.archived +
        collectionsStatus.archived +
        useCasesStatus.archived +
        resourcesStatus.archived +
        companyStatus.archived +
        careersStatus.archived

      setKpiCards([
        { title: 'Managed Content', value: totalManagedContent, description: 'All editable entities', to: '/pages/content/products' },
        { title: 'Archived Items', value: archivedTotal, description: 'Needs review or restore', to: '/pages/content/collections' },
        { title: 'SEO Targets', value: seoTargetsTotal, description: 'Global + page-level targets', to: '/seo' },
        { title: 'Employees', value: employees.length, description: 'Backstage accounts', to: '/settings/employees' },
      ])

      setContentMixData([
        {
          name: 'Products',
          active: productsStatus.active,
          archived: productsStatus.archived,
          to: '/pages/content/products',
        },
        {
          name: 'Collections',
          active: collectionsStatus.active,
          archived: collectionsStatus.archived,
          to: '/pages/content/collections',
        },
        {
          name: 'Use Cases',
          active: useCasesStatus.active,
          archived: useCasesStatus.archived,
          to: '/pages/content/use-cases',
        },
        {
          name: 'Resources',
          active: resourcesStatus.active,
          archived: resourcesStatus.archived,
          to: '/pages/content/resources',
        },
        {
          name: 'Company',
          active: companyStatus.active,
          archived: companyStatus.archived,
          to: '/pages/content/company/cards',
        },
        {
          name: 'Careers',
          active: careersStatus.active,
          archived: careersStatus.archived,
          to: '/pages/content/company/careers',
        },
      ])

      setContentStatusData([
        {
          name: 'Active',
          value:
            productsStatus.active +
            collectionsStatus.active +
            useCasesStatus.active +
            resourcesStatus.active +
            companyStatus.active +
            careersStatus.active,
        },
        {
          name: 'Archived',
          value: archivedTotal,
        },
      ])

      const mapFeatures = Array.isArray(worldGeoJson?.features) ? worldGeoJson.features : []
      setGeoFeatures(mapFeatures)

      const activeEmployees = employees.filter((employee) => employee?.status !== 'archived')
      const regionMap = new Map(
        regionOptions.map((item) => [toLower(item?.value), String(item?.label ?? '').trim()]),
      )

      const countryAggregate = activeEmployees.reduce((acc, employee) => {
        const regionCode = toLower(employee?.regionCode)
        if (!regionCode) return acc

        const label = regionMap.get(regionCode) || regionCode.toUpperCase()
        const countryName = toCountryName(regionCode, label)
        const key = toLower(countryName)
        const current = acc.get(key) ?? {
          regionCode,
          regionLabel: label,
          countryName,
          count: 0,
        }
        current.count += 1
        acc.set(key, current)
        return acc
      }, new Map())

      const allCountryData = [...countryAggregate.values()].map((item) => ({
        id: item.countryName,
        value: item.count,
        regionCode: item.regionCode,
        regionLabel: item.regionLabel,
      }))

      const regionsSorted = [...countryAggregate.values()].sort((a, b) => b.count - a.count)
      setRegions(regionsSorted)

      let nextSelectedRegionCode = 'all'
      setSelectedRegionCode((previous) => {
        if (previous === 'all') {
          nextSelectedRegionCode = 'all'
          return 'all'
        }
        const preserved = regionsSorted.find((item) => item.regionCode === previous)?.regionCode ?? 'all'
        nextSelectedRegionCode = preserved
        return preserved
      })

      const scopedCountryData =
        nextSelectedRegionCode === 'all'
          ? allCountryData
          : allCountryData.filter((item) => item.regionCode === nextSelectedRegionCode)
      setGeoCountryData(scopedCountryData)

      const scopedEmployees = activeEmployees
        .filter((employee) =>
          nextSelectedRegionCode === 'all'
            ? true
            : toLower(employee?.regionCode) === nextSelectedRegionCode,
        )
        .slice(0, 5)
        .map((employee) => ({
          id: employee.id,
          displayName: employee.displayName || '-',
          email: employee.email || '-',
          careerTitle: employee.careerTitle || '-',
          regionLabel:
            regionMap.get(toLower(employee.regionCode)) ??
            String(employee.regionCode ?? '').toUpperCase(),
        }))
      setSelectedRegionEmployees(scopedEmployees)

      const actorEmail = toLower(user?.email)
      const auditLogs = Array.isArray(auditPayload?.data?.auditLogs) ? auditPayload.data.auditLogs : []
      const personalLogs = auditLogs
        .filter((item) => toLower(item?.actorId) === actorEmail)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          action: toActionLabel(item.action),
          target: `${item.targetType ?? 'target'} · ${item.targetId ?? '-'}`,
          createdAt: item.createdAt,
        }))
      setRecentActions(personalLogs)

      const currentEmployee = employees.find((item) => toLower(item?.email) === actorEmail) ?? null
      const roleNameMap = new Map(roles.map((role) => [role.id, role.name]))
      const roleNames = (currentEmployee?.roleIds ?? []).map((roleId) => roleNameMap.get(roleId)).filter(Boolean)
      const employeeRegionLabel = currentEmployee
        ? regionMap.get(toLower(currentEmployee.regionCode)) ?? String(currentEmployee.regionCode ?? '').toUpperCase()
        : '-'

      setUserProfile({
        displayName: user?.displayName || currentEmployee?.displayName || '-',
        email: user?.email || currentEmployee?.email || '-',
        avatarUrl: user?.avatarUrl || currentEmployee?.avatarUrl || '',
        roleNames,
        regionLabel: employeeRegionLabel || '-',
        careerTitle: currentEmployee?.careerTitle || '-',
      })

      setPermissionRadarData(buildPermissionRadarData(permissions))

      setStatus('success')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to load dashboard data.')
      setStatus('error')
    }
  }, [permissions, user?.email, user?.avatarUrl, user?.displayName])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const remaining = Number(triggerInfo?.cooldownRemainingSeconds ?? 0)
    if (remaining <= 0) return undefined

    const timer = window.setInterval(() => {
      setTriggerInfo((prev) => {
        const value = Number(prev?.cooldownRemainingSeconds ?? 0)
        if (value <= 1) return { ...(prev ?? {}), cooldownRemainingSeconds: 0 }
        return { ...(prev ?? {}), cooldownRemainingSeconds: value - 1 }
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [triggerInfo?.cooldownRemainingSeconds])

  const handleTriggerTestingRefresh = useCallback(async () => {
    if (isTriggering) return
    if (Number(triggerInfo?.cooldownRemainingSeconds ?? 0) > 0) return

    setIsTriggering(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await triggerBackstageDashboardTestingHealthRefresh()
      if (response.code !== 0) throw new Error(response.message || 'Unable to trigger testing refresh.')
      setTriggerInfo(response.trigger ?? null)
      setSuccessMessage('Testing health refresh queued. Coverage will update after CI completes.')
      await loadDashboard({ preserveStatus: true })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to trigger testing refresh.')
    } finally {
      setIsTriggering(false)
    }
  }, [isTriggering, loadDashboard, triggerInfo?.cooldownRemainingSeconds])

  const testingSummary = testingHealth?.summary ?? null
  const testingHistory = useMemo(() => {
    const raw = Array.isArray(testingHealth?.history) ? testingHealth.history : []
    return raw.map((item) => ({ ...item, label: toShortTime(item.recordedAt) }))
  }, [testingHealth?.history])

  const selectedRegion = useMemo(
    () =>
      selectedRegionCode === 'all'
        ? {
            regionCode: 'all',
            regionLabel: 'All Regions',
            countryName: 'All Countries',
            count: regions.reduce((sum, region) => sum + Number(region.count ?? 0), 0),
          }
        : regions.find((region) => region.regionCode === selectedRegionCode) ?? null,
    [regions, selectedRegionCode],
  )

  const regionOptions = useMemo(
    () => [
      {
        value: 'all',
        label: `All Regions (${regions.reduce((sum, region) => sum + Number(region.count ?? 0), 0)})`,
      },
      ...regions.map((region) => ({
        value: region.regionCode,
        label: `${region.regionLabel} (${region.count})`,
      })),
    ],
    [regions],
  )

  return {
    status,
    errorMessage,
    successMessage,
    updatedAt,
    isTriggering,
    triggerInfo,
    kpiCards,
    contentMixData,
    contentStatusData,
    testingSummary,
    testingHistory,
    geoFeatures,
    geoCountryData,
    regionOptions,
    regions,
    selectedRegionCode,
    selectedRegion,
    selectedRegionEmployees,
    userProfile,
    permissionRadarData,
    recentActions,
    setSelectedRegionCode,
    refreshDashboard: loadDashboard,
    triggerTestingRefresh: handleTriggerTestingRefresh,
  }
}
