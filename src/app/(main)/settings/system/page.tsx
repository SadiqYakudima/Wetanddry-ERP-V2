import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import { getSystemSettings } from '@/lib/actions/settings'
import SystemSettingsClient from '@/components/settings/SystemSettingsClient'

export default async function SystemSettingsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    if (!hasPermission(session.user.role || '', 'manage_system_settings')) {
        redirect('/settings/account')
    }

    const settings = await getSystemSettings()

    return <SystemSettingsClient settings={settings} />
}
