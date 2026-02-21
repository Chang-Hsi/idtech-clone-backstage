import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import AuthLayout from '../layout/AuthLayout'
import LoginPage from '../pages/LoginPage'
import HomePageManager from '../pages/pageTypes/HomePageManager'
import BannerHubPageManager from '../pages/pageTypes/BannerHubPageManager'
import ContactPageManager from '../pages/pageTypes/ContactPageManager'
import PrivacyPolicyPageManager from '../pages/pageTypes/PrivacyPolicyPageManager'
import ProductsContentPageManager from '../pages/contentTypes/ProductsContentPageManager'
import ProductCreatePageManager from '../pages/contentTypes/ProductCreatePageManager'
import ProductEditPageManager from '../pages/contentTypes/ProductEditPageManager'
import CollectionsContentPageManager from '../pages/contentTypes/CollectionsContentPageManager'
import CollectionCreatePageManager from '../pages/contentTypes/CollectionCreatePageManager'
import CollectionEditPageManager from '../pages/contentTypes/CollectionEditPageManager'
import UseCasesContentPageManager from '../pages/contentTypes/UseCasesContentPageManager'
import UseCaseCreatePageManager from '../pages/contentTypes/UseCaseCreatePageManager'
import UseCaseEditPageManager from '../pages/contentTypes/UseCaseEditPageManager'
import ResourcesContentPageManager from '../pages/contentTypes/ResourcesContentPageManager'
import ResourceCreatePageManager from '../pages/contentTypes/ResourceCreatePageManager'
import ResourceEditPageManager from '../pages/contentTypes/ResourceEditPageManager'
import CompanyCardsContentPageManager from '../pages/contentTypes/CompanyCardsContentPageManager'
import CompanyAboutUsPageManager from '../pages/contentTypes/CompanyAboutUsPageManager'
import CompanyCareersPageManager from '../pages/contentTypes/CompanyCareersPageManager'
import CompanyCareerCreatePageManager from '../pages/contentTypes/CompanyCareerCreatePageManager'
import CompanyCareerEditPageManager from '../pages/contentTypes/CompanyCareerEditPageManager'
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
    element: <ContactPageManager />,
  },
  {
    path: 'pages/legal',
    title: 'Legal Page',
    description: 'Manage legal content entries such as privacy policy text.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <PrivacyPolicyPageManager />,
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
    element: <UseCasesContentPageManager />,
  },
  {
    path: 'pages/content/use-cases/new',
    title: 'Create Use Case',
    description: 'Create a new use case entity.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <UseCaseCreatePageManager />,
  },
  {
    path: 'pages/content/use-cases/:slug/edit',
    title: 'Edit Use Case',
    description: 'Edit use case entity.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <UseCaseEditPageManager />,
  },
  {
    path: 'pages/content/resources',
    title: 'Resources (Entity)',
    description: 'Content-type management for resource cards and published resource entries.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <ResourcesContentPageManager />,
  },
  {
    path: 'pages/content/resources/new',
    title: 'Create Resource',
    description: 'Create a new resource entry.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <ResourceCreatePageManager />,
  },
  {
    path: 'pages/content/resources/:slug/edit',
    title: 'Edit Resource',
    description: 'Edit resource entry.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <ResourceEditPageManager />,
  },
  {
    path: 'pages/content/company',
    title: 'Company',
    description: 'Company content group entry. Redirects to Company Cards.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <Navigate to="/pages/content/company/cards" replace />,
  },
  {
    path: 'pages/content/company/cards',
    title: 'Company Cards (Entity)',
    description: 'Content-type management for company section cards and related links.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CompanyCardsContentPageManager />,
  },
  {
    path: 'pages/content/company/about-us',
    title: 'About Us (Entity)',
    description: 'Content-type management for About Us page content.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CompanyAboutUsPageManager />,
  },
  {
    path: 'pages/content/company/careers',
    title: 'Careers (Entity)',
    description: 'Content-type management for Careers page content.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CompanyCareersPageManager />,
  },
  {
    path: 'pages/content/company/careers/new',
    title: 'Create Career Job',
    description: 'Create a new career job.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CompanyCareerCreatePageManager />,
  },
  {
    path: 'pages/content/company/careers/:slug/edit',
    title: 'Edit Career Job',
    description: 'Edit a career job.',
    primaryNav: 'pages',
    secondaryNav: 'pages',
    element: <CompanyCareerEditPageManager />,
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
