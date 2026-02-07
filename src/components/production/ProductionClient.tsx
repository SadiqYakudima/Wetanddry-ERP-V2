'use client'

import React, { useEffect, useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Factory, Play, AlertCircle, CheckCircle, Database, Clock, ChevronDown,
    Loader2, X, TrendingUp, BarChart3, Beaker, Package, History,
    AlertTriangle, Settings, Building2, MapPin, ListOrdered, ArrowLeft, Lock, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RecipeManager from './RecipeManager';
import { usePermissions } from '@/hooks/use-permissions';

interface Recipe {
    id: string;
    productCode: string;
    name: string;
    description: string | null;
    totalWeight: number;
    ingredients: {
        id: string;
        materialName: string;
        quantity: number;
        unit: string;
        inventoryItemId?: string | null;
        inventoryItem?: {
            id: string;
            name: string;
        } | null;
    }[];
}

interface Silo {
    id: string;
    name: string;
    description: string | null;
    capacity: number | null;
    cementItem: {
        id: string;
        name: string;
        quantity: number;
        unit: string;
        maxCapacity: number | null;
    } | null;
}

interface ProductionRun {
    id: string;
    quantity: number;
    cementUsed: number | null;
    status: string;
    notes: string | null;
    operatorName: string | null;
    createdAt: Date;
    recipe: {
        name: string;
    };
    silo: {
        name: string;
    } | null;
    client?: {
        name: string;
    } | null;
    order?: {
        orderNumber: string;
    } | null;
}

interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
}

interface ClientOption {
    id: string;
    code: string;
    name: string;
    category?: string;
}

interface PendingOrder {
    id: string; // This is the OrderLineItem ID
    cubicMeters: number;
    status: string;
    recipe: {
        id: string;
        name: string;
        productCode: string;
    };
    order: {
        id: string;
        orderNumber: string;
        requiredDate: Date | null;
        client: {
            id: string;
            name: string;
            code: string;
        };
    };
}

interface ProductionClientProps {
    recipes: Recipe[];
    silos: Silo[];
    recentRuns: ProductionRun[];
    inventoryItems: InventoryItem[];
    clients?: ClientOption[];
    pendingOrders?: PendingOrder[];
    initialPermissions?: {
        canLogProduction: boolean;
        canManageRecipes: boolean;
    };
}

