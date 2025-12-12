export default function FuelLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
                        <div className="h-10 w-24 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
                <div className="divide-y">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="p-4 flex gap-4">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
