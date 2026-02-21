export const STATUS_ACTIVE = 'active'
export const STATUS_ARCHIVED = 'archived'

export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const buildUniqueSlug = (title, jobs, targetId = '') => {
  const base = slugify(title) || 'career'
  const used = new Set(
    jobs
      .filter((item) => item.id !== targetId)
      .map((item) => String(item.slug ?? '').trim())
      .filter(Boolean),
  )
  let candidate = base
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

const toMarkdownList = (value) => {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join('\n')
}

export const normalizeCareersPayload = (page) => {
  const payload = page ?? {}
  const tabs = Array.isArray(payload.tabs) ? payload.tabs : []
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : []

  const normalizedTabs = tabs.map((item, index) => ({
    key: String(item?.key ?? '').trim().toLowerCase(),
    label: String(item?.label ?? '').trim(),
    sortOrder: Number.isInteger(item?.sortOrder) ? item.sortOrder : index,
  }))
  const hasAll = normalizedTabs.some((tab) => tab.key === 'all')

  return {
    tabs: hasAll
      ? normalizedTabs
      : [{ key: 'all', label: 'Show all', sortOrder: 0 }, ...normalizedTabs],
    jobs: jobs.map((item, index) => ({
      id: String(item?.id ?? createId('job')).trim(),
      slug: String(item?.slug ?? '').trim(),
      title: String(item?.title ?? '').trim(),
      region: String(item?.region ?? '').trim(),
      countryCode: String(item?.countryCode ?? '').trim().toLowerCase(),
      employmentType: String(item?.employmentType ?? '').trim(),
      locationLabel: String(item?.locationLabel ?? '').trim(),
      imageUrl: String(item?.imageUrl ?? '').trim(),
      summary: String(item?.summary ?? '').trim(),
      jobDutiesMarkdown: toMarkdownList(item?.jobDutiesMarkdown ?? item?.jobDuties),
      qualificationsMarkdown: toMarkdownList(item?.qualificationsMarkdown ?? item?.qualifications),
      applyEmail: String(item?.applyEmail ?? '').trim(),
      isOpen: Boolean(item?.isOpen),
      sortOrder: Number.isInteger(item?.sortOrder) ? item.sortOrder : index,
    })),
  }
}

export const buildCareersUpdatePayload = (form, updatedBy) => ({
  tabs: form.tabs.map((tab) => ({ key: tab.key, label: tab.label })),
  jobs: form.jobs.map((job) => ({
    id: job.id,
    title: job.title,
    region: job.region,
    countryCode: job.countryCode,
    employmentType: job.employmentType,
    locationLabel: job.locationLabel,
    imageUrl: job.imageUrl,
    summary: job.summary,
    jobDutiesMarkdown: String(job.jobDutiesMarkdown ?? '').trim(),
    qualificationsMarkdown: String(job.qualificationsMarkdown ?? '').trim(),
    applyEmail: job.applyEmail,
    isOpen: Boolean(job.isOpen),
  })),
  updatedBy,
})

export const validateJobForm = ({ title, region, countryCode, employmentType, locationLabel, imageUrl, summary, applyEmail, jobDutiesMarkdown, qualificationsMarkdown }, tabs) => {
  if (!title || !region || !countryCode || !employmentType || !locationLabel || !imageUrl || !summary || !applyEmail) {
    return 'Please complete all required fields.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyEmail)) {
    return 'Apply email format is invalid.'
  }

  if (!String(jobDutiesMarkdown ?? '').trim() || !String(qualificationsMarkdown ?? '').trim()) {
    return 'Job duties and qualifications are required.'
  }

  if (!tabs.some((tab) => tab.key === countryCode)) {
    return 'countryCode must match an existing tab key.'
  }

  return ''
}
