import React from "react";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--etihuku-black)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(80,70,229,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm px-4 relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-[10px] flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--etihuku-indigo)" }}
          >
            <span
              className="text-white text-[20px] font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              E
            </span>
          </div>
          <h1
            className="text-[22px] font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome to Etihuku
          </h1>
          <p className="text-[13px] text-[var(--etihuku-gray-400)] mt-1">
            AI Data Operations Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="card p-6 space-y-5"
          style={{ boxShadow: "0 0 40px rgba(80,70,229,0.12)" }}
        >
          <h2
            className="text-[16px] font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sign in to your account
          </h2>

          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-label text-[var(--etihuku-gray-400)]">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@organisation.co.za"
                className="w-full h-10 px-3 rounded-[6px] text-[14px] outline-none transition-all"
                style={{
                  backgroundColor: "var(--etihuku-gray-900)",
                  border: "1px solid var(--etihuku-gray-700)",
                  color: "var(--etihuku-white)",
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-label text-[var(--etihuku-gray-400)]">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[12px] text-[var(--etihuku-indigo-light)] hover:text-[var(--etihuku-indigo)] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-[6px] text-[14px] outline-none transition-all"
                style={{
                  backgroundColor: "var(--etihuku-gray-900)",
                  border: "1px solid var(--etihuku-gray-700)",
                  color: "var(--etihuku-white)",
                }}
              />
            </div>

            {/* Submit */}
            <a href="/overview" className="btn btn-primary w-full justify-center text-[14px]">
              Sign in
            </a>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--etihuku-gray-700)]" />
            <span className="text-caption text-[var(--etihuku-gray-500)]">or</span>
            <div className="flex-1 h-px bg-[var(--etihuku-gray-700)]" />
          </div>

          {/* SSO */}
          <div className="space-y-2">
            <button className="btn btn-secondary w-full justify-center text-[13px] gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button className="btn btn-secondary w-full justify-center text-[13px] gap-2">
              <svg width="16" height="16" viewBox="0 0 23 23" fill="none">
                <path d="M0 0h10.93v10.93H0z" fill="#F25022"/>
                <path d="M12.07 0H23v10.93H12.07z" fill="#7FBA00"/>
                <path d="M0 12.07h10.93V23H0z" fill="#00A4EF"/>
                <path d="M12.07 12.07H23V23H12.07z" fill="#FFB900"/>
              </svg>
              Continue with Azure AD
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-[var(--etihuku-gray-500)] mt-6">
          Don&apos;t have an account?{" "}
          <a href="#" className="text-[var(--etihuku-indigo-light)] hover:text-[var(--etihuku-indigo)] transition-colors">
            Contact sales
          </a>
        </p>
      </div>
    </div>
  );
}
