'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
    const { notifications, unreadCount, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        if (!isOpen && unreadCount > 0) {
            markAllAsRead();
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none rounded-full hover:bg-gray-800"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#15151b] border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right animate-in fade-in scale-95 duration-200">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0d0d12]">
                        <h3 className="font-bold text-white">Notificaciones</h3>
                        <span className="text-xs text-gray-400 font-bold bg-gray-800 px-2 py-1 rounded-full">{notifications.length} Info</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                                <span className="text-4xl mb-3 opacity-20">📭</span>
                                No tienes notificaciones nuevas.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-800/30">
                                {notifications.map(notif => (
                                    <li key={notif.id} className={`p-4 transition-colors ${!notif.read ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'hover:bg-gray-800/30'}`}>
                                        <div className="flex gap-3 items-start">
                                            <div className="text-xl mt-0.5 flex-shrink-0">
                                                {notif.type === 'like' && '❤️'}
                                                {notif.type === 'question' && '❓'}
                                                {notif.type === 'vote' && '📊'}
                                                {notif.type === 'purchase' && '💸'}
                                                {notif.type === 'system' && '⚡'}
                                            </div>
                                            <div>
                                                <p className={`text-sm ${!notif.read ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>{notif.message}</p>
                                                <span className="text-xs text-gray-500 mt-1 block">
                                                    {new Date(notif.createdAt).toLocaleDateString()} a las {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
