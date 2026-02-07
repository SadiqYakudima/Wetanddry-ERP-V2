import React from 'react';
import { getExceptions, logException, resolveException } from '@/lib/actions/exceptions';
import { getTrucks } from '@/lib/actions/trucks';
import { getRecipes } from '@/lib/actions/production';
import { AlertOctagon, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

export default async function ExceptionsPage() {
    const [exceptions, trucks, recipes, session] = await Promise.all([
        getExceptions(),
        getTrucks(),
        getRecipes(),
        auth()
    ]);

    const canCreateException = session?.user?.role ? hasPermission(session.user.role, 'create_exception') : false;
    const canManageExceptions = session?.user?.role ? hasPermission(session.user.role, 'manage_exceptions') : false;

    const totalDumps = exceptions.filter(e => e.type === 'Dump').length;
    const totalDiverts = exceptions.filter(e => e.type === 'Divert').length;
    const unresolved = exceptions.filter(e => !e.resolved).length;

    return (
        <div className="space-y-8 w-full pb-10">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Exception Handling</h1>
                <p className="text-gray-500 mt-2 text-lg">Report and track production dumps and diverts across operations.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-red-50 rounded-xl text-red-600 ring-1 ring-red-100">
                            <XCircle size={28} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Dumps</div>
                            <div className="text-3xl font-bold text-gray-900 mt-1">{totalDumps}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-yellow-50 rounded-xl text-yellow-600 ring-1 ring-yellow-100">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Diverts</div>
                            <div className="text-3xl font-bold text-gray-900 mt-1">{totalDiverts}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-orange-50 rounded-xl text-orange-600 ring-1 ring-orange-100">
                            <AlertOctagon size={28} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unresolved Issues</div>
                            <div className="text-3xl font-bold text-gray-900 mt-1">{unresolved}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Report Form - Only shown to users with create_exception permission */}
                {canCreateException && (
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm sticky top-24 overflow-hidden">
                            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <AlertOctagon className="text-red-600" size={20} />
                                    Report Exception
                                </h2>
                            </div>

                            <div className="p-6">
                                <form action={logException} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Type
                                        </label>
                                        <select
                                            name="type"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                                            required
                                        >
                                            <option value="">Select Type...</option>
                                            <option value="Dump">Dump (Waste)</option>
                                            <option value="Divert">Divert (Re-routed)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Reason
                                        </label>
                                        <select
                                            name="reason"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                                            required
                                        >
                                            <option value="">Select Reason...</option>
                                            <option value="Bad Mix">Bad Mix Quality</option>
                                            <option value="Truck Breakdown">Truck Breakdown</option>
                                            <option value="Client Rejection">Client Rejection</option>
                                            <option value="Traffic Delay">Traffic Delay (Expired)</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Quantity (m³)
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="quantity"
                                                type="number"
                                                step="0.1"
                                                placeholder="e.g., 6.0"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Related Truck (Optional)
                                        </label>
                                        <select
                                            name="truckId"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                                        >
                                            <option value="">None</option>
                                            {trucks.map(truck => (
                                                <option key={truck.id} value={truck.id}>{truck.plateNumber}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Related Recipe (Optional)
                                        </label>
                                        <select
                                            name="recipeId"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                                        >
                                            <option value="">None</option>
                                            {recipes.map(recipe => (
                                                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Notes
                                        </label>
                                        <textarea
                                            name="notes"
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Additional details..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-lg shadow-red-100 active:scale-[0.98] transform duration-100"
                                    >
                                        Submit Report
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exception List */}
                <div className={canCreateException ? "lg:col-span-2" : "lg:col-span-3"}>
                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Exception History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {exceptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <div className="p-3 bg-gray-50 rounded-full mb-3">
                                                        <CheckCircle size={24} className="text-gray-300" />
                                                    </div>
                                                    <p className="text-base font-medium text-gray-900">No exceptions reported</p>
                                                    <p className="text-sm mt-1">Operations are running smoothly.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        exceptions.map((ex) => (
                                            <tr key={ex.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap font-medium">
                                                    {ex.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset",
                                                        ex.type === 'Dump'
                                                            ? "bg-red-50 text-red-700 ring-red-600/20"
                                                            : "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                                                    )}>
                                                        {ex.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-medium">{ex.reason}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <span className="font-medium text-gray-900">{ex.quantity}</span> {ex.unit}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {ex.resolved ? (
                                                        <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ring-green-600/20">
                                                            <CheckCircle size={14} /> Resolved
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ring-amber-600/20">
                                                            <AlertTriangle size={14} /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!ex.resolved && canManageExceptions && (
                                                        <form action={resolveException.bind(null, ex.id)}>
                                                            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
                                                                Mark Resolved
                                                            </button>
                                                        </form>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
