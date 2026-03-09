'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { auth, db, storage } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, sendEmailVerification, updateProfile } from 'firebase/auth';
import { getSmartAvatar } from '@/lib/firebase/profileUtils';
import Image from 'next/image';
import { APP_NAME, APP_DOMAIN } from '@/config/brand';
import ModuleEditor from '@/components/dashboard/ModuleEditor';
import RenderEngine from '@/components/public/RenderEngine';
import LinksList from '@/components/public/LinksList';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import FeedManager from '@/components/dashboard/FeedManager';
import AccountSettings from '@/components/dashboard/AccountSettings';
import DeleteAccountZone from '@/components/dashboard/DeleteAccountZone';
import VerificationBadgeZone from '@/components/dashboard/VerificationBadgeZone';
import StripeConnectZone from '@/components/dashboard/StripeConnectZone';
import { motion, AnimatePresence } from 'framer-motion';
import { getSkin } from '@/config/themes';
import { FONT_WHITELIST, FONT_MAP } from '@/config/fonts';
import { fontDictionary } from '@/utils/fonts';
import VerifiedBadge from '@/components/public/VerifiedBadge';
import toast from 'react-hot-toast';
import { getContrastYIQ, getSafeTextColor } from '@/lib/utils/themeUtils';
import NotificationBell from '@/components/dashboard/NotificationBell';
import WelcomeModal from '@/components/dashboard/WelcomeModal';
import QAManager from '@/components/dashboard/QAManager';
import HelpButton from '@/components/dashboard/HelpButton';

import { CreatorProfile } from '@/lib/firebase/profileUtils';

const THEME_COLORS = [
    { id: 'cyan_neon', hex: '#00FFCC', name: 'Cyan Neón' },
    { id: 'pink_neon', hex: '#FF0055', name: 'Rosa Neón' },
    { id: 'purple_electric', hex: '#7B61FF', name: 'Morado Eléctrico' },
    { id: 'orange_vibrant', hex: '#FF4500', name: 'Naranja Vibrante' },
    { id: 'yellow_bright', hex: '#FFB800', name: 'Amarillo Brillante' },
    { id: 'green_emerald', hex: '#00E676', name: 'Verde Esmeralda' },
    { id: 'blue_ocean', hex: '#00BFFF', name: 'Azul Océano' },
    { id: 'red_crimson', hex: '#DC143C', name: 'Rojo Carmesí' },
    { id: 'lavender', hex: '#E6E6FA', name: 'Lavanda' },
    { id: 'mint', hex: '#98FF98', name: 'Menta' },
    { id: 'peach', hex: '#FFDAB9', name: 'Melocotón' },
    { id: 'dark_slate', hex: '#2F4F4F', name: 'Gris Pizarra' }
];

