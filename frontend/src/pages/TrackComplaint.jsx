import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { complaintsAPI } from '../services/api';
import {
    BuildingOffice2Icon,
    MagnifyingGlassIcon,
    MapPinIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function TrackComplaint() {
    const { complaintId: paramId } = useParams();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { complaintId: paramId || '' }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setSearched(true);
        try {
            const response = await complaintsAPI.track(data.complaintId);
            setComplaint(response.data);
        } catch (error) {
            setComplaint(null);
            toast.error('Complaint not found. Please check the ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'resolved':
            case 'closed':
                return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'in_progress':
                return <ClockIcon className="w-5 h-5 text-blue-400" />;
            case 'rejected':
                return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
            default:
                return <ClockIcon className="w-5 h-5 text-amber-400" />;
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-card rounded-none border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <BuildingOffice2Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">CivicLens</span>
                    </Link>

                    <Link to="/login" className="btn-secondary">
                        Sign In
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-4">Track Your Complaint</h1>
                    <p className="text-neutral-400 text-lg">
                        Enter your complaint ID to check the current status and updates
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                {...register('complaintId', {
                                    required: 'Complaint ID is required',
                                    pattern: {
                                        value: /^CL-\d{4}-\d{6}$/,
                                        message: 'Invalid format. Use: CL-YYYY-XXXXXX'
                                    }
                                })}
                                type="text"
                                className="input-field pl-12 text-lg"
                                placeholder="Enter Complaint ID (e.g., CL-2026-000001)"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-8 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="spinner w-5 h-5 border-2"></div>
                            ) : (
                                <>
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    Track
                                </>
                            )}
                        </button>
                    </div>
                    {errors.complaintId && (
                        <p className="text-red-400 text-sm mt-2">{errors.complaintId.message}</p>
                    )}
                </form>

                {/* Results */}
                {searched && !loading && (
                    <>
                        {complaint ? (
                            <div className="glass-card overflow-hidden">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 bg-white/5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm text-neutral-400 mb-1">Complaint ID</p>
                                            <h2 className="text-2xl font-bold">{complaint.complaint_id}</h2>
                                        </div>
                                        <div className={`badge badge-${complaint.status.replace('_', '-')}`}>
                                            {complaint.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{complaint.title}</h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="w-4 h-4" />
                                                {complaint.category}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="w-4 h-4" />
                                                Submitted: {format(new Date(complaint.created_at), 'PPp')}
                                            </span>
                                            {complaint.resolved_at && (
                                                <span className="flex items-center gap-1 text-green-400">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Resolved: {format(new Date(complaint.resolved_at), 'PPp')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Priority Badge */}
                                    <div>
                                        <span className={`badge priority-${complaint.priority} px-4 py-1`}>
                                            {complaint.priority} Priority
                                        </span>
                                    </div>

                                    {/* Timeline */}
                                    <div>
                                        <h4 className="font-semibold mb-4">Status Timeline</h4>
                                        <div className="space-y-4">
                                            {complaint.status_updates?.map((update, index) => (
                                                <div key={index} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                            {getStatusIcon(update.status)}
                                                        </div>
                                                        {index < complaint.status_updates.length - 1 && (
                                                            <div className="w-0.5 h-full bg-white/10 mt-2"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-4">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium capitalize">
                                                                {update.status.replace('_', ' ')}
                                                            </span>
                                                            <span className="text-sm text-neutral-400">
                                                                {format(new Date(update.date), 'PPp')}
                                                            </span>
                                                        </div>
                                                        {update.comment && (
                                                            <p className="text-neutral-400 text-sm">{update.comment}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Complaint Not Found</h3>
                                <p className="text-neutral-400">
                                    We couldn't find a complaint with that ID. Please check the ID and try again.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Help Section */}
                <div className="mt-12 text-center">
                    <p className="text-neutral-400 mb-4">
                        Can't find your complaint ID? Check your email or SMS for the confirmation.
                    </p>
                    <Link to="/register" className="text-primary-400 hover:text-primary-300">
                        Create an account to track all your complaints easily →
                    </Link>
                </div>
            </main>
        </div>
    );
}
