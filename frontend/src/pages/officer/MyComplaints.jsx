import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { officerAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    ClockIcon,
    ChatBubbleLeftIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function OfficerComplaints() {
    const [searchParams] = useSearchParams();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [updateComment, setUpdateComment] = useState('');
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        priority: searchParams.get('priority') || ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    useEffect(() => {
        fetchComplaints();
    }, [filters.status, filters.priority, pagination.page]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await officerAPI.getMyComplaints({
                page: pagination.page,
                per_page: 10,
                status: filters.status || undefined,
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

    const handleStatusUpdate = async (status) => {
        if (!selectedComplaint) return;

        try {
            await officerAPI.updateComplaint(selectedComplaint.complaint_id, {
                status,
                comment: updateComment
            });
            toast.success(`Status updated to ${status}`);
            setUpdateComment('');
            fetchComplaints();

            // Refresh selected complaint
            const response = await officerAPI.getMyComplaints({
                page: 1,
                per_page: 1
            });
            const updated = response.data.complaints.find(c => c.complaint_id === selectedComplaint.complaint_id);
            if (updated) setSelectedComplaint(updated);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleAddNote = async () => {
        if (!selectedComplaint || !noteText.trim()) return;

        try {
            await officerAPI.addNote(selectedComplaint.complaint_id, noteText);
            toast.success('Note added');
            setNoteText('');
            fetchComplaints();
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'border-red-500 bg-red-500/10';
            case 'high': return 'border-orange-500 bg-orange-500/10';
            case 'medium': return 'border-blue-500 bg-blue-500/10';
            default: return 'border-green-500 bg-green-500/10';
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Assignments</h1>
                <p className="text-neutral-400">
                    Manage and resolve complaints assigned to you
                </p>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 mb-6">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="input-field w-40"
                    >
                        <option value="">All Status</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="input-field w-40"
                    >
                        <option value="">All Priority</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Complaints List */}
                <div className="lg:col-span-1 glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="font-semibold">Complaints ({pagination.total})</h2>
                    </div>

                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton h-24 w-full"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                            {complaints.map((complaint) => (
                                <button
                                    key={complaint.id}
                                    onClick={() => setSelectedComplaint(complaint)}
                                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${selectedComplaint?.id === complaint.id ? 'bg-primary-500/10 border-l-4 border-primary-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${complaint.priority === 'critical' ? 'bg-red-500' :
                                            complaint.priority === 'high' ? 'bg-orange-500' :
                                                complaint.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                                            }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-400 mb-1">{complaint.complaint_id}</p>
                                            <p className="font-medium truncate">{complaint.title}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                                                <span>{complaint.category}</span>
                                                <span className={`badge badge-${complaint.status.replace('_', '-')}`}>
                                                    {complaint.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="p-4 border-t border-white/10 flex items-center justify-between">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page <= 1}
                            className="btn-secondary p-2 disabled:opacity-50"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-neutral-400">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.totalPages}
                            className="btn-secondary p-2 disabled:opacity-50"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Complaint Detail */}
                <div className="lg:col-span-2">
                    {selectedComplaint ? (
                        <div className="glass-card overflow-hidden">
                            {/* Header */}
                            <div className={`p-6 border-b-4 ${getPriorityColor(selectedComplaint.priority)}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-primary-400 font-mono mb-1">
                                            {selectedComplaint.complaint_id}
                                        </p>
                                        <h2 className="text-xl font-bold">{selectedComplaint.title}</h2>
                                    </div>
                                    <span className={`badge priority-${selectedComplaint.priority}`}>
                                        {selectedComplaint.priority}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Meta */}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <span className="flex items-center gap-2 text-neutral-400">
                                        <MapPinIcon className="w-4 h-4" />
                                        {selectedComplaint.category}
                                    </span>
                                    <span className="flex items-center gap-2 text-neutral-400">
                                        <ClockIcon className="w-4 h-4" />
                                        {format(new Date(selectedComplaint.created_at), 'PPp')}
                                    </span>
                                    <span className={`badge badge-${selectedComplaint.status.replace('_', '-')}`}>
                                        {selectedComplaint.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className="text-neutral-300">{selectedComplaint.description}</p>
                                </div>

                                {/* Address */}
                                {selectedComplaint.address && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Location</h4>
                                        <p className="text-neutral-300">{selectedComplaint.address}</p>
                                    </div>
                                )}

                                {/* Reporter */}
                                <div>
                                    <h4 className="font-semibold mb-2">Reported By</h4>
                                    <p className="text-neutral-300">{selectedComplaint.reporter?.full_name}</p>
                                    <p className="text-neutral-400 text-sm">{selectedComplaint.reporter?.email}</p>
                                </div>

                                {/* Actions */}
                                {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'closed' && (
                                    <div className="p-4 rounded-xl bg-white/5 space-y-4">
                                        <h4 className="font-semibold">Update Status</h4>
                                        <textarea
                                            value={updateComment}
                                            onChange={(e) => setUpdateComment(e.target.value)}
                                            placeholder="Add a comment about this update..."
                                            className="input-field resize-none"
                                            rows={2}
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleStatusUpdate('in_progress')}
                                                className="btn-secondary flex-1"
                                            >
                                                Mark In Progress
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate('resolved')}
                                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircleIcon className="w-5 h-5" />
                                                Mark Resolved
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Add Note */}
                                <div className="p-4 rounded-xl bg-white/5 space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <ChatBubbleLeftIcon className="w-5 h-5" />
                                        Add Note
                                    </h4>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add a note or comment..."
                                            className="input-field flex-1"
                                        />
                                        <button
                                            onClick={handleAddNote}
                                            disabled={!noteText.trim()}
                                            className="btn-primary disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Status History */}
                                {selectedComplaint.status_updates?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-4">Update History</h4>
                                        <div className="space-y-3">
                                            {selectedComplaint.status_updates.map((update, index) => (
                                                <div key={index} className="p-3 rounded-lg bg-white/5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`badge badge-${update.new_status.replace('_', '-')}`}>
                                                            {update.new_status.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-xs text-neutral-400">
                                                            {format(new Date(update.created_at), 'PPp')}
                                                        </span>
                                                    </div>
                                                    {update.comment && (
                                                        <p className="text-sm text-neutral-300 mt-2">{update.comment}</p>
                                                    )}
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        by {update.updated_by?.full_name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-12 text-center">
                            <ClipboardDocumentListIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Select a Complaint</h3>
                            <p className="text-neutral-400">
                                Choose a complaint from the list to view details and take action
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
