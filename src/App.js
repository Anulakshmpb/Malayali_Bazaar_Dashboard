import './App.css';
import Login from './Components/Shared/Login';
import AppBar from './Components/Shared/AppBar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Components/Pages/Dashboard';
import AdminUsers from './Components/Pages/Settings/AdminUsers';
import AdminSettings from './Components/Pages/Settings/AdminSettings';
import Orders from './Components/Pages/Orders/Orders';
import Products from './Components/Pages/Products/Products';
import ViewOrder from './Components/Pages/Orders/ViewOrder';
import AddProduct from './Components/Pages/Products/AddProduct';
import StockManagement from './Components/Pages/Products/StockManagement';
import Category from './Components/Pages/Products/Category';
import Brand from './Components/Pages/Products/Brand';
import Section from './Components/Pages/Section/Section';
import ViewSection from './Components/Pages/Section/ViewSection';
import Banner from './Components/Pages/Banner/Banner';
import User from './Components/Pages/Users/User';
import ViewUser from './Components/Pages/Users/ViewUser';
import Footer from './Components/Pages/SiteManagement/Footer';
import PrivacyPolicy from './Components/Pages/SiteManagement/PrivacyPolicy';
import TermsCondition from './Components/Pages/SiteManagement/TermsCondition';
import ShippingPolicy from './Components/Pages/SiteManagement/Shipping';
import Report from './Components/Pages/Reports/Report';
import Analytics from './Components/Pages/Reports/Analytics';
import UserLedger from './Components/Pages/UserLedger/UserLedger';
import ViewLedger from './Components/Pages/UserLedger/ViewLedger';
import CommonSection from './Components/Pages/SiteManagement/CommonSection';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-white">
        <AppBar>
          <div className='mt-[100px] min-h-[calc(100vh-100px)] bg-white'>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Dashboard />} />

              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />

              <Route path="/orders" element={<Orders />} />
              <Route path='/orders/view' element={<ViewOrder />} />

              <Route path="/products" element={<Products />} />
              <Route path="/products/add" element={<AddProduct />} />
              <Route path="/products/stock" element={<StockManagement />} />
              <Route path="/products/category" element={<Category />} />
              <Route path='/products/brand' element={<Brand />} />

              <Route path='/section' element={<Section />} />
              <Route path='/section/view' element={<ViewSection />} />

              <Route path='/banner' element={<Banner />} />

              <Route path='/users' element={<User />} />
              <Route path='/users/view' element={<ViewUser />} />

              <Route path='/footer' element={<Footer />} />
              <Route path='/privacy' element={<PrivacyPolicy />} />
              <Route path='/terms' element={<TermsCondition />} />
              <Route path='/shipping' element={<ShippingPolicy />} />
              <Route path='/common-section' element={<CommonSection />} />


              <Route path='/reports' element={<Report />} />
              <Route path='/analytics' element={<Analytics />} />

              <Route path='/customer-ledger' element={<UserLedger />} />
              <Route path='/customer-ledger/view/id' element={<ViewLedger />} />
            </Routes>
          </div>
        </AppBar>
      </div>
    </Router>
  );
}

export default App;
