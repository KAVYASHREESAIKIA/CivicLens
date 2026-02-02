import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { complaintsAPI } from '../../services/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import {
    DocumentPlusIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function CitizenDashboard() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await complaintsAPI.getAll({ per_page: 5 });
            const allComplaints = response.data.complaints;

            setComplaints(allComplaints);
            setStats({
                total: response.data.total,
                pending: allComplaints.filter(c => c.status === 'pending').length,
                inProgress: allComplaints.filter(c => c.status === 'in_progress').length,
                resolved: allComplaints.filter(c => c.status === 'resolved').length
            });
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Complaints', value: stats.total, icon: ClipboardDocumentListIcon, color: 'from-blue-500 to-cyan-400' },
        { label: 'Pending', value: stats.pending, icon: ClockIcon, color: 'from-amber-500 to-orange-400' },
        { label: 'In Progress', value: stats.inProgress, icon: ArrowTrendingUpIcon, color: 'from-purple-500 to-pink-400' },
        { label: 'Resolved', value: stats.resolved, icon: CheckCircleIcon, color: 'from-emerald-500 to-teal-400' }
    ];

    return (
        <Layout>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.first_name}! 👋
                </h1>
                <p className="text-neutral-400">
                    Here's an overview of your civic complaints and their status
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <Link
                    to="/citizen/submit"
                    className="glass-card p-6 flex items-center gap-4 card-hover group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DocumentPlusIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Submit New Complaint</h3>
                        <p className="text-neutral-400 text-sm">Report a civic issue in your area</p>
                    </div>
                </Link>

                <Link
                    to="/citizen/complaints"
                    className="glass-card p-6 flex items-center gap-4 card-hover group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ClipboardDocumentListIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">View All Complaints</h3>
                        <p className="text-neutral-400 text-sm">Track and manage your submissions</p>
                    </div>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="glass-card p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-neutral-400 text-sm mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Complaints */}
            <div className="glass-card">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Complaints</h2>
                    <Link to="/citizen/complaints" className="text-primary-400 hover:text-primary-300 text-sm">
                        View All →
                    </Link>
                </div>

                {loading ? (
                    <div className="p-8">
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton h-20 w-full"></div>
                            ))}
                        </div>
                    </div>
                ) : complaints.length > 0 ? (
                    <div className="divide-y divide-white/10">
                        {complaints.map((complaint) => (
                            <div key={complaint.id} className="p-6 hover:bg-white/5 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-sm text-neutral-400">{complaint.complaint_id}</span>
                                            <span className={`badge badge-${complaint.status.replace('_', '-')}`}>
                                                {complaint.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="font-medium truncate">{complaint.title}</h3>
                                        <p className="text-sm text-neutral-400 mt-1">
                                            {complaint.category} • {format(new Date(complaint.created_at), 'PPp')}
                                        </p>
                                    </div>
                                    <span className={`badge priority-${complaint.priority}`}>
                                        {complaint.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <ClipboardDocumentListIcon className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Complaints Yet</h3>
                        <p className="text-neutral-400 mb-6">
                            Start by submitting your first civic complaint
                        </p>
                        <Link to="/citizen/submit" className="btn-primary">
                            Submit Complaint
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
}
