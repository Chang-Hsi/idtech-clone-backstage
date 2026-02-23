import { request } from '../lib/request'

export async function uploadBackstageImage({ file, category = 'misc', updatedBy = '' }) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', String(category ?? 'misc'))
  if (String(updatedBy ?? '').trim()) {
    formData.append('updatedBy', String(updatedBy).trim())
  }

  return request('/api/backstage/uploads/images', {
    method: 'POST',
    body: formData,
  })
}
