import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { collection, query, onSnapshot, orderBy, doc, writeBatch } from 'firebase/firestore';

export type Notification = {
    id: string;
    type: 'like' | 'question' | 'vote' | 'purchase' | 'system';
    message: string;
    read: boolean;
    createdAt: string;
};

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!auth.currentUser) return;

        // Fase 4: Suscripción en Tiempo Real a Colección de Notificaciones
        const notifsRef = collection(db, 'creators', auth.currentUser.uid, 'notifications');
        const q = query(notifsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, []);

    const markAllAsRead = async () => {
        if (!auth.currentUser || notifications.length === 0) return;

        try {
            const batch = writeBatch(db);
            const unreadNotifs = notifications.filter(n => !n.read);

            if (unreadNotifs.length === 0) return;

            unreadNotifs.forEach(n => {
                const ref = doc(db, 'creators', auth.currentUser!.uid, 'notifications', n.id);
                batch.update(ref, { read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marking as read:', error);
        }
    };

    return { notifications, unreadCount, markAllAsRead };
};
