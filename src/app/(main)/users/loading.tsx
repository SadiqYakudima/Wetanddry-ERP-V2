export default function UsersLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-64 bg-gray-200 rounded" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>

            {/* User cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full" />
                            <div>
                                <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                                <div className="h-4 w-40 bg-gray-200 rounded" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="h-6 w-20 bg-gray-200 rounded-full" />
                            <div className="h-8 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
