import Dashboard from '../Pages/Dashboard';
import AdminUsers from '../Pages/Settings/AdminUsers';
import AdminSettings from '../Pages/Settings/AdminSettings';
import Orders from '../Pages/Orders/Orders';
import ViewOrder from '../Pages/Orders/ViewOrder';
import Products from '../Pages/Products/Products';
import AddProduct from '../Pages/Products/AddProduct';
import StockManagement from '../Pages/Products/StockManagement';
import Category from '../Pages/Products/Category';
import Brand from '../Pages/Products/Brand';
import Section from '../Pages/Section/Section';
import ViewSection from '../Pages/Section/ViewSection';
import Banner from '../Pages/Banner/Banner';
import User from '../Pages/Users/User';
import ViewUser from '../Pages/Users/ViewUser';
import Footer from '../Pages/SiteManagement/Footer';
import PrivacyPolicy from '../Pages/SiteManagement/PrivacyPolicy';
import TermsCondition from '../Pages/SiteManagement/TermsCondition';
import ShippingPolicy from '../Pages/SiteManagement/Shipping';
import CommonSection from '../Pages/SiteManagement/CommonSection';
import Report from '../Pages/Reports/Report';
import Analytics from '../Pages/Reports/Analytics';
import UserLedger from '../Pages/UserLedger/UserLedger';
import ViewLedger from '../Pages/UserLedger/ViewLedger';
import DeliveryCharges from '../Pages/DeliveryCharges/DeliveryCharges';

export const PROTECTED_ROUTES = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    element: Dashboard,
  },
  {
    path: '/admin/users',
    name: 'Admin Users',
    element: AdminUsers,
  },
  {
    path: '/admin/settings',
    name: 'Admin Settings',
    element: AdminSettings,
  },
  {
    path: '/orders',
    name: 'Orders',
    element: Orders,
  },
  {
    path: '/orders/view',
    name: 'View Order',
    element: ViewOrder,
  },
  {
    path: '/products',
    name: 'Products',
    element: Products,
  },
  {
    path: '/products/add',
    name: 'Add Product',
    element: AddProduct,
  },
  {
    path: '/products/stock',
    name: 'Stock Management',
    element: StockManagement,
  },
  {
    path: '/products/category',
    name: 'Category',
    element: Category,
  },
  {
    path: '/products/brand',
    name: 'Brand',
    element: Brand,
  },
  {
    path: '/section',
    name: 'Section',
    element: Section,
  },
  {
    path: '/section/view',
    name: 'View Section',
    element: ViewSection,
  },
  {
    path: '/banner',
    name: 'Banner',
    element: Banner,
  },
  {
    path: '/users',
    name: 'Users',
    element: User,
  },
  {
    path: '/users/view',
    name: 'View User',
    element: ViewUser,
  },
  {
    path: '/footer',
    name: 'Footer',
    element: Footer,
  },
  {
    path: '/privacy',
    name: 'Privacy Policy',
    element: PrivacyPolicy,
  },
  {
    path: '/terms',
    name: 'Terms and Conditions',
    element: TermsCondition,
  },
  {
    path: '/shipping',
    name: 'Shipping Policy',
    element: ShippingPolicy,
  },
  {
    path: '/common-section',
    name: 'Common Section',
    element: CommonSection,
  },
  {
    path: '/reports',
    name: 'Reports',
    element: Report,
  },
  {
    path: '/analytics',
    name: 'Analytics',
    element: Analytics,
  },
  {
    path: '/customer-ledger',
    name: 'Customer Ledger',
    element: UserLedger,
  },
  {
    path: '/customer-ledger/view/:id',
    name: 'View Ledger',
    element: ViewLedger,
  },
  {
    path: '/delivery-charges',
    name: 'Delivery Charges',
    element: DeliveryCharges,
  },
];