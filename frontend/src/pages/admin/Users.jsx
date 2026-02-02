import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    UserPlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [filters, setFilters] = useState({
        role: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'citizen',
        department: ''
    });

    useEffect(() => {
        fetchUsers();
    }, [filters.role, pagination.page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getUsers({
                page: pagination.page,
                per_page: 15,
                role: filters.role || undefined,
                search: filters.search || undefined
            });
            setUsers(response.data.users);
            setPagination({
                page: response.data.current_page,
                totalPages: response.data.pages,
                total: response.data.total
            });
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await adminAPI.updateUser(editingUser.id, formData);
                toast.success('User updated successfully');
            } else {
                await adminAPI.createUser(formData);
                toast.success('User created successfully');
            }
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone || '',
            role: user.role,
            department: user.department || ''
        });
        setShowModal(true);
    };

    const handleDeactivate = async (userId) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await adminAPI.deleteUser(userId);
            toast.success('User deactivated');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to deactivate user');
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: '',
            role: 'citizen',
            department: ''
        });
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-500/20 text-purple-400';
            case 'officer': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-green-500/20 text-green-400';
        }
    };

    return (
        <Layout>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">User Management</h1>
                    <p className="text-neutral-400">
                        Manage citizens, officers, and administrators
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingUser(null);
                        setShowModal(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64 relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                            className="input-field pl-12 w-full"
                        />
                    </div>

                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="input-field w-40"
                    >
                        <option value="">All Roles</option>
                        <option value="citizen">Citizens</option>
                        <option value="officer">Officers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
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
                                        <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                                                        {user.first_name[0]}{user.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.full_name}</p>
                                                        <p className="text-sm text-neutral-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-400">
                                                {user.department || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge ${user.is_active ? 'badge-resolved' : 'badge-rejected'}`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-400 text-sm">
                                                {user.created_at ? format(new Date(user.created_at), 'PP') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="btn-secondary p-2"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivate(user.id)}
                                                        className="btn-secondary p-2 text-red-400 hover:bg-red-500/20"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
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
                                Showing {users.length} of {pagination.total} users
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative glass-card max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-6">
                            {editingUser ? 'Edit User' : 'Create New User'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input-field"
                                        required={!editingUser}
                                        minLength={8}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="citizen">Citizen</option>
                                    <option value="officer">Officer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {formData.role === 'officer' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Public Works Department">Public Works Department</option>
                                        <option value="Water Supply Department">Water Supply Department</option>
                                        <option value="Sanitation Department">Sanitation Department</option>
                                        <option value="Public Safety Department">Public Safety Department</option>
                                        <option value="Electricity Department">Electricity Department</option>
                                        <option value="Transport Department">Transport Department</option>
                                        <option value="Environment Department">Environment Department</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
