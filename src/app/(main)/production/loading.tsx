export default function ProductionLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 w-52 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-72 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-36 bg-gray-200 rounded" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg" />
                ))}
            </div>

            {/* Recipe cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                        <div className="space-y-3">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="flex justify-between">
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                    <div className="h-4 w-16 bg-gray-200 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
