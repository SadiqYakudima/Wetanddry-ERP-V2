export default function FinanceLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                        <div className="h-8 w-28 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 h-80">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                    <div className="h-full bg-gray-100 rounded" />
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200 h-80">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                    <div className="h-full bg-gray-100 rounded" />
                </div>
            </div>
        </div>
    )
}
