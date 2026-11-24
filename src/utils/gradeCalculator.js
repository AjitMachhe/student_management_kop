export function calculateExamResult(marksArray, maxPerSubject = 100, resultOptions = []) {
  const numericMarks = marksArray.map((m) => Math.max(0, Number(m) || 0));
  const totalMarks = numericMarks.length * (Number(maxPerSubject) || 100);
  const obtainedMarks = numericMarks.reduce((sum, val) => sum + val, 0);
  const percentage =
    totalMarks > 0 ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;

  // Match against active percentage-based result options (sorted by display_order)
  const activeOptions = [...resultOptions]
    .filter((opt) => opt.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  // Exclude special manual-only zero-range flags (ABSENT / WITHHELD) during auto-grading
  const autoMatch = activeOptions.find(
    (opt) =>
      !['ABSENT', 'WITHHELD'].includes(opt.option_code) &&
      percentage >= Number(opt.min_percentage) &&
      percentage <= Number(opt.max_percentage)
  );

  const fallback = activeOptions[activeOptions.length - 1] || null;
  const matchedOption = autoMatch || fallback;

  return {
    totalMarks: Number(totalMarks.toFixed(2)),
    obtainedMarks: Number(obtainedMarks.toFixed(2)),
    percentage,
    matchedOption,
    resultStatus: matchedOption ? matchedOption.option_label : percentage >= 35 ? 'Pass' : 'Fail',
    resultOptionId: matchedOption ? matchedOption.id : null,
  };
}

export const BADGE_COLOR_CLASSES = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  lime: 'bg-lime-50 text-lime-700 ring-lime-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-300',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
};