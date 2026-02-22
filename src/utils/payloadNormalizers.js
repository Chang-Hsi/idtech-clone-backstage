import { settingsEmployeesWriteSchema } from '@chang-hsi/idtech-shared-contracts'

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