export default function ProductionClient({
    recipes,
    silos,
    recentRuns,
    inventoryItems,
    clients = [],
    pendingOrders = [],
    initialPermissions
}: ProductionClientProps) {
    const [activeTab, setActiveTab] = useState<'queue' | 'production' | 'recipes' | 'logs'>('queue');

    // Order Execution State
    const [selectedOrderLineItem, setSelectedOrderLineItem] = useState<PendingOrder | null>(null);

    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [selectedSilo, setSelectedSilo] = useState<Silo | null>(null);
    const [quantity, setQuantity] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Router for refresh
    const router = useRouter();

    // CRM Integration - Client fields
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [orderRef, setOrderRef] = useState<string>('');
    const [deliveryAddress, setDeliveryAddress] = useState<string>('');

    const renderCount = useRef(0);
    const mountTime = useRef(Date.now());
    const { can, isLoading, role } = usePermissions();

    // Use server-provided permissions for initial render (no loading flash)
    // Fall back to client-side hook for dynamic updates (e.g., if role changes)
    const canLogProduction = initialPermissions?.canLogProduction ?? can('log_production');
    const canManageRecipes = initialPermissions?.canManageRecipes ?? can('manage_recipes');

    useEffect(() => {
        // Track permission changes
    }, [canLogProduction, canManageRecipes]);

    // Initialize Order Mode
    const handleRunOrder = (orderItem: PendingOrder) => {
        setSelectedOrderLineItem(orderItem);
        // Auto-select recipe based on order item
        const matchingRecipe = recipes.find(r => r.id === orderItem.recipe.id);
        if (matchingRecipe) {
            setSelectedRecipe(matchingRecipe);
        }

        // Auto-fill client details
        setSelectedClientId(orderItem.order.client.id);
        setOrderRef(orderItem.order.orderNumber);

        // Pre-fill quantity (but allow edit if needed, though usually fixed for order items)
        setQuantity(orderItem.cubicMeters.toString());

        setActiveTab('production');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToQueue = () => {
        setSelectedOrderLineItem(null);
        setSelectedRecipe(null);
        setSelectedSilo(null);
        setQuantity('');
        setSelectedClientId('');
        setOrderRef('');
        setActiveTab('queue');
    };

    // Calculate required materials for selected recipe and quantity
    const calculateRequirements = () => {
        if (!selectedRecipe || !quantity) return null;
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) return null;

        return selectedRecipe.ingredients.map(ing => {
            // Find available stock
            const isCement = ing.materialName.toLowerCase().includes('cement');
            let available = 0;
            let unit = ing.unit;

            if (isCement && selectedSilo && selectedSilo.cementItem) {
                available = selectedSilo.cementItem.quantity;
                unit = selectedSilo.cementItem.unit;
            } else {
                // Look up by ID first (robust), fall back to name (legacy)
                const linkedId = ing.inventoryItemId || ing.inventoryItem?.id;

                let item: InventoryItem | undefined;
                if (linkedId) {
                    item = inventoryItems.find(i => i.id === linkedId);
                } else {
                    item = inventoryItems.find(i => i.name === ing.materialName);
                }

                if (item) {
                    available = item.quantity;
                    unit = item.unit;
                }
            }

            return {
                name: ing.materialName,
                required: ing.quantity * qty,
                available,
                unit,
                isCement,
                isSufficient: available >= (ing.quantity * qty)
            };
        });
    };

    const requirements = calculateRequirements();
    const cementRequirement = requirements?.find(r => r.isCement);
    const allMaterialsSufficient = requirements?.every(r => r.isSufficient) ?? false;

    // Derived check for button disabled state
    const canExecute = selectedRecipe && selectedSilo && quantity && allMaterialsSufficient && !isPending;

    const handleSubmit = async () => {
        if (!canExecute) return;

        const formData = new FormData();
        formData.append('recipeId', selectedRecipe!.id);
        formData.append('siloId', selectedSilo!.id);
        formData.append('quantity', quantity);

        // CRM Integration - Client fields
        if (selectedClientId) {
            formData.append('clientId', selectedClientId);
        }
        if (orderRef) {
            formData.append('orderRef', orderRef);
        }
        if (deliveryAddress) {
            formData.append('deliveryAddress', deliveryAddress);
        }

        // Link to Order Line Item if in Order Mode
        if (selectedOrderLineItem) {
            formData.append('orderId', selectedOrderLineItem.order.id);
            formData.append('orderLineItemId', selectedOrderLineItem.id);
        }

        startTransition(async () => {
            try {
                const { createProductionRun } = await import('@/lib/actions/production');
                const result = await createProductionRun(formData);

                if (result.success) {
                    setMessage({ type: 'success', text: result.message });
                    setShowConfirmModal(false);

                    // Set summary data and show result modal
                    setSummaryData({
                        recipeName: selectedRecipe!.name,
                        quantity: quantity,
                        deductions: result.deductions,
                        runId: result.run?.id,
                        clientName: clients.find(c => c.id === selectedClientId)?.name
                    });
                    setShowSummaryModal(true);

                    // clear form
                    if (selectedOrderLineItem) {
                        setSelectedOrderLineItem(null);
                    }
                    setSelectedRecipe(null);
                    setSelectedSilo(null);
                    setQuantity('');
                    setSelectedClientId('');
                    setOrderRef('');
                    setDeliveryAddress('');
                } else {
                    setMessage({ type: 'error', text: result.message });
                    setShowConfirmModal(false);
                }
            } catch (error: any) {
                setMessage({ type: 'error', text: error.message || 'Production failed' });
                setShowConfirmModal(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Production & Mixology</h1>
                    <p className="text-gray-600 mt-1">Manage mix designs and execute production</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 gap-1">
                <button
                    onClick={() => setActiveTab('queue')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg flex items-center gap-2",
                        activeTab === 'queue'
                            ? "text-emerald-600 bg-emerald-50/50 border-b-2 border-emerald-600"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    <ListOrdered size={16} />
                    Order Queue
                </button>
                {canLogProduction && (
                    <button
                        onClick={() => setActiveTab('production')}
                        className={cn(
                            "px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg flex items-center gap-2",
                            activeTab === 'production'
                                ? selectedOrderLineItem
                                    ? "text-blue-600 bg-blue-50/50 border-b-2 border-blue-600"
                                    : "text-gray-400 bg-gray-50/50 border-b-2 border-gray-300"
                                : "text-gray-400 hover:text-gray-500 hover:bg-gray-50 cursor-default"
                        )}
                    >
                        {!selectedOrderLineItem && <Lock size={14} className="text-gray-400" />}
                        <Play size={16} />
                        Run Production
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('recipes')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg",
                        activeTab === 'recipes'
                            ? "text-blue-600 bg-blue-50/50 border-b-2 border-blue-600"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    Recipes
                </button>
                <div className="w-px bg-gray-200 my-3 mx-1" />
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg flex items-center gap-2",
                        activeTab === 'logs'
                            ? "text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    <History size={16} />
                    Logs & History
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'recipes' && (
                <RecipeManager recipes={recipes} inventoryItems={inventoryItems} canManageRecipes={canManageRecipes} />
            )}

            {activeTab === 'queue' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-gray-900">Production Queue</h2>
                            <button
                                onClick={() => {
                                    setIsRefreshing(true);
                                    router.refresh();
                                    setTimeout(() => setIsRefreshing(false), 1000);
                                }}
                                disabled={isRefreshing}
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mb-6">Active orders awaiting production - sorted by required date</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                                <div className="text-3xl font-bold text-gray-900">{pendingOrders.length}</div>
                                <div className="text-gray-500 font-medium text-sm">Total in Queue</div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                                <div className="text-3xl font-bold text-amber-600">
                                    {pendingOrders.filter(o => o.status === 'Pending').length}
                                </div>
                                <div className="text-amber-700 font-medium text-sm">Pending</div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                    {pendingOrders.filter(o => o.status === 'In Progress').length}
                                </div>
                                <div className="text-blue-700 font-medium text-sm">In Progress</div>
                            </div>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <ListOrdered className="mx-auto text-gray-300 mb-3" size={32} />
                                <p className="text-gray-500">No pending orders found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <th className="px-6 py-4">Required Date</th>
                                            <th className="px-6 py-4">Order</th>
                                            <th className="px-6 py-4">Client</th>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4 text-center">Qty (m³)</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingOrders.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {item.order.requiredDate
                                                        ? new Date(item.order.requiredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                                                        : <span className="text-gray-400">Not set</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-blue-600">{item.order.orderNumber}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.order.client.name}</div>
                                                    <div className="text-xs text-gray-400">{item.order.client.code}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{item.recipe?.productCode || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500">{item.recipe?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-gray-900">
                                                    {item.cubicMeters}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                        item.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                            item.status === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                                "bg-gray-50 text-gray-600 border-gray-100"
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleRunOrder(item)}
                                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 flex items-center gap-1 ml-auto"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                        Run
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'production' && canLogProduction && (
                <>
                    {!selectedOrderLineItem ? (
                        /* Locked State - No order selected */
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock size={36} className="text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-700 mb-2">Production Locked</h2>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                To run production, please select an order from the <strong>Order Queue</strong> and click the <strong>"Run"</strong> button.
                            </p>
                            <button
                                onClick={() => setActiveTab('queue')}
                                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 inline-flex items-center gap-2"
                            >
                                <ListOrdered size={18} />
                                Go to Order Queue
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Production Form */}
                            <div className="lg:col-span-2 space-y-6">

                                {selectedOrderLineItem && (
                                    <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <div className="text-emerald-100 text-sm font-medium mb-1">Running Production for</div>
                                                <h2 className="text-3xl font-bold">{selectedOrderLineItem.order.orderNumber}</h2>
                                                <div className="text-emerald-50 mt-1">{selectedOrderLineItem.order.client.name}</div>
                                            </div>
                                            <button
                                                onClick={handleBackToQueue}
                                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/20"
                                            >
                                                Back to Queue
                                            </button>
                                        </div>
                                        {/* Decorative background elements */}
                                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    </div>
                                )}

                                {/* Alert Message */}
                                {message && (
                                    <div className={cn(
                                        "p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300",
                                        message.type === 'success'
                                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                            : "bg-red-50 border border-red-200 text-red-800"
                                    )}>
                                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                        <span className="font-medium">{message.text}</span>
                                        <button onClick={() => setMessage(null)} className="ml-auto">
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* Recipe Selection */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Beaker className="text-blue-600" size={22} />
                                        Step 1: Recipe
                                        {selectedOrderLineItem && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full uppercase ml-2">Locked</span>}
                                    </h2>

                                    {recipes.length === 0 ? (
                                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                            <p className="text-gray-500">No recipes found. Switch to the "Mix Designs" tab to add recipes.</p>
                                        </div>
                                    ) : (
                                        selectedOrderLineItem ? (
                                            // LOCKED RECIPE DISPLAY
                                            <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50">
                                                <div className="font-bold text-gray-900 flex justify-between">
                                                    <span>{selectedRecipe?.productCode || 'Loading...'}</span>
                                                    <span className="text-gray-500 font-normal text-sm">{selectedRecipe?.totalWeight.toFixed(0)} kg/m³</span>
                                                </div>
                                                <div className="font-medium text-gray-700">{selectedRecipe?.name || 'Recipe from order not found'}</div>

                                                {selectedRecipe ? (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {selectedRecipe.ingredients.slice(0, 3).map(ing => (
                                                            <span key={ing.id} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                                                {ing.materialName.split(' ')[0]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-red-500 text-sm">
                                                        <AlertTriangle size={14} className="inline mr-1" />
                                                        The recipe specified in the order (ID: {selectedOrderLineItem.recipe.id}) could not be found.
                                                    </div>
                                                )}
                                                <div className="mt-3 text-xs text-blue-600 flex items-center gap-1">
                                                    <Lock size={12} />
                                                    Recipe is locked to the sales order specification and cannot be changed
                                                </div>
                                            </div>
                                        ) : (
                                            // STANDARD SELECTION
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {recipes.map(recipe => (
                                                    <button
                                                        key={recipe.id}
                                                        onClick={() => setSelectedRecipe(recipe)}
                                                        className={cn(
                                                            "p-4 rounded-xl border-2 text-left transition-all",
                                                            selectedRecipe?.id === recipe.id
                                                                ? "border-blue-500 bg-blue-50"
                                                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <div className="font-bold text-gray-900 flex justify-between">
                                                            <span>{recipe.productCode}</span>
                                                            <span className="text-gray-500 font-normal text-sm">{recipe.totalWeight.toFixed(0)} kg/m³</span>
                                                        </div>
                                                        <div className="font-medium text-gray-700">{recipe.name}</div>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {recipe.ingredients.slice(0, 3).map(ing => (
                                                                <span key={ing.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                                    {ing.materialName.split(' ')[0]}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Silo Selection */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Database className="text-indigo-600" size={22} />
                                        Step 2: Select Cement Silo
                                        <span className="text-sm font-normal text-red-500 ml-2">*Required</span>
                                    </h2>

                                    {silos.length === 0 ? (
                                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                            <Database className="mx-auto text-gray-300 mb-3" size={40} />
                                            <p className="text-gray-500">No silos available. Please add silos in Inventory Management.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {silos.map(silo => {
                                                const percentage = silo.cementItem?.maxCapacity
                                                    ? (silo.cementItem.quantity / silo.cementItem.maxCapacity) * 100
                                                    : 50;
                                                const isLow = silo.cementItem ? silo.cementItem.quantity < 5000 : true;

                                                return (
                                                    <button
                                                        key={silo.id}
                                                        onClick={() => setSelectedSilo(silo)}
                                                        disabled={!silo.cementItem}
                                                        className={cn(
                                                            "p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                                                            selectedSilo?.id === silo.id
                                                                ? "border-indigo-500 bg-indigo-50"
                                                                : silo.cementItem
                                                                    ? "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                                                    : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{silo.name}</div>
                                                                <p className="text-sm text-gray-500">{silo.cementItem?.name || 'No cement loaded'}</p>
                                                            </div>
                                                            {isLow && silo.cementItem && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                                    Low
                                                                </span>
                                                            )}
                                                        </div>

                                                        {silo.cementItem && (
                                                            <>
                                                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all",
                                                                            isLow ? "bg-amber-500" : "bg-indigo-500"
                                                                        )}
                                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <div className="mt-2 flex justify-between text-sm">
                                                                    <span className="text-gray-500">Available</span>
                                                                    <span className="font-semibold text-gray-900">
                                                                        {silo.cementItem.quantity.toLocaleString()} {silo.cementItem.unit}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* CRM Integration - Client Selection */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Building2 className="text-violet-600" size={22} />
                                        Step 3: Client Assignment
                                        {selectedOrderLineItem ?
                                            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full uppercase ml-2">Locked</span> :
                                            <span className="text-sm font-normal text-gray-400 ml-2">(Optional)</span>
                                        }
                                    </h2>

                                    {selectedOrderLineItem ? (
                                        // LOCKED CLIENT DISPLAY
                                        <div className="p-4 rounded-xl border border-violet-200 bg-violet-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-sm text-violet-600 font-medium mb-1">Client</div>
                                                    <div className="font-bold text-gray-900 text-lg">{selectedOrderLineItem.order.client.name}</div>
                                                    <div className="text-gray-500 font-medium">{selectedOrderLineItem.order.client.code}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-violet-600 font-medium mb-1">Order Reference</div>
                                                    <div className="font-mono text-gray-900">{selectedOrderLineItem.order.orderNumber}</div>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-violet-100">
                                                <div className="text-sm text-violet-600 font-medium mb-1 flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    Delivery Address
                                                </div>
                                                <div className="text-gray-700">{deliveryAddress || 'No specific address provided'}</div>
                                            </div>

                                            <div className="mt-3 text-xs text-violet-600 flex items-center gap-1">
                                                <Lock size={12} />
                                                Client is locked to the sales order specification and cannot be changed
                                            </div>
                                        </div>
                                    ) : (
                                        // STANDARD CLIENT SELECTION
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Client
                                                </label>
                                                <select
                                                    value={selectedClientId}
                                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                                                >
                                                    <option value="">-- No client (internal) --</option>
                                                    {clients.map(client => (
                                                        <option key={client.id} value={client.id}>
                                                            {client.code} - {client.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Order/PO Reference
                                                </label>
                                                <input
                                                    type="text"
                                                    value={orderRef}
                                                    onChange={(e) => setOrderRef(e.target.value)}
                                                    placeholder="e.g., PO-2024-001"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                                                />
                                            </div>

                                            {selectedClientId && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        <MapPin size={14} className="inline mr-1" />
                                                        Delivery Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={deliveryAddress}
                                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                                        placeholder="Enter delivery location..."
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Quantity Input */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Package className="text-emerald-600" size={22} />
                                        Step {clients.length > 0 ? '4' : '3'}: Confirm Production Quantity
                                        <span className="text-sm font-normal text-red-500 ml-2">*Required</span>
                                    </h2>

                                    {selectedOrderLineItem && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm font-medium">
                                            Order requires: <span className="font-bold">{selectedOrderLineItem.cubicMeters} m³</span> (You must enter this exact quantity)
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quantity to Produce
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0.5"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                    placeholder="Enter quantity"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-lg"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">m³</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Material Requirements Preview with Active Stock Checks */}
                                    {requirements && (
                                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Required vs Available Materials:</h4>
                                            <div className="space-y-3">
                                                {requirements.map((req, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                                        <div className={cn(
                                                            "flex items-center gap-2",
                                                            req.isCement ? "text-indigo-700 font-medium" : "text-gray-700"
                                                        )}>
                                                            {req.isCement && <Database size={14} />}
                                                            <span>{req.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                                            <div className="text-right">
                                                                <span className="text-xs text-gray-500 block">Required</span>
                                                                <span className="font-semibold text-gray-900">
                                                                    {req.required.toLocaleString(undefined, { maximumFractionDigits: 2 })} {req.unit}
                                                                </span>
                                                            </div>
                                                            <div className="text-right border-l pl-4">
                                                                <span className="text-xs text-gray-500 block">Available</span>
                                                                <span className={cn(
                                                                    "font-semibold",
                                                                    req.isSufficient ? "text-emerald-600" : "text-red-500"
                                                                )}>
                                                                    {req.available.toLocaleString(undefined, { maximumFractionDigits: 2 })} {req.unit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {!allMaterialsSufficient && (
                                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-sm">
                                                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                                    <span>Insufficient stock for one or more ingredients. Please restock before producing.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Execute Button */}
                                    <button
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={!canExecute}
                                        className={cn(
                                            "mt-6 w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all",
                                            canExecute
                                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Play size={22} />
                                        Execute Production
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Quick Stats */}
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <BarChart3 size={20} />
                                        Today's Production
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-blue-200 text-sm">Total Runs</div>
                                            <div className="text-3xl font-bold">
                                                {recentRuns.filter(r =>
                                                    new Date(r.createdAt).toDateString() === new Date().toDateString()
                                                ).length}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-blue-200 text-sm">Volume Produced</div>
                                            <div className="text-3xl font-bold">
                                                {recentRuns
                                                    .filter(r => new Date(r.createdAt).toDateString() === new Date().toDateString())
                                                    .reduce((sum, r) => sum + r.quantity, 0)
                                                    .toFixed(1)} m³
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Runs Sidebar */}
                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <History size={18} />
                                            Recent Production Runs
                                        </h3>
                                    </div>
                                    {recentRuns.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Factory className="mx-auto text-gray-300 mb-3" size={32} />
                                            <p>No production runs yet</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                            {recentRuns.slice(0, 10).map(run => (
                                                <div key={run.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{run.recipe.name}</div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {run.quantity} m³ • {run.silo?.name || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                                                run.status === 'Completed'
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                            )}>
                                                                {run.status}
                                                            </span>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {new Date(run.createdAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {run.cementUsed && (
                                                        <div className="mt-2 text-xs text-indigo-600">
                                                            Cement used: {run.cementUsed.toLocaleString()} kg
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Confirmation Modal */}
                            {showConfirmModal && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                                        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                            <div className="flex items-center gap-3">
                                                <Factory size={24} />
                                                <h3 className="text-xl font-bold">Confirm Production</h3>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Recipe</span>
                                                    <span className="font-semibold text-gray-900">{selectedRecipe?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Cement Source</span>
                                                    <span className="font-semibold text-indigo-600">{selectedSilo?.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Quantity</span>
                                                    <span className="font-semibold text-gray-900">{quantity} m³</span>
                                                </div>
                                                {cementRequirement && (
                                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                                        <span className="text-gray-600">Cement to Deduct</span>
                                                        <span className="font-semibold text-red-600">
                                                            -{cementRequirement.required.toLocaleString()} {cementRequirement.unit}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                                <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
                                                <p className="text-sm text-amber-800">
                                                    This will automatically deduct the required materials from inventory. This action cannot be undone.
                                                </p>
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => setShowConfirmModal(false)}
                                                    disabled={isPending}
                                                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isPending}
                                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {isPending ? (
                                                        <>
                                                            <Loader2 size={18} className="animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={18} />
                                                            Confirm & Execute
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PRODUCTION SUMMARY MODAL */}
                            {showSummaryModal && summaryData && (
                                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                                        <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center">
                                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                                <CheckCircle size={32} className="text-white" />
                                            </div>
                                            <h2 className="text-2xl font-bold">Production Successful!</h2>
                                            <p className="text-emerald-50 mt-1">Inventory has been updated automatically.</p>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider">Recipe</div>
                                                    <div className="text-gray-900 font-bold text-lg mt-1">{summaryData.recipeName}</div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                                    <div className="text-gray-500 text-xs uppercase font-bold tracking-wider">Quantity</div>
                                                    <div className="text-gray-900 font-bold text-lg mt-1">{summaryData.quantity} m³</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                    <TrendingUp size={16} className="text-gray-500" />
                                                    Materials Deducted
                                                </h4>
                                                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                                    {summaryData.deductions?.map((d: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between p-3 text-sm">
                                                            <span className="text-gray-600">{d.item}</span>
                                                            <span className="font-mono font-medium text-gray-900">-{d.quantity.toLocaleString()} {d.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setShowSummaryModal(false)}
                                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                                            >
                                                Close & Continue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <History className="text-indigo-600" size={20} />
                            Production History
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Detailed log of all production executions and status.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Date & Time</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Order</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Recipe</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Cement Used</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Source Silo</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentRuns.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-500">
                                            No production history found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentRuns.map((run) => (
                                        <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-900">
                                                <div className="font-medium">{new Date(run.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-gray-500 text-xs">{new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {run.order ? (
                                                    <>
                                                        <div className="text-sm font-semibold text-blue-600">{run.order.orderNumber}</div>
                                                        <div className="text-xs text-gray-500">{run.client?.name || 'Unknown Client'}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Internal</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-900">
                                                {run.recipe.name}
                                            </td>
                                            <td className="py-4 px-6 text-sm font-bold text-gray-900">
                                                {run.quantity} m³
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                {run.cementUsed ? `${run.cementUsed.toLocaleString()} kg` : '-'}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Database size={14} className="text-gray-400" />
                                                    {run.silo?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    run.status === 'Completed'
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : run.status === 'In Progress'
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-amber-100 text-amber-700"
                                                )}>{run.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
