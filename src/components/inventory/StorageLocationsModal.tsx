'use client'

import { useState, useTransition } from 'react'
import {
    X, Plus, Edit, Trash2, Save, Loader2, Warehouse, Database,
    Container, MapPin, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    createStorageLocation,
    updateStorageLocation,
    deleteStorageLocation
} from '@/lib/actions/inventory'

interface StorageLocation {
    id: string
    name: string
    type: string
    description: string | null
}

interface StorageLocationsModalProps {
    locations: StorageLocation[]
    onClose: () => void
}

const LOCATION_TYPES = ['Warehouse', 'Silo', 'Container', 'Shelf', 'Yard', 'Cold Storage']

function getLocationIcon(type: string) {
    switch (type) {
        case 'Silo': return <Database size={18} className="text-blue-600" />
        case 'Container': return <Container size={18} className="text-teal-600" />
        case 'Warehouse': return <Warehouse size={18} className="text-amber-600" />
        default: return <MapPin size={18} className="text-gray-600" />
    }
}

function getLocationColor(type: string) {
    switch (type) {
        case 'Silo': return 'bg-blue-50 border-blue-200'
        case 'Container': return 'bg-teal-50 border-teal-200'
        case 'Warehouse': return 'bg-amber-50 border-amber-200'
        default: return 'bg-gray-50 border-gray-200'
    }
}

export default function StorageLocationsModal({ locations, onClose }: StorageLocationsModalProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await createStorageLocation(formData)
                setShowAddForm(false)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create location')
            }
        })
    }

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
        e.preventDefault()
        setError(null)
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            try {
                await updateStorageLocation(id, formData)
                setEditingId(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update location')
            }
        })
    }

    const handleDelete = (id: string) => {
        setError(null)
        setDeletingId(id)

        startTransition(async () => {
            try {
                await deleteStorageLocation(id)
                setDeletingId(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete location')
                setDeletingId(null)
            }
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Warehouse size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Storage Locations</h2>
                            <p className="text-sm text-gray-500">{locations.length} location{locations.length !== 1 ? 's' : ''} configured</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!showAddForm && (
                            <button
                                onClick={() => { setShowAddForm(true); setEditingId(null) }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-all"
                            >
                                <Plus size={16} />
                                Add Location
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Add Form */}
                    {showAddForm && (
                        <form onSubmit={handleCreate} className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-4 space-y-4">
                            <h3 className="font-semibold text-gray-900 text-sm">New Storage Location</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Location name"
                                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <select
                                    name="type"
                                    required
                                    className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select type</option>
                                    {LOCATION_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <input
                                name="description"
                                type="text"
                                placeholder="Description (optional)"
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddForm(false); setError(null) }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-all"
                                >
                                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Create
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Locations List */}
                    {locations.length === 0 && !showAddForm ? (
                        <div className="text-center py-12">
                            <Warehouse className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500 font-medium">No storage locations configured</p>
                            <p className="text-gray-400 text-sm mt-1">Add your first location to get started</p>
                        </div>
                    ) : (
                        locations.map(loc => (
                            <div key={loc.id} className={cn("border rounded-xl p-4 transition-all", getLocationColor(loc.type))}>
                                {editingId === loc.id ? (
                                    <form onSubmit={(e) => handleUpdate(e, loc.id)} className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                defaultValue={loc.name}
                                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <select
                                                name="type"
                                                required
                                                defaultValue={loc.type}
                                                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {LOCATION_TYPES.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input
                                            name="description"
                                            type="text"
                                            defaultValue={loc.description || ''}
                                            placeholder="Description (optional)"
                                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setEditingId(null); setError(null) }}
                                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white/60 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isPending}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                                            >
                                                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getLocationIcon(loc.type)}
                                            <div>
                                                <div className="font-semibold text-gray-900">{loc.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 bg-white/80 rounded text-xs font-medium">{loc.type}</span>
                                                    {loc.description && <span>{loc.description}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => { setEditingId(loc.id); setShowAddForm(false); setError(null) }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white/60 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete "${loc.name}"? This cannot be undone.`)) {
                                                        handleDelete(loc.id)
                                                    }
                                                }}
                                                disabled={isPending && deletingId === loc.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-white/60 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {isPending && deletingId === loc.id
                                                    ? <Loader2 size={16} className="animate-spin" />
                                                    : <Trash2 size={16} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
