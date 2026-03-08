'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase/client';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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

export default function AdminDashboardPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [deniedUid, setDeniedUid] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.uid === ADMIN_UID) {
                    setIsAdmin(true);
                    fetchRequests();
                } else {
                    setDeniedUid(user.uid);
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router, ADMIN_UID]);

    const fetchRequests = async () => {
        setIsLoading(true);
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
            toast.error("Error cargando solicitudes de verificación");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (uid: string) => {
        setIsActionLoading(uid);
        try {
            await updateDoc(doc(db, 'creators', uid), { isVerified: true });
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
            // 1. Delete the proof image from Storage to free up space
            if (proofImageUrl) {
                try {
                    const imageRef = ref(storage, proofImageUrl);
                    await deleteObject(imageRef);
                } catch (storageErr) {
                    // Non-fatal: storage file might already be gone
                    console.warn("Could not delete proof image from Storage:", storageErr);
                }
            }

            // 2. Delete the Firestore request document
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

    const formatDate = (ts: any) => {
        if (!ts) return 'Desconocida';
        try { return new Date(ts.toDate()).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return 'N/A'; }
    };

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
                    <p className="text-sm text-gray-500 mt-6 max-w-md">
                        Si tú eres el dueño, copia este código exacto, pégalo en <code className="bg-gray-800 px-1 rounded text-gray-300">NEXT_PUBLIC_ADMIN_UID</code> dentro de <code className="bg-gray-800 px-1 rounded text-gray-300">.env.local</code> y <strong>reinicia tu servidor</strong>.
                    </p>
                    <button onClick={() => router.push('/')} className="mt-8 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
                        Volver al Inicio
                    </button>
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
            {/* Lightbox for proof images */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 cursor-zoom-out"
                    onClick={() => setLightboxUrl(null)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightboxUrl}
                        alt="Prueba de verificación"
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

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFCC] to-blue-500">
                            🛡️ Panel de Administración (Nuxira)
                        </h1>
                        <p className="text-gray-400 mt-2">Solicitudes de Verificación · Revisión de Pruebas de Identidad</p>
                    </div>
                </div>

                <div className="bg-[#0f0f0f] border border-gray-800 rounded-3xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Solicitudes Pendientes <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">{requests.length}</span>
                    </h2>

                    {isLoading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-800/50 rounded-2xl w-full" />)}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
                            <span className="text-4xl">☕</span>
                            <p className="text-gray-500 mt-4">No hay solicitudes pendientes por ahora.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider">
                                        <th className="pb-4 pl-4 font-medium">Usuario</th>
                                        <th className="pb-4 font-medium">Email</th>
                                        <th className="pb-4 font-medium">Categoría</th>
                                        <th className="pb-4 font-medium">Red Social</th>
                                        <th className="pb-4 font-medium">Prueba</th>
                                        <th className="pb-4 font-medium">Fecha</th>
                                        <th className="pb-4 pr-4 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                                            {/* Usuario */}
                                            <td className="py-4 pl-4">
                                                <div className="flex flex-col">
                                                    <a href={`/${req.username}`} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-[#00FFCC] transition-colors">
                                                        @{req.username}
                                                    </a>
                                                    <span className="text-xs text-gray-600 font-mono">{req.uid.slice(0, 12)}…</span>
                                                </div>
                                            </td>
                                            {/* Email */}
                                            <td className="py-4 text-gray-400">{req.email}</td>
                                            {/* Categoría */}
                                            <td className="py-4">
                                                {req.category ? (
                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold">
                                                        {req.category}
                                                    </span>
                                                ) : <span className="text-gray-600">—</span>}
                                            </td>
                                            {/* Red Social */}
                                            <td className="py-4">
                                                {req.socialUrl ? (
                                                    <a
                                                        href={req.socialUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-[#00FFCC] hover:underline text-xs font-medium"
                                                    >
                                                        Ver perfil ↗
                                                    </a>
                                                ) : <span className="text-gray-600">—</span>}
                                            </td>
                                            {/* Prueba */}
                                            <td className="py-4">
                                                {req.proofImageUrl ? (
                                                    <button
                                                        onClick={() => setLightboxUrl(req.proofImageUrl!)}
                                                        className="group relative w-12 h-10 rounded-lg overflow-hidden border border-gray-700 hover:border-[#00FFCC]/50 transition-all"
                                                        title="Ver captura de pantalla"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={req.proofImageUrl} alt="Prueba" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">🔍</div>
                                                    </button>
                                                ) : <span className="text-gray-600 text-xs">Sin imagen</span>}
                                            </td>
                                            {/* Fecha */}
                                            <td className="py-4 text-gray-500">
                                                {formatDate(req.submittedAt || req.requestedAt)}
                                            </td>
                                            {/* Acciones */}
                                            <td className="py-4 pr-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReject(req.uid, req.proofImageUrl)}
                                                        disabled={isActionLoading === req.uid}
                                                        className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req.uid)}
                                                        disabled={isActionLoading === req.uid}
                                                        className="px-4 py-2 bg-[#00FFCC]/10 text-[#00FFCC] hover:bg-[#00FFCC] hover:text-black border border-[#00FFCC]/20 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                                    >
                                                        Aprobar ✅
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
