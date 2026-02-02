import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { complaintsAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
    MapPinIcon,
    PhotoIcon,
    XMarkIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categories = [
    { value: 'roads', label: '🛣️ Roads & Potholes', desc: 'Road damage, potholes, street lights' },
    { value: 'water', label: '💧 Water Supply', desc: 'Water shortage, leakage, quality issues' },
    { value: 'sanitation', label: '🧹 Sanitation', desc: 'Garbage, sewage, drainage problems' },
    { value: 'safety', label: '🛡️ Public Safety', desc: 'Crime, harassment, security concerns' },
    { value: 'electricity', label: '⚡ Electricity', desc: 'Power outage, damaged lines, street lights' },
    { value: 'public_transport', label: '🚌 Transport', desc: 'Bus service, metro, traffic issues' },
    { value: 'environment', label: '🌳 Environment', desc: 'Pollution, tree damage, stray animals' },
    { value: 'other', label: '📋 Other', desc: 'Any other civic issue' }
];

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position ? <Marker position={position} /> : null;
}

export default function SubmitComplaint() {
    const navigate = useNavigate();
    const [position, setPosition] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm();

    const defaultCenter = [28.6139, 77.2090]; // Delhi

    const getCurrentLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPosition = [pos.coords.latitude, pos.coords.longitude];
                    setPosition(newPosition);
                    setValue('latitude', pos.coords.latitude);
                    setValue('longitude', pos.coords.longitude);
                    toast.success('Location detected!');
                    setGettingLocation(false);
                },
                (error) => {
                    toast.error('Failed to get location. Please select on map.');
                    setGettingLocation(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            toast.error('Geolocation is not supported');
            setGettingLocation(false);
        }
    };

    useEffect(() => {
        if (position) {
            setValue('latitude', position[0]);
            setValue('longitude', position[1]);
        }
    }, [position, setValue]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 16 * 1024 * 1024) {
                toast.error('Image size must be less than 16MB');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title || '');
            formData.append('description', data.description || '');
            formData.append('category', selectedCategory || 'other');
            formData.append('latitude', position ? position[0] : 0);
            formData.append('longitude', position ? position[1] : 0);
            formData.append('address', data.address || '');

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await complaintsAPI.create(formData);
            toast.success(`Complaint submitted! ID: ${response.data.complaint.complaint_id}`);
            navigate('/citizen/complaints');
        } catch (error) {
            const errorMessage = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(', ')
                : (error.response?.data?.message || 'Failed to submit complaint');
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Submit New Complaint</h1>
                    <p className="text-neutral-400">
                        Report a civic issue in your area. Our AI will help prioritize and route it to the right department.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Category Selection */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4">1. Select Category</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedCategory === cat.value
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <p className="font-medium mb-1">{cat.label}</p>
                                    <p className="text-xs text-neutral-400">{cat.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Complaint Details */}
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-lg font-semibold">2. Complaint Details</h2>

                        <div>
                            <label className="block text-sm font-medium mb-2">Title</label>
                            <input
                                {...register('title')}
                                type="text"
                                className="input-field"
                                placeholder="Brief title of the issue (e.g., 'Large pothole near market')"
                            />
                            {errors.title && (
                                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                {...register('description')}
                                rows={4}
                                className="input-field resize-none"
                                placeholder="Describe the issue in detail. Include any relevant information like how long the problem has existed, impact on daily life, etc."
                            />
                            {errors.description && (
                                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Address / Landmark</label>
                            <input
                                {...register('address')}
                                type="text"
                                className="input-field"
                                placeholder="E.g., Near City Hospital, Main Road"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">3. Location</h2>
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={gettingLocation}
                                className="btn-secondary text-sm flex items-center gap-2"
                            >
                                {gettingLocation ? (
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MapPinIcon className="w-4 h-4" />
                                )}
                                Use Current Location
                            </button>
                        </div>

                        <p className="text-neutral-400 text-sm mb-4">
                            Click on the map to mark the exact location of the issue
                        </p>

                        <div className="h-80 rounded-xl overflow-hidden border border-white/10">
                            <MapContainer
                                center={position || defaultCenter}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationMarker position={position} setPosition={setPosition} />
                            </MapContainer>
                        </div>

                        {position && (
                            <p className="text-sm text-neutral-400 mt-2">
                                Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                            </p>
                        )}

                        <input type="hidden" {...register('latitude')} />
                        <input type="hidden" {...register('longitude')} />
                    </div>

                    {/* Image Upload */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4">4. Photo (Optional)</h2>
                        <p className="text-neutral-400 text-sm mb-4">
                            Upload a photo of the issue to help authorities understand the problem better
                        </p>

                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-64 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                <PhotoIcon className="w-12 h-12 text-neutral-400 mb-2" />
                                <p className="text-neutral-400">Click to upload image</p>
                                <p className="text-neutral-500 text-sm">Max size: 16MB</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-8 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="spinner w-5 h-5 border-2"></div>
                            ) : (
                                'Submit Complaint'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
