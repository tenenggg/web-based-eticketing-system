export default function AdminAccountTable({ users, onEdit, onDelete, currentUserId }) {
  return (
    <table className="data-table account-table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Username</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => {
          const isCurrentUser = Number(user.id) === Number(currentUserId);
          const counter = index + 1;

          return (
            <tr key={user.id} className="account-row">
              <td className="account-counter">{counter}</td>
              <td className="account-username">{user.username}</td>
              <td>
                <span className={`ticket-badge ${user.role === 'admin' ? 'status-inprogress' : 'status-open'}`}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button type="button" className="btn-secondary" onClick={() => onEdit(user)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-danger"
                    onClick={() => onDelete(user)}
                    disabled={isCurrentUser}
                    title={isCurrentUser ? 'You cannot delete your own account' : 'Delete account'}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
