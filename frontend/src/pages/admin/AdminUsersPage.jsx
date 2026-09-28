import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import AdminAccountTable from '../../components/admin/AdminAccountTable.jsx';
import AdminAccountModal from '../../components/admin/AdminAccountModal.jsx';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers.js';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const {
    isLoading,
    users,
    currentPageUsers,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    loadUsersFromDb,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    currentUserId,
  } = useAdminUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    loadUsersFromDb();
  }, [loadUsersFromDb]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setModalMode('edit');
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleSubmit = async (payload, mode) => {
    if (mode === 'create') {
      const response = await handleCreateAccount(payload);
      return Boolean(response);
    }

    if (selectedAccount?.id) {
      const response = await handleUpdateAccount(selectedAccount.id, payload);
      return Boolean(response);
    }

    return false;
  };

  const handleDelete = async (account) => {
    if (Number(account.id) === Number(currentUserId)) {
      return;
    }

    const confirmed = window.confirm(`Delete account "${account.username}"?`);
    if (!confirmed) return;

    await handleDeleteAccount(account.id);
  };

  return (
    <div className="dashboard-page admin-dashboard-page">
      <PageHeader
        pageTitle="Account Management"
        backButton={
          <button type="button" className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        }
        actionButton={
          <button type="button" className="btn-primary btn-pill" onClick={openCreateModal}>
            + Add Account
          </button>
        }
      />

      <main className="dashboard-main">
        <div className="table-controls">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search account"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="table-container">
          {isLoading ? (
            <div className="table-empty-state">
              <p>Loading accounts...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="table-empty-state">
              <div className="empty-icon">👥</div>
              <p>No accounts found.</p>
            </div>
          ) : (
            <AdminAccountTable
              users={currentPageUsers}
              onEdit={openEditModal}
              onDelete={handleDelete}
              currentUserId={currentUserId}
            />
          )}
        </div>

        {!isLoading && users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={(currentPage - 1) * 10}
            totalItems={users.length}
            pageSize={10}
            onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          />
        )}
      </main>

      <AdminAccountModal
        isOpen={isModalOpen}
        mode={modalMode}
        account={selectedAccount}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
