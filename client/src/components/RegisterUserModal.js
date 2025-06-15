import React from 'react';
import { ROLES } from '../utils/constants';

export default function RegisterUserModal({
  isOpen,
  onClose,
  newUser,
  onChange,
  onSubmit,
  userRole,
  onEdit,
}) {
  if (!isOpen) return null;

  const isEdit = !!newUser?.id && typeof onEdit === 'function';

  const handleAction = () => {
    isEdit ? onEdit() : onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit User' : 'Register New User'}
        </h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={newUser.username}
            onChange={onChange}
            disabled={isEdit}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={newUser.firstName}
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={newUser.lastName}
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={newUser.password}
            onChange={onChange}
            className="border p-2 rounded"
          />
          <select
            name="roleId"
            value={newUser.roleId}
            onChange={onChange}
            className="border p-2 rounded"
          >
            {userRole === ROLES.ADMIN && (
              <option value="1">{ROLES.ADMIN}</option>
            )}
            <option value="2">{ROLES.USER}</option>
            <option value="3">{ROLES.MANAGER}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {isEdit ? 'Save' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
