import { strengthToColor, strengthToLabel } from "../utils/passwordTools";

export default function PasswordStrengthMeter({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">Strength score</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
          {strengthToLabel(analysis.score)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${strengthToColor(analysis.score)}`}
          style={{ width: `${analysis.score}%` }}
        />
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-300">
        {analysis.feedback?.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
