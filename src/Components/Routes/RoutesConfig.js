import { lazy } from 'react';

const Dashboard = lazy(() => import('../Pages/Dashboard'));
const AdminUsers = lazy(() => import('../Pages/Settings/AdminUsers'));
const AdminSettings = lazy(() => import('../Pages/Settings/AdminSettings'));
const Orders = lazy(() => import('../Pages/Orders/Orders'));
const ViewOrder = lazy(() => import('../Pages/Orders/ViewOrder'));
const Products = lazy(() => import('../Pages/Products/Products'));
const AddProduct = lazy(() => import('../Pages/Products/AddProduct'));
const StockManagement = lazy(() => import('../Pages/Products/StockManagement'));
const Category = lazy(() => import('../Pages/Products/Category'));
const Brand = lazy(() => import('../Pages/Products/Brand'));
const Section = lazy(() => import('../Pages/Section/Section'));
const ViewSection = lazy(() => import('../Pages/Section/ViewSection'));
const Banner = lazy(() => import('../Pages/Banner/Banner'));
const User = lazy(() => import('../Pages/Users/User'));
const ViewUser = lazy(() => import('../Pages/Users/ViewUser'));
const Footer = lazy(() => import('../Pages/SiteManagement/Footer'));
const PrivacyPolicy = lazy(() => import('../Pages/SiteManagement/PrivacyPolicy'));
const TermsCondition = lazy(() => import('../Pages/SiteManagement/TermsCondition'));
const ShippingPolicy = lazy(() => import('../Pages/SiteManagement/Shipping'));
const CommonSection = lazy(() => import('../Pages/SiteManagement/CommonSection'));
const Report = lazy(() => import('../Pages/Reports/Report'));
const Analytics = lazy(() => import('../Pages/Reports/Analytics'));
const UserLedger = lazy(() => import('../Pages/UserLedger/UserLedger'));
const ViewLedger = lazy(() => import('../Pages/UserLedger/ViewLedger'));
const DeliveryCharges = lazy(() => import('../Pages/DeliveryCharges/DeliveryCharges'));
const Notification = lazy(() => import('../Pages/Notifications/Notification'));
const SchemeManagement = lazy(() => import('../Pages/Products/Scheme'));
const SendNotification = lazy(() => import('../Pages/Notifications/SendNotification'));
const NotificationTemplates = lazy(() => import('../Pages/Notifications/NotificatoinTemplate'));
const PromoCode = lazy(() => import('../Pages/PromoCode/PromoCode'));

export const PROTECTED_ROUTES = [
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/admin/users', name: 'Admin Users', element: AdminUsers },
  { path: '/admin/settings', name: 'Admin Settings', element: AdminSettings },
  { path: '/orders', name: 'Orders', element: Orders },
  { path: '/orders/view', name: 'View Order', element: ViewOrder },
  { path: '/products', name: 'Products', element: Products },
  { path: '/products/add', name: 'Add Product', element: AddProduct },
  { path: '/products/stock', name: 'Stock Management', element: StockManagement },
  { path: '/products/category', name: 'Category', element: Category },
  { path: '/products/brand', name: 'Brand', element: Brand },
  { path: '/section', name: 'Section', element: Section },
  { path: '/section/view', name: 'View Section', element: ViewSection },
  { path: '/banner', name: 'Banner', element: Banner },
  { path: '/users', name: 'Users', element: User },
  { path: '/users/view', name: 'View User', element: ViewUser },
  { path: '/footer', name: 'Footer', element: Footer },
  { path: '/privacy', name: 'Privacy Policy', element: PrivacyPolicy },
  { path: '/terms', name: 'Terms and Conditions', element: TermsCondition },
  { path: '/shipping', name: 'Shipping Policy', element: ShippingPolicy },
  { path: '/common-section', name: 'Common Section', element: CommonSection },
  { path: '/reports', name: 'Reports', element: Report },
  { path: '/analytics', name: 'Analytics', element: Analytics },
  { path: '/customer-ledger', name: 'Customer Ledger', element: UserLedger },
  { path: '/customer-ledger/view/:id', name: 'View Ledger', element: ViewLedger },
  { path: '/delivery-charges', name: 'Delivery Charges', element: DeliveryCharges },
  { path: '/notification', name: 'Notification', element: Notification },
  { path: '/product/scheme', name: 'Scheme Management', element: SchemeManagement },
  { path: '/notification-templates', name: 'Notification Templates', element: NotificationTemplates },
  { path: '/send-notification', name: 'Send Notification', element: SendNotification },
  { path: '/promocode', name: 'Promocode', element: PromoCode },
];

export const ROUTE_ALIASES = [
  { path: '/orders/view/:id', permissionPath: '/orders/view', element: ViewOrder },
  { path: '/section/view/:id', permissionPath: '/section/view', element: ViewSection },
];
