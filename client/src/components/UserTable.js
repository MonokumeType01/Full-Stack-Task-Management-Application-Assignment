import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function UserTable({ users, onTaskSelected, isAdminOrManager }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("title");
    const [sortOrder, setSortOrder] = useState("asc");
    const [activeTab, setActiveTab] = useState("users");

    const filteredUsers = users.filter((user) => {
      const isUser = user.roleName === "User";
      const isManagerOrAdmin = user.roleName === "Manager" || user.roleName === "Admin";
      return (
        (activeTab === "users" && isUser) ||
        (activeTab === "managers" && isManagerOrAdmin)
      );
    }).filter((user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      const isNumeric = !isNaN(valA) && !isNaN(valB);
      if (isNumeric) {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const getSortIndicator = (column) => {
        return sortBy === column ? (sortOrder === "asc" ? "↑" : "↓") : "";
    };

    const handleCreateNewUser =()=>{
      onTaskSelected("create-user",null)
    }

    const handleDeleteUser =(user)=>{
      onTaskSelected("delete-user",user)
    }


  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">User Tasks</h2>
        <div className="flex items-center gap-2">
          {isAdminOrManager &&(
            <button
                onClick={handleCreateNewUser}
                className="text-green-600 font-bold text-xl hover:text-green-800"
                title="Create new users"
              >
                <Plus />
              </button>)
          }
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 border rounded-l ${activeTab === "users" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("managers")}
          className={`px-4 py-2 border rounded-r ${activeTab === "managers" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Managers / Admins
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("username")}>
                Username {getSortIndicator("username")}
              </th>
              <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("firstName")}>
                Name {getSortIndicator("firstName")}
              </th>
              <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("roleName")}>
                Role {getSortIndicator("roleName")}
              </th>

              {activeTab === "users" ? (
                <>
                  <th className="py-2 px-4">Assigned Total</th>
                  <th className="py-2 px-4">Not Started</th>
                  <th className="py-2 px-4">In Progress</th>
                  <th className="py-2 px-4">Pending Check</th>
                  <th className="py-2 px-4">Completed</th>
                  <th className="py-2 px-4">Overdue</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-4">Created Total</th>
                  <th className="py-2 px-4">Assigned Total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onTaskSelected("view-user", user)}>
                <td className="py-2 px-4">{user.username}</td>
                <td className="py-2 px-4">{user.lastName} {user.firstName}</td>
                <td className="py-2 px-4">{user.roleName}</td>

                {activeTab === "users" ? (
                  <>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.total ?? 0}</td>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.notStarted ?? 0}</td>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.inProgress ?? 0}</td>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.pendingCheck ?? 0}</td>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.completed ?? 0}</td>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.overdue ?? 0}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4">{user.taskCount?.created?.total ?? 0}</td>
                    <td className="py-2 px-4">{user.taskCount?.assigned?.total ?? 0}</td>
                  </>
                )}

                <td className="py-2 px-4">
                  {isAdminOrManager && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                      className="text-red-600 hover:text-red-800 font-semibold"
                      title="Delete user"
                    >
                      Delete
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
