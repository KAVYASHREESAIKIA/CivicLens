import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

// SVG Icons as components
const MapPinIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ChartBarIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const ShieldCheckIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const BoltIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const UserGroupIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const CpuChipIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const features = [
    {
        icon: <MapPinIcon />,
        title: 'Geolocated Complaints',
        description: 'Pin issues on an interactive map with precise GPS location for faster resolution.',
        color: 'from-blue-500 to-cyan-400',
    },
    {
        icon: <CpuChipIcon />,
        title: 'AI-Powered Analysis',
        description: 'Smart categorization and severity scoring using NLP and machine learning.',
        color: 'from-purple-500 to-pink-400',
    },
    {
        icon: <ChartBarIcon />,
        title: 'Real-time Analytics',
        description: 'Comprehensive dashboards with heatmaps, trends, and performance metrics.',
        color: 'from-green-500 to-emerald-400',
    },
    {
        icon: <BoltIcon />,
        title: 'Instant Prioritization',
        description: 'Automatic urgency detection and escalation for critical civic issues.',
        color: 'from-amber-500 to-orange-400',
    },
    {
        icon: <UserGroupIcon />,
        title: 'Multi-Role Access',
        description: 'Dedicated portals for citizens, officers, and administrators.',
        color: 'from-rose-500 to-red-400',
    },
    {
        icon: <ClockIcon />,
        title: 'Status Tracking',
        description: 'Real-time updates on complaint progress from submission to resolution.',
        color: 'from-indigo-500 to-blue-400',
    },
];

const stats = [
    { value: '10K+', label: 'Issues Resolved' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Support Available' },
    { value: '15min', label: 'Avg Response Time' },
];

export default function Landing() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [trackId, setTrackId] = useState('');

    const getDashboardLink = () => {
        if (!user) return '/login';
        const routes = { admin: '/admin', officer: '/officer', citizen: '/citizen' };
        return routes[user.role] || '/citizen';
    };

    const handleTrack = (e) => {
        e.preventDefault();
        if (trackId.trim()) {
            navigate(`/track/${trackId.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0f1a] text-white overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-bounce delay-500"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <EyeIcon />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                CivicLens
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <span className="text-gray-400 hidden sm:inline">
                                        Welcome, <span className="text-white font-medium">{user?.first_name}</span>
                                    </span>
                                    <Link
                                        to={getDashboardLink()}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                                    >
                                        Dashboard
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="px-5 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors font-medium"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                        AI-Powered Civic Intelligence Platform
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Transform How Cities
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                            Listen to Citizens
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Report civic issues, track resolutions in real-time, and empower authorities with
                        AI-driven insights for smarter, faster, and more transparent governance.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            to={isAuthenticated ? getDashboardLink() : "/register"}
                            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-1 flex items-center gap-3"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Report an Issue'}
                            <ArrowRightIcon />
                        </Link>
                        <Link
                            to="/track"
                            className="px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            Track Complaint
                        </Link>
                    </div>

                    {/* Quick Track Form */}
                    <div className="max-w-md mx-auto">
                        <form onSubmit={handleTrack} className="flex gap-2">
                            <input
                                type="text"
                                value={trackId}
                                onChange={(e) => setTrackId(e.target.value)}
                                placeholder="Enter Complaint ID (e.g., CL-2026-000001)"
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                            >
                                Track
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 py-16 border-y border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-400 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Intelligent Civic Management
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Powered by cutting-edge AI and geospatial analytics for smarter city governance
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            What You Can Report
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Comprehensive coverage for all urban civic issues
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: '🛣️', label: 'Roads & Infrastructure', color: 'from-amber-500/20 to-amber-600/10' },
                            { icon: '💧', label: 'Water Supply', color: 'from-blue-500/20 to-blue-600/10' },
                            { icon: '🗑️', label: 'Sanitation & Waste', color: 'from-green-500/20 to-green-600/10' },
                            { icon: '🔒', label: 'Public Safety', color: 'from-red-500/20 to-red-600/10' },
                            { icon: '⚡', label: 'Electricity', color: 'from-yellow-500/20 to-yellow-600/10' },
                            { icon: '🚌', label: 'Public Transport', color: 'from-purple-500/20 to-purple-600/10' },
                            { icon: '🌳', label: 'Environment', color: 'from-emerald-500/20 to-emerald-600/10' },
                            { icon: '📋', label: 'Other Issues', color: 'from-gray-500/20 to-gray-600/10' },
                        ].map((category, index) => (
                            <div
                                key={index}
                                className={`p-6 rounded-2xl bg-gradient-to-br ${category.color} border border-white/5 hover:border-white/10 transition-all duration-300 text-center group hover:-translate-y-1`}
                            >
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                                    {category.icon}
                                </div>
                                <div className="text-white font-medium text-sm">
                                    {category.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                Ready to Make Your City Better?
                            </h2>
                            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                                Join thousands of citizens who are actively participating in building smarter,
                                cleaner, and safer communities.
                            </p>
                            <Link
                                to={isAuthenticated ? getDashboardLink() : "/register"}
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-gray-900 font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:-translate-y-1"
                            >
                                {isAuthenticated ? 'Go to Dashboard' : 'Start Reporting Now'}
                                <ArrowRightIcon />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-black/30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <EyeIcon />
                            </div>
                            <span className="text-lg font-bold text-white">CivicLens</span>
                        </div>

                        <div className="text-gray-400 text-sm text-center">
                            © 2026 CivicLens. Built for smarter cities.
                        </div>

                        <div className="flex items-center gap-6">
                            <Link to="/track" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Track Complaint
                            </Link>
                            <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Sign In
                            </Link>
                            <Link to="/register" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
        </div>
    );
}
