import { ResponsiveChoropleth } from '@nivo/geo'
import { Link } from 'react-router-dom'
import DropdownSelect from '../../common/DropdownSelect'

const getCountryNameFromFeature = (feature) => String(feature?.properties?.name ?? '').trim()
const normalizeCountryKey = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return ''
  if (
    normalized === 'usa' ||
    normalized === 'us' ||
    normalized === 'united states' ||
    normalized === 'united states of america'
  ) {
    return 'usa'
  }
  return normalized
}
const isSameCountry = (left, right) => normalizeCountryKey(left) === normalizeCountryKey(right)

const DashboardGeoDistributionPanel = ({
  features,
  countryData,
  regionOptions,
  regions,
  selectedRegion,
  selectedRegionCode,
  selectedRegionEmployees,
  onSelectRegion,
}) => {
  const maxValue = Math.max(1, ...countryData.map((item) => Number(item.value) || 0))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Region & Career Distribution</h2>
          <p className="mt-1 text-xs text-slate-500">Active employee count by country, with career breakdown.</p>
        </div>

        <DropdownSelect
          value={selectedRegionCode}
          options={regionOptions}
          placeholder="All Regions"
          onChange={(value) => onSelectRegion(value || 'all')}
          className="min-w-56"
        />
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-[300px] rounded-lg border border-slate-200 bg-slate-50 p-2">
          {features.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">World map data unavailable.</div>
          ) : (
            <ResponsiveChoropleth
              features={features}
              data={countryData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              domain={[0, maxValue]}
              unknownColor="#e2e8f0"
              colors="blues"
              label={(feature) => getCountryNameFromFeature(feature)}
              value="value"
              match={(feature, datum) => isSameCountry(getCountryNameFromFeature(feature), String(datum?.id ?? ''))}
              projectionType="naturalEarth1"
              projectionScale={130}
              borderWidth={0.8}
              borderColor="#cbd5e1"
              legends={[]}
              tooltip={({ feature }) => (
                <div className="rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg">
                  <p className="font-medium">{feature.label}</p>
                  <p>{feature.value ?? 0} employees</p>
                </div>
              )}
              onClick={(feature) => {
                const name = String(feature?.label ?? '')
                const target = regions.find((region) => isSameCountry(region.countryName, name))
                if (target?.regionCode) {
                  onSelectRegion(target.regionCode)
                }
              }}
            />
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selectedRegion?.regionLabel || 'Region'} Employees
          </h3>
          <p className="mt-1 text-xs text-slate-500">Total: {selectedRegion?.count ?? 0} employees</p>

          <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
            {selectedRegionEmployees.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500">No employees found for this region.</p>
            ) : (
              <Link to="/settings/employees" className="block">
                <table className="w-full table-fixed text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Career</th>
                      <th className="px-3 py-2">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRegionEmployees.map((employee) => (
                      <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="truncate px-3 py-3 font-medium">{employee.displayName}</td>
                        <td className="truncate px-3 py-3 text-slate-600">{employee.careerTitle}</td>
                        <td className="truncate px-3 py-3 text-slate-500">{employee.regionLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardGeoDistributionPanel
