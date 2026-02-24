import React, { useState } from 'react';
import { HashRouter, Route, Routes, NavLink, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FulfillmentPage from './pages/FulfillmentPage';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import RecipesPage from './pages/RecipesPage';
import AdminTutorialPage from './pages/AdminTutorialPage';
import DeliveriesPage from './pages/DeliveriesPage';
import { ShoppingCart, ClipboardList, BarChart3, CalendarDays, Lock, Unlock, Droplets, X, BookOpen, HelpCircle, PlayCircle, Truck } from 'lucide-react';
import { useApp } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { cart, isAdmin, login, logout, notifications, dismissNotification } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);

  const navLinkClasses = "flex flex-col items-center justify-center text-center px-1 py-1 text-brand-cream hover:bg-brand-light-green/20 rounded-lg transition-colors duration-200 w-full";
  const activeLinkClasses = "bg-brand-light-green/30";

  const handleAdminToggle = () => {
    if (isAdmin) {
      logout();
    } else {
      setShowLoginModal(true);
      setLoginError(false);
      setPasswordInput('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(passwordInput);
    if (success) {
      setShowLoginModal(false);
      setPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const scrollToHowTo = () => {
    const executeScroll = () => {
      const element = document.getElementById('how-to-order');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(executeScroll, 100);
    } else {
      executeScroll();
    }
  };

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      {/* Real-time Notifications */}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 max-w-xs ${
              notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
              notification.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex-grow">
              <p className="text-sm font-bold">{notification.message}</p>
            </div>
            <button 
              onClick={() => dismissNotification(notification.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <header className="bg-brand-green text-white shadow-lg p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
           <NavLink to="/" className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-brand-orange" />
              <div className="flex flex-col">
                  <h1 className="text-xl md:text-2xl font-bold font-serif text-brand-cream leading-tight">Living Water</h1>
                  <p className="text-[10px] uppercase tracking-widest text-brand-light-green font-semibold">La Sierra Tongan SDA Fellowship</p>
              </div>
          </NavLink>
          <button 
            onClick={handleAdminToggle} 
            title={isAdmin ? 'Logout Admin' : 'Admin Login'} 
            className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-brand-orange/20' : 'hover:bg-brand-light-green/20'}`}
          >
            {isAdmin ? <Unlock className="h-6 w-6 text-brand-orange" /> : <Lock className="h-6 w-6 text-brand-cream" />}
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 mb-24">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/fulfillment" element={<ProtectedRoute><FulfillmentPage /></ProtectedRoute>} />
          <Route path="/deliveries" element={<ProtectedRoute><DeliveriesPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/admin-tutorial" element={<ProtectedRoute><AdminTutorialPage /></ProtectedRoute>} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-brand-green shadow-top-lg z-20 p-2 border-t border-brand-light-green/20">
        <div className={`container mx-auto grid ${isAdmin ? 'grid-cols-7' : 'grid-cols-2'} gap-1 transition-all duration-300`}>
          <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
            <div className="relative">
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-brand-green">
                  {totalCartItems}
                </span>
              )}
            </div>
            <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Order</span>
          </NavLink>
          
          {!isAdmin && (
            <button onClick={scrollToHowTo} className={navLinkClasses}>
              <HelpCircle className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">How to</span>
            </button>
          )}

          {isAdmin && (
            <>
              <NavLink to="/fulfillment" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Fulfill</span>
              </NavLink>
              <NavLink to="/deliveries" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <Truck className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Deliveries</span>
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Stats</span>
              </NavLink>
              <NavLink to="/recipes" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <BookOpen className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Recipes</span>
              </NavLink>
              <NavLink to="/schedule" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <CalendarDays className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Dates</span>
              </NavLink>
              <NavLink to="/admin-tutorial" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                <PlayCircle className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-[9px] md:text-[10px] mt-1 font-bold uppercase tracking-tighter">Tutorial</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Custom Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden border border-brand-light-green">
            <div className="bg-brand-green p-6 text-center relative">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute right-4 top-4 text-brand-cream/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <Lock className="mx-auto h-12 w-12 text-brand-orange mb-2" />
              <h2 className="text-2xl font-bold text-white font-serif">Admin Login</h2>
              <p className="text-brand-light-green text-sm">Access fulfillment and dashboard tools</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-brand-brown mb-2 uppercase tracking-wide">Password</label>
                <input
                  autoFocus
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError(false);
                  }}
                  placeholder="Enter password"
                  className={`w-full p-4 border rounded-xl bg-white focus:ring-2 focus:ring-brand-orange outline-none transition-all ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                />
                {loginError && (
                  <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">Incorrect password. Please try again.</p>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="submit"
                  className="w-full bg-brand-orange text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg active:scale-95"
                >
                  Login to Dashboard
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-full text-gray-500 font-semibold py-2 text-sm hover:text-brand-brown transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;