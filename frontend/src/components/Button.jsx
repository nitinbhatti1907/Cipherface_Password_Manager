export default function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary:
      "bg-cyanGlow text-slate-950 hover:shadow-glow hover:-translate-y-0.5 focus:ring-2 focus:ring-cyanGlow/40",
    dark: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
    danger: "bg-rose-500 text-white hover:bg-rose-400",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
