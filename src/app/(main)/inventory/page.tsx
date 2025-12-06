import React from 'react';
import { getInventoryStats, getStorageLocations, getMaterialRequests, seedInitialInventory } from '@/lib/actions/inventory';
import InventoryClient from '@/components/inventory/InventoryClient';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    // Fetch all required data
    const { items, totalItems, lowStockItems, totalValue, expiringItems, siloStats } = await getInventoryStats();
    const locations = await getStorageLocations();
    const pendingRequests = await getMaterialRequests('Pending');

    // Seed initial data if empty
    if (totalItems === 0) {
        await seedInitialInventory();
    }

    return (
        <InventoryClient
            items={items}
            totalItems={totalItems}
            lowStockItems={lowStockItems}
            totalValue={totalValue}
            expiringItems={expiringItems}
            siloStats={siloStats}
            locations={locations}
            pendingRequests={pendingRequests}
        />
    );
}
