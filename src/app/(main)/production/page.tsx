import React from 'react';
import { getRecipes, getSilos, getProductionRuns, getAllInventoryItems } from '@/lib/actions/production';
import { getClientsForSelect } from '@/lib/actions/crm';
import ProductionClient from '@/components/production/ProductionClient';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// Revalidate every 30 seconds
export const revalidate = 30;

export default async function ProductionPage() {
    const session = await auth();

    // Pre-compute permissions on the server to avoid client-side loading flash
    const userRole = session?.user?.role;
    const canLogProduction = userRole ? hasPermission(userRole, 'log_production') : false;
    const canManageRecipes = userRole ? hasPermission(userRole, 'manage_recipes') : false;
    const canViewCrm = userRole ? hasPermission(userRole, 'view_crm') : false;

    // Use dynamic import to avoid circular dependency issues if any
    const { getPendingProductionOrders } = await import('@/lib/actions/production');
    const { getClientsForSelect } = await import('@/lib/actions/crm');

    const [recipes, silos, recentRuns, inventoryItems, clients, pendingOrders] = await Promise.all([
        getRecipes(),
        getSilos(),
        getProductionRuns(),
        getAllInventoryItems(),
        canViewCrm ? getClientsForSelect() : Promise.resolve([]),
        getPendingProductionOrders()
    ]);

    return (
        <ProductionClient
            recipes={recipes}
            silos={silos}
            recentRuns={recentRuns}
            inventoryItems={inventoryItems}
            clients={clients}
            pendingOrders={pendingOrders}
            initialPermissions={{ canLogProduction, canManageRecipes }}
        />
    );
}
