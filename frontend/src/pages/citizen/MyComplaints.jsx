import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { complaintsAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    FunnelIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
];

const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'roads', label: 'Roads' },
    { value: 'water', label: 'Water' },
    { value: 'sanitation', label: 'Sanitation' },
    { value: 'safety', label: 'Safety' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'public_transport', label: 'Transport' },
    { value: 'environment', label: 'Environment' },
    { value: 'other', label: 'Other' }
];

export default function MyComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    useEffect(() => {
        fetchComplaints();
    }, [filters.status, filters.category, pagination.page]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await complaintsAPI.getAll({
                page: pagination.page,
                per_page: 10,
                status: filters.status || undefined,
                category: filters.category || undefined
            });
            setComplaints(response.data.complaints);
            setPagination({
                page: response.data.current_page,
                totalPages: response.data.pages,
                total: response.data.total
            });
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewComplaint = async (complaint) => {
        try {
            const response = await complaintsAPI.getOne(complaint.complaint_id);
            setSelectedComplaint(response.data.complaint);
        } catch (error) {
            console.error('Failed to fetch complaint details:', error);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Complaints</h1>
                <p className="text-neutral-400">
                    View and track all your submitted complaints
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="input-field pl-12"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="input-field w-full sm:w-40"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="input-field w-full sm:w-40"
                    >
                        {categoryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Complaints List */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-8">
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="skeleton h-24 w-full"></div>
                            ))}
                        </div>
                    </div>
                ) : complaints.length > 0 ? (
                    <>
                        <div className="divide-y divide-white/10">
                            {complaints.map((complaint) => (
                                <div
                                    key={complaint.id}
                                    className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => viewComplaint(complaint)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className="text-sm text-primary-400 font-mono">
                                                    {complaint.complaint_id}
                                                </span>
                                                <span className={`badge badge-${complaint.status.replace('_', '-')}`}>
                                                    {complaint.status.replace('_', ' ')}
                                                </span>
                                                <span className={`badge priority-${complaint.priority}`}>
                                                    {complaint.priority}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg mb-1 truncate">{complaint.title}</h3>
                                            <p className="text-neutral-400 text-sm line-clamp-1">{complaint.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    {complaint.category}
                                                </span>
                                                <span>{format(new Date(complaint.created_at), 'PP')}</span>
                                            </div>
                                        </div>
                                        <button className="btn-secondary flex items-center gap-2 shrink-0">
                                            <EyeIcon className="w-4 h-4" />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="p-6 border-t border-white/10 flex items-center justify-between">
                            <p className="text-neutral-400 text-sm">
                                Showing {complaints.length} of {pagination.total} complaints
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    disabled={pagination.page <= 1}
                                    className="btn-secondary p-2 disabled:opacity-50"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <span className="px-4 text-sm">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="btn-secondary p-2 disabled:opacity-50"
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-neutral-400">No complaints found</p>
                    </div>
                )}
            </div>

            {/* Complaint Detail Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedComplaint(null)}
                    ></div>
                    <div className="relative glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 glass-card rounded-t-2xl">
                            <div>
                                <p className="text-sm text-primary-400 font-mono">{selectedComplaint.complaint_id}</p>
                                <h2 className="text-xl font-bold">{selectedComplaint.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex flex-wrap gap-3">
                                <span className={`badge badge-${selectedComplaint.status.replace('_', '-')}`}>
                                    {selectedComplaint.status.replace('_', ' ')}
                                </span>
                                <span className={`badge priority-${selectedComplaint.priority}`}>
                                    {selectedComplaint.priority} Priority
                                </span>
                                <span className="badge bg-white/10 text-white">
                                    {selectedComplaint.category}
                                </span>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-neutral-300">{selectedComplaint.description}</p>
                            </div>

                            {selectedComplaint.address && (
                                <div>
                                    <h4 className="font-medium mb-2">Address</h4>
                                    <p className="text-neutral-300">{selectedComplaint.address}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-2">Submitted</h4>
                                    <p className="text-neutral-300">
                                        {format(new Date(selectedComplaint.created_at), 'PPpp')}
                                    </p>
                                </div>
                                {selectedComplaint.resolved_at && (
                                    <div>
                                        <h4 className="font-medium mb-2">Resolved</h4>
                                        <p className="text-neutral-300">
                                            {format(new Date(selectedComplaint.resolved_at), 'PPpp')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedComplaint.officer && (
                                <div>
                                    <h4 className="font-medium mb-2">Assigned Officer</h4>
                                    <p className="text-neutral-300">{selectedComplaint.officer.full_name}</p>
                                    <p className="text-neutral-400 text-sm">{selectedComplaint.department}</p>
                                </div>
                            )}

                            {selectedComplaint.status_updates?.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-4">Status Updates</h4>
                                    <div className="space-y-3">
                                        {selectedComplaint.status_updates.map((update, index) => (
                                            <div key={index} className="p-4 rounded-xl bg-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`badge badge-${update.new_status.replace('_', '-')}`}>
                                                        {update.new_status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-neutral-400 text-sm">
                                                        {format(new Date(update.created_at), 'PPp')}
                                                    </span>
                                                </div>
                                                {update.comment && (
                                                    <p className="text-neutral-300 text-sm">{update.comment}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
