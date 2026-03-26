export function strengthToColor(score) {
  if (score <= 25) return "bg-rose-500";
  if (score <= 50) return "bg-orange-400";
  if (score <= 75) return "bg-amber-400";
  return "bg-emerald-400";
}

export function strengthToLabel(score) {
  if (score <= 25) return "Weak";
  if (score <= 50) return "Fair";
  if (score <= 75) return "Good";
  return "Strong";
}
