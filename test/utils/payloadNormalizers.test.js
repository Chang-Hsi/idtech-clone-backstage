import { describe, expect, it } from 'vitest'
import { buildSettingsEmployeesWritePayload, normalizeEmployeesForWrite } from '../../src/utils/payloadNormalizers'

describe('normalizeEmployeesForWrite', () => {
  it('normalizes string fields, roleIds, status, and booleans', () => {
    const result = normalizeEmployeesForWrite([
      {
        id: '  emp-1  ',
        email: '  user@example.com  ',
        displayName: '  User Name  ',
        avatarUrl: '  https://example.com/avatar.jpg  ',
        status: 'archived',
        roleIds: [' role-admin ', '', null, 'role-editor'],
        regionCode: ' TW ',
        careerTitle: ' Senior SRE Engineer ',
        forcePasswordReset: 1,
        lastLoginAt: ' 2026-02-22T01:02:03.000Z ',
      },
    ])

    expect(result).toEqual([
      {
        id: 'emp-1',
        email: 'user@example.com',
        displayName: 'User Name',
        avatarUrl: 'https://example.com/avatar.jpg',
        status: 'archived',
        roleIds: ['role-admin', 'role-editor'],
        regionCode: 'tw',
        careerTitle: 'Senior SRE Engineer',
        forcePasswordReset: true,
        lastLoginAt: '2026-02-22T01:02:03.000Z',
      },
    ])
  })

  it('drops nullable/empty lastLoginAt and defaults status to active', () => {
    const result = normalizeEmployeesForWrite([
      {
        id: 'emp-2',
        email: 'editor@example.com',
        displayName: 'Editor',
        avatarUrl: '',
        status: 'unknown-status',
        roleIds: [],
        regionCode: ' US ',
        careerTitle: ' QA Engineer ',
        forcePasswordReset: 0,
        lastLoginAt: null,
      },
      {
        id: 'emp-3',
        email: 'qa@example.com',
        displayName: 'QA',
        avatarUrl: '',
        roleIds: null,
        regionCode: 'JP',
        careerTitle: 'Frontend Engineer',
        lastLoginAt: '   ',
      },
    ])

    expect(result).toEqual([
      {
        id: 'emp-2',
        email: 'editor@example.com',
        displayName: 'Editor',
        avatarUrl: '',
        status: 'active',
        roleIds: [],
        regionCode: 'us',
        careerTitle: 'QA Engineer',
        forcePasswordReset: false,
      },
      {
        id: 'emp-3',
        email: 'qa@example.com',
        displayName: 'QA',
        avatarUrl: '',
        status: 'active',
        roleIds: [],
        regionCode: 'jp',
        careerTitle: 'Frontend Engineer',
        forcePasswordReset: false,
      },
    ])
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeEmployeesForWrite(null)).toEqual([])
    expect(normalizeEmployeesForWrite(undefined)).toEqual([])
    expect(normalizeEmployeesForWrite({})).toEqual([])
  })

  it('buildSettingsEmployeesWritePayload returns parsed shared-schema payload', () => {
    const payload = buildSettingsEmployeesWritePayload({
      employees: [
        {
          id: '  emp-1 ',
          email: '  user@example.com ',
          displayName: ' User ',
          avatarUrl: '',
          status: 'active',
          roleIds: [' role-editor '],
          regionCode: ' tw ',
          careerTitle: ' Senior SRE Engineer ',
          forcePasswordReset: false,
          lastLoginAt: null,
        },
      ],
      updatedBy: '  admin@idtech.local ',
    })

    expect(payload).toEqual({
      employees: [
        {
          id: 'emp-1',
          email: 'user@example.com',
          displayName: 'User',
          avatarUrl: '',
          status: 'active',
          roleIds: ['role-editor'],
          regionCode: 'tw',
          careerTitle: 'Senior SRE Engineer',
          forcePasswordReset: false,
        },
      ],
      updatedBy: 'admin@idtech.local',
    })
  })

  it('buildSettingsEmployeesWritePayload throws when shared schema validation fails', () => {
    expect(() =>
      buildSettingsEmployeesWritePayload({
        employees: [
          {
            id: 'emp-1',
            email: 'invalid-email',
            displayName: 'User',
            avatarUrl: '',
            status: 'active',
            roleIds: ['role-editor'],
          },
        ],
        updatedBy: 'admin@idtech.local',
      }),
    ).toThrow(/Invalid employees payload/)
  })
})
