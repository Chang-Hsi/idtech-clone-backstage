import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchBackstageDashboardSummary, triggerBackstageDashboardTestingHealthRefresh } from '../../../api/backstageDashboardApi'

const WORLD_MAP_PATH = `${import.meta.env.BASE_URL}maps/countries.geojson`
const FALLBACK_WORLD_MAP_PATH = '/maps/countries.geojson'
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

export default function useDashboardData() {
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
  const [lighthouseSnapshot, setLighthouseSnapshot] = useState(null)

  const [geoFeatures, setGeoFeatures] = useState([])
  const [geoCountryData, setGeoCountryData] = useState([])
  const [regions, setRegions] = useState([])
  const [selectedRegionCode, setSelectedRegionCode] = useState('all')
  const [selectedRegionEmployees, setSelectedRegionEmployees] = useState([])
  const [allRegionEmployees, setAllRegionEmployees] = useState([])
  const [geoCountryDataAll, setGeoCountryDataAll] = useState([])

  const [userProfile, setUserProfile] = useState(null)
  const [permissionRadarData, setPermissionRadarData] = useState([])
  const [recentActions, setRecentActions] = useState([])

  const loadDashboard = useCallback(async ({ preserveStatus = false } = {}) => {
    if (!preserveStatus) setStatus('loading')
    setErrorMessage('')

    try {
      const [
        dashboardPayload,
        worldGeoJson,
      ] = await Promise.all([
        fetchBackstageDashboardSummary(),
        (async () => {
          const primary = await fetch(WORLD_MAP_PATH, { cache: 'force-cache' })
          if (primary.ok) return primary.json()
          const fallback = await fetch(FALLBACK_WORLD_MAP_PATH, { cache: 'force-cache' })
          if (!fallback.ok) throw new Error('Unable to load world map data.')
          return fallback.json()
        })(),
      ])

      const summary = dashboardPayload?.summary ?? {}

      setTestingHealth(summary.testingHealth ?? null)
      setTriggerInfo(summary.trigger ?? null)
      setUpdatedAt(summary.updatedAt ?? null)
      setKpiCards(Array.isArray(summary.kpiCards) ? summary.kpiCards : [])
      setContentMixData(Array.isArray(summary.contentMixData) ? summary.contentMixData : [])
      setContentStatusData(Array.isArray(summary.contentStatusData) ? summary.contentStatusData : [])
      setLighthouseSnapshot(summary.lighthouse ?? null)
      setRegions(Array.isArray(summary.regions) ? summary.regions : [])
      setAllRegionEmployees(Array.isArray(summary.selectedRegionEmployees) ? summary.selectedRegionEmployees : [])
      setGeoCountryDataAll(Array.isArray(summary.geoCountryDataAll) ? summary.geoCountryDataAll : [])
      setUserProfile(summary.userProfile ?? null)
      setPermissionRadarData(Array.isArray(summary.permissionRadarData) ? summary.permissionRadarData : [])
      const personalLogs = Array.isArray(summary.recentActions)
        ? summary.recentActions.map((item) => ({
            id: item.id,
            action: toActionLabel(item.action),
            target: `${item.targetType ?? 'target'} · ${item.targetId ?? '-'}`,
            createdAt: item.createdAt,
          }))
        : []
      setRecentActions(personalLogs)

      const mapFeatures = Array.isArray(worldGeoJson?.features) ? worldGeoJson.features : []
      setGeoFeatures(mapFeatures)

      setStatus('success')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to load dashboard data.')
      setStatus('error')
    }
  }, [])

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

  useEffect(() => {
    const regionsSorted = Array.isArray(regions) ? regions : []
    setSelectedRegionCode((previous) => {
      return previous === 'all'
        ? 'all'
        : regionsSorted.find((item) => item.regionCode === previous)?.regionCode ?? 'all'
    })
  }, [regions])

  useEffect(() => {
    const allCountryData = Array.isArray(geoCountryDataAll) ? geoCountryDataAll : []
    const allEmployees = Array.isArray(allRegionEmployees) ? allRegionEmployees : []
    const scopedCountryData =
      selectedRegionCode === 'all'
        ? allCountryData
        : allCountryData.filter((item) => toLower(item?.regionCode) === selectedRegionCode)
    setGeoCountryData(scopedCountryData)

    const scopedEmployees = allEmployees
      .filter((employee) => (selectedRegionCode === 'all' ? true : toLower(employee?.regionCode) === selectedRegionCode))
      .slice(0, 5)
    setSelectedRegionEmployees(scopedEmployees)
  }, [allRegionEmployees, geoCountryDataAll, selectedRegionCode])

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
    lighthouseSnapshot,
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
