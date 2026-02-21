import {
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'

export const PRIMARY_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { key: 'pages', label: 'Pages', to: '/pages/home', icon: RectangleStackIcon },
  { key: 'seo', label: 'SEO', to: '/seo', icon: MagnifyingGlassIcon },
  { key: 'settings', label: 'Settings', to: '/settings', icon: Cog6ToothIcon },
]

export const SECONDARY_NAV_CONFIG = {
  pages: {
    title: 'Content Manager',
    searchPlaceholder: 'Search',
    groups: [
      {
        title: 'Page Types',
        items: [
          { label: 'Home', to: '/pages/home' },
          { label: 'Banner Hub', to: '/pages/banner-hub' },
          { label: 'Contact', to: '/pages/contact' },
          { label: 'Privacy Policy', to: '/pages/legal' },
        ],
      },
      {
        title: 'Content Types',
        items: [
          { label: 'Products', to: '/pages/content/products' },
          { label: 'Collections', to: '/pages/content/collections' },
          { label: 'Use Cases', to: '/pages/content/use-cases' },
          { label: 'Resources', to: '/pages/content/resources' },
          {
            label: 'Company',
            children: [
              { label: 'Company Cards', to: '/pages/content/company/cards' },
              { label: 'About Us', to: '/pages/content/company/about-us' },
              { label: 'Careers', to: '/pages/content/company/careers' },
            ],
          },
        ],
      },
    ],
  },
}
