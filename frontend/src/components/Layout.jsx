import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HomeIcon,
    DocumentPlusIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    UsersIcon,
    ArrowRightOnRectangleIcon,
    BuildingOffice2Icon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const citizenNavItems = [
    { path: '/citizen', label: 'Dashboard', icon: HomeIcon },
    { path: '/citizen/submit', label: 'Submit Complaint', icon: DocumentPlusIcon },
    { path: '/citizen/complaints', label: 'My Complaints', icon: ClipboardDocumentListIcon },
];

const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: HomeIcon },
    { path: '/admin/complaints', label: 'All Complaints', icon: ClipboardDocumentListIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
];

const officerNavItems = [
    { path: '/officer', label: 'Dashboard', icon: HomeIcon },
    { path: '/officer/complaints', label: 'My Assignments', icon: ClipboardDocumentListIcon },
];

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getNavItems = () => {
        switch (user?.role) {
            case 'admin':
                return adminNavItems;
            case 'officer':
                return officerNavItems;
            default:
                return citizenNavItems;
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <BuildingOffice2Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold gradient-text">CivicLens</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg bg-white/5 text-white"
                    >
                        {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar - Desktop */}
                <aside className={`
                    fixed lg:sticky top-0 left-0 z-40 h-screen w-72 
                    bg-slate-900/95 lg:bg-slate-900/50 backdrop-blur-xl
                    border-r border-white/10 flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    {/* Logo */}
                    <div className="p-6 border-b border-white/10">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <BuildingOffice2Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold gradient-text">CivicLens</h1>
                                <p className="text-xs text-neutral-500">Smart City Platform</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 px-3">
                            Navigation
                        </p>
                        {getNavItems().map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl
                                        transition-all duration-200 font-medium
                                        ${isActive
                                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-5 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{user?.full_name}</p>
                                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main content */}
                <main className="flex-1 min-h-screen lg:ml-0">
                    <div className="pt-16 lg:pt-0">
                        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
