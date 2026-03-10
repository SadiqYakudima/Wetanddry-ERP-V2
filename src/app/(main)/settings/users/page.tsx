import { getUsers } from '@/lib/actions/users';
import UserList from '@/app/(main)/users/UserList';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

export default async function SettingsUsersPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    if (!hasPermission(session.user.role || '', 'manage_users')) {
        redirect('/settings/account');
    }

    const result = await getUsers();
    const users = result.success ? result.data || [] : [];

    return <UserList initialUsers={users} />;
}
