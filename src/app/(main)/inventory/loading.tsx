export default function InventoryLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 w-56 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-72 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg" />
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="h-10 w-64 bg-gray-200 rounded" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="h-5 w-5 bg-gray-200 rounded" />
                            <div className="h-4 w-48 bg-gray-200 rounded" />
                            <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
