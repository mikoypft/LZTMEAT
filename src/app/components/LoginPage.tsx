import { useState, useEffect } from 'react';
import { LogIn, User, Lock, Building2, Factory, ShieldCheck, ShoppingCart } from 'lucide-react';
import { login } from '@/utils/api';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export type UserRole = 'ADMIN' | 'STORE' | 'PRODUCTION' | 'POS';

export interface UserData {
  username: string;
  role: UserRole;
  fullName: string;
  employeeRole?: 'Store' | 'Production' | 'Employee'; // Employee-specific role
  permissions?: string[]; // Permissions for Employee role
  storeId?: string; // Store assignment
  storeName?: string; // Store name
}

interface LoginPageProps {
  onLogin: (userData: UserData) => void;
}

// Quick login options for demo
const QUICK_LOGIN_OPTIONS = [
  { username: 'admin', password: 'admin123', role: 'ADMIN' as UserRole },
  { username: 'mark_sioson', password: '123456', role: 'POS' as UserRole }
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [initStatus, setInitStatus] = useState<string>('Initializing...');

  // Initialize default users on component mount
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        console.log('Checking if database needs initialization...');
        setInitStatus('Testing database connection...');
        
        // TEST: Call the test-login endpoint to force create admin and verify it works
        console.log('Calling test-login endpoint...');
        const testResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-26f4e13f/auth/test-login`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('✅ Test login successful:', testData);
          setInitStatus('✅ Database ready - Admin user verified');
        } else {
          const testError = await testResponse.json();
          console.error('❌ Test login failed:', testError);
          setInitStatus(`❌ Database test failed: ${testError.message || JSON.stringify(testError)}`);
        }
        
        // First, try to reset/initialize the database to ensure admin user exists
        const resetResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-26f4e13f/auth/reset`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (resetResponse.ok) {
          const resetData = await resetResponse.json();
          console.log('Database reset/initialized:', resetData);
        } else {
          console.error('Database reset failed:', await resetResponse.text());
        }
        
        // Then verify user initialization
        const initResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-26f4e13f/auth/init`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (initResponse.ok) {
          const initData = await initResponse.json();
          console.log('User initialization check:', initData);
        } else {
          console.error('User initialization check failed:', await initResponse.text());
        }
        
        // Debug: Check what users exist
        const debugResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-26f4e13f/auth/debug`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('Current users in database:', debugData);
        } else {
          console.error('Debug check failed:', await debugResponse.text());
        }
      } catch (error) {
        console.error('Error checking user initialization:', error);
      }
    };
    
    initializeUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      
      // Log them in with their actual role
      onLogin({
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        employeeRole: user.employeeRole,
        permissions: user.permissions,
        storeId: user.storeId,
        storeName: user.storeName,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    const credentials = QUICK_LOGIN_OPTIONS.find(opt => opt.role === role);
    if (!credentials) return;

    setLoading(true);
    setError('');

    try {
      const user = await login(credentials.username, credentials.password);
      onLogin({
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        employeeRole: user.employeeRole,
        permissions: user.permissions,
        storeId: user.storeId,
        storeName: user.storeName,
      });
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError(err.message || 'Quick login failed');
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'ADMIN' as UserRole,
      label: 'Administrator',
      icon: ShieldCheck,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Full system access',
    },
    {
      value: 'STORE' as UserRole,
      label: 'Store Manager',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'POS & Store Inventory',
    },
    {
      value: 'PRODUCTION' as UserRole,
      label: 'Production Manager',
      icon: Factory,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Production Dashboard',
    },
    {
      value: 'POS' as UserRole,
      label: 'POS Cashier',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'POS Only Access',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl mb-2">LZT Meat Products</h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
          <h2 className="text-xl mb-6">Sign In</h2>

          {/* Init Status */}
          {initStatus && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              initStatus.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
              initStatus.includes('❌') ? 'bg-red-50 border border-red-200 text-red-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {initStatus}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Toggle */}
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCredentials ? 'Hide' : 'Show'} demo credentials
          </button>

          {showCredentials && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs space-y-2">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1">
                <p>Admin: <code className="bg-background px-2 py-1 rounded">admin / admin123</code></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}