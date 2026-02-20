import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import AuthLayout from '../layout/AuthLayout'
import LoginPage from '../pages/LoginPage'
import HomePageManager from '../pages/Pages/HomePageManager'
import BannerHubPageManager from '../pages/Pages/BannerHubPageManager'
import ProductsContentPageManager from '../pages/Pages/ProductsContentPageManager'
import ProductCreatePageManager from '../pages/Pages/ProductCreatePageManager'
import ProductEditPageManager from '../pages/Pages/ProductEditPageManager'
import CollectionsContentPageManager from '../pages/Pages/CollectionsContentPageManager'
import CollectionCreatePageManager from '../pages/Pages/CollectionCreatePageManager'
import CollectionEditPageManager from '../pages/Pages/CollectionEditPageManager'
import PlaceholderPage from '../pages/PlaceholderPage'
import RequireAuth from './guards/RequireAuth'
import RequireGuest from './guards/RequireGuest'

const pageRoutes = [
  {
    path: 'dashboard',
    title: 'Dashboard',
    description: 'Overview of content operations, publish activity, and editing status.',
    primaryNav: 'dashboard',
  },
  {
    path: 'pages/home',
    title: 'Home Page',
    description: 'Manage homepage sections and hero content.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <HomePageManager />,
  },
  {
    path: 'pages/banner-hub',
    title: 'Banner Hub',
    description: 'Manage reusable banner content across core pages, detail pages, and product detail pages.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <BannerHubPageManager />,
  },
  {
    path: 'pages/contact',
    title: 'Contact Page',
    description: 'Manage contact content blocks and CTA messaging.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'pages/legal',
    title: 'Legal Page',
    description: 'Manage legal content entries such as privacy policy text.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'pages/content/products',
    title: 'Products (Entity)',
    description: 'Content-type management for individual product entities used by ProductDetailPage.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <ProductsContentPageManager />,
  },
  {
    path: 'pages/content/products/new',
    title: 'Create Product',
    description: 'Create a new product entity.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <ProductCreatePageManager />,
  },
  {
    path: 'pages/content/products/:slug/edit',
    title: 'Edit Product',
    description: 'Edit product entity.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <ProductEditPageManager />,
  },
  {
    path: 'pages/content/collections',
    title: 'Collections (Entity)',
    description: 'Content-type management for collection entities used by ProductCollectionPage.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CollectionsContentPageManager />,
  },
  {
    path: 'pages/content/collections/new',
    title: 'Create Collection',
    description: 'Create a new collection entity.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CollectionCreatePageManager />,
  },
  {
    path: 'pages/content/collections/:slug/edit',
    title: 'Edit Collection',
    description: 'Edit collection entity.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CollectionEditPageManager />,
  },
  {
    path: 'pages/content/use-cases',
    title: 'Use Cases (Entity)',
    description: 'Content-type management for use case cards and detail entities.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'pages/content/resources',
    title: 'Resources (Entity)',
    description: 'Content-type management for resource cards and published resource entries.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'pages/content/company',
    title: 'Company Cards (Entity)',
    description: 'Content-type management for company section cards and related links.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'pages/content/articles',
    title: 'Articles (Content Type)',
    description: 'Content-type management for resource articles.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'pages/content/jobs',
    title: 'Jobs (Content Type)',
    description: 'Content-type management for career job postings.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
  },
  {
    path: 'seo',
    title: 'SEO Manager',
    description: 'Global and page-level SEO controls.',
    primaryNav: 'seo',
  },
  {
    path: 'settings',
    title: 'Settings',
    description: 'System settings, profile, and backstage preferences.',
    primaryNav: 'settings',
  },
]

const router = createBrowserRouter(
  [
    {
      path: '/auth',
      element: (
        <RequireGuest>
          <AuthLayout />
        </RequireGuest>
      ),
      children: [
        { index: true, element: <Navigate to="/auth/login" replace /> },
        { path: 'login', element: <LoginPage /> },
      ],
    },
    {
      path: '/',
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Navigate to="/pages/home" replace /> },
        ...pageRoutes.map((route) => ({
          path: route.path,
          element: route.element ?? <PlaceholderPage title={route.title} description={route.description} />,
          handle: {
            primaryNav: route.primaryNav,
            secondaryNav: route.secondaryNav ?? null,
          },
        })),
      ],
    },
    { path: '*', element: <Navigate to="/pages/home" replace /> },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

export default router
