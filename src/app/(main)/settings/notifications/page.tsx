import NotificationSettings from '@/components/notifications/NotificationSettings'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function NotificationSettingsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    return <NotificationSettings />
}
