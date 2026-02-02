import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import { adminAPI, analyticsAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [trends, setTrends] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, trendsRes, heatmapRes] = await Promise.all([
                adminAPI.getDashboard(),
                analyticsAPI.getTrends(30, 'day'),
                adminAPI.getHeatmap({ days: 30 })
            ]);

            setDashboardData(dashboardRes.data);
            setTrends(trendsRes.data.complaints_trend || []);
            setHeatmapData(heatmapRes.data.heatmap || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = dashboardData ? [
        {
            label: 'Total Complaints',
            value: dashboardData.overview.total_complaints,
            icon: ClipboardDocumentListIcon,
            color: 'from-blue-500 to-cyan-400',
            change: `+${dashboardData.overview.today_complaints} today`
        },
        {
            label: 'Critical Issues',
            value: dashboardData.overview.critical_issues,
            icon: ExclamationTriangleIcon,
            color: 'from-red-500 to-orange-400',
            change: 'Needs attention'
        },
        {
            label: 'Pending Escalations',
            value: dashboardData.overview.pending_escalations,
            icon: ClockIcon,
            color: 'from-amber-500 to-yellow-400',
            change: 'Overdue complaints'
        },
        {
            label: 'Avg Resolution Time',
            value: `${dashboardData.overview.avg_resolution_hours.toFixed(1)}h`,
            icon: ArrowTrendingUpIcon,
            color: 'from-emerald-500 to-teal-400',
            change: 'Last 30 days'
        }
    ] : [];

    const categoryData = dashboardData ?
        Object.entries(dashboardData.category_breakdown).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        })) : [];

    const statusData = dashboardData ?
        Object.entries(dashboardData.status_breakdown).map(([name, value]) => ({
            name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
            value
        })) : [];

    const defaultCenter = [28.6139, 77.2090];

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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-neutral-400">
                        City-wide overview of civic complaints and operations
                    </p>
                </div>
                <Link to="/admin/analytics" className="btn-primary">
                    View Analytics →
                </Link>
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
                                <span className="text-xs text-neutral-400 bg-white/5 px-2 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-3xl font-bold mb-1">{stat.value}</p>
                            <p className="text-neutral-400 text-sm">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Trend Chart */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Complaints Trend (30 Days)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="period"
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
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Complaints by Category</h2>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Map and Status */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Heatmap */}
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Complaint Heatmap</h2>
                        <Link to="/admin/analytics" className="text-primary-400 text-sm hover:text-primary-300">
                            View Full Map →
                        </Link>
                    </div>
                    <div className="h-80 rounded-xl overflow-hidden">
                        <MapContainer
                            center={defaultCenter}
                            zoom={11}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {heatmapData.map((point, index) => (
                                <CircleMarker
                                    key={index}
                                    center={[point.lat, point.lng]}
                                    radius={Math.max(5, point.intensity * 15)}
                                    fillColor={
                                        point.status === 'resolved' ? '#10b981' :
                                            point.intensity > 0.7 ? '#ef4444' :
                                                point.intensity > 0.4 ? '#f59e0b' : '#3b82f6'
                                    }
                                    fillOpacity={0.6}
                                    stroke={false}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-semibold capitalize">{point.category}</p>
                                            <p>Status: {point.status}</p>
                                            <p>Severity: {(point.intensity * 100).toFixed(0)}%</p>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Status Overview</h2>
                    <div className="space-y-4">
                        {statusData.map((status, index) => {
                            const total = statusData.reduce((sum, s) => sum + s.value, 0);
                            const percentage = total > 0 ? (status.value / total * 100).toFixed(1) : 0;

                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="capitalize">{status.name}</span>
                                        <span className="font-semibold">{status.value}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <Link
                            to="/admin/complaints"
                            className="btn-secondary w-full justify-center"
                        >
                            View All Complaints
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
