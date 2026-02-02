import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { officerAPI } from '../../services/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function OfficerDashboard() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, performanceRes] = await Promise.all([
                officerAPI.getDashboard(),
                officerAPI.getPerformance(30)
            ]);

            setDashboardData(dashboardRes.data);
            setPerformance(performanceRes.data.daily_resolutions || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = dashboardData ? [
        {
            label: 'Active Assignments',
            value: dashboardData.stats.pending,
            icon: ClipboardDocumentListIcon,
            color: 'from-blue-500 to-cyan-400',
            desc: 'In progress'
        },
        {
            label: 'Resolved Today',
            value: dashboardData.stats.resolved_today,
            icon: CheckCircleIcon,
            color: 'from-emerald-500 to-teal-400',
            desc: `${dashboardData.stats.resolved_this_week} this week`
        },
        {
            label: 'Critical Issues',
            value: dashboardData.stats.critical_issues,
            icon: ExclamationTriangleIcon,
            color: 'from-red-500 to-orange-400',
            desc: 'Needs immediate attention'
        },
        {
            label: 'Avg Resolution',
            value: `${dashboardData.stats.avg_resolution_hours.toFixed(1)}h`,
            icon: ClockIcon,
            color: 'from-purple-500 to-pink-400',
            desc: 'Your average time'
        }
    ] : [];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="spinner"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.first_name}! 👋
                </h1>
                <p className="text-neutral-400">
                    Department: <span className="text-primary-400">{user?.department || 'Not assigned'}</span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="glass-card p-6 card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1">{stat.value}</p>
                            <p className="text-neutral-400 text-sm">{stat.label}</p>
                            <p className="text-xs text-neutral-500 mt-1">{stat.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts and Actions */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Performance Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5" />
                        Your Resolution Trend (30 Days)
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performance}>
                                <defs>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                                />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorResolved)"
                                    name="Resolved"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-4">
                        <Link
                            to="/officer/complaints"
                            className="block p-4 rounded-xl border border-white/10 hover:border-primary-500 hover:bg-primary-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <ClipboardDocumentListIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium">My Assignments</p>
                                    <p className="text-sm text-neutral-400">
                                        {dashboardData?.stats.total_assigned || 0} total assigned
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/officer/complaints?status=in_progress"
                            className="block p-4 rounded-xl border border-white/10 hover:border-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <ClockIcon className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium">In Progress</p>
                                    <p className="text-sm text-neutral-400">
                                        {dashboardData?.stats.pending || 0} pending
                                    </p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/officer/complaints?priority=critical"
                            className="block p-4 rounded-xl border border-white/10 hover:border-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="font-medium">Critical Issues</p>
                                    <p className="text-sm text-neutral-400">
                                        {dashboardData?.stats.critical_issues || 0} critical
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                    <div className="text-center p-6 rounded-xl bg-white/5">
                        <p className="text-4xl font-bold text-green-400">
                            {dashboardData?.stats.resolved_this_week || 0}
                        </p>
                        <p className="text-neutral-400 mt-2">Resolved This Week</p>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-white/5">
                        <p className="text-4xl font-bold text-blue-400">
                            {dashboardData?.stats.total_assigned || 0}
                        </p>
                        <p className="text-neutral-400 mt-2">Total Assigned</p>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-white/5">
                        <p className="text-4xl font-bold text-purple-400">
                            {dashboardData?.stats.avg_resolution_hours?.toFixed(1) || 0}h
                        </p>
                        <p className="text-neutral-400 mt-2">Avg Resolution Time</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
