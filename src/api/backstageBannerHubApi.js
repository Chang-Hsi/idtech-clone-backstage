import { request } from '../lib/request'

export async function fetchBannerHubPageFromApi({ tab, limit = 10, offset = 0 }) {
  const search = new URLSearchParams({
    tab,
    limit: String(limit),
    offset: String(offset),
  })
  const payload = await request(`/api/backstage/banner-hub?${search.toString()}`, { cache: 'no-store' })
  const data = payload?.data ?? {}
  const bannerHub = data?.bannerHub ?? {}
  const pagination = bannerHub?.pagination ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    tab: bannerHub?.tab ?? tab,
    items: Array.isArray(bannerHub?.items) ? bannerHub.items : [],
    pagination: {
      totalCount: Number.isFinite(pagination?.totalCount) ? pagination.totalCount : 0,
      limit: Number.isFinite(pagination?.limit) ? pagination.limit : limit,
      offset: Number.isFinite(pagination?.offset) ? pagination.offset : offset,
      hasNextPage: Boolean(pagination?.hasNextPage),
      hasPrevPage: Boolean(pagination?.hasPrevPage),
    },
  }
}

export async function fetchBannerHubFromApi() {
  const payload = await request('/api/backstage/banner-hub', { cache: 'no-store' })
  const data = payload?.data ?? {}
  const bannerHub = data?.bannerHub ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    coreBanners: Array.isArray(bannerHub.coreBanners) ? bannerHub.coreBanners : [],
    detailBanners: Array.isArray(bannerHub.detailBanners) ? bannerHub.detailBanners : [],
    productDetailBanners: Array.isArray(bannerHub.productDetailBanners)
      ? bannerHub.productDetailBanners
      : [],
  }
}

export async function updateBannerHubCore({ items, updatedBy }) {
  return request('/api/backstage/banner-hub/core', {
    method: 'PUT',
    body: JSON.stringify({ items, updatedBy }),
  })
}

export async function updateBannerHubDetail({ items, updatedBy }) {
  return request('/api/backstage/banner-hub/detail-pages', {
    method: 'PUT',
    body: JSON.stringify({ items, updatedBy }),
  })
}

export async function updateBannerHubProductDetails({ items, updatedBy }) {
  return request('/api/backstage/banner-hub/product-details', {
    method: 'PUT',
    body: JSON.stringify({ items, updatedBy }),
  })
}

export async function uploadDatasheetForProduct({ productSlug, fileName, contentBase64, mimeType, updatedBy }) {
  return request(`/api/backstage/banner-hub/product-details/${productSlug}/datasheet`, {
    method: 'POST',
    body: JSON.stringify({ fileName, contentBase64, mimeType, updatedBy }),
  })
}
