import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCafe } from '../store/CafeContext';
import { UserRole } from '../types';
import { ChefHat, User, ShieldCheck, Coffee, ArrowLeft, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useCafe();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setInputValue('');
    setPasswordInput('');
    setError('');
    setShowSignup(false);
  };

  /**
   * CUSTOMER SIGNUP
   * Creates a new customer account with email + password and logs in via API
   */
  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !passwordInput.trim()) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputValue.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/customer/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputValue.trim(),
          password: passwordInput,
          name: inputValue.split('@')[0], // Use email prefix as name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Store JWT token ONLY (not password or email)
      localStorage.setItem('jwt_token', data.token);
      login({ 
        role: UserRole.CUSTOMER, 
        name: data.user.name, 
        id: data.user.id, 
        email: data.user.email,
        token: data.token 
      });
      navigate('/customer');
    } catch (err) {
      setError('Network error. Make sure backend is running on ' + API_BASE_URL);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * CUSTOMER LOGIN
   * Authenticates customer with email and password via API
   */
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !passwordInput.trim()) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputValue.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputValue.trim(),
          password: passwordInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store JWT token ONLY (not password or email)
      localStorage.setItem('jwt_token', data.token);
      login({ 
        role: UserRole.CUSTOMER, 
        name: data.user.name, 
        id: data.user.id,
        email: data.user.email,
        token: data.token 
      });
      navigate('/customer');
    } catch (err) {
      setError('Network error. Make sure backend is running on ' + API_BASE_URL);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * STAFF LOGIN (Admin/Kitchen)
   * Authenticates admin or kitchen staff with 4-digit PIN via API
   */
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Validate PIN format
    if (inputValue.length !== 4 || isNaN(Number(inputValue))) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const role = selectedRole === UserRole.ADMIN ? 'admin' : 'kitchen';
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          pin: inputValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid PIN');
        return;
      }

      // Store JWT token ONLY (not PIN)
      localStorage.setItem('jwt_token', data.token);
      login({ 
        role: selectedRole!, 
        name: data.user.name, 
        id: data.user.id,
        email: data.user.email,
        token: data.token 
      });

      // Navigate to appropriate dashboard
      if (selectedRole === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        navigate('/kitchen');
      }
    } catch (err) {
      setError('Network error. Make sure backend is running on ' + API_BASE_URL);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (selectedRole === UserRole.CUSTOMER) {
      if (showSignup) {
        handleCustomerSignup(e);
      } else {
        handleCustomerLogin(e);
      }
    } else {
      handleStaffLogin(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cafe-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-cafe-100 transition-all duration-300">
        
        {/* Header */}
        <div className="p-8 text-center bg-cafe-800 text-white relative">
          {selectedRole && (
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute left-4 top-8 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm animate-bounce-slight">
              <Coffee size={32} className="text-brand-orange" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">CafeOS</h1>
          <p className="text-cafe-300">
            {selectedRole ? `${showSignup ? 'Create Account' : 'Login'} as ${selectedRole.toLowerCase()}` : 'Select your role to access'}
          </p>
        </div>

        {/* Role Selection View */}
        {!selectedRole && (
          <div className="p-8 space-y-4">
            <button
              onClick={() => handleRoleSelect(UserRole.CUSTOMER)}
              className="w-full group relative flex items-center p-4 rounded-xl border-2 border-cafe-100 hover:border-brand-orange hover:shadow-lg transition-all duration-300 bg-white"
            >
              <div className="bg-orange-50 p-3 rounded-lg text-brand-orange group-hover:scale-110 transition-transform">
                <User size={24} />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-bold text-cafe-800">Customer</h3>
                <p className="text-sm text-cafe-500">Dine-in or Online ordering</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.KITCHEN)}
              className="w-full group relative flex items-center p-4 rounded-xl border-2 border-cafe-100 hover:border-blue-500 hover:shadow-lg transition-all duration-300 bg-white"
            >
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                <ChefHat size={24} />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-bold text-cafe-800">Kitchen Staff</h3>
                <p className="text-sm text-cafe-500">Manage incoming orders</p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.ADMIN)}
              className="w-full group relative flex items-center p-4 rounded-xl border-2 border-cafe-100 hover:border-purple-500 hover:shadow-lg transition-all duration-300 bg-white"
            >
              <div className="bg-purple-50 p-3 rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <div className="ml-4 text-left">
                <h3 className="font-bold text-cafe-800">Admin</h3>
                <p className="text-sm text-cafe-500">Analytics & Control</p>
              </div>
            </button>
          </div>
        )}

        {/* Customer Login/Signup Form */}
        {selectedRole === UserRole.CUSTOMER && (
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-cafe-600 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cafe-300 focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all text-lg"
                  placeholder="e.g. john@adani.cafe"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-cafe-600 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cafe-300 focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all text-lg"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || !passwordInput.trim() || isLoading}
                className="w-full bg-cafe-800 text-white py-4 rounded-xl font-bold hover:bg-cafe-900 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="mr-2 animate-spin" />
                    {showSignup ? 'Creating Account...' : 'Logging in...'}
                  </>
                ) : (
                  <>
                    {showSignup ? 'Create Account' : 'Login'} <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </button>

              {/* Toggle between Login and Signup */}
              <button
                type="button"
                onClick={() => {
                  setShowSignup(!showSignup);
                  setError('');
                  setPasswordInput('');
                }}
                className="w-full text-center text-cafe-600 hover:text-cafe-800 text-sm font-medium transition-colors"
                disabled={isLoading}
              >
                {showSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>
            </form>
          </div>
        )}

        {/* Staff Login Form (PIN) */}
        {selectedRole && selectedRole !== UserRole.CUSTOMER && (
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-cafe-600 mb-2">
                  Enter Access PIN
                </label>
                <input
                  type="password"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 rounded-xl border border-cafe-300 focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange outline-none transition-all text-lg text-center font-mono tracking-widest"
                  placeholder="●●●●"
                  maxLength={4}
                  disabled={isLoading}
                  inputMode="numeric"
                />
                <p className="text-xs text-cafe-400 mt-2 italic">
                  {selectedRole === UserRole.ADMIN ? 'Admin PIN' : 'Kitchen PIN'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={inputValue.length !== 4 || isLoading}
                className="w-full bg-cafe-800 text-white py-4 rounded-xl font-bold hover:bg-cafe-900 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Access Dashboard <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
        
        <div className="bg-cafe-50 px-8 py-4 text-center text-xs text-cafe-400 border-t border-cafe-100">
          🔐 Secure JWT Authentication • Hackathon Version 2.0
        </div>
      </div>
    </div>
  );
};