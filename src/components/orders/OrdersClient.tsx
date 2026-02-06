'use client'

import React, { useState, useTransition, useEffect } from 'react'
import {
    ShoppingCart, Plus, Search, Eye, Trash2,
    CheckCircle, Clock, AlertCircle, Package, DollarSign,
    Calendar, Building2, FileText, X, ChevronRight,
    CreditCard, ArrowRight, Check, Info, Box
} from 'lucide-react'
import { hasPermission } from '@/lib/permissions'
import {
    createSalesOrder,
    addOrderLineItem,
    removeOrderLineItem,
    submitOrder,
    cancelOrder,
    getOrder
} from '@/lib/actions/orders'
import { recordPayment, addPaymentScheduleItem, removePaymentScheduleItem } from '@/lib/actions/payments'

// ==================== TYPE DEFINITIONS ====================

interface Order {
    id: string
    orderNumber: string
    clientId: string
    client: { id: string; name: string; code: string }
    projectId: string | null
    project: { id: string; name: string } | null
    orderDate: Date
    requiredDate: Date | null
    deliveryAddress: string | null
    status: string
    totalAmount: number
    amountPaid: number
    activationThreshold: number
    notes: string | null
    lineItems: OrderLineItem[]
    payments: Payment[]
    paymentSchedule?: PaymentScheduleItem[]
    _count: { lineItems: number; payments: number; productionRuns: number }
}

interface OrderLineItem {
    id: string
    recipeId: string
    recipe: { id: string; name: string; productCode: string }
    cubicMeters: number
    unitPrice: number
    lineTotal: number
    productType: string
    deliveredQty: number
    status: string
}

interface Payment {
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
    referenceNumber: string | null
    status: string
    receivedBy: string
}

interface PaymentScheduleItem {
    id: string
    dueDate: Date
    amount: number
    description: string | null
    status: string
}

interface Stats {
    total: number
    draft: number
    pending: number
    active: number
    fulfilled: number
    totalValue: number
    totalPaid: number
}

// ==================== MAIN COMPONENT ====================

interface OrdersClientProps {
    initialOrders: Order[]
    initialStats: Stats
    clients: { id: string; code: string; name: string }[]
    recipes: { id: string; productCode: string; name: string }[]
    projects: { id: string; name: string }[]
    userRole: string
    userName: string
}

export default function OrdersClient({
    initialOrders,
    initialStats,
    clients,
    recipes,
    projects,
    userRole,
    userName
}: OrdersClientProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [stats, setStats] = useState<Stats>(initialStats)
    const [filter, setFilter] = useState({ status: 'all', search: '', clientId: 'all' })
    const [isPending, startTransition] = useTransition()
    const [showNewOrderModal, setShowNewOrderModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showOrderDetail, setShowOrderDetail] = useState(false)

    const canManageOrders = hasPermission(userRole, 'manage_orders')
    const canApproveOrders = hasPermission(userRole, 'approve_orders')

    const filteredOrders = orders.filter(order => {
        if (filter.status !== 'all' && order.status !== filter.status) return false
        if (filter.clientId !== 'all' && order.clientId !== filter.clientId) return false
        if (filter.search) {
            const search = filter.search.toLowerCase()
            return (
                order.orderNumber.toLowerCase().includes(search) ||
                order.client.name.toLowerCase().includes(search) ||
                (order.notes?.toLowerCase().includes(search) || false)
            )
        }
        return true
    })

    const refreshOrders = async () => {
        const { getOrders } = await import('@/lib/actions/orders')
        const result = await getOrders()
        setOrders(result.orders)
        setStats(result.stats)
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'Draft': 'bg-gray-50 text-gray-600 border-gray-100',
            'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-100',
            'Active': 'bg-green-50 text-green-700 border-green-100',
            'Fulfilled': 'bg-blue-50 text-blue-700 border-blue-100',
            'Closed': 'bg-purple-50 text-purple-700 border-purple-100',
            'Cancelled': 'bg-red-50 text-red-700 border-red-100'
        }
        return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        Sales Orders
                    </h1>
                    <p className="text-gray-500 mt-1">Manage orders, track deliveries, and process payments</p>
                </div>
                {canManageOrders && (
                    <button
                        onClick={() => setShowNewOrderModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Order
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Orders" value={stats.total} />
                <StatCard label="Draft" value={stats.draft} />
                <StatCard label="Pending" value={stats.pending} color="text-yellow-600" />
                <StatCard label="Active" value={stats.active} color="text-green-600" />
                <StatCard label="Total Value" value={`₦${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="text-emerald-600" />
                <StatCard label="Collected" value={`₦${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="text-purple-600" />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search orders"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <select
                    value={filter.clientId}
                    onChange={(e) => setFilter({ ...filter, clientId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Clients</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        {filter.search || filter.status !== 'all' || filter.clientId !== 'all'
                                            ? 'No orders match your filters'
                                            : 'No orders yet'}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-800">{order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-800">{order.client.name}</div>
                                                <div className="text-sm text-gray-500">{order.client.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{order._count.lineItems} item(s)</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">₦{order.totalAmount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className={order.amountPaid < order.totalAmount ? 'text-orange-600 font-bold text-base' : 'text-green-600 font-bold text-base'}>
                                                    ₦{order.amountPaid.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {order.totalAmount > 0 ? `${Math.round((order.amountPaid / order.totalAmount) * 100)}%` : '0%'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order)
                                                    setShowOrderDetail(true)
                                                }}
                                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium inline-flex items-center gap-1"
                                            >
                                                View <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Order Modal */}
            {showNewOrderModal && (
                <NewOrderWizard
                    clients={clients}
                    recipes={recipes}
                    projects={projects}
                    onClose={() => setShowNewOrderModal(false)}
                    onSuccess={() => {
                        setShowNewOrderModal(false)
                        startTransition(refreshOrders)
                    }}
                />
            )}

            {/* Order Detail Modal */}
            {showOrderDetail && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    recipes={recipes}
                    clients={clients}
                    canManage={canManageOrders}
                    canApprove={canApproveOrders}
                    onClose={() => {
                        setShowOrderDetail(false)
                        setSelectedOrder(null)
                    }}
                    onRefresh={() => startTransition(refreshOrders)}
                />
            )}
        </div>
    )
}

// ==================== STAT CARD ====================

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
            <div className={`text-xl font-bold ${color} truncate`} title={String(value)}>{value}</div>
        </div>
    )
}

// ==================== NEW ORDER WIZARD (2-Step) ====================

interface LineItemDraft {
    recipeId: string
    productName: string
    cubicMeters: number
    unitPrice: number
    lineTotal: number
}

function NewOrderWizard({
    clients,
    recipes,
    projects,
    onClose,
    onSuccess
}: {
    clients: { id: string; code: string; name: string }[]
    recipes: { id: string; productCode: string; name: string }[]
    projects: { id: string; name: string }[]
    onClose: () => void
    onSuccess: () => void
}) {
    const [step, setStep] = useState(1)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')

    // Step 1 Data
    const [clientId, setClientId] = useState('')
    const [clientSearch, setClientSearch] = useState('')
    const [showClientDropdown, setShowClientDropdown] = useState(false)
    const [requiredDate, setRequiredDate] = useState('')
    const [activationThreshold, setActivationThreshold] = useState('30')
    const [deliveryAddress, setDeliveryAddress] = useState('')
    const [notes, setNotes] = useState('')

    // Step 2 Data
    const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
    const [lineItems, setLineItems] = useState<LineItemDraft[]>([])
    const [newItem, setNewItem] = useState({ recipeId: '', cubicMeters: '', unitPrice: '' })

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(clientSearch.toLowerCase())
    )

    const selectedClient = clients.find(c => c.id === clientId)
    const orderTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)

    const handleNextStep = () => {
        if (!clientId) {
            setError('Please select a client')
            return
        }
        setError('')
        setStep(2)
    }

    const handleCreateOrderAndAddItem = async () => {
        if (!newItem.recipeId || !newItem.cubicMeters || !newItem.unitPrice) {
            setError('Please fill in all item fields')
            return
        }

        const recipe = recipes.find(r => r.id === newItem.recipeId)
        if (!recipe) return

        const qty = parseFloat(newItem.cubicMeters)
        const price = parseFloat(newItem.unitPrice)
        const total = qty * price

        startTransition(async () => {
            try {
                let orderId = createdOrderId

                // Create order if not yet created
                if (!orderId) {
                    const formData = new FormData()
                    formData.append('clientId', clientId)
                    if (requiredDate) formData.append('requiredDate', requiredDate)
                    formData.append('activationThreshold', (parseFloat(activationThreshold) / 100).toString())
                    if (deliveryAddress) formData.append('deliveryAddress', deliveryAddress)
                    if (notes) formData.append('notes', notes)

                    const result = await createSalesOrder(formData)
                    if (result.success && result.order) {
                        orderId = result.order.id
                        setCreatedOrderId(orderId)
                    } else {
                        setError('Failed to create order')
                        return
                    }
                }

                // Add line item
                const itemFormData = new FormData()
                itemFormData.append('orderId', orderId)
                itemFormData.append('recipeId', newItem.recipeId)
                itemFormData.append('cubicMeters', newItem.cubicMeters)
                itemFormData.append('unitPrice', newItem.unitPrice)

                await addOrderLineItem(itemFormData)

                // Add to local state
                setLineItems([...lineItems, {
                    recipeId: newItem.recipeId,
                    productName: `${recipe.productCode} - ${recipe.name}`,
                    cubicMeters: qty,
                    unitPrice: price,
                    lineTotal: total
                }])

                // Reset form
                setNewItem({ recipeId: '', cubicMeters: '', unitPrice: '' })
                setError('')
            } catch (err: any) {
                setError(err.message || 'An error occurred')
            }
        })
    }

    const handleDone = () => {
        if (lineItems.length === 0) {
            setError('Please add at least one item')
            return
        }
        onSuccess()
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {step === 1 ? 'Create New Order' : 'Add Line Items'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {step === 1 ? 'Enter order details' : 'Add products to the order'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
                    )}

                    {step === 1 ? (
                        <>
                            {/* Client Search */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search clients by name or code..."
                                        value={selectedClient ? `${selectedClient.code} - ${selectedClient.name}` : clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value)
                                            setClientId('')
                                            setShowClientDropdown(true)
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                {showClientDropdown && !clientId && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filteredClients.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    setClientId(c.id)
                                                    setClientSearch('')
                                                    setShowClientDropdown(false)
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span>{c.code} - {c.name}</span>
                                            </button>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <div className="px-4 py-2 text-gray-500 text-sm">No clients found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Required Date & Threshold */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
                                    <input
                                        type="date"
                                        value={requiredDate}
                                        onChange={(e) => setRequiredDate(e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Activation Threshold (%)</label>
                                    <input
                                        type="number"
                                        value={activationThreshold}
                                        onChange={(e) => setActivationThreshold(e.target.value)}
                                        min="0"
                                        max="100"
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Payment % required to activate</p>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                                <input
                                    type="text"
                                    placeholder="Enter delivery address"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    placeholder="Optional notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600">
                                Add products to the order. Click &quot;Add&quot; to save each item.
                            </p>

                            {/* Added Items */}
                            {lineItems.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-emerald-50 px-3 py-2 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Added Items ({lineItems.length})
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Product</th>
                                                <th className="px-3 py-2 text-left">Qty (m³)</th>
                                                <th className="px-3 py-2 text-left">Price/m³</th>
                                                <th className="px-3 py-2 text-left">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {lineItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2">{item.productName}</td>
                                                    <td className="px-3 py-2">{item.cubicMeters}</td>
                                                    <td className="px-3 py-2">₦{item.unitPrice.toLocaleString()}</td>
                                                    <td className="px-3 py-2">₦{item.lineTotal.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-emerald-50">
                                            <tr>
                                                <td colSpan={3} className="px-3 py-2 text-right font-medium">Order Total:</td>
                                                <td className="px-3 py-2 font-bold">₦{orderTotal.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {/* Add Item Form */}
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-600 mb-1">Product</label>
                                    <select
                                        value={newItem.recipeId}
                                        onChange={(e) => setNewItem({ ...newItem, recipeId: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="">Select...</option>
                                        {recipes.map(r => (
                                            <option key={r.id} value={r.id}>{r.productCode} - {r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-20">
                                    <label className="block text-sm text-gray-600 mb-1">Qty (m³)</label>
                                    <input
                                        type="number"
                                        value={newItem.cubicMeters}
                                        onChange={(e) => setNewItem({ ...newItem, cubicMeters: e.target.value })}
                                        step="0.5"
                                        min="0"
                                        className="w-full border rounded-lg px-2 py-2 text-sm"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-sm text-gray-600 mb-1">Price/m³</label>
                                    <input
                                        type="number"
                                        value={newItem.unitPrice}
                                        onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                                        step="100"
                                        min="0"
                                        className="w-full border rounded-lg px-2 py-2 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateOrderAndAddItem}
                                    disabled={isPending}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                                >
                                    Add
                                </button>
                            </div>

                            <button
                                type="button"
                                className="text-emerald-600 text-sm hover:underline"
                            >
                                + Add Another Item
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    {step === 1 ? (
                        <button
                            onClick={handleNextStep}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
                        >
                            Next: Add Items <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleDone}
                            disabled={isPending || lineItems.length === 0}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ==================== ORDER DETAIL MODAL ====================

function OrderDetailModal({
    order,
    recipes,
    clients,
    canManage,
    canApprove,
    onClose,
    onRefresh
}: {
    order: Order
    recipes: { id: string; productCode: string; name: string }[]
    clients: { id: string; code: string; name: string }[]
    canManage: boolean
    canApprove: boolean
    onClose: () => void
    onRefresh: () => void
}) {
    const [activeTab, setActiveTab] = useState<'details' | 'items' | 'payments' | 'schedule'>('details')
    const [isPending, startTransition] = useTransition()
    const [showRecordPayment, setShowRecordPayment] = useState(false)
    const [orderData, setOrderData] = useState(order)

    const loadOrderDetails = async () => {
        try {
            const fullOrder = await getOrder(order.id)
            setOrderData(fullOrder as any)
        } catch (e) { }
    }

    useEffect(() => {
        loadOrderDetails()
    }, [])

    const handleSubmitOrder = () => {
        startTransition(async () => {
            try {
                await submitOrder(order.id)
                loadOrderDetails()
                onRefresh()
            } catch (e) { }
        })
    }

    const handleCancelOrder = () => {
        if (!confirm('Are you sure you want to cancel this order?')) return
        startTransition(async () => {
            try {
                await cancelOrder(order.id, 'Cancelled by user')
                loadOrderDetails()
                onRefresh()
            } catch (e) { }
        })
    }

    const handleRecordPayment = (formData: FormData) => {
        formData.append('orderId', order.id)
        startTransition(async () => {
            try {
                await recordPayment(formData)
                setShowRecordPayment(false)
                loadOrderDetails()
                onRefresh()
            } catch (e) { }
        })
    }

    const paidPercent = orderData.totalAmount > 0 ? (orderData.amountPaid / orderData.totalAmount) * 100 : 0
    const outstanding = orderData.totalAmount - orderData.amountPaid

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-gray-500'
            case 'Pending': return 'bg-yellow-500'
            case 'Active': return 'bg-green-500'
            case 'Fulfilled': return 'bg-blue-500'
            case 'Closed': return 'bg-purple-500'
            case 'Cancelled': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-emerald-600 text-white p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-sm opacity-80">{orderData.orderNumber}</div>
                                <div className="text-xl font-semibold">{orderData.client.name}</div>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(orderData.status)} text-white`}>
                                    {orderData.status}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    {[
                        { key: 'details', label: 'Details', icon: FileText },
                        { key: 'items', label: 'Line Items', icon: Package },
                        { key: 'payments', label: 'Payments', icon: CreditCard },
                        { key: 'schedule', label: 'Payment Schedule', icon: Calendar }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'details' && (
                        <DetailsTab
                            order={orderData}
                            paidPercent={paidPercent}
                            outstanding={outstanding}
                            canManage={canManage}
                            canApprove={canApprove}
                            isPending={isPending}
                            onSubmit={handleSubmitOrder}
                            onCancel={handleCancelOrder}
                        />
                    )}

                    {activeTab === 'items' && (
                        <LineItemsTab order={orderData} />
                    )}

                    {activeTab === 'payments' && (
                        <PaymentsTab
                            order={orderData}
                            canManage={canManage}
                            showRecordPayment={showRecordPayment}
                            setShowRecordPayment={setShowRecordPayment}
                            onRecordPayment={handleRecordPayment}
                            isPending={isPending}
                            outstanding={outstanding}
                        />
                    )}

                    {activeTab === 'schedule' && (
                        <PaymentScheduleTab
                            order={orderData}
                            canManage={canManage}
                            onRefresh={loadOrderDetails}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==================== DETAILS TAB ====================

function DetailsTab({
    order,
    paidPercent,
    outstanding,
    canManage,
    canApprove,
    isPending,
    onSubmit,
    onCancel
}: {
    order: Order
    paidPercent: number
    outstanding: number
    canManage: boolean
    canApprove: boolean
    isPending: boolean
    onSubmit: () => void
    onCancel: () => void
}) {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity flex items-start justify-end">
                        <span className="text-5xl font-bold text-emerald-600 leading-none">₦</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-gray-900">₦{order.totalAmount.toLocaleString()}</div>
                    <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-full" />
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Paid ({paidPercent.toFixed(0)}%)</div>
                    <div className="text-2xl font-bold text-gray-900">₦{order.amountPaid.toLocaleString()}</div>
                    <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(paidPercent, 100)}%` }} />
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle className="w-12 h-12 text-orange-600" />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">Outstanding</div>
                    <div className="text-2xl font-bold text-gray-900">₦{outstanding.toLocaleString()}</div>
                    <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.max(0, 100 - paidPercent)}%` }} />
                    </div>
                </div>
            </div>

            {/* Payment Progress */}
            {/* Payment Progress */}
            {/* Payment Progress */}
            <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                    <span className="text-sm font-medium text-gray-900">{paidPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        style={{ width: `${Math.min(paidPercent, 100)}%` }}
                    />
                </div>
                <div className="flex justify-center items-center text-xs text-gray-500">
                    <span>Activation Threshold: {(order.activationThreshold > 1 ? order.activationThreshold : order.activationThreshold * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Building2 className="w-4 h-4" />
                        Client Information
                    </div>
                    <div className="font-medium text-gray-800">{order.client.name}</div>
                    <div className="text-sm text-gray-600">Code: {order.client.code}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                        <Calendar className="w-4 h-4" />
                        Dates
                    </div>
                    <div className="text-sm text-gray-600">
                        <span className="text-gray-500">Order Date:</span> {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                    {order.requiredDate && (
                        <div className="text-sm text-gray-600 mt-1">
                            <span className="text-gray-500">Required:</span> {new Date(order.requiredDate).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div>
                <div className="text-sm text-gray-500 mb-2">Actions</div>
                <div className="flex gap-2">
                    {canManage && order.status === 'Draft' && order.lineItems?.length > 0 && (
                        <button
                            onClick={onSubmit}
                            disabled={isPending}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            <ChevronRight className="w-4 h-4" />
                            Submit Order
                        </button>
                    )}
                    {canApprove && ['Draft', 'Pending'].includes(order.status) && order.amountPaid === 0 && (
                        <button
                            onClick={onCancel}
                            disabled={isPending}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ==================== LINE ITEMS TAB ====================

function LineItemsTab({ order }: { order: Order }) {
    const totalValue = order.lineItems?.reduce((sum, item) => sum + item.lineTotal, 0) || 0
    const totalVolume = order.lineItems?.reduce((sum, item) => sum + Number(item.cubicMeters), 0) || 0
    const itemCount = order.lineItems?.length || 0

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Total Items</div>
                    <div className="text-2xl font-bold text-gray-800">{itemCount}</div>
                    <Package className="absolute top-4 right-4 w-8 h-8 text-emerald-100" />
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Total Volume</div>
                    <div className="text-2xl font-bold text-gray-800">{totalVolume.toFixed(2)} m³</div>
                    <Box className="absolute top-4 right-4 w-8 h-8 text-blue-100" />
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Total Value</div>
                    <div className="text-2xl font-bold text-gray-800">₦{totalValue.toLocaleString()}</div>
                    <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-3xl font-bold text-orange-100">₦</div>
                </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                {order.lineItems?.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty (m³)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price/m³</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivered</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.lineItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-800">{item.recipe?.productCode || item.productType.split(' - ')[0]}</div>
                                        <div className="text-xs text-gray-500">{item.recipe?.name || item.productType.split(' - ')[1]}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.cubicMeters}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">₦{item.unitPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">₦{item.lineTotal.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.deliveredQty} m³</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${item.status === 'Fulfilled' ? 'bg-green-50 text-green-700 border-green-100' :
                                            item.status === 'Partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-100">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-700">Total:</td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-800">₦{totalValue.toLocaleString()}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No line items yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ==================== PAYMENTS TAB ====================

function PaymentsTab({
    order,
    canManage,
    showRecordPayment,
    setShowRecordPayment,
    onRecordPayment,
    isPending,
    outstanding
}: {
    order: Order
    canManage: boolean
    showRecordPayment: boolean
    setShowRecordPayment: (show: boolean) => void
    onRecordPayment: (formData: FormData) => void
    isPending: boolean
    outstanding: number
}) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onRecordPayment(new FormData(e.currentTarget))
    }

    const lastPayment = order.payments && order.payments.length > 0
        ? order.payments[order.payments.length - 1]
        : null

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Amount Paid</div>
                    <div className="text-2xl font-bold text-gray-800">₦{order.amountPaid.toLocaleString()}</div>
                    <CreditCard className="absolute top-4 right-4 w-8 h-8 text-blue-100" />
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Outstanding</div>
                    <div className="text-2xl font-bold text-gray-800">₦{outstanding.toLocaleString()}</div>
                    <AlertCircle className="absolute top-4 right-4 w-8 h-8 text-orange-100" />
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Last Payment</div>
                    <div className="text-lg font-bold text-gray-800">
                        {lastPayment ? `₦${lastPayment.amount.toLocaleString()}` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {lastPayment ? new Date(lastPayment.paymentDate).toLocaleDateString() : 'No payments'}
                    </div>
                    <Calendar className="absolute top-4 right-4 w-8 h-8 text-emerald-100" />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Payment History</h3>
                {canManage && !['Closed', 'Cancelled'].includes(order.status) && (
                    <button
                        onClick={() => setShowRecordPayment(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Record Payment
                    </button>
                )}
            </div>

            {showRecordPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden transform transition-all scale-100">
                        <button
                            onClick={() => setShowRecordPayment(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pb-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Record Payment</h3>
                            <p className="text-sm text-gray-500">Outstanding: ₦{outstanding.toLocaleString()}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₦) *</label>
                                <input
                                    type="number"
                                    name="amount"
                                    step="100"
                                    min="0"
                                    required
                                    placeholder="0.00"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                                <select name="paymentMethod" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-all">
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference Number</label>
                                <input
                                    type="text"
                                    name="referenceNumber"
                                    placeholder="Transaction reference"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                <textarea
                                    name="notes"
                                    rows={2}
                                    placeholder="Optional notes..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRecordPayment(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-sm shadow-emerald-200 transition-all"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                {order.payments?.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Received By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.payments.map(payment => (
                                <tr key={payment.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{payment.paymentMethod}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{payment.referenceNumber || '-'}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">₦{payment.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${payment.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' :
                                            payment.status === 'Bounced' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{payment.receivedBy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : !showRecordPayment && (
                    <div className="text-center py-12 text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No payments recorded yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ==================== PAYMENT SCHEDULE TAB ====================

function PaymentScheduleTab({
    order,
    canManage,
    onRefresh
}: {
    order: Order
    canManage: boolean
    onRefresh: () => void
}) {
    const [isPending, startTransition] = useTransition()
    const [newItem, setNewItem] = useState({ dueDate: '', amount: '', description: '' })
    const [error, setError] = useState('')

    const scheduleItems = order.paymentSchedule || []
    const scheduleTotal = scheduleItems.reduce((sum, item) => sum + item.amount, 0)

    // Remaining to schedule should be based on Outstanding amount (Order Total - Amount Paid)
    const outstanding = order.totalAmount - order.amountPaid
    const remainingToSchedule = Math.max(0, outstanding - scheduleTotal)

    const handleAddItem = () => {
        if (!newItem.dueDate || !newItem.amount) {
            setError('Due date and amount are required')
            return
        }

        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append('orderId', order.id)
                formData.append('dueDate', newItem.dueDate)
                formData.append('amount', newItem.amount)
                if (newItem.description) formData.append('description', newItem.description)

                await addPaymentScheduleItem(formData)
                setNewItem({ dueDate: '', amount: '', description: '' })
                setError('')
                onRefresh()
            } catch (e: any) {
                setError(e.message || 'Failed to add item')
            }
        })
    }

    const handleRemoveItem = (itemId: string) => {
        startTransition(async () => {
            try {
                await removePaymentScheduleItem(itemId)
                onRefresh()
            } catch (e) { }
        })
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Scheduled Total</div>
                    <div className="text-2xl font-bold text-gray-800">₦{scheduleTotal.toLocaleString()}</div>
                    <Calendar className="absolute top-4 right-4 w-8 h-8 text-blue-100" />
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Order Total</div>
                    <div className="text-2xl font-bold text-gray-800">₦{order.totalAmount.toLocaleString()}</div>
                    <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-3xl font-bold text-emerald-100">₦</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="text-sm text-gray-600 mb-1">Remaining to Schedule</div>
                    <div className="text-2xl font-bold text-gray-800">₦{remainingToSchedule.toLocaleString()}</div>
                    <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min((remainingToSchedule / order.totalAmount) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-gray-800">Installments</h3>
                    <p className="text-sm text-gray-500">Manage payment milestones</p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            {/* Add Installment Form */}
            {canManage && (
                <div className="bg-gray-50 border rounded-xl p-4 shadow-sm">
                    <div className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        Add New Installment
                    </div>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={newItem.dueDate}
                                onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₦)</label>
                            <input
                                type="number"
                                value={newItem.amount}
                                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                                step="100"
                                min="0"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex-[1.5]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                            <input
                                type="text"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="e.g., 30% Deposit"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <button
                            onClick={handleAddItem}
                            disabled={isPending}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium h-[38px]"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Schedule Table */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                {scheduleItems.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase border-b">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Due Date</th>
                                <th className="px-6 py-3 font-semibold">Description</th>
                                <th className="px-6 py-3 font-semibold">Amount</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                {canManage && <th className="px-6 py-3 font-semibold"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {scheduleItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 text-gray-800">{new Date(item.dueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.description || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">₦{item.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    {canManage && (
                                        <td className="px-6 py-4 text-right">
                                            {item.status !== 'Paid' && (
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    disabled={isPending}
                                                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t">
                            <tr>
                                <td colSpan={2} className="px-6 py-4 text-right font-medium text-gray-700">Schedule Total:</td>
                                <td className="px-6 py-4 font-bold text-gray-800">₦{scheduleTotal.toLocaleString()}</td>
                                <td colSpan={canManage ? 2 : 1}></td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No payment schedule defined</p>
                        <p className="text-sm mt-1">Add installments above to create a payment plan</p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 leading-relaxed">
                    <span className="font-semibold block mb-1">How it works</span>
                    When payments are recorded, they are automatically matched to pending schedule items in order of due date. This helps track if the client is following the agreed payment plan.
                </p>
            </div>
        </div>
    )
}
