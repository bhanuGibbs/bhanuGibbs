import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

// Lazy-loaded page components for code splitting
const Home = lazy(() => import('./pages/Home'));
const Billing = lazy(() => import('./pages/Billing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Products = lazy(() => import('./pages/Products'));
const Quotations = lazy(() => import('./pages/Quotations'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const SetupCompany = lazy(() => import('./pages/SetupCompany'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Info = lazy(() => import('./pages/Info'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const POSDashboard = lazy(() => import('./pages/pos/POSDashboard'));
const POSTerminal = lazy(() => import('./pages/pos/POSTerminal'));
const POSProducts = lazy(() => import('./pages/pos/POSProducts'));
const POSTransactions = lazy(() => import('./pages/pos/POSTransactions'));
const POSInventory = lazy(() => import('./pages/pos/POSInventory'));
const DeliveryChallans = lazy(() => import('./pages/DeliveryChallans'));
const DeliveryChallanForm = lazy(() => import('./components/DeliveryChallanForm'));
const ChallanProducts = lazy(() => import('./pages/ChallanProducts'));
const SalesInventoryDashboard = lazy(() => import('./pages/SalesInventoryDashboard'));

const RequireAuth = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-soft">
          <p className="text-sm text-slate-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.is_profile_complete && location.pathname !== '/setup-company') {
    return <Navigate to="/setup-company" replace />;
  }

  return children;
};

const RequireBusinessProfile = ({ profiles, children }) => {
  const { user } = useAuth();
  if (profiles.includes(user?.business_profile)) return children;
  return <Navigate to={user?.business_profile === 'sales_inventory' ? '/sales-inventory' : '/dashboard'} replace />;
};

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-soft">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated users go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Unauthenticated users always see the landing page
  return <Navigate to="/landing" replace />;
};

const RequireAdmin = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'Admin' && user?.role !== 'Super Admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-soft">
              <p className="text-sm text-slate-600">Loading...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<RootRedirect />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/new"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <Home />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/billing"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <Billing />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/customers"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <Customers />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/products"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <Products />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/quotations"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <Quotations />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/setup-company"
          element={
            <RequireAuth>
              <SetupCompany />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/info"
          element={
            <RequireAuth>
              <Info />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminUsers />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        {/* POS Routes */}
        <Route
          path="/pos"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <POSDashboard />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/pos/terminal"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <POSTerminal />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/pos/products"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <POSProducts />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/pos/transactions"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <POSTransactions />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/pos/inventory"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <POSInventory />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        {/* Delivery Challan Routes */}
        <Route
          path="/delivery-challans"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <DeliveryChallans />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/delivery-challan/new"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <DeliveryChallanForm />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/challan-products"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['invoice', 'pos', 'delivery_challan']}>
                <ChallanProducts />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route
          path="/sales-inventory"
          element={
            <RequireAuth>
              <RequireBusinessProfile profiles={['sales_inventory']}>
                <SalesInventoryDashboard />
              </RequireBusinessProfile>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
