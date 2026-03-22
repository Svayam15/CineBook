import { Film } from "lucide-react";

const AuthLayout = ({ children, subtitle = "Your ultimate movie booking experience" }) => {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Film className="text-primary" size={36} />
            <h1 className="font-heading text-4xl font-bold text-white tracking-tight">
              Cine<span className="text-primary">Book</span>
            </h1>
          </div>
          {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-700 text-xs mt-6">
          © 2026 CineBook. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;