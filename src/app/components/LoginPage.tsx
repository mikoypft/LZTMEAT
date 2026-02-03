import { useState } from "react";
import {
  LogIn,
  User,
  Lock,
  Building2,
  Factory,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { login } from "@/utils/api";

export type UserRole = "ADMIN" | "STORE" | "PRODUCTION" | "POS";

export interface UserData {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  employeeRole?: "Store" | "Production" | "Employee"; // Employee-specific role
  permissions?: string[]; // Permissions for Employee role
  storeId?: string; // Store assignment
  storeName?: string; // Store name
}

interface LoginPageProps {
  onLogin: (userData: UserData) => void;
}

// Quick login options for demo
const QUICK_LOGIN_OPTIONS = [
  { username: "admin", password: "admin123", role: "ADMIN" as UserRole },
  { username: "mark_sioson", password: "123456", role: "POS" as UserRole },
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  
  // Only show demo credentials in development (localhost), not on Plesk deployment
  const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const showDemoCredentials = isDevelopment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(username, password);

      // Log them in with their actual role
      onLogin({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        employeeRole: user.employeeRole,
        permissions: user.permissions,
        storeId: user.storeId,
        storeName: user.storeName,
      });
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    const credentials = QUICK_LOGIN_OPTIONS.find((opt) => opt.role === role);
    if (!credentials) return;

    setLoading(true);
    setError("");

    try {
      const user = await login(credentials.username, credentials.password);
      onLogin({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        employeeRole: user.employeeRole,
        permissions: user.permissions,
        storeId: user.storeId,
        storeName: user.storeName,
      });
    } catch (err: any) {
      console.error("Quick login error:", err);
      setError(err.message || "Quick login failed");
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "ADMIN" as UserRole,
      label: "Administrator",
      icon: ShieldCheck,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Full system access",
    },
    {
      value: "STORE" as UserRole,
      label: "Store Manager",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "POS & Store Inventory",
    },
    {
      value: "PRODUCTION" as UserRole,
      label: "Production Manager",
      icon: Factory,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Production Dashboard",
    },
    {
      value: "POS" as UserRole,
      label: "POS Cashier",
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "POS Only Access",
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
          <p className="text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg">
          <h2 className="text-xl mb-6">Sign In</h2>

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

          {/* Demo Credentials Toggle - Only show in development */}
          {showDemoCredentials && (
            <>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCredentials ? "Hide" : "Show"} demo credentials
              </button>

              {showCredentials && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Demo Credentials:
                  </p>
                  <div className="p-4 bg-muted/50 rounded-lg text-xs space-y-2">
                    <div className="space-y-1">
                      <p>
                        Admin:{" "}
                        <code className="bg-background px-2 py-1 rounded">
                          admin / admin123
                        </code>
                      </p>
                      <p>
                        Store:{" "}
                        <code className="bg-background px-2 py-1 rounded">
                          store_manager / store123
                        </code>
                      </p>
                      <p>
                        Production:{" "}
                        <code className="bg-background px-2 py-1 rounded">
                          production / prod123
                        </code>
                      </p>
                      <p>
                        POS:{" "}
                        <code className="bg-background px-2 py-1 rounded">
                          mark_sioson / 123456
                        </code>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-muted-foreground mb-2 pt-2">
                    Quick Login:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => quickLogin("ADMIN")}
                      disabled={loading}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Login as Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => quickLogin("POS")}
                      disabled={loading}
                      className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Login as POS
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
