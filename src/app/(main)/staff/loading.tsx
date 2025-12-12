export default function StaffLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 w-40 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-56 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-36 bg-gray-200 rounded" />
            </div>

            {/* Search/filter */}
            <div className="flex gap-4 mb-6">
                <div className="h-10 w-64 bg-gray-200 rounded" />
                <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>

            {/* Staff table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1">
                                <div className="h-5 w-40 bg-gray-200 rounded mb-1" />
                                <div className="h-4 w-28 bg-gray-200 rounded" />
                            </div>
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-8 w-20 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
