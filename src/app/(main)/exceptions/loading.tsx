export default function ExceptionsLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
            {/* Header */}
            <div className="mb-6">
                <div className="h-8 w-52 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-72 bg-gray-200 rounded" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div>
                            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                            <div className="h-6 w-12 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form skeleton */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i}>
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                                <div className="h-10 w-full bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* List skeleton */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b">
                        <div className="h-6 w-36 bg-gray-200 rounded" />
                    </div>
                    <div className="divide-y">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4">
                                <div className="flex justify-between mb-2">
                                    <div className="h-5 w-32 bg-gray-200 rounded" />
                                    <div className="h-5 w-20 bg-gray-200 rounded" />
                                </div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
