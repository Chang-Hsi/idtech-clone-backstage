import { describe, expect, it } from 'vitest'
import {
  buildCareersUpdatePayload,
  normalizeCareersPayload,
} from '../../../../../src/components/pages/company/careers/careersFormUtils'

describe('careersFormUtils payload normalization', () => {
  it('normalizeCareersPayload adds default all tab and normalizes fields', () => {
    const result = normalizeCareersPayload({
      tabs: [{ key: ' US ', label: ' United States ' }],
      jobs: [
        {
          id: '  job-1 ',
          slug: ' senior-dev ',
          title: ' Senior Dev ',
          region: ' North America ',
          countryCode: ' US ',
          employmentType: ' FULL-TIME ',
          locationLabel: ' Cypress, US ',
          imageUrl: ' https://example.com/job.jpg ',
          summary: ' Build things ',
          jobDuties: [' First duty ', 'Second duty'],
          qualifications: [' QA 1 ', 'QA 2'],
          applyEmail: ' hr@example.com ',
          isOpen: 1,
        },
      ],
    })

    expect(result.tabs.map((tab) => tab.key)).toEqual(['all', 'us'])
    expect(result.tabs[0].label).toBe('Show all')
    expect(result.jobs[0]).toMatchObject({
      id: 'job-1',
      slug: 'senior-dev',
      title: 'Senior Dev',
      region: 'North America',
      countryCode: 'us',
      employmentType: 'FULL-TIME',
      locationLabel: 'Cypress, US',
      imageUrl: 'https://example.com/job.jpg',
      summary: 'Build things',
      jobDutiesMarkdown: '- First duty\n- Second duty',
      qualificationsMarkdown: '- QA 1\n- QA 2',
      applyEmail: 'hr@example.com',
      isOpen: true,
    })
  })

  it('buildCareersUpdatePayload trims markdown fields and keeps backend write shape', () => {
    const payload = buildCareersUpdatePayload(
      {
        tabs: [
          { key: 'all', label: 'Show all' },
          { key: 'us', label: 'United States' },
        ],
        jobs: [
          {
            id: 'job-1',
            slug: 'should-not-be-sent',
            title: 'Role 1',
            region: 'US',
            countryCode: 'us',
            employmentType: 'FULL-TIME',
            locationLabel: 'Cypress',
            imageUrl: 'https://example.com/job.jpg',
            summary: 'Summary',
            jobDutiesMarkdown: '  - duty 1\n- duty 2  ',
            qualificationsMarkdown: '  - q1\n- q2  ',
            applyEmail: 'hr@example.com',
            isOpen: true,
            sortOrder: 123,
          },
        ],
      },
      'admin@idtech.local',
    )

    expect(payload).toEqual({
      tabs: [
        { key: 'all', label: 'Show all' },
        { key: 'us', label: 'United States' },
      ],
      jobs: [
        {
          id: 'job-1',
          title: 'Role 1',
          region: 'US',
          countryCode: 'us',
          employmentType: 'FULL-TIME',
          locationLabel: 'Cypress',
          imageUrl: 'https://example.com/job.jpg',
          summary: 'Summary',
          jobDutiesMarkdown: '- duty 1\n- duty 2',
          qualificationsMarkdown: '- q1\n- q2',
          applyEmail: 'hr@example.com',
          isOpen: true,
        },
      ],
      updatedBy: 'admin@idtech.local',
    })
  })
})
