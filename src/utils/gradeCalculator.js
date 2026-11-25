export const JUNIOR_STANDARDS = ['1st', '2nd', '3rd'];

export function getSubjectMaxMarksByStandard(standard) {
  const isJunior = JUNIOR_STANDARDS.includes(String(standard || '').trim());
  return {
    sub1Max: isJunior ? 100 : 150,
    sub2Max: 100,
    totalMax: isJunior ? 200 : 250,
  };
}

export function calculateTwoSubjectResult({
  subject1Marks,
  subject2Marks,
  standard = '4th',
  resultOptions = [],
}) {
  const { sub1Max, sub2Max, totalMax } = getSubjectMaxMarksByStandard(standard);

  const s1 = Math.min(sub1Max, Math.max(0, Number(subject1Marks) || 0));
  const s2 = Math.min(sub2Max, Math.max(0, Number(subject2Marks) || 0));
  const obtainedMarks = Number((s1 + s2).toFixed(2));
  const percentage =
    totalMax > 0 ? Number(((obtainedMarks / totalMax) * 100).toFixed(2)) : 0;

  const activeOptions = [...resultOptions]
    .filter((opt) => opt.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const autoMatch = activeOptions.find(
    (opt) =>
      !['ABSENT', 'WITHHELD'].includes(opt.option_code) &&
      percentage >= Number(opt.min_percentage) &&
      percentage <= Number(opt.max_percentage)
  );

  const fallback = activeOptions[activeOptions.length - 1] || null;
  const matchedOption = autoMatch || fallback;

  return {
    sub1Max,
    sub2Max,
    totalMarks: totalMax,
    obtainedMarks,
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