import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { analyticsAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    CalendarIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminAnalytics() {
    const [period, setPeriod] = useState(30);
    const [overview, setOverview] = useState(null);
    const [categoryData, setCategoryData] = useState([]);
    const [departmentData, setDepartmentData] = useState([]);
    const [zoneData, setZoneData] = useState([]);
    const [resolutionData, setResolutionData] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [overviewRes, categoriesRes, departmentsRes, zonesRes, resolutionRes, leaderboardRes] = await Promise.all([
                analyticsAPI.getOverview(period),
                analyticsAPI.getCategories(period),
                analyticsAPI.getDepartments(period),
                analyticsAPI.getZones(period),
                analyticsAPI.getResolutionTimes(period),
                analyticsAPI.getLeaderboard(period)
            ]);

            setOverview(overviewRes.data);
            setCategoryData(categoriesRes.data.categories || []);
            setDepartmentData(departmentsRes.data.departments || []);
            setZoneData(zonesRes.data.zones || []);
            setResolutionData(resolutionRes.data.by_priority || []);
            setLeaderboard(leaderboardRes.data.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                    <p className="text-neutral-400">
                        Comprehensive insights into civic complaint trends and performance
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-neutral-400" />
                    <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="input-field w-40"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last year</option>
                    </select>
                </div>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-6">
                        <p className="text-neutral-400 text-sm mb-1">Total Complaints</p>
                        <p className="text-3xl font-bold">{overview.total_complaints}</p>
                        <p className="text-sm text-neutral-400 mt-2">In selected period</p>
                    </div>
                    <div className="glass-card p-6">
                        <p className="text-neutral-400 text-sm mb-1">Resolved</p>
                        <p className="text-3xl font-bold text-green-400">{overview.resolved}</p>
                        <p className="text-sm text-green-400 mt-2">
                            {overview.resolution_rate}% resolution rate
                        </p>
                    </div>
                    <div className="glass-card p-6">
                        <p className="text-neutral-400 text-sm mb-1">Pending</p>
                        <p className="text-3xl font-bold text-amber-400">{overview.pending}</p>
                        <p className="text-sm text-neutral-400 mt-2">Awaiting resolution</p>
                    </div>
                    <div className="glass-card p-6">
                        <p className="text-neutral-400 text-sm mb-1">Avg. Resolution Time</p>
                        <p className="text-3xl font-bold">{overview.avg_resolution_hours.toFixed(1)}h</p>
                        <p className="text-sm text-neutral-400 mt-2">Hours to resolve</p>
                    </div>
                </div>
            )}

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Category Performance */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Performance by Category</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis dataKey="category" type="category" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px'
                                    }}
                                />
                                <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resolution Times by Priority */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Resolution Time by Priority</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={resolutionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="priority" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px'
                                    }}
                                />
                                <Bar dataKey="avg_hours" fill="#f59e0b" name="Avg Hours" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Department Performance */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Department Performance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold">Total</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold">Resolved</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold">Rate</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold">Avg Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {departmentData.slice(0, 6).map((dept, index) => (
                                    <tr key={index} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium">{dept.department}</td>
                                        <td className="px-4 py-3 text-center">{dept.total}</td>
                                        <td className="px-4 py-3 text-center text-green-400">{dept.resolved}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={dept.resolution_rate >= 70 ? 'text-green-400' : dept.resolution_rate >= 40 ? 'text-amber-400' : 'text-red-400'}>
                                                {dept.resolution_rate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-neutral-400">
                                            {dept.avg_resolution_hours.toFixed(1)}h
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Officer Leaderboard */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Top Officers</h2>
                    <div className="space-y-4">
                        {leaderboard.slice(0, 5).map((officer, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                            index === 2 ? 'bg-amber-600' : 'bg-white/10'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{officer.name}</p>
                                    <p className="text-xs text-neutral-400">{officer.department}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-400">{officer.resolved}</p>
                                    <p className="text-xs text-neutral-400">resolved</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Problematic Zones */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5" />
                    Top Problematic Zones
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {zoneData.slice(0, 8).map((zone, index) => (
                        <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{zone.zone || 'Unknown Zone'}</span>
                                <span className="text-lg font-bold">{zone.total}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-400">{zone.resolved} resolved</span>
                                <span className="text-amber-400">{zone.pending} pending</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${zone.total > 0 ? (zone.resolved / zone.total * 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
