import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  School,
  Users,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  Award,
  TrendingUp,
  Calculator,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { getDashboardAnalytics } from '../services/reportService';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getDashboardAnalytics();
      setData(result);
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating live academic analytics..." />;
  if (!data) return null;

  const { kpis, schoolWiseStats, standardWiseStats, mediumWiseStats } = data;

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Real-time overview of registered schools, students, and examination performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={loadAnalytics} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link to="/schools" className="btn-secondary">
            <Plus className="h-4 w-4" />
            Add School
          </Link>
          <Link to="/students" className="btn-primary">
            <Plus className="h-4 w-4" />
            Register Student
          </Link>
        </div>
      </div>

      {/* 8 KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Schools"
          value={kpis.totalSchools.toLocaleString()}
          subtitle="Registered institutions"
          icon={School}
          color="blue"
        />
        <StatCard
          title="Total Students"
          value={kpis.totalStudents.toLocaleString()}
          subtitle="Active enrolled records"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Male Students"
          value={kpis.maleStudents.toLocaleString()}
          subtitle={
            kpis.totalStudents > 0
              ? `${((kpis.maleStudents / kpis.totalStudents) * 100).toFixed(1)}% of total`
              : '0% of total'
          }
          icon={UserCheck}
          color="cyan"
        />
        <StatCard
          title="Total Female Students"
          value={kpis.femaleStudents.toLocaleString()}
          subtitle={
            kpis.totalStudents > 0
              ? `${((kpis.femaleStudents / kpis.totalStudents) * 100).toFixed(1)}% of total`
              : '0% of total'
          }
          icon={UserPlus}
          color="pink"
        />
        <StatCard
          title="Examination Records"
          value={kpis.totalExams.toLocaleString()}
          subtitle="Evaluated mark sheets"
          icon={FileSpreadsheet}
          color="violet"
        />
        <StatCard
          title="Total Obtained Marks"
          value={kpis.totalObtainedMarks.toLocaleString()}
          subtitle="Aggregate scored marks"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Total Maximum Marks"
          value={kpis.totalMaxMarks.toLocaleString()}
          subtitle="Aggregate exam ceiling"
          icon={Calculator}
          color="sky"
        />
        <StatCard
          title="Average Percentage"
          value={`${kpis.averagePercentage}%`}
          subtitle="Overall institutional mean"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Charts Row: Standard-wise & Medium-wise */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Standard-wise Student Statistics */}
        <div className="card-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Standard-Wise Student Statistics
              </h2>
              <p className="text-xs text-slate-500">
                Enrollment distribution across academic standards
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {standardWiseStats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No student data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={standardWiseStats} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="standard" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="male" name="Male" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="female" name="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Medium-wise Student Statistics */}
        <div className="card-panel p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Medium-Wise Statistics</h2>
            <p className="text-xs text-slate-500">Share of students by instruction medium</p>
          </div>

          <div className="h-72 w-full">
            {mediumWiseStats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No medium data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mediumWiseStats}
                    dataKey="students"
                    nameKey="medium"
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={4}
                  >
                    {mediumWiseStats.map((entry, idx) => (
                      <Cell key={entry.medium} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* School-wise Student & Performance Statistics Table */}
      <div className="card-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              School-Wise Student & Performance Statistics
            </h2>
            <p className="text-xs text-slate-500">
              Breakdown of registered students, evaluated exams, and average percentage per school
            </p>
          </div>
          <Link to="/schools" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Schools →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">School Name</th>
                <th className="px-5 py-3">District</th>
                <th className="px-5 py-3 text-right">Total Students</th>
                <th className="px-5 py-3 text-right">Exams Recorded</th>
                <th className="px-5 py-3 text-right">Average %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {schoolWiseStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No schools registered yet.
                  </td>
                </tr>
              ) : (
                schoolWiseStats.map((sc) => (
                  <tr key={sc.schoolId} className="hover:bg-blue-50/40">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{sc.schoolName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{sc.district}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-blue-700">
                      {sc.students}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">{sc.exams}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        {sc.avgPercentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}