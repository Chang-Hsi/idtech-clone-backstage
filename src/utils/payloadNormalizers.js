import { z } from 'zod'

const settingsEmployeeSchema = z.object({
  id: z.string().trim().min(1),
  email: z.email().trim().min(1),
  displayName: z.string().trim().min(1),
  avatarUrl: z.url().trim().optional().or(z.literal('')).default(''),
  status: z.enum(['active', 'archived']).default('active'),
  roleIds: z.array(z.string().trim().min(1)).default([]),
  regionCode: z.string().trim().min(1),
  careerTitle: z.string().trim().min(1),
  lastLoginAt: z.string().trim().optional(),
  forcePasswordReset: z.boolean().optional().default(false),
})

const settingsEmployeesWriteSchema = z.object({
  employees: z.array(settingsEmployeeSchema).min(1),
  updatedBy: z.string().trim().optional(),
})

export const normalizeEmployeesForWrite = (employees) =>
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
      regionCode: String(employee?.regionCode ?? '').trim().toLowerCase(),
      careerTitle: String(employee?.careerTitle ?? '').trim(),
      forcePasswordReset: Boolean(employee?.forcePasswordReset),
    }

    const lastLoginAt = employee?.lastLoginAt
    if (typeof lastLoginAt === 'string' && lastLoginAt.trim()) {
      normalized.lastLoginAt = lastLoginAt.trim()
    }

    return normalized
  })

const formatZodIssuePath = (path = []) => (Array.isArray(path) && path.length ? path.join('.') : 'payload')

export const buildSettingsEmployeesWritePayload = ({ employees, updatedBy }) => {
  const normalizedEmployees = normalizeEmployeesForWrite(employees)
  const parsed = settingsEmployeesWriteSchema.safeParse({
    employees: normalizedEmployees,
    updatedBy: String(updatedBy ?? '').trim() || undefined,
  })

  if (!parsed.success) {
    const [firstIssue] = parsed.error.issues ?? []
    if (firstIssue) {
      const fieldPath = formatZodIssuePath(firstIssue.path)
      throw new Error(`Invalid employees payload (${fieldPath}): ${firstIssue.message}`)
    }
    throw new Error('Invalid employees payload.')
  }

  return parsed.data
}
