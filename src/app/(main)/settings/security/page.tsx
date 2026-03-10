import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import { getSystemSettings } from '@/lib/actions/settings'
import SecuritySettingsClient from '@/components/settings/SecuritySettingsClient'

export default async function SecuritySettingsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    if (!hasPermission(session.user.role || '', 'manage_system_settings')) {
        redirect('/settings/account')
    }

    const settings = await getSystemSettings()

    return <SecuritySettingsClient settings={settings} />
}
