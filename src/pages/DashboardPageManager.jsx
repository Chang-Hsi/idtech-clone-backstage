import { useAuth } from '../features/auth/AuthContext'
import StatusMessage from '../components/common/StatusMessage'
import DashboardHeader from '../components/pages/dashboard/DashboardHeader'
import DashboardKpiRow from '../components/pages/dashboard/DashboardKpiRow'
import DashboardTestingHealthPanel from '../components/pages/dashboard/DashboardTestingHealthPanel'
import DashboardLighthouseSnapshotPanel from '../components/pages/dashboard/DashboardLighthouseSnapshotPanel'
import DashboardGeoDistributionPanel from '../components/pages/dashboard/DashboardGeoDistributionPanel'
import DashboardContentChartsPanel from '../components/pages/dashboard/DashboardContentChartsPanel'
import DashboardUserPanel from '../components/pages/dashboard/DashboardUserPanel'
import useDashboardData from '../components/pages/dashboard/useDashboardData'

const DashboardPageManager = () => {
  const { user, permissions, session } = useAuth()
  const {
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
    hasPendingSubmissions,
    pendingMessageItems,
    submissionStatusRatio,
    setSelectedRegionCode,
    refreshDashboard,
    triggerTestingRefresh,
  } = useDashboardData({ user, permissions })

  return (
    <section className="space-y-4">
      <DashboardHeader
        userDisplayName={userProfile?.displayName ?? user?.displayName ?? ''}
        updatedAt={updatedAt}
        onRefresh={() => refreshDashboard()}
        isRefreshing={status === 'loading'}
      />

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading dashboard metrics...
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <DashboardKpiRow items={kpiCards} />

          <DashboardTestingHealthPanel
            summary={testingSummary}
            history={testingHistory}
            triggerInfo={triggerInfo}
            isTriggering={isTriggering}
            onTrigger={triggerTestingRefresh}
          />

          <DashboardLighthouseSnapshotPanel snapshot={lighthouseSnapshot} />

          <DashboardGeoDistributionPanel
            features={geoFeatures}
            countryData={geoCountryData}
            regionOptions={regionOptions}
            regions={regions}
            selectedRegion={selectedRegion}
            selectedRegionCode={selectedRegionCode}
            selectedRegionEmployees={selectedRegionEmployees}
            onSelectRegion={setSelectedRegionCode}
          />

          <DashboardContentChartsPanel
            mixData={contentMixData}
            statusData={contentStatusData}
          />
        </div>

        <DashboardUserPanel
          userProfile={userProfile}
          sessionExpiresAt={session?.expiresAt ?? null}
          permissionRadarData={permissionRadarData}
          recentActions={recentActions}
          hasPendingSubmissions={hasPendingSubmissions}
          pendingMessageItems={pendingMessageItems}
          submissionStatusRatio={submissionStatusRatio}
        />
      </div>
    </section>
  )
}

export default DashboardPageManager
