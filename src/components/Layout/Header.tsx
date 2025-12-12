"use client";

import React from 'react';
import { Search } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { Session } from 'next-auth';

interface HeaderProps {
    session?: Session | null;
}

export function Header({ session }: HeaderProps) {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                {/* Search Bar */}
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        name="search"
                        id="global-search"
                        placeholder="Search trucks, materials, records..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <NotificationBell initialSession={session} />
            </div>
        </header>
    );
}
