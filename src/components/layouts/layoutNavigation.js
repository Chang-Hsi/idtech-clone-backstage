import {
  Cog6ToothIcon,
  EnvelopeIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline'

export const PRIMARY_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { key: 'pages', label: 'Pages', to: '/pages/home', icon: RectangleStackIcon },
  { key: 'seo', label: 'SEO', to: '/seo', icon: MagnifyingGlassIcon },
  { key: 'submissions', label: 'Messages', to: '/submissions/lead/new', icon: EnvelopeIcon },
  { key: 'settings', label: 'Settings', to: '/settings/profile', icon: Cog6ToothIcon },
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
  settings: {
    title: 'Settings',
    searchEnabled: false,
    groups: [
      {
        title: 'System',
        items: [
          { label: 'Profile', to: '/settings/profile' },
          { label: 'Roles & Permissions', to: '/settings/roles' },
          { label: 'Employees', to: '/settings/employees' },
          { label: 'Security Policies', to: '/settings/security' },
          { label: 'Audit Logs', to: '/settings/audit' },
        ],
      },
    ],
  },
  submissions: {
    title: 'Message Center',
    searchEnabled: false,
    groups: [
      {
        title: 'Connect Types',
        items: [
          { label: 'Pending', to: '/submissions/lead/new' },
          { label: 'Completed', to: '/submissions/lead/resolved' },
          { label: 'Archived', to: '/submissions/lead/archived' },
        ],
      },
      {
        title: 'Contact Types',
        items: [
          { label: 'Pending', to: '/submissions/contact/new' },
          { label: 'Completed', to: '/submissions/contact/resolved' },
          { label: 'Archived', to: '/submissions/contact/archived' },
        ],
      },
      {
        title: 'Career Types',
        items: [
          { label: 'Pending', to: '/submissions/career/new' },
          { label: 'Completed', to: '/submissions/career/resolved' },
          { label: 'Archived', to: '/submissions/career/archived' },
        ],
      },
    ],
  },
}
