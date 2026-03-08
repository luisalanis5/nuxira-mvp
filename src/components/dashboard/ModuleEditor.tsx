'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase/client';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { isKnownEmbedUrl } from '@/components/public/MediaEmbed';
import toast from 'react-hot-toast';
import { APP_NAME } from '@/config/brand';

type ModuleItem = {
  id: string;
  type: string;
  title: string;
  active: boolean;
  clicks?: number; // Clicks contador
  items?: { name: string; url: string; icon?: string }[];
  props?: any;
};

export default function ModuleEditor({ modules, isPremium, stripeSetupComplete, onUpdate }: { modules: ModuleItem[], isPremium: boolean, stripeSetupComplete?: boolean, onUpdate: () => void }) {
  const [addingType, setAddingType] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [localModules, setLocalModules] = useState<ModuleItem[]>(modules);

  React.useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

  const handleUpgrade = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const response = await fetch('/api/stripe/checkout-premium', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.details || data.error || "No URL returned");
      }
    } catch (err: any) {
      console.error("Error iniciando pago Stripe", err);
      toast.error(err.message || "Error al conectar con el servidor de pago.");
    } finally {
      setSaving(false);
    }
  };

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [adDescription, setAdDescription] = useState('');
  const [adCta, setAdCta] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adImage, setAdImage] = useState('');

  // Estados interactivos
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(['']);
  const [feedTitle, setFeedTitle] = useState('Últimas Novedades');

  const [lockedDesc, setLockedDesc] = useState('');
  const [lockedPrice, setLockedPrice] = useState(5);
  const [lockedPreviewUrl, setLockedPreviewUrl] = useState('');
  const [secretContent, setSecretContent] = useState(''); // REEMPLAZA a lockedContentUrl

  const resetForms = () => {
    setTitle('');
    setUrl('');
    setVideoUrl('');
    setThumbnailUrl('');
    setIsLive(false);
    setAdDescription('');
    setAdCta('');
    setAdUrl('');
    setAdImage('');
    setPollQuestion('');
    setPollOptions(['', '']);
    setGalleryTitle('');
    setGalleryUrls(['']);
    setFeedTitle('Últimas Novedades');
    setLockedDesc('');
    setLockedPrice(5);
    setLockedPreviewUrl('');
    setSecretContent('');
    setAddingType(null);
    setEditingId(null);
  };

  const startEditing = (mod: ModuleItem) => {
    resetForms();
    setEditingId(mod.id);
    setAddingType(mod.type);
    setTitle(mod.title);

    if (mod.type === 'links' && mod.items && mod.items.length > 0) {
      setUrl(mod.items[0].url);
      setTitle(mod.items[0].name); // Opcional
    } else if (mod.type === 'media' && mod.props) {
      setVideoUrl(mod.props.videoUrl || '');
      setThumbnailUrl(mod.props.thumbnailUrl || '');
      setIsLive(mod.props.isLive || false);
    } else if (mod.type === 'nativeAd' && mod.props) {
      setAdDescription(mod.props.description || '');
      setAdUrl(mod.props.url || '');
      setAdCta(mod.props.ctaText || '');
      setAdImage(mod.props.image || '');
    } else if (mod.type === 'poll' && mod.props) {
      setPollQuestion(mod.props.question || '');
      setPollOptions(mod.props.options || ['', '']);
    } else if (mod.type === 'gallery' && mod.props) {
      setGalleryTitle(mod.props.title || '');
      setGalleryUrls((mod.props.images || []).map((img: any) => img.url) || ['']);
    } else if (mod.type === 'feed' && mod.props) {
      setFeedTitle(mod.props.title || 'Últimas Novedades');
    } else if (mod.type === 'locked' && mod.props) {
      setLockedDesc(mod.props.description || '');
      setLockedPrice(mod.props.price || 5);
      setLockedPreviewUrl(mod.props.previewImageUrl || '');
      setSecretContent(mod.props.secretContent || '');
    }
  };

  const handleAddNew = (type: string) => {
    setAddingType(addingType === type ? null : type);
  };

  const toggleActive = async (moduleToToggle: ModuleItem) => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'creators', auth.currentUser.uid);
      const updatedModules = localModules.map(m => m.id === moduleToToggle.id ? { ...m, active: m.active === false ? true : false } : m);
      setLocalModules(updatedModules);
      await updateDoc(docRef, { modules: updatedModules });
      onUpdate();
    } catch (err) {
      console.error("Error toggle module", err);
      toast.error("Error al actualizar estado.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !addingType) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'creators', auth.currentUser.uid);

      // 1. GENERACIÓN DE IDS LOCALES: Garantizamos un ID temporal si es nuevo
      let localId = editingId || `temp-${Math.random().toString(36).substring(2, 9)}`;

      let newModuleData: any = {
        id: localId,
        type: addingType,
        title: title || 'Nuevo Módulo',
        active: true,
      };

      if (!editingId) {
        newModuleData.clicks = 0; // Solo en creación si lo deseas, o si ya no estaba
      } else {
        // Preservamos clicks
        const existingMod = localModules.find(m => m.id === editingId);
        newModuleData.clicks = existingMod?.clicks || 0;
      }

      if (addingType === 'links') {
        newModuleData.items = [{ name: title, url }];
      }
      else if (addingType === 'media') {
        newModuleData.props = {
          title,
          videoUrl,
          thumbnailUrl,
          isLive
        };
      } else if (addingType === 'nativeAd') {
        newModuleData.props = {
          title,
          description: adDescription,
          url: adUrl,
          image: adImage,
          ctaText: adCta || 'Ver Oferta'
        };
      } else if (addingType === 'poll') {
        newModuleData.props = {
          question: pollQuestion,
          options: pollOptions.filter(o => o.trim() !== '')
        };
      } else if (addingType === 'gallery') {
        newModuleData.props = {
          title: galleryTitle,
          images: galleryUrls.filter(u => u.trim() !== '').map(url => ({ url }))
        };
      } else if (addingType === 'feed') {
        newModuleData.props = {
          title: feedTitle
        };
      } else if (addingType === 'locked') {
        newModuleData.props = {
          title,
          description: lockedDesc,
          price: Number(lockedPrice),
          previewImageUrl: lockedPreviewUrl,
          secretContent: secretContent,
          creatorId: auth.currentUser.uid
        };
      }

      if (editingId) {
        // ACTUALIZAR (Reemplazando en el array)
        const updatedModules = localModules.map(m => m.id === editingId ? newModuleData : m);
        setLocalModules(updatedModules);
        await updateDoc(docRef, { modules: updatedModules });
      } else {
        // CREAR NUEVO - LIMPIEZA DE DATOS: Asegurar que se guarde con un ID real en la BD
        const realId = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        newModuleData.id = realId;

        setLocalModules([...localModules, newModuleData]);
        await updateDoc(docRef, { modules: arrayUnion(newModuleData) });
      }

      resetForms();
      onUpdate();
    } catch (error) {
      console.error("Error guardando módulo", error);
      toast.error("Error al guardar el módulo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleToRemove: ModuleItem) => {
    if (!auth.currentUser) return;
    if (!confirm(`¿Eliminar el módulo "${moduleToRemove.title}"? Esta acción no se puede deshacer.`)) return;

    setSaving(true);
    try {
      if (editingId === moduleToRemove.id) resetForms(); // Limpia form si borra lo que edita
      setLocalModules(localModules.filter((m) => m.id !== moduleToRemove.id));
      const docRef = doc(db, 'creators', auth.currentUser.uid);
      await updateDoc(docRef, { modules: arrayRemove(moduleToRemove) });
      onUpdate();
    } catch (error) {
      console.error("Error eliminando módulo", error);
      toast.error("Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (modToMove: ModuleItem, direction: 'up' | 'down') => {
    if (!auth.currentUser) return;
    const isLink = modToMove.type === 'links';
    const currentIndex = localModules.findIndex(m => m.id === modToMove.id);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up') {
      // Find previous of same type group
      for (let i = currentIndex - 1; i >= 0; i--) {
        if ((localModules[i].type === 'links') === isLink) {
          targetIndex = i;
          break;
        }
      }
    } else {
      // Find next of same type group
      for (let i = currentIndex + 1; i < localModules.length; i++) {
        if ((localModules[i].type === 'links') === isLink) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) return; // Cannot move further

    setSaving(true);
    try {
      const docRef = doc(db, 'creators', auth.currentUser.uid);
      const newModules = [...localModules];

      // Swap elements
      const temp = newModules[currentIndex];
      newModules[currentIndex] = newModules[targetIndex];
      newModules[targetIndex] = temp;

      setLocalModules(newModules);
      await updateDoc(docRef, { modules: newModules });
      onUpdate();
    } catch (err) {
      console.error("Error reordenando", err);
      toast.error('Error reordenando módulos');
    } finally {
      setSaving(false);
    }
  };

  // Efectos de portal removidos, el renderizado de la interfaz de edición es puramente funcional In-Situ dentro del flujo de React.

  return (
    <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-3xl p-6 mt-8 shadow-2xl relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-white">Gestor de Módulos</h3>

        {!editingId && (
          <div className="flex flex-col gap-2 items-end">
            <div className="flex flex-wrap justify-end gap-2 bg-gray-800/80 p-2 rounded-xl border border-gray-700/50">
              <button onClick={() => handleAddNew('links')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${addingType === 'links' ? 'bg-[#00FFCC] text-black shadow-lg shadow-[#00FFCC]/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>+ Enlace</button>
              <button onClick={() => handleAddNew('media')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${addingType === 'media' ? 'bg-[#FF0055] text-white shadow-lg shadow-[#FF0055]/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>+ Media</button>
              <button onClick={() => handleAddNew('poll')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${addingType === 'poll' ? 'bg-[#7B61FF] text-white shadow-lg shadow-[#7B61FF]/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>+ Encuesta</button>
              <button onClick={() => handleAddNew('gallery')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${addingType === 'gallery' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>+ Galería</button>
              <button onClick={() => handleAddNew('feed')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${addingType === 'feed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>+ Novedades</button>

              <button
                onClick={() => {
                  if (!isPremium) { setShowProModal(true); return; }
                  if (!stripeSetupComplete) {
                    toast.error('Ve a la sección de Pagos y termina de conectar tu cuenta bancaria para habilitar la monetización.', { duration: 5000 });
                    return;
                  }
                  handleAddNew('locked');
                }}
                title={isPremium && !stripeSetupComplete ? 'Conecta tu cuenta bancaria primero' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPremium
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700 border border-green-500/30'
                    : !stripeSetupComplete
                      ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/30 cursor-not-allowed'
                      : addingType === 'locked'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20 scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
              >
                {!isPremium ? (
                  <>+ Paywall <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Pro</span></>
                ) : !stripeSetupComplete ? (
                  <>🔒 Paywall <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">sin banco</span></>
                ) : (
                  <>+ Paywall</>
                )}
              </button>

              <button
                onClick={() => isPremium ? handleAddNew('nativeAd') : setShowProModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isPremium ? 'text-gray-300 hover:text-white hover:bg-gray-700 border border-yellow-500/30' : addingType === 'nativeAd' ? 'bg-[#7B61FF] text-white shadow-lg shadow-[#7B61FF]/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                + Anuncio {!isPremium && <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Pro</span>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* IIFE para encapsular el Formulario y renderizar In-Situ */}
      {(() => {
        const renderForm = () => (
          <div id="extractedFormWrapper" className="w-full relative bg-gray-900/95 border border-blue-500/40 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-[fadeIn_0.2s_ease-out] z-10 flex flex-col mt-4 mb-6">

            {/* Cabecera In-Situ */}
            <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900 z-20">
              <h4 className="text-sm font-bold text-[#00FFCC] uppercase tracking-wider">
                {editingId ? 'Editar' : 'Añadir'} {addingType === 'links' ? 'Enlace' : addingType === 'media' ? 'Video/Live' : addingType === 'poll' ? 'Encuesta' : addingType === 'gallery' ? 'Galería' : addingType === 'feed' ? 'Novedades' : addingType === 'locked' ? 'Paywall' : 'Anuncio'}
              </h4>
              <button type="button" onClick={resetForms} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Contenido del Form */}
            <div className="p-5">
              <form id="moduleForm" onSubmit={handleCreateOrUpdateModule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addingType !== 'poll' && addingType !== 'gallery' && addingType !== 'feed' && (
                    <input
                      type="text" placeholder={addingType === 'nativeAd' ? "Título del Anuncio" : addingType === 'media' ? "Título del Video" : addingType === 'locked' ? "Título del Contenido VIP" : "Nombre del Enlace"}
                      required value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#00FFCC] outline-none text-white transition-all"
                    />
                  )}

                  {addingType === 'links' && (
                    <input
                      type="url" placeholder="https://..." required value={url} onChange={e => setUrl(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#00FFCC] outline-none text-white transition-all"
                    />
                  )}

                  {addingType === 'media' && (
                    <>
                      <input
                        type="url" placeholder="URL del Video (YouTube/Twitch)" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF0055] outline-none text-white transition-all"
                      />
                      {!isKnownEmbedUrl(videoUrl) ? (
                        <div className="col-span-1 md:col-span-2 space-y-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Portada (Opcional)</p>
                          <input
                            type="url" placeholder="URL de imagen de portada (Imgur, etc.)" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF0055] outline-none text-white transition-all"
                          />
                          <p className="text-gray-500 text-[11px] ml-1">Sube tu imagen a <a href="https://imgur.com/upload" target="_blank" className="text-[#FF0055] hover:underline">Imgur.com</a> y pega el enlace directo aquí.</p>
                        </div>
                      ) : (
                        <p className="w-full text-xs font-bold text-[#00FFCC] bg-[#00FFCC]/10 p-3 rounded-xl border border-[#00FFCC]/20 text-center col-span-1 md:col-span-2">
                          ✨ ¡Enlace Inteligente Detectado! Usaremos el reproductor oficial. No necesitas subir portada.
                        </p>
                      )}
                      <p className="text-gray-400 text-[11px] col-span-1 md:col-span-2">
                        Pega el enlace directo de tu video de YouTube, Spotify, TikTok o Twitch. No alojamos el archivo para que tu perfil cargue más rápido.
                      </p>
                    </>
                  )}

                  {addingType === 'nativeAd' && (
                    <>
                      <input
                        type="text" placeholder="Descripción Corta" required value={adDescription} onChange={e => setAdDescription(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7B61FF] outline-none text-white transition-all"
                      />
                      <input
                        type="url" placeholder="URL de Destino" required value={adUrl} onChange={e => setAdUrl(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7B61FF] outline-none text-white transition-all"
                      />
                      <input
                        type="text" placeholder="Texto del Botón (ej. Ver Oferta)" required value={adCta} onChange={e => setAdCta(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7B61FF] outline-none text-white transition-all"
                      />
                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Imagen del Anuncio (URL)</p>
                        <input
                          type="url" placeholder="URL de imagen (Imgur, Cloudinary, etc.)" value={adImage} onChange={e => setAdImage(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7B61FF] outline-none text-white transition-all"
                        />
                        <p className="text-gray-500 text-[11px] ml-1">Sube tu imagen a <a href="https://imgur.com/upload" target="_blank" className="text-[#7B61FF] hover:underline">Imgur.com</a> y pega el enlace directo.</p>
                      </div>
                    </>
                  )}

                  {addingType === 'poll' && (
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <input
                        type="text" placeholder="Pregunta (ej: ¿Qué contenido quieren ver mañana?)" required value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7B61FF] outline-none text-white transition-all"
                      />
                      <div className="grid md:grid-cols-2 gap-3">
                        {pollOptions.map((opt, idx) => (
                          <div key={idx} className="flex gap-2 relative">
                            <input
                              type="text" placeholder={`Opción ${idx + 1}`} required={idx < 2} value={opt} onChange={e => {
                                const newOpts = [...pollOptions];
                                newOpts[idx] = e.target.value;
                                setPollOptions(newOpts);
                              }}
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7B61FF] outline-none text-white transition-all"
                            />
                          </div>
                        ))}
                      </div>
                      {pollOptions.length < 4 && (
                        <button type="button" onClick={() => setPollOptions([...pollOptions, ''])} className="text-[#7B61FF] font-bold text-sm tracking-wider uppercase hover:text-white transition-colors">+ Añadir Opción</button>
                      )}
                    </div>
                  )}

                  {addingType === 'gallery' && (
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <input
                        type="text" placeholder="Título de la Galería (Opcional)" value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-white transition-all"
                      />

                      {/* Info BYOS */}
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-2">
                        <span className="text-lg">📸</span>
                        <div>
                          <p className="text-orange-300 font-bold text-xs">¿Cómo agregar fotos?</p>
                          <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">Sube tus fotos gratis a <a href="https://imgur.com/upload" target="_blank" className="text-orange-400 hover:underline font-bold">Imgur.com</a> o <a href="https://postimages.org" target="_blank" className="text-orange-400 hover:underline font-bold">PostImages.org</a> y pega los enlaces directos (.jpg/.png) abajo.</p>
                        </div>
                      </div>

                      {/* Campos URL para cada imagen */}
                      {galleryUrls.map((imgUrl, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="url"
                            placeholder={`URL imagen ${idx + 1} (https://i.imgur.com/...)`}
                            value={imgUrl}
                            onChange={e => {
                              const updated = [...galleryUrls];
                              updated[idx] = e.target.value;
                              setGalleryUrls(updated);
                            }}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-white transition-all"
                          />
                          {galleryUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setGalleryUrls(galleryUrls.filter((_: string, i: number) => i !== idx))}
                              className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-sm font-bold flex-shrink-0"
                            >✕</button>
                          )}
                        </div>
                      ))}

                      {galleryUrls.length < 10 && (
                        <button
                          type="button"
                          onClick={() => setGalleryUrls([...galleryUrls, ''])}
                          className="w-full py-2.5 rounded-xl border border-dashed border-orange-500/40 text-orange-400 text-sm font-bold hover:bg-orange-500/10 transition-all"
                        >+ Añadir otra imagen</button>
                      )}
                    </div>
                  )}

                  {addingType === 'locked' && (
                    <>
                      {!isPremium ? (
                        <div className="col-span-1 md:col-span-2 bg-gray-900 border-2 border-green-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors pointer-events-none"></div>
                          <span className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">🔒</span>
                          <h5 className="text-white font-black text-xl mb-2">Función Premium</h5>
                          <p className="text-gray-400 text-sm mb-6 max-w-sm">
                            El módulo Paywall (contenido exclusivo de pago) está reservado para creadores <strong>Nuxira Pro</strong>.
                          </p>
                          <button type="button" onClick={() => setShowProModal(true)} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all hover:-translate-y-1">
                            Desbloquear con Premium
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Cabecera + Comisión */}
                          <div className="col-span-1 md:col-span-2 bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-start gap-3">
                            <span className="text-2xl mt-0.5">🔒</span>
                            <div className="flex-1">
                              <h5 className="text-green-400 font-bold text-sm mb-1">Paywall — Monetiza tu Contenido</h5>
                              <p className="text-gray-300 text-xs leading-relaxed">Vende videos, fotos o links exclusivos a tus fans. Solo pagan una vez para acceder.</p>
                            </div>
                          </div>

                          {/* Comisión Nuxira */}
                          <div className="col-span-1 md:col-span-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3">
                            <span className="text-xl">💰</span>
                            <div className="flex-1">
                              <p className="text-yellow-300 font-bold text-xs">Comisión {APP_NAME}: 15%</p>
                              <p className="text-gray-400 text-[11px]">Si cobras $100 MXN, recibes $85.00 MXN. {APP_NAME} retiene el 15% por procesamiento bancario y plataforma.</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-black text-sm">85%</p>
                              <p className="text-gray-500 text-[10px]">para ti</p>
                            </div>
                          </div>

                          {/* Tipo de Contenido */}
                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Contenido Secreto</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { key: 'video', icon: '🎬', label: 'Video' },
                                { key: 'photo', icon: '📸', label: 'Foto(s)' },
                                { key: 'link', icon: '🔗', label: 'Link/Archivo' },
                              ].map(opt => (
                                <button
                                  key={opt.key} type="button"
                                  onClick={() => setSecretContent('')}
                                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-bold transition-all ${secretContent === '' && opt.key === 'link' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'}`}
                                >
                                  <span className="text-xl">{opt.icon}</span>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Info básica */}
                          <input
                            type="text" placeholder="Título del contenido (Ej: Video exclusivo 30 min)" value={title} onChange={e => setTitle(e.target.value)} required
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white transition-all"
                          />
                          <input
                            type="text" placeholder="Descripción corta para tus fans" value={lockedDesc} onChange={e => setLockedDesc(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white transition-all"
                          />

                          {/* Precio + ganancias en tiempo real */}
                          <div className="col-span-1 md:col-span-2 space-y-1">
                            <div className="flex gap-3 items-end">
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Precio (MXN)</p>
                                <input
                                  type="number" min="10" step="1" placeholder="Ej: 50.00" required value={lockedPrice} onChange={e => setLockedPrice(Number(e.target.value))}
                                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white transition-all"
                                />
                              </div>
                              <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-center min-w-[110px]">
                                <p className="text-[10px] text-gray-500">Tú recibes</p>
                                <p className="text-green-400 font-black text-lg">
                                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(lockedPrice * 0.85)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Preview Difuminada con Base64 */}
                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Portada de Vista Previa (Difuminada)</p>
                            {lockedPreviewUrl ? (
                              <div className="flex items-center gap-3 bg-gray-800/60 p-3 rounded-xl border border-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={lockedPreviewUrl} alt="preview" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                                <span className="text-xs text-gray-400 flex-1 truncate">Portada cargada ✓</span>
                                <button type="button" onClick={() => setLockedPreviewUrl('')} className="text-red-400 text-xs px-2 py-1 rounded-lg bg-red-500/10">✕</button>
                              </div>
                            ) : (
                              <input
                                type="url" placeholder="URL de portada difuminada (https://i.imgur.com/...)" value={lockedPreviewUrl} onChange={e => setLockedPreviewUrl(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white transition-all"
                              />
                            )}
                          </div>

                          {/* Contenido Secreto */}
                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contenido Que Verán Después de Pagar</p>
                            <input
                              type="url" placeholder="YouTube, Vimeo, Google Drive, Dropbox, o cualquier URL..." required value={secretContent} onChange={e => setSecretContent(e.target.value)}
                              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white transition-all"
                            />
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              {[
                                { icon: '▶️', label: 'YouTube / Vimeo', hint: 'El video se muestra directo' },
                                { icon: '📁', label: 'Google Drive / Dropbox', hint: 'Activa enlace público antes' },
                                { icon: '🔗', label: 'Cualquier URL', hint: 'Grupos privados, Notion, etc.' },
                              ].map((tip, i) => (
                                <div key={i} className="text-center p-2 bg-gray-900/60 rounded-lg border border-gray-800">
                                  <p className="text-sm">{tip.icon}</p>
                                  <p className="text-[10px] font-bold text-gray-400">{tip.label}</p>
                                  <p className="text-[9px] text-gray-600">{tip.hint}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Método de pago */}
                          <div className="col-span-1 md:col-span-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-3">
                            <span className="text-lg">💳</span>
                            <div>
                              <p className="text-blue-300 font-bold text-xs mb-0.5">Método de Pago: Stripe</p>
                              <p className="text-gray-400 text-[11px] leading-relaxed">El cobro se procesa via Stripe. Tus fans pueden pagar con tarjeta de crédito, débito o Apple/Google Pay. Los fondos llegan a tu cuenta en 2-5 días hábiles.</p>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {addingType === 'feed' && (
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <input
                        type="text" placeholder="Título de la sección (ej: Últimas Novedades)" required value={feedTitle} onChange={e => setFeedTitle(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
                      />
                      <p className="text-gray-400 text-xs italic">
                        Nota: Al guardar este módulo habilitarás el tablón de novedades en tu perfil público. Podrás publicar textos e imágenes en él desde la nueva sección del "Feed Manager" del centro de mando.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Footer In-Situ */}
            <div className="flex justify-end p-5 border-t border-gray-800 bg-gray-900 z-20 gap-3">
              <button type="button" onClick={resetForms} className="px-6 py-3 text-gray-400 hover:text-white text-sm font-bold transition-colors">Cancelar</button>
              <button type="button" onClick={(e) => { e.preventDefault(); const f = e.currentTarget.closest('#extractedFormWrapper')?.querySelector('form'); if (f) f.requestSubmit(); }} disabled={saving} className="px-8 py-3 bg-white text-black text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-transform active:scale-95 shadow-lg">
                {saving ? 'Guardando...' : (editingId ? 'Actualizar Módulo' : 'Guardar Módulo')}
              </button>
            </div>

          </div>
        );

        return (
          <>
            {addingType && !editingId && renderForm()}

            {/* Listas de Módulos Activos Agrupados */}
            <div className="space-y-6 pt-2">
              {localModules.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4 border border-dashed border-gray-800 rounded-2xl">No tienes módulos activos aún. ¡Crea el primero!</p>}

              {/* Enlaces Estáticos */}
              {localModules.filter(m => m.type === 'links').length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Enlaces Estáticos</h4>
                  {localModules.filter(m => m.type === 'links').map((mod, idx, arr) => (
                    <div key={mod.id} className="w-full flex flex-col gap-3">
                      <div id={`module-card-${mod.id}`} className="flex justify-between items-center p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/80 rounded-2xl hover:border-gray-500 hover:bg-gray-800 transition-all group shadow-sm">
                        <div className="flex flex-col gap-1 mr-4">
                          <button onClick={() => handleMove(mod, 'up')} disabled={idx === 0 || saving} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors bg-gray-900/50 rounded-md" title="Subir">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button onClick={() => handleMove(mod, 'down')} disabled={idx === arr.length - 1 || saving} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors bg-gray-900/50 rounded-md" title="Bajar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap shrink-0">
                            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border shrink-0 bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/20">links</span>
                            <span className="flex items-center gap-1.5 bg-white/5 text-gray-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-white/10 shrink-0"><span>👁️</span> {mod.clicks || 0} Clics</span>
                            {mod.active === false && <span className="bg-red-500/20 text-red-500 text-[10px] uppercase font-bold px-2 py-1 rounded border border-red-500/30 shrink-0">Oculto</span>}
                          </div>
                          <p className={`font-bold text-white text-lg truncate ${mod.active === false ? 'opacity-50 line-through' : ''}`}>{mod.title}</p>
                          {mod.items && <p className="text-sm text-gray-400 truncate">{mod.items[0]?.url}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleActive(mod)} disabled={saving} className="p-3 text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400 hover:text-black border border-yellow-400/20 rounded-xl transition-all shadow-sm opacity-50 group-hover:opacity-100" title={mod.active === false ? "Mostrar en Perfil" : "Ocultar del Perfil"}>
                            {mod.active === false ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                          </button>
                          <button onClick={() => startEditing(mod)} disabled={saving} className="p-3 text-blue-400 bg-blue-400/5 hover:bg-blue-400 hover:text-white border border-blue-400/20 rounded-xl transition-all shadow-sm opacity-50 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => handleDeleteModule(mod)} disabled={saving} className="p-3 text-red-400 bg-red-400/5 hover:bg-red-400 hover:text-white border border-red-400/20 rounded-xl transition-all shadow-sm opacity-50 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      {editingId === mod.id && renderForm()}
                    </div>
                  ))}
                </div>
              )}

              {/* Módulos Dinámicos */}
              {localModules.filter(m => m.type !== 'links').length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mt-4">Módulos Dinámicos</h4>
                  {localModules.filter(m => m.type !== 'links').map((mod, idx, arr) => (
                    <div key={mod.id} className="w-full flex flex-col gap-3">
                      <div id={`module-card-${mod.id}`} className="flex justify-between items-center p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/80 rounded-2xl hover:border-gray-500 hover:bg-gray-800 transition-all group shadow-sm">
                        <div className="flex flex-col gap-1 mr-4">
                          <button onClick={() => handleMove(mod, 'up')} disabled={idx === 0 || saving} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors bg-gray-900/50 rounded-md" title="Subir"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                          <button onClick={() => handleMove(mod, 'down')} disabled={idx === arr.length - 1 || saving} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors bg-gray-900/50 rounded-md" title="Bajar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap shrink-0">
                            <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${mod.type === 'media' ? 'bg-[#FF0055]/10 text-[#FF0055] border-[#FF0055]/20' : mod.type === 'locked' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-[#7B61FF]/10 text-[#7B61FF] border-[#7B61FF]/20'}`}>{mod.type}</span>
                            <span className="flex items-center gap-1.5 bg-white/5 text-gray-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-white/10 shrink-0"><span>👁️</span> {mod.clicks || 0} Clics</span>
                            {mod.active === false && <span className="bg-red-500/20 text-red-500 text-[10px] uppercase font-bold px-2 py-1 rounded border border-red-500/30 shrink-0">Oculto</span>}
                          </div>
                          <p className={`font-bold text-white text-lg truncate ${mod.active === false ? 'opacity-50 line-through' : ''}`}>{mod.title}</p>
                          {mod.type === 'media' && mod.props && <p className="text-sm text-gray-400 truncate">{mod.props.videoUrl} {mod.props.isLive && '(En Vivo)'}</p>}
                          {mod.type === 'nativeAd' && mod.props && <p className="text-sm text-gray-400 truncate">{mod.props.description}</p>}
                          {mod.type === 'poll' && mod.props && <p className="text-sm text-gray-400 truncate">{mod.props.question}</p>}
                          {mod.type === 'gallery' && mod.props && <p className="text-sm text-gray-400 truncate">Galería: {mod.props.images?.length || 0} fotos</p>}
                          {mod.type === 'feed' && mod.props && <p className="text-sm text-gray-400 truncate">Feed Dinámico</p>}
                          {mod.type === 'locked' && mod.props && <p className="text-sm text-gray-400 truncate">Premium ($ {mod.props.price})</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleActive(mod)} disabled={saving} className="p-3 text-yellow-400 bg-yellow-400/5 hover:bg-yellow-400 hover:text-black border border-yellow-400/20 rounded-xl transition-all shadow-sm opacity-50 group-hover:opacity-100" title={mod.active === false ? "Mostrar en Perfil" : "Ocultar del Perfil"}>
                            {mod.active === false ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                          </button>
                          <button onClick={() => startEditing(mod)} disabled={saving} className="p-3 text-blue-400 bg-blue-400/5 hover:bg-blue-400 hover:text-white border border-blue-400/20 rounded-xl transition-all shadow-sm opacity-50 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => handleDeleteModule(mod)} disabled={saving} className="p-3 text-red-400 bg-red-400/5 hover:bg-red-400 hover:text-white border border-red-400/20 rounded-xl transition-all shadow-sm opacity-50 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                      {editingId === mod.id && renderForm()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* MODAL ESPECTACULAR NUXIRA PRO */}
      {
        showProModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop con Blur extremo */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowProModal(false)} />

            <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.15)] animate-[slideIn_0.3s_ease-out]">
              {/* Botón X para cerrar */}
              <button
                onClick={() => setShowProModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-20 bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* Glow decorativo top */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px]" />

              <div className="p-8 text-center relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] rotate-3">
                  <svg className="w-10 h-10 text-black -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{APP_NAME} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">PRO</span></h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  Toma el control absoluto de tu monetización. Añade tus propios Banners de Afiliados, remueve los anuncios de la plataforma y obtén métricas avanzadas.
                </p>

                <div className="space-y-3 mb-8 text-left">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">✓</span>
                    100% Ingresos Propios (Anuncios Nativos)
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">✓</span>
                    Elimina Anuncios Aleatorios de {APP_NAME}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleUpgrade}
                    disabled={saving}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black uppercase tracking-widest text-sm shadow-xl hover:shadow-yellow-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Procesando...' : 'Hacerse Pro'}
                  </button>
                  <button
                    onClick={() => setShowProModal(false)}
                    className="w-full py-3 rounded-xl bg-transparent text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
