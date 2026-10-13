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
              
            </Routes>
          </div>
        </AppBar>
      </div>
    </Router>
  );
}

export default App;
