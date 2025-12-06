import LoginForm from '@/components/auth/LoginForm';
import { Droplet } from 'lucide-react';

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                        <Droplet className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-1">Sign in to Wet & Dry EMS</p>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
