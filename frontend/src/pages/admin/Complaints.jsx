import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { complaintsAPI, adminAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    UserPlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        priority: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    useEffect(() => {
        fetchComplaints();
        fetchOfficers();
    }, [filters.status, filters.category, filters.priority, pagination.page]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await complaintsAPI.getAll({
                page: pagination.page,
                per_page: 15,
                status: filters.status || undefined,
                category: filters.category || undefined,
                priority: filters.priority || undefined
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

    const fetchOfficers = async () => {
        try {
            const response = await adminAPI.getOfficers();
            setOfficers(response.data.officers);
        } catch (error) {
            console.error('Failed to fetch officers:', error);
        }
    };

    const handleAssign = async (complaintId, officerId) => {
        try {
            await complaintsAPI.assign(complaintId, officerId);
            toast.success('Complaint assigned successfully');
            setAssignModalOpen(false);
            setSelectedComplaint(null);
            fetchComplaints();
        } catch (error) {
            toast.error('Failed to assign complaint');
        }
    };

    const handleStatusUpdate = async (complaintId, status, comment = '') => {
        try {
            await complaintsAPI.updateStatus(complaintId, { status, comment });
            toast.success('Status updated successfully');
            fetchComplaints();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'text-red-400';
            case 'high': return 'text-orange-400';
            case 'medium': return 'text-blue-400';
            default: return 'text-green-400';
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">All Complaints</h1>
                <p className="text-neutral-400">
                    Manage and assign complaints across the city
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64 relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, title, or description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="input-field pl-12 w-full"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="input-field w-40"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="input-field w-36"
                    >
                        <option value="">All Priority</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="input-field w-40"
                    >
                        <option value="">All Categories</option>
                        <option value="roads">Roads</option>
                        <option value="water">Water</option>
                        <option value="sanitation">Sanitation</option>
                        <option value="safety">Safety</option>
                        <option value="electricity">Electricity</option>
                        <option value="public_transport">Transport</option>
                        <option value="environment">Environment</option>
                    </select>
                </div>
            </div>

            {/* Complaints Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-8">
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="skeleton h-16 w-full"></div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">ID / Title</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Assigned To</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {complaints.map((complaint) => (
                                        <tr key={complaint.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-primary-400 font-mono text-sm">{complaint.complaint_id}</p>
                                                <p className="font-medium truncate max-w-xs">{complaint.title}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize">{complaint.category}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold capitalize ${getPriorityColor(complaint.priority)}`}>
                                                    {complaint.priority}
                                                </span>
                                                <div className="text-xs text-neutral-400">
                                                    Score: {(complaint.severity_score * 100).toFixed(0)}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge badge-${complaint.status.replace('_', '-')}`}>
                                                    {complaint.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {complaint.officer ? (
                                                    <div>
                                                        <p className="font-medium">{complaint.officer.full_name}</p>
                                                        <p className="text-xs text-neutral-400">{complaint.department}</p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedComplaint(complaint);
                                                            setAssignModalOpen(true);
                                                        }}
                                                        className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm"
                                                    >
                                                        <UserPlusIcon className="w-4 h-4" />
                                                        Assign
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-400 text-sm">
                                                {format(new Date(complaint.created_at), 'PP')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedComplaint(complaint)}
                                                        className="btn-secondary p-2"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <select
                                                        value={complaint.status}
                                                        onChange={(e) => handleStatusUpdate(complaint.complaint_id, e.target.value)}
                                                        className="input-field py-2 text-sm"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="closed">Closed</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                )}
            </div>

            {/* Assign Modal */}
            {assignModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModalOpen(false)}></div>
                    <div className="relative glass-card max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Assign Complaint</h3>
                        <p className="text-neutral-400 mb-6">
                            Select an officer to assign <span className="text-primary-400">{selectedComplaint.complaint_id}</span>
                        </p>

                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {officers.map((officer) => (
                                <button
                                    key={officer.id}
                                    onClick={() => handleAssign(selectedComplaint.complaint_id, officer.id)}
                                    className="w-full p-4 rounded-xl border border-white/10 hover:border-primary-500 hover:bg-primary-500/10 transition-colors text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{officer.full_name}</p>
                                            <p className="text-sm text-neutral-400">{officer.department}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-primary-400">{officer.workload?.pending || 0} pending</p>
                                            <p className="text-neutral-400">{officer.workload?.resolved || 0} resolved</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setAssignModalOpen(false)}
                            className="btn-secondary w-full mt-4"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    );
}
