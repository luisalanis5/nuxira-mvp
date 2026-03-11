'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

interface VerificationRequest {
    id: string;
    uid: string;
    username: string;
    email: string;
    status: string;
    category?: string;
    socialUrl?: string;
    proofImageUrl?: string;
    submittedAt?: any;
    requestedAt?: any;
}

interface FeedbackItem {
    id: string;
    userId: string;
    userEmail: string;
    type: 'bug' | 'suggestion' | 'improvement';
    message: string;
    screenshotUrl?: string;
    status: string;
    createdAt: any;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [deniedUid, setDeniedUid] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'bug' | 'suggestion' | 'improvement'>('all');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setDeniedUid(null);
                setIsAdmin(false);
                await fetch('/api/auth/session', { method: 'DELETE' });
                router.push('/dashboard/login');
                return;
            }
            try {
                setIsAdmin(false);
                setDeniedUid(null);

                const creatorRef = doc(db, 'creators', user.uid);
                const creatorSnap = await getDoc(creatorRef);

                if (creatorSnap.exists() && creatorSnap.data().role === 'admin') {
                    setIsAdmin(true);
                    fetchRequests();
                    fetchFeedback();
                } else {
                    setDeniedUid(user.uid);
                    setTimeout(() => {
                        if (!isAdmin) router.push('/dashboard');
                    }, 5000);
                }
            } catch (err) {
                console.error("Error validando rol admin:", err);
                router.push('/dashboard');
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchRequests = async () => {
        try {
            const q = query(collection(db, 'verification_requests'));
            const querySnapshot = await getDocs(q);
            const reqs: VerificationRequest[] = [];
            querySnapshot.forEach((docSnap) => {
                reqs.push({ id: docSnap.id, ...docSnap.data() } as VerificationRequest);
            });
            setRequests(reqs);
        } catch (error) {
            console.error("Error fetching verification requests:", error);
        }
    };

    const fetchFeedback = async () => {
        try {
            const q = query(collection(db, 'feedback'));
            const querySnapshot = await getDocs(q);
            const items: FeedbackItem[] = [];
            querySnapshot.forEach((docSnap) => {
                items.push({ id: docSnap.id, ...docSnap.data() } as FeedbackItem);
            });
            // Sort by date desc
            items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setFeedback(items);
        } catch (error) {
            console.error("Error fetching feedback:", error);
        }
    };

    const handleApprove = async (uid: string) => {
        setIsActionLoading(uid);
        try {
            await updateDoc(doc(db, 'creators', uid), { isVerified: true });
            await addDoc(collection(db, 'creators', uid, 'notifications'), {
                type: 'verification',
                message: '¡Felicidades! Tu cuenta ha sido verificada.',
                isRead: false,
                createdAt: serverTimestamp(),
                actionUrl: '/dashboard'
            });
            await deleteDoc(doc(db, 'verification_requests', uid));
            toast.success("✅ Creador verificado exitosamente");
            setRequests(prev => prev.filter(r => r.id !== uid));
        } catch (error) {
            console.error("Error approving request:", error);
            toast.error("Hubo un error al aprobar");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleReject = async (uid: string, proofImageUrl?: string) => {
        setIsActionLoading(uid);
        try {
            if (proofImageUrl) {
                try {
                    const imageRef = ref(storage, proofImageUrl);
                    await deleteObject(imageRef);
                } catch (storageErr) {
                    console.warn("Could not delete proof image from Storage:", storageErr);
                }
            }
            await deleteDoc(doc(db, 'verification_requests', uid));
            toast.success("❌ Solicitud rechazada y prueba eliminada de Storage");
            setRequests(prev => prev.filter(r => r.id !== uid));
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Hubo un error al rechazar");
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleDeleteFeedback = async (id: string, screenshotUrl?: string) => {
        setIsActionLoading(id);
        try {
            if (screenshotUrl) {
                try {
                    const imageRef = ref(storage, screenshotUrl);
                    await deleteObject(imageRef);
                } catch (err) {
                    console.warn("Could not delete feedback image:", err);
                }
            }
            await deleteDoc(doc(db, 'feedback', id));
            toast.success("Feedback eliminado");
            setFeedback(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error("Error deleting feedback:", error);
            toast.error("Error al eliminar feedback");
        } finally {
            setIsActionLoading(null);
        }
    };

    const formatDate = (ts: any) => {
        if (!ts) return 'Reciente';
        try {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        catch { return 'N/A'; }
    };

    const filteredFeedback = feedback.filter(f => feedbackFilter === 'all' || f.type === feedbackFilter);

    if (!isAdmin) {
        if (deniedUid) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-6xl mb-4">🛑</span>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
                    <p className="text-gray-400 mb-6 max-w-md">Tu cuenta actual no tiene privilegios de administrador.</p>
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tu UID actual es:</p>
                        <code className="text-blue-400 font-mono text-lg">{deniedUid}</code>
                    </div>
                    <p className="text-sm text-gray-500 mt-6 max-w-md italic">
                        Para entrar, ve a tu <strong className="text-white">Firebase Console</strong>, busca el documento con tu UID en la colección <code className="bg-gray-800 px-1 rounded text-gray-300">creators</code>, y agrega o cambia el campo:
                    </p>
                    <div className="mt-4 bg-[#1a1a1a] p-3 rounded-lg border border-gray-800 font-mono text-xs">
                        <span className="text-purple-400">role</span>: <span className="text-green-400">"admin"</span>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Volver al Inicio
                        </button>
                        <button
                            onClick={async () => {
                                await auth.signOut();
                                router.push('/dashboard/login');
                            }}
                            className="px-6 py-2 bg-gray-900 text-gray-400 border border-gray-800 font-bold rounded-lg hover:bg-gray-800 hover:text-white transition-all"
                        >
                            Cerrar Sesión (Cambiar cuenta)
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-t-2 border-l-2 border-[#00FFCC] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
            {lightboxUrl && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 cursor-zoom-out"
                    onClick={() => setLightboxUrl(null)}
                >
                    <img
                        src={lightboxUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-bold leading-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFCC] to-blue-500">
                            🛡️ Panel de Administración (Nuxira)
                        </h1>
                        <p className="text-gray-400 mt-2">Gestión de plataforma · Verificaciones · Feedback Beta</p>
                    </div>
                </div>

                {/* SECCIÓN: VERIFICACIONES */}
                <div className="bg-[#0f0f0f] border border-gray-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Solicitudes de Verificación <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">{requests.length}</span>
                    </h2>

                    {requests.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl bg-gray-900/20 text-gray-500">
                            <p>No hay solicitudes pendientes.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4 pl-4 font-medium text-xs">Usuario</th>
                                        <th className="pb-4 font-medium text-xs">Email</th>
                                        <th className="pb-4 font-medium text-xs">Prueba</th>
                                        <th className="pb-4 font-medium text-xs">Fecha</th>
                                        <th className="pb-4 pr-4 font-medium text-right text-xs">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            <td className="py-4 pl-4">
                                                <div className="flex flex-col">
                                                    <a href={`/${req.username}`} target="_blank" className="font-bold text-white hover:text-[#00FFCC] transition-colors">@{req.username}</a>
                                                    <span className="text-[10px] text-gray-600 font-mono tracking-tighter truncate w-24">{req.uid}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-gray-400 text-xs">{req.email}</td>
                                            <td className="py-4">
                                                {req.proofImageUrl && (
                                                    <button onClick={() => setLightboxUrl(req.proofImageUrl!)} className="w-10 h-10 rounded-lg overflow-hidden border border-gray-800 hover:border-[#00FFCC] transition-all">
                                                        <img src={req.proofImageUrl} alt="Proof" className="w-full h-full object-cover" />
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-4 text-gray-500 text-xs">{formatDate(req.submittedAt || req.requestedAt)}</td>
                                            <td className="py-4 pr-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleReject(req.uid, req.proofImageUrl)} className="p-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all">❌</button>
                                                    <button onClick={() => handleApprove(req.uid)} className="p-2 bg-[#00FFCC]/10 text-[#00FFCC] rounded-lg text-xs font-bold hover:bg-[#00FFCC] hover:text-black transition-all">✅</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* SECCIÓN: FEEDBACK Y BUGS */}
                <div className="bg-[#0f0f0f] border border-gray-800 rounded-3xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Feedback y Errores <span className="bg-[#00FFCC]/20 text-[#00FFCC] px-3 py-1 rounded-full text-sm font-black">{feedback.length}</span>
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Sugerencias, mejoras y reportes recibidos desde la Beta.</p>
                        </div>
                        <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl">
                            {(['all', 'bug', 'improvement', 'suggestion'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFeedbackFilter(f)}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${feedbackFilter === f ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {f === 'all' ? 'Todos' : f === 'bug' ? 'Bugs' : f === 'improvement' ? 'Mejoras' : 'Ideas'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredFeedback.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl bg-gray-900/10">
                            <p className="text-gray-600">No hay feedback en esta categoría.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredFeedback.map(f => (
                                <div key={f.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${f.type === 'bug' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    f.type === 'improvement' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    }`}>
                                                    {f.type}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">{formatDate(f.createdAt)}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteFeedback(f.id, f.screenshotUrl)}
                                                disabled={isActionLoading === f.id}
                                                className="text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed mb-4">{f.message}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 font-bold mb-0.5">Reportado por:</span>
                                            <span className="text-[10px] text-gray-400 font-mono italic">{f.userEmail || f.userId}</span>
                                        </div>
                                        {f.screenshotUrl && (
                                            <button
                                                onClick={() => setLightboxUrl(f.screenshotUrl!)}
                                                className="w-12 h-12 rounded-xl border border-gray-800 overflow-hidden hover:border-[#00FFCC] transition-all hover:scale-110 shadow-2xl"
                                            >
                                                <img src={f.screenshotUrl} alt="Screenshot" className="w-full h-full object-cover" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

