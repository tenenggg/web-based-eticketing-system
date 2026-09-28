import { useCallback, useMemo, useState } from 'react';
import { createUserAccount, deleteUserAccount, fetchUsersFromDb, updateUserAccount } from '../../api/userApi.js';
import { useAuth } from '../useAuth.jsx';
import { useToast } from '../useToast.jsx';

const PAGE_SIZE = 10;

export function useAdminUsers() {
  const { currentUser, handleUnauthorized } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsersFromDb = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!silent) setIsLoading(true);

      try {
        const data = await fetchUsersFromDb(handleUnauthorized);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load accounts', error);
        if (!silent) showToast(error.message || 'Failed to load accounts', 'error');
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [handleUnauthorized, showToast]
  );

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const nextUsers = [...users].sort((a, b) => a.username.localeCompare(b.username));

    if (!query) return nextUsers;

    return nextUsers.filter((user) => user.username.toLowerCase().includes(query) || user.role.toLowerCase().includes(query));
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const currentPageUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCreateAccount = useCallback(
    async (payload) => {
      try {
        const result = await createUserAccount(payload.username, payload.password, payload.role, handleUnauthorized);
        showToast(result.message || 'Account created successfully', 'success');
        await loadUsersFromDb({ silent: false });
        setCurrentPage(1);
        return result;
      } catch (error) {
        showToast(error.message || 'Could not create account', 'error');
        return null;
      }
    },
    [handleUnauthorized, loadUsersFromDb, showToast]
  );

  const handleUpdateAccount = useCallback(
    async (userId, payload) => {
      try {
        const result = await updateUserAccount(userId, payload, handleUnauthorized);
        showToast(result.message || 'Account updated successfully', 'success');
        await loadUsersFromDb({ silent: false });
        return result;
      } catch (error) {
        showToast(error.message || 'Could not update account', 'error');
        return null;
      }
    },
    [handleUnauthorized, loadUsersFromDb, showToast]
  );

  const handleDeleteAccount = useCallback(
    async (userId) => {
      try {
        const result = await deleteUserAccount(userId, handleUnauthorized);
        showToast(result.message || 'Account deleted successfully', 'success');
        await loadUsersFromDb({ silent: false });
        return result;
      } catch (error) {
        showToast(error.message || 'Could not delete account', 'error');
        return null;
      }
    },
    [handleUnauthorized, loadUsersFromDb, showToast]
  );

  return {
    users: filteredUsers,
    currentPageUsers,
    currentPage: safePage,
    totalPages,
    isLoading,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    loadUsersFromDb,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    currentUserId: currentUser?.id,
  };
}
