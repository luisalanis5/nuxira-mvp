'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { auth, db, storage } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import ModuleEditor from '@/components/dashboard/ModuleEditor';
import RenderEngine from '@/components/public/RenderEngine';
import LinksList from '@/components/public/LinksList';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import FeedManager from '@/components/dashboard/FeedManager';
import { motion, AnimatePresence } from 'framer-motion';
import { getSkin } from '@/config/themes';
import { FONT_WHITELIST } from '@/config/fonts';
import VerifiedBadge from '@/components/public/VerifiedBadge';
import toast from 'react-hot-toast';

type CreatorData = {
    profile: {
        displayName: string;
        bio: string;
        avatarUrl: string;
    };
    username: string;
    plan: string;
    modules: any[];
    theme?: {
        primaryColor: string;
        mode: string;
        fontMode: string;
        buttonStyle: string;
        activeSkin: string;
        videoBgUrl?: string;
        audioBgUrl?: string;
        fontFamily?: string;
    };
    isPremium?: boolean;
    isVerified?: boolean;
};

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

    const [creatorData, setCreatorData] = useState<CreatorData | null>(null);

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

    const [activeTab, setActiveTab] = useState<'basics' | 'design' | 'modules'>('basics');

    // UI State para Mobile Preview
    const [showPreviewMobile, setShowPreviewMobile] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/dashboard/login');
                return;
            }

            try {
                const docRef = doc(db, 'creators', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as CreatorData;
                    setCreatorData(data);

                    // Inicializar los estados con los datos reales
                    setDisplayName(data.profile.displayName || '');
                    setBio(data.profile.bio || '');
                    setPrimaryColor(data.theme?.primaryColor || '#00FFCC');
                    setFontMode(data.theme?.fontMode || 'sans');
                    setButtonStyle(data.theme?.buttonStyle || 'rounded');
                    setThemeMode(data.theme?.mode || 'dark');
                    setActiveSkin(data.theme?.activeSkin || 'default');
                    setVideoBgUrl(data.theme?.videoBgUrl || '');
                    setAudioBgUrl(data.theme?.audioBgUrl || '');
                    setFontFamily(data.theme?.fontFamily || 'Inter');
                }
            } catch (error) {
                console.error("Error obteniendo datos:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setIsSaving(true);
        try {
            const docRef = doc(db, 'creators', auth.currentUser.uid);

            await updateDoc(docRef, {
                'profile.displayName': displayName,
                'profile.bio': bio,
                'theme.primaryColor': primaryColor,
                'theme.fontMode': fontMode,
                'theme.buttonStyle': buttonStyle,
                'theme.mode': themeMode,
                'theme.activeSkin': activeSkin,
                'theme.videoBgUrl': videoBgUrl,
                'theme.audioBgUrl': audioBgUrl,
                'theme.fontFamily': fontFamily,
            });

            // Actualizar estado local para que la UI refleje el nuevo color inmediatamente
            setCreatorData(prev => prev ? {
                ...prev,
                profile: { ...prev.profile, displayName, bio },
                theme: { primaryColor, fontMode, buttonStyle, mode: themeMode, activeSkin, videoBgUrl, audioBgUrl, fontFamily }
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
            await updateDoc(docRef, { 'profile.avatarUrl': downloadUrl });

            // 4. Actualizar UI
            setCreatorData(prev => prev ? {
                ...prev,
                profile: { ...prev.profile, avatarUrl: downloadUrl }
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
        if (!confirm("Esto es una simulación de pago. ¿Deseas hacerte Premium gratis? 😂")) return;

        try {
            const docRef = doc(db, 'creators', auth.currentUser.uid);
            await updateDoc(docRef, { isPremium: true });

            setCreatorData(prev => prev ? { ...prev, isPremium: true } : null);
            toast.success("⭐ ¡Felicidades! Ya eres Nexia Pro.");
        } catch (error) {
            console.error("Error al hacerse premium:", error);
            toast.error("Error al procesar el pago.");
        }
    };

    const handleRequestVerification = async () => {
        if (!auth.currentUser) return;
        if (!creatorData?.isPremium) {
            toast.error("Pronto disponible para cuentas PRO. ¡Hazte premium primero!");
            return;
        }

        try {
            const docRef = doc(db, 'creators', auth.currentUser.uid);
            await updateDoc(docRef, { isVerified: true });

            setCreatorData(prev => prev ? { ...prev, isVerified: true } : null);
            toast.success("¡Verificación concedida!");
        } catch (error) {
            console.error("Error al verificar:", error);
            toast.error("Error al procesar la verificación.");
        }
    };

    const analyticsData = useMemo(() => {
        return creatorData?.modules ? creatorData.modules.filter((m: any) => m.clicks !== undefined) : [];
    }, [creatorData?.modules]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d0d12] text-white">
                <div className="w-8 h-8 rounded-full border-4 border-t-[#00FFCC] animate-spin border-gray-700"></div>
            </div>
        );
    }

    if (!creatorData) return null;

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
    const fontClass = fontMode === 'serif' ? 'font-serif' : fontMode === 'mono' ? 'font-mono' : activeSkinObj.baseFont;


    return (
        <div className={`min-h-screen bg-[#0d0d12] text-white p-4 md:p-8 relative overflow-hidden ${showPreviewMobile ? 'h-screen overflow-hidden' : 'overflow-auto'}`}>
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
                <header className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Centro de Mando
                        </h1>
                        <p className="text-gray-400 mt-2 flex items-center gap-3">
                            <span>Plan actual: <span className="uppercase font-extrabold tracking-wider transition-colors duration-300" style={{ color: primaryColor }}>{creatorData.isPremium ? 'PRO ⭐' : 'Free'}</span></span>
                            {!creatorData.isPremium && (
                                <button
                                    onClick={handleMakePremium}
                                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-lg hover:shadow-yellow-500/50 transition-all hover:-translate-y-0.5"
                                >
                                    ⭐ Hacerse Premium
                                </button>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => auth.signOut()}
                        className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* COLUMNA IZQUIERDA: EDITOR (60%) */}
                    <div className={`w-full md:w-[60%] md:min-w-[400px] space-y-8 ${showPreviewMobile ? 'hidden md:block' : 'block'}`}>
                        {/* TAB NAVIGATION */}
                        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide">
                            <button onClick={() => setActiveTab('basics')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'basics' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>Básicos</button>
                            <button onClick={() => setActiveTab('design')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'design' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>Diseño & Tema</button>
                            <button onClick={() => setActiveTab('modules')} className={`whitespace-nowrap px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'modules' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>Módulos & Contenido</button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'basics' && (
                                <motion.div key="basics" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    {/* Perfil Summary */}
                                    <div className="p-6 bg-gray-900 border border-gray-800 rounded-3xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 shadow-xl">
                                        <div className="relative group cursor-pointer flex-shrink-0 w-28 h-28" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                            <div className="absolute -inset-1 rounded-full blur-sm opacity-50 transition-colors duration-300 group-hover:opacity-80" style={{ backgroundColor: primaryColor }}></div>
                                            <img
                                                src={creatorData.profile.avatarUrl}
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
                                            <h2 className="font-bold text-xl break-words w-full">{displayName || creatorData.profile.displayName}</h2>
                                            <p className="text-sm text-gray-500 mb-6 break-words w-full">nexia.app/{creatorData.username}</p>

                                            <a
                                                href={`/${creatorData.username}`}
                                                target="_blank"
                                                className="w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 block text-center"
                                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                            >
                                                Ver Perfil Público ↗
                                            </a>
                                            <button
                                                onClick={handleRequestVerification}
                                                className={`w-full mt-3 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 block text-center ${creatorData?.isVerified ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-default' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                                                disabled={creatorData?.isVerified}
                                            >
                                                {creatorData?.isVerified ? '✓ Cuenta Verificada' : 'Solicitar Verificación'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* THEME ENGINE 2.0 PANEL OR BASIC INFO */}
                                    <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
                                        <h3 className="text-xl font-bold mb-6 text-white text-center md:text-left">Información Personal</h3>

                                        <form onSubmit={handleSaveProfile} className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                                    Nombre a Mostrar
                                                </label>
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-5 py-4 focus:ring-2 outline-none text-white transition-all focus:bg-gray-800"
                                                    style={{ '--tw-ring-color': primaryColor } as any}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                                    Biografía
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-5 py-4 focus:ring-2 outline-none text-white resize-none transition-all focus:bg-gray-800"
                                                    style={{ '--tw-ring-color': primaryColor } as any}
                                                    placeholder="Cuéntale al mundo quién eres..."
                                                />
                                            </div>

                                            <div className="flex justify-end pt-6">
                                                <button type="submit" disabled={isSaving} className="w-full md:w-auto px-10 py-4 font-bold rounded-2xl transition-all disabled:opacity-50 text-black shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95" style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}40` }}>{isSaving ? 'Guardando...' : 'Guardar Básicos'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'design' && (
                                <motion.div key="design" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex items-center gap-2 mb-6 group relative w-fit">
                                        <h3 className="text-xl font-bold text-white text-center md:text-left">Identidad de Marca y Tema</h3>
                                        <svg className="w-5 h-5 text-gray-400 cursor-help hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 p-3 text-xs bg-gray-900 border border-gray-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            ¿Cómo usar el Fondo de Video? Pega una URL de un video mp4. ¿Audio Ambiental? Pega un link de mp3. Se reproducirán en bucle en tu perfil.
                                        </div>
                                    </div>
                                    <form onSubmit={handleSaveProfile} className="space-y-6">
                                        <div className="pt-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-4 mt-4 text-center md:text-left">
                                                Color del Tema
                                            </label>
                                            <div className="flex flex-wrap gap-4 justify-center md:justify-start items-center">
                                                {THEME_COLORS.map((color) => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => setPrimaryColor(color.hex)}
                                                        title={color.name}
                                                        className={`w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center ${primaryColor === color.hex ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-[#0d0d12]' : 'hover:scale-110'
                                                            }`}
                                                        style={{ backgroundColor: color.hex, boxShadow: primaryColor === color.hex ? `0 0 20px ${color.hex}80` : 'none' }}
                                                    >
                                                        {primaryColor === color.hex && (
                                                            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}

                                                {/* Selector de Color Personalizado en Tiempo Real */}
                                                <div
                                                    className="relative w-12 h-12 rounded-full overflow-hidden transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg hover:scale-110"
                                                    style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}80` }}
                                                    title="Color Personalizado Profundo"
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
                                                    <svg className="w-5 h-5 text-black pointer-events-none mix-blend-difference opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* THEME ENGINE 2.0 CONTROLS */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800/50">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Tipografía (Google Fonts)</label>
                                                <select
                                                    value={fontFamily}
                                                    onChange={(e) => setFontFamily(e.target.value)}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                                                >
                                                    {FONT_WHITELIST.map(font => (
                                                        <option key={font} value={font}>{font}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Skin Base (Fallback)</label>
                                                <select
                                                    value={activeSkin}
                                                    onChange={(e) => setActiveSkin(e.target.value)}
                                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                                                >
                                                    <option value="default">Default (Cristal)</option>
                                                    <option value="gotham">Gotham (Oscuro/Neón)</option>
                                                    <option value="burton">Burton (Dibujado)</option>
                                                    <option value="minimalist">Minimalist (Limpio)</option>
                                                    <option value="neumorphism">Neumorphism (3D Suave)</option>
                                                    <option value="sunset">Sunset (Gradiente Cálido)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                {/* VIDEO BG - URL DE PLATAFORMA */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-400">🎬 Fondo de Video</label>
                                                    {videoBgUrl ? (
                                                        <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-xl border border-gray-700">
                                                            <span className="text-xl">🎬</span>
                                                            <span className="text-xs text-green-400 flex-1 truncate font-bold">Video activo ✓</span>
                                                            <button type="button" onClick={() => setVideoBgUrl('')} className="text-red-400 text-xs px-2 py-1 bg-red-500/10 rounded-lg">✕ Quitar</button>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="url"
                                                            value={videoBgUrl}
                                                            onChange={(e) => setVideoBgUrl(e.target.value)}
                                                            placeholder="https://youtube.com/watch?v=... o vimeo.com/..."
                                                            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                                        />
                                                    )}
                                                    <p className="text-[11px] text-gray-500">Pega un enlace de YouTube, Vimeo o cualquier plataforma de video. Se reproducirá en tu perfil.</p>
                                                </div>

                                                {/* AUDIO BG UPLOADER */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-400">Audio Ambiental (MP3, max 5MB)</label>
                                                    {audioBgUrl ? (
                                                        <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-xl border border-gray-700">
                                                            <span className="text-2xl">🎵</span>
                                                            <span className="text-xs text-gray-300 flex-1 truncate">Audio activo ✓</span>
                                                            <button type="button" onClick={() => setAudioBgUrl('')} className="text-red-400 text-xs px-2 py-1 bg-red-500/10 rounded-lg">✕ Quitar</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <label className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 border border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-500/60 hover:bg-gray-800 transition-all text-center">
                                                                <span className="text-2xl">🎵</span>
                                                                <span className="text-xs text-gray-400">Subir audio MP3 · Máx. 5MB</span>
                                                                <span className="text-[11px] text-gray-500">Sonido ambiental que se reproduce en tu perfil</span>
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
                                                            <p className="text-[11px] text-gray-500 text-center">O pega una URL directa de .mp3</p>
                                                            <input type="url" value={audioBgUrl} onChange={(e) => setAudioBgUrl(e.target.value)} placeholder="https://.../audio.mp3" className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-6">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="w-full md:w-auto px-10 py-4 font-bold rounded-2xl transition-all disabled:opacity-50 text-black shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95"
                                                style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}40` }}
                                            >
                                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* Editor de Enlaces y Módulos */}
                            {activeTab === 'modules' && creatorData && (
                                <motion.div key="modules" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    <ModuleEditor
                                        modules={creatorData.modules || []}
                                        isPremium={creatorData.isPremium || false}
                                        onUpdate={async () => {
                                            const user = auth.currentUser;
                                            if (user) {
                                                const docRef = doc(db, 'creators', user.uid);
                                                const docSnap = await getDoc(docRef);
                                                if (docSnap.exists()) {
                                                    setCreatorData(docSnap.data() as CreatorData);
                                                }
                                            }
                                        }}
                                    />

                                    {/* Feed Manager (Solo visible si hay un módulo Feed) */}
                                    {creatorData && creatorData.modules?.some(m => m.type === 'feed') && (
                                        <FeedManager />
                                    )}

                                    {/* ANALYTICS VISUALES AQUI */}
                                    {creatorData.modules && creatorData.modules.length > 0 && (
                                        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl">
                                            <h3 className="text-xl font-bold text-white mb-6">Analíticas de Clics</h3>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={analyticsData}>
                                                        <XAxis dataKey="title" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1f2028', border: 'none', borderRadius: '12px' }} />
                                                        <Bar dataKey="clicks" fill={primaryColor} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* COLUMNA DERECHA: LIVE PREVIEW MOCKUP (40%) */}
                    <div className={`w-full md:w-[40%] flex justify-center sticky top-8 h-[calc(100vh-4rem)] ${!showPreviewMobile ? 'hidden md:flex' : 'flex'}`}>
                        <div className="w-[375px] h-[812px] bg-black border-8 border-gray-800 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center pt-12 pb-8">
                            <div className="absolute top-0 inset-x-0 h-7 bg-gray-800 rounded-b-3xl w-40 mx-auto z-50"></div> {/* Notch */}

                            {/* LIVE PREVIEW CONTENT */}
                            <div
                                className={`w-full h-full overflow-y-auto pb-20 scrollbar-hide ${activeSkinObj.containerClass} ${fontClass} !min-h-0 relative`}
                            >
                                {/* Fondo de previsualización dinámico transparente si es requerido */}
                                {activeSkin !== 'gotham' && activeSkin !== 'burton' && (
                                    <div
                                        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
                                        style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${primaryColor} 0%, transparent 50%)` }}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center p-6 text-center">
                                    <div className="relative w-24 h-24 flex-shrink-0 mt-4 overflow-hidden rounded-full border-4" style={{ borderColor: primaryColor }}>
                                        <Image src={creatorData.profile.avatarUrl} alt="Avatar" fill sizes="96px" className="object-cover aspect-square" />
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
            </div >
        </div >
    );
}
