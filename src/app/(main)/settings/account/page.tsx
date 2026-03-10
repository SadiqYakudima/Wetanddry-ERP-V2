import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AccountSettingsClient from '@/components/settings/AccountSettingsClient'

export default async function AccountSettingsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    return <AccountSettingsClient user={session.user} />
}