export default function CreatorDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(true);
    const [verificationSent, setVerificationSent] = useState(false);

    const [creatorData, setCreatorData] = useState<CreatorProfile | null>(null);

    // Estados para el formulario y Theme 2.0
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#00FFCC');
    const [fontMode, setFontMode] = useState('sans');
    const [buttonStyle, setButtonStyle] = useState('rounded');
    const [themeMode, setThemeMode] = useState('dark');
    const [activeSkin, setActiveSkin] = useState('default');

    // Theme 3.0 State
    const [videoBgUrl, setVideoBgUrl] = useState('');
    const [audioBgUrl, setAudioBgUrl] = useState('');
    const [fontFamily, setFontFamily] = useState('Inter');

    const [activeTab, setActiveTab] = useState<'overview' | 'appearance' | 'studio' | 'interaction' | 'payments' | 'settings'>('overview');
    const [statsTimeframe, setStatsTimeframe] = useState<'all' | '7d' | '24h'>('7d');
    const [aggregatedStats, setAggregatedStats] = useState<any[]>([]);

    // UI State para Mobile Preview
    const [showPreviewMobile, setShowPreviewMobile] = useState(false);

    const updateCreatorData = async () => {
        if (!auth.currentUser) return;
        try {
            const docRef = doc(db, 'creators', auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCreatorData(docSnap.data() as CreatorProfile);
            }
        } catch (error) {
            console.error("Error re-fetching creator data:", error);
        }
    };

    useEffect(() => {
        const checkAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/dashboard/login');
                return;
            }

            // Verificar si volvemos de Stripe Connect
            const urlParams = new URLSearchParams(window.location.search);
            const connectStatus = urlParams.get('connect');

            if (connectStatus === 'success' || connectStatus === 'refresh') {
                // The actual verification and toast is handled by StripeConnectZone via /api/stripe/verify-connect.
                // Here we only refresh the creator data so the component gets fresh Firestore values.
                await updateCreatorData();
                // URL cleanup is handled by StripeConnectZone after the verify call completes.
            }

            // Fase 2: Restricción por Email no verificado
            if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
                router.push('/verify-email');
                return;
            } else {
                setIsEmailVerified(true);
            }

            try {
                const docRef = doc(db, 'creators', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as CreatorProfile;
                    setCreatorData(data);

                    // Inicializar los estados con los datos reales
                    setDisplayName(data.displayName || '');
                    setBio(data.bio || '');
                    setPrimaryColor(data.theme?.primaryColor || '#00FFCC');
                    setFontMode(data.theme?.fontMode || 'sans');
                    setButtonStyle(data.theme?.buttonStyle || 'rounded');
                    setThemeMode(data.theme?.mode || 'dark');
                    setActiveSkin(data.theme?.activeSkin || 'default');
                    setVideoBgUrl(data.theme?.videoBgUrl || data.theme?.backgroundImage || '');
                    setAudioBgUrl(data.theme?.audioBgUrl || '');
                    setFontFamily(data.theme?.fontFamily || 'Inter');
                }
            } catch (error) {
                console.error("Error obteniendo datos:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => checkAuth();
    }, [router]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setIsSaving(true);
        try {
            const docRef = doc(db, 'creators', auth.currentUser.uid);

            await updateDoc(docRef, {
                'displayName': displayName,
                'bio': bio,
                'theme.primaryColor': primaryColor,
                'theme.fontMode': fontMode,
                'theme.buttonStyle': buttonStyle,
                'theme.mode': themeMode,
                'theme.activeSkin': activeSkin,
                'theme.videoBgUrl': videoBgUrl,
                'theme.backgroundImage': videoBgUrl, // keep both fields in sync for the public profile
                'theme.audioBgUrl': audioBgUrl,
                'theme.fontFamily': fontFamily,
            });

            // Actualizar estado local
            setCreatorData((prev: any) => prev ? {
                ...prev,
                displayName,
                bio,
                theme: { ...prev.theme, primaryColor, fontMode, buttonStyle, mode: themeMode, activeSkin, videoBgUrl, backgroundImage: videoBgUrl, audioBgUrl, fontFamily }
            } : null);

            toast.success("¡Configuración guardada!");
        } catch (error) {
            console.error("Error guardando:", error);
            toast.error("Hubo un error al guardar. Revisa tu conexión.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.currentUser) return;

        setIsUploadingPic(true);
        try {
            // 1. Comprimir con canvas (máx 500px, calidad 0.80) antes de subir
            const compressedBlob = await new Promise<Blob>((resolve, reject) => {
                const img = new window.Image();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    img.src = ev.target?.result as string;
                    img.onload = () => {
                        const MAX = 500;
                        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.round(img.width * ratio);
                        canvas.height = Math.round(img.height * ratio);
                        const ctx = canvas.getContext('2d')!;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas fail')), 'image/jpeg', 0.80);
                    };
                    img.onerror = reject;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // 2. Subir a Firebase Storage
            const storageRef = ref(storage, `creators/${auth.currentUser.uid}/avatar.jpg`);
            await uploadBytes(storageRef, compressedBlob, { contentType: 'image/jpeg' });
            const downloadUrl = await getDownloadURL(storageRef);

            // 3. Guardar URL (no Base64) en Firestore
            const docRef = doc(db, 'creators', auth.currentUser.uid);
            await updateDoc(docRef, { 'avatarUrl': downloadUrl });

            // 4. Actualizar UI
            setCreatorData((prev: any) => prev ? {
                ...prev,
                avatarUrl: downloadUrl
            } : null);
        } catch (err) {
            console.error('[AVATAR UPLOAD ERROR]', err);
            toast.error('Error al subir la foto. Verifica las Storage Rules de Firebase.');
        } finally {
            setIsUploadingPic(false);
            e.target.value = '';
        }
    };

    const handleMakePremium = async () => {
        if (!auth.currentUser) return;

        try {
            const response = await fetch('/api/stripe/checkout-premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: auth.currentUser.uid }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.details || data.error || "No url returned");
            }
        } catch (error: any) {
            console.error("Error al iniciar checkout:", error);
            toast.error(error.message || "Error al conectar con la pasarela de pago.");
        }
    };

    const analyticsData = useMemo(() => {
        if (statsTimeframe === 'all') {
            return creatorData?.modules ? creatorData.modules.filter((m: any) => m.clicks !== undefined) : [];
        }
        return aggregatedStats;
    }, [creatorData?.modules, aggregatedStats, statsTimeframe]);

    // Fetch and aggregate stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!auth.currentUser || statsTimeframe === 'all') return;

            try {
                const { collection, query, where, getDocs, Timestamp } = await import('firebase/firestore');
                const analyticsRef = collection(db, 'creators', auth.currentUser.uid, 'analytics_events');

                let startDate = new Date();
                if (statsTimeframe === '7d') startDate.setDate(startDate.getDate() - 7);
                if (statsTimeframe === '24h') startDate.setHours(startDate.getHours() - 24);

                const q = query(analyticsRef, where('timestamp', '>=', Timestamp.fromDate(startDate)));
                const querySnapshot = await getDocs(q);

                const counts: Record<string, number> = {};
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const moduleId = data.moduleId;
                    counts[moduleId] = (counts[moduleId] || 0) + 1;
                });

                const formattedStats = (creatorData?.modules || [])
                    .filter((m: any) => counts[m.id])
                    .map((m: any) => ({
                        title: m.title || m.type,
                        clicks: counts[m.id]
                    }));

                setAggregatedStats(formattedStats);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();
    }, [auth.currentUser, statsTimeframe, creatorData?.modules]);

    const handleCopyLink = () => {
        if (!creatorData?.username) return;
        const profileUrl = `${window.location.origin}/${creatorData.username}`;
        navigator.clipboard.writeText(profileUrl);
        toast.success("¡Enlace copiado!");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d0d12] text-white">
                <div className="w-8 h-8 rounded-full border-4 border-t-[#00FFCC] animate-spin border-gray-700"></div>
            </div>
        );
    }

    if (!creatorData) return null;

    if (!isEmailVerified) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d12] text-white p-4 text-center selection:bg-[#00FFCC] selection:text-black">
                <div className="bg-gray-900/60 p-8 sm:p-12 rounded-3xl border border-gray-800 max-w-md w-full shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <span className="text-6xl mb-6 block drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">✉️</span>
                    <h2 className="text-2xl font-black mb-3 text-white tracking-tight">Verifica tu correo electrónico</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Hemos enviado un enlace de confirmación a <br /><b className="text-white block mt-1 text-base">{auth.currentUser?.email}</b><br />
                        Por favor, confírmalo para acceder a tu Centro de Mando.
                    </p>

                    <button
                        onClick={async () => {
                            if (auth.currentUser) {
                                await sendEmailVerification(auth.currentUser);
                                toast.success("Correo reenviado. Revisa tu bandeja de entrada o spam.");
                                setVerificationSent(true);
                            }
                        }}
                        disabled={verificationSent}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-all mb-6 shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        {verificationSent ? '✅ Enlace Reenviado' : 'Reenviar Enlace de Acceso'}
                    </button>

                    <button onClick={() => { auth.signOut(); router.push('/dashboard/login'); }} className="text-gray-500 text-sm font-bold hover:text-white transition-colors">
                        ← Volver al inicio de sesión
                    </button>
                </div>
            </div>
        )
    }

    // --- GENERAR PREVIEW ---
    const generatePreviewLayout = () => {
        const modules = creatorData.modules || [];
        const dynamicLayout: any[] = [];

        dynamicLayout.push({
            type: 'qna',
            id: 'qna-core',
            props: {
                creatorId: auth.currentUser?.uid,
                title: `¡Pregúntale a ${displayName}!`,
                placeholder: 'Haz tu pregunta anónimamente aquí...'
            }
        });

        const dynamicModules = modules.filter((mod: any) => mod.type !== 'links');

        dynamicModules.forEach((mod: any) => {
            const baseProps = { ...mod.props, id: mod.id, username: creatorData.username, creatorId: auth.currentUser?.uid };

            if (mod.type === 'media') {
                dynamicLayout.push({ type: 'media', id: mod.id, props: baseProps });
            } else if (mod.type === 'nativeAd') {
                dynamicLayout.push({ type: 'nativeAd', id: mod.id, props: baseProps });
            } else if (mod.type === 'tip') {
                dynamicLayout.push({ type: 'tip', id: mod.id, props: baseProps });
            } else if (mod.type === 'poll') {
                dynamicLayout.push({ type: 'poll', id: mod.id, props: baseProps });
            } else if (mod.type === 'gallery') {
                dynamicLayout.push({ type: 'gallery', id: mod.id, props: baseProps });
            } else if (mod.type === 'feed') {
                dynamicLayout.push({ type: 'feed', id: mod.id, props: baseProps });
            }
        });

        return dynamicLayout;
    };

    // Agrupar 'links' para LinksList
    const linksModules = creatorData.modules ? creatorData.modules.filter((mod: any) => mod.type === 'links') : [];

    // Resolver la clase del skin y la tipografía para la vista previa
    const activeSkinObj = getSkin(activeSkin as any);
    const fontClass = fontFamily && fontDictionary[fontFamily] ? fontDictionary[fontFamily].className : '';


    return (
        <div className={`min-h-screen bg-[#0d0d12] text-white p-4 md:p-8 relative ${showPreviewMobile ? 'h-screen overflow-hidden' : ''}`}>

            {/* FASE 4 / TAREA 4: Modal de Bienvenida para usuarios que recién crearon su nexus */}
            {creatorData.hasSeenWelcomeModal === false && (
                <WelcomeModal onClose={() => setCreatorData(prev => prev ? { ...prev, hasSeenWelcomeModal: true } : null)} />
            )}

            {/* Toggle Flotante Mobile para Live Preview */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setShowPreviewMobile(!showPreviewMobile)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(123,97,255,0.5)] active:scale-95 transition-transform"
                >
                    {showPreviewMobile ? '✏️ Volver a Editar' : '📱 Vista Previa'}
                </button>
            </div>

            {/* Glow de fondo dinámico */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none transition-colors duration-700"
                style={{ backgroundColor: primaryColor }}
            />

            <div className="relative z-10 max-w-3xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-800 gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                                Centro de Mando
                            </h1>
                            <p className="text-gray-400 mt-2 flex items-center justify-center md:justify-start gap-3">
                                <span>Plan actual: <span className="uppercase font-extrabold tracking-wider transition-colors duration-300" style={{ color: primaryColor }}>{creatorData.isPremium ? 'PRO ⭐' : 'Free'}</span></span>
                            </p>
                        </div>

                        {!creatorData.isPremium && (
                            <button
                                onClick={handleMakePremium}
                                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg hover:shadow-yellow-500/50 transition-all hover:-translate-y-0.5"
                            >
                                ⭐ Unirse a Premium
                            </button>
                        )}

                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-[#15151b] border border-gray-800 rounded-xl text-sm font-bold text-white hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                        >
                            🔗 Copiar mi enlace
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button
                            onClick={async () => {
                                await fetch('/api/auth/session', { method: 'DELETE' });
                                auth.signOut();
                            }}
                            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* COLUMNA IZQUIERDA: EDITOR (60%) */}
                    <div className={`w-full md:w-[60%] md:min-w-[400px] space-y-8 ${showPreviewMobile ? 'hidden md:block' : 'block'}`}>
                        {/* TAB NAVIGATION */}
                        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide">
                            <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>🏠 Inicio</button>
                            <button onClick={() => setActiveTab('appearance')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'appearance' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>🎨 Apariencia</button>
                            <button onClick={() => setActiveTab('studio')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'studio' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>📝 Creator Studio</button>
                            <button onClick={() => setActiveTab('interaction')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'interaction' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>💬 Interacción</button>
                            <button onClick={() => setActiveTab('payments')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'payments' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>🏦 Pagos</button>
                            <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>⚙️ Configuración</button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div key="overview" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    {/* Perfil Summary */}
                                    <div className="p-6 bg-gray-900 border border-gray-800 rounded-3xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 shadow-xl">
                                        <div className="relative group cursor-pointer flex-shrink-0 w-28 h-28" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                            <div className="absolute -inset-1 rounded-full blur-sm opacity-50 transition-colors duration-300 group-hover:opacity-80" style={{ backgroundColor: primaryColor }}></div>
                                            <img
                                                src={creatorData.avatarUrl || getSmartAvatar(creatorData.displayName || creatorData.username, creatorData.username)}
                                                alt="Avatar"
                                                className={`relative z-10 w-full h-full rounded-full border-4 object-cover aspect-square ${isUploadingPic ? 'opacity-50' : ''}`}
                                                style={{ borderColor: primaryColor }}
                                            />
                                            {isUploadingPic && (
                                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                                    <div className="w-8 h-8 rounded-full border-4 border-t-white animate-spin border-gray-700"></div>
                                                </div>
                                            )}
                                            {!isUploadingPic && (
                                                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                                    <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">Cambiar</span>
                                                </div>
                                            )}
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-start">
                                            <h2 className="font-bold text-xl break-words w-full">{displayName || creatorData.displayName}</h2>
                                            <p className="text-sm text-gray-500 mb-6 break-words w-full">{APP_DOMAIN}/{creatorData.username}</p>

                                            <a
                                                href={`/${creatorData.username}`}
                                                target="_blank"
                                                className="w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 block text-center"
                                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                            >
                                                Ver Perfil Público ↗
                                            </a>
                                        </div>
                                    </div>

                                    {/* ANALYTICS VISUALES AQUI */}
                                    {creatorData.modules && creatorData.modules.length > 0 && (
                                        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold text-white">Analíticas de Clics</h3>
                                                <div className="flex bg-gray-800 rounded-lg p-1">
                                                    <button
                                                        onClick={() => setStatsTimeframe('24h')}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statsTimeframe === '24h' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                                    >
                                                        24h
                                                    </button>
                                                    <button
                                                        onClick={() => setStatsTimeframe('7d')}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statsTimeframe === '7d' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                                    >
                                                        7d
                                                    </button>
                                                    <button
                                                        onClick={() => setStatsTimeframe('all')}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${statsTimeframe === 'all' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                                    >
                                                        Total
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={analyticsData}>
                                                        <XAxis dataKey="title" stroke="#8884d8" fontSize={10} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#8884d8" fontSize={10} tickLine={false} axisLine={false} />
                                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2028', border: 'none', borderRadius: '12px' }} />
                                                        <Bar dataKey="clicks" fill={primaryColor} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-4 text-center">
                                                * Los datos de 24h y 7d son aproximados basados en eventos recientes.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'appearance' && (
                                <motion.div key="appearance" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    {/* SECCIÓN DISEÑO MOVIDA AL PRINCIPIO DE APARIENCIA */}
                                    <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
                                        <div className="flex items-center gap-2 mb-6 group relative w-fit">
                                            <h3 className="text-xl font-bold text-white text-center md:text-left tracking-tight flex items-center gap-2">
                                                Identidad de Marca y Tema
                                                <svg className="w-5 h-5 text-gray-400 cursor-help hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </h3>
                                            <div className="absolute left-0 top-full mt-2 w-64 p-3 text-xs bg-gray-900 border border-gray-700 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover:translate-y-0">
                                                ¿Cómo usar el Fondo de Pantalla? Pega una URL o sube una imagen optimizada. ¿Audio Ambiental? Pega un link de mp3.
                                            </div>
                                        </div>
                                        <form onSubmit={handleSaveProfile} className="space-y-6">
                                            <div className="pt-2">
                                                <label className="block text-sm font-medium text-gray-400 mb-4 mt-2 text-center md:text-left">
                                                    Color de Acento (Primario)
                                                </label>
                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start items-center">
                                                    {THEME_COLORS.map((color) => (
                                                        <button
                                                            key={color.id}
                                                            type="button"
                                                            onClick={() => setPrimaryColor(color.hex)}
                                                            title={color.name}
                                                            className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${primaryColor === color.hex ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-[#0d0d12]' : 'hover:scale-110'
                                                                }`}
                                                            style={{ backgroundColor: color.hex, boxShadow: primaryColor === color.hex ? `0 0 20px ${color.hex}80` : 'none' }}
                                                        >
                                                            {primaryColor === color.hex && (
                                                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))}

                                                    <div
                                                        className="relative w-10 h-10 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 border border-white/20"
                                                        style={{ backgroundColor: primaryColor }}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={primaryColor}
                                                            onChange={(e) => {
                                                                const newColor = e.target.value;
                                                                setPrimaryColor(newColor);

                                                                // Guardado en tiempo real con debounce simple
                                                                if ((window as any)._colorTimeout) clearTimeout((window as any)._colorTimeout);
                                                                (window as any)._colorTimeout = setTimeout(async () => {
                                                                    if (auth.currentUser) {
                                                                        try {
                                                                            const docRef = doc(db, 'creators', auth.currentUser.uid);
                                                                            await updateDoc(docRef, { 'theme.primaryColor': newColor });
                                                                            setCreatorData((prev: any) => prev ? { ...prev, theme: { ...prev.theme, primaryColor: newColor } } : null);
                                                                        } catch (err) {
                                                                            console.error("Error guardando color custom:", err);
                                                                        }
                                                                    }
                                                                }, 500);
                                                            }}
                                                            className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer opacity-0"
                                                        />
                                                        <svg className="w-5 h-5 text-white mix-blend-difference" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-800/50">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipografía Principal</label>
                                                    <select
                                                        value={fontFamily}
                                                        onChange={(e) => setFontFamily(e.target.value)}
                                                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                                    >
                                                        {FONT_WHITELIST.map(font => (
                                                            <option key={font} value={font}>{font}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Skin Base (Estilo)</label>
                                                    <select
                                                        value={activeSkin}
                                                        onChange={(e) => setActiveSkin(e.target.value)}
                                                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                                    >
                                                        <option value="default">Default (Cristal)</option>
                                                        <option value="gotham">Gotham (Oscuro/Neón)</option>
                                                        <option value="burton">Burton (Dibujado)</option>
                                                        <option value="minimalist">Minimalist (Limpio)</option>
                                                        <option value="neumorphism">Neumorphism (3D Suave)</option>
                                                        <option value="royal_midnight">Royal Midnight (👑 Deluxe)</option>
                                                        <option value="organic_zen">Organic Zen (🍃 Natural)</option>
                                                        <option value="neon_cyberpunk">Neon Cyberpunk (⚡ High-Contrast)</option>
                                                        <option value="frosted_glass">Frosted Glass (❄️ White Frost)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-400">🖼️ Fondo Personalizado</label>
                                                    {videoBgUrl ? (
                                                        <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-xl border border-gray-700">
                                                            <img src={videoBgUrl} className="w-8 h-8 rounded object-cover" />
                                                            <span className="text-xs text-green-400 flex-1 truncate font-bold italic">Imagen de Fondo Activa ✓</span>
                                                            <button type="button" onClick={() => setVideoBgUrl('')} className="text-red-400 p-1 hover:bg-red-500/10 rounded-lg">✕</button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex items-center justify-center gap-2 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl h-[52px] cursor-pointer hover:border-blue-500/50 hover:bg-gray-800 transition-all text-gray-400">
                                                            <span className="text-lg">📤</span>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Subir Imagen</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file || !auth.currentUser) return;
                                                                    setIsSaving(true);
                                                                    try {
                                                                        // Comprimir con canvas 
                                                                        const compressedBlob = await new Promise<Blob>((resolve, reject) => {
                                                                            const img = new window.Image();
                                                                            const reader = new FileReader();
                                                                            reader.onload = (ev) => {
                                                                                img.src = ev.target?.result as string;
                                                                                img.onload = () => {
                                                                                    const MAX = 1920;
                                                                                    const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
                                                                                    const canvas = document.createElement('canvas');
                                                                                    canvas.width = Math.round(img.width * ratio);
                                                                                    canvas.height = Math.round(img.height * ratio);
                                                                                    const ctx = canvas.getContext('2d')!;
                                                                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                                                    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas fail')), 'image/jpeg', 0.80);
                                                                                };
                                                                                img.onerror = reject;
                                                                            };
                                                                            reader.onerror = reject;
                                                                            reader.readAsDataURL(file);
                                                                        });
                                                                        const storageRef = ref(storage, `creators/${auth.currentUser.uid}/theme/bg-image-${Date.now()}.jpg`);
                                                                        await uploadBytes(storageRef, compressedBlob, { contentType: 'image/jpeg' });
                                                                        const url = await getDownloadURL(storageRef);
                                                                        setVideoBgUrl(url);
                                                                    } catch (err: any) {
                                                                        console.error('[BG UPLOAD ERROR]', err);
                                                                        toast.error(`Error al subir imagen: ${err?.code || err?.message || 'desconocido'}`);
                                                                    } finally {
                                                                        setIsSaving(false);
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-400">🎵 Audio (MP3)</label>
                                                    <label className="flex items-center justify-center gap-2 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl h-[52px] cursor-pointer hover:border-blue-500/50 hover:bg-gray-800 transition-all text-gray-400">
                                                        <span className="text-lg">{audioBgUrl ? '✅' : '🎸'}</span>
                                                        <span className="text-xs font-bold uppercase tracking-wider">{audioBgUrl ? 'Audio Listo' : 'Subir MP3'}</span>
                                                        <input type="file" accept="audio/mpeg,audio/mp3,audio/*" className="hidden" onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file || !auth.currentUser) return;
                                                            if (file.size > 5 * 1024 * 1024) { toast.error('El audio no puede superar 5MB'); return; }
                                                            setIsSaving(true);
                                                            try {
                                                                const storageRef = ref(storage, `creators/${auth.currentUser.uid}/theme/bg-audio.mp3`);
                                                                await uploadBytes(storageRef, file);
                                                                const url = await getDownloadURL(storageRef);
                                                                setAudioBgUrl(url);
                                                            } catch (err: any) {
                                                                console.error('[AUDIO UPLOAD ERROR]', err);
                                                                toast.error(`Error al subir audio: ${err?.code || err?.message || 'desconocido'}`);
                                                            }
                                                            finally { setIsSaving(false); e.target.value = ''; }
                                                        }} />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex justify-end border-t border-gray-800 pt-6">
                                                <button type="submit" disabled={isSaving} className={`w-full md:w-auto px-10 py-4 font-bold rounded-2xl transition-all shadow-xl hover:-translate-y-1 ${getContrastYIQ(primaryColor)}`} style={{ backgroundColor: primaryColor }}>
                                                    {isSaving ? 'Guardando...' : 'Aplicar Diseño'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* SECCIÓN INFORMACIÓN PERSONAL (AHORA SEGUNDA) */}
                                    <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl mt-8">
                                        <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Información de Perfil</h3>
                                        <form onSubmit={handleSaveProfile} className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Nombre Público</label>
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="w-full bg-gray-800/30 border border-gray-700/50 rounded-2xl px-5 py-4 focus:ring-1 outline-none text-white transition-all"
                                                    style={{ '--tw-ring-color': primaryColor } as any}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Breve Biografía</label>
                                                <textarea
                                                    rows={3}
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    className="w-full bg-gray-800/30 border border-gray-700/50 rounded-2xl px-5 py-4 focus:ring-1 outline-none text-white resize-none transition-all"
                                                    style={{ '--tw-ring-color': primaryColor } as any}
                                                    placeholder="Cuéntale al mundo quién eres..."
                                                />
                                            </div>
                                            <div className="flex justify-end pt-4">
                                                <button type="submit" disabled={isSaving} className="text-gray-400 hover:text-white font-bold transition-colors">Actualizar Perfil</button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {/* PESTAÑA DE MENSAJES Q&A */}
                            {activeTab === 'interaction' && (
                                <motion.div key="interaction" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    <QAManager />
                                </motion.div>
                            )}

                            {/* PESTAÑA FEED Y MÓDULOS */}
                            {activeTab === 'studio' && creatorData && (
                                <motion.div key="studio" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    {/* Feed Manager (Requiere al menos un módulo Feed creado) */}
                                    {creatorData && creatorData.modules?.some(m => m.type === 'feed') && (
                                        <FeedManager
                                            feedModules={creatorData.modules.filter(m => m.type === 'feed')}
                                            creatorId={creatorData.uid}
                                        />
                                    )}

                                    <ModuleEditor
                                        modules={creatorData.modules || []}
                                        isPremium={creatorData.isPremium || false}
                                        stripeSetupComplete={creatorData.stripeSetupComplete === true}
                                        onUpdate={async () => {
                                            const user = auth.currentUser;
                                            if (user) {
                                                const docRef = doc(db, 'creators', user.uid);
                                                const docSnap = await getDoc(docRef);
                                                if (docSnap.exists()) {
                                                    setCreatorData(docSnap.data() as CreatorProfile);
                                                }
                                            }
                                        }}
                                    />
                                </motion.div>
                            )}

                            {/* Pestaña de Pagos y Monetización */}
                            {activeTab === 'payments' && creatorData && (
                                <motion.div key="payments" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    <StripeConnectZone creatorData={creatorData} onUpdate={updateCreatorData} />
                                </motion.div>
                            )}

                            {/* Pestaña de Ajustes de Cuenta */}
                            {activeTab === 'settings' && (
                                <motion.div key="settings" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        <AccountSettings />
                                        <VerificationBadgeZone creatorData={creatorData} />
                                        <DeleteAccountZone />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* COLUMNA DERECHA: LIVE PREVIEW MOCKUP (40%) */}
                    <div className={`w-full md:w-[40%] flex justify-center md:sticky md:top-8 md:self-start ${!showPreviewMobile ? 'hidden md:flex' : 'flex'}`}>
                        <div className="w-[min(375px,90vw)] h-[min(812px,calc(100vh-6rem))] bg-black border-8 border-gray-800 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center pt-12 pb-8">
                            <div className="absolute top-0 inset-x-0 h-7 bg-gray-800 rounded-b-3xl w-40 mx-auto z-50"></div> {/* Notch */}

                            {/* LIVE PREVIEW CONTENT */}
                            <div
                                className={`w-full h-full overflow-y-auto pb-20 scrollbar-hide ${activeSkinObj.containerClass} ${videoBgUrl ? '!bg-transparent' : ''} !min-h-0 relative`}
                                style={{
                                    backgroundColor: activeSkin !== 'default' ? undefined : (videoBgUrl ? undefined : '#0d0d12'),
                                    backgroundImage: videoBgUrl ? `url(${videoBgUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    color: activeSkin !== 'default' ? undefined : (getSafeTextColor(primaryColor) === '#FFFFFF' ? '#FFFFFF' : '#111827'),
                                    fontFamily: fontFamily && FONT_MAP[fontFamily] ? FONT_MAP[fontFamily] : 'var(--font-inter)'
                                }}
                            >
                                {/* Fondo de previsualización dinámico transparente si es requerido */}
                                {activeSkin !== 'gotham' && activeSkin !== 'burton' && !videoBgUrl && (
                                    <div
                                        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                                        style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${primaryColor} 0%, transparent 50%)` }}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center p-6 text-center">
                                    <div className="relative w-24 h-24 flex-shrink-0 mt-4 overflow-hidden rounded-full border-4" style={{ borderColor: primaryColor }}>
                                        <Image src={creatorData.avatarUrl || '/default-avatar.png'} alt="Avatar" fill sizes="96px" className="object-cover aspect-square" />
                                    </div>
                                    <h2 className={`text-2xl font-bold mt-4 leading-tight break-words text-center flex items-center justify-center ${activeSkinObj.textClass}`}>
                                        {displayName}
                                        {(creatorData.isVerified || creatorData.isPremium) && <VerifiedBadge />}
                                    </h2>
                                    <p className={`text-sm mt-2 mb-6 px-4 ${activeSkinObj.textClass} opacity-80`}>{bio}</p>

                                    <div className="w-full">
                                        <LinksList modules={linksModules} theme={{ primaryColor, mode: themeMode, fontMode, buttonStyle, activeSkin, fontFamily, videoBgUrl, audioBgUrl }} username={creatorData.username} />
                                        <RenderEngine layout={generatePreviewLayout()} theme={{ primaryColor, mode: themeMode, fontMode, buttonStyle, activeSkin, fontFamily, videoBgUrl, audioBgUrl }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <HelpButton />
            </div >
        </div >
    );
}
