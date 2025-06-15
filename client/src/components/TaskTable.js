import TaskRow from './TaskRow';
import {ROLES} from "../utils/constants";
import { useState } from 'react';
import { Trash, Plus } from 'lucide-react';

export default function TaskTable({ tasks, onTaskSelected, userRole, selectedTaskIds, setSelectedTaskIds  }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("title");
    const [sortOrder, setSortOrder] = useState("asc");

    const isAdminOrManager = userRole !== ROLES.USER
    const isUser = userRole === ROLES.USER

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
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

    const toggleTaskSelection = (taskId) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTaskIds.length === filteredTasks.length) {
            setSelectedTaskIds([]);
        } else {
            setSelectedTaskIds(filteredTasks.map(t => t.id));
        }
    };

    const handleDelete = () => {
        onTaskSelected("delete", selectedTaskIds);
        console.log("Delete these tasks:", selectedTaskIds);
    };

    const handleCreateNewTask = () => {
        onTaskSelected("create", null);
    };


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Task List</h2>
        <div className="flex items-center gap-2">
          {isAdminOrManager &&(
            <button
                onClick={handleCreateNewTask}
                className="text-green-600 font-bold text-xl hover:text-green-800"
                title="Create new tasks"
              >
                <Plus />
              </button>)
          }
          {isAdminOrManager && selectedTaskIds.length > 0 && (
              <button
                onClick={handleDelete}
                className="text-red-600 font-bold text-xl hover:text-red-800"
                title="Delete selected tasks"
              >
                <Trash />
              </button>
            )}
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-600 border-b cursor-pointer">
                {isAdminOrManager && (
                    <th className="py-2 px-4">
                    <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedTaskIds.length === filteredTasks.length}
                    />
                    </th>
                )}
              <th className="py-2 px-4" onClick={() => handleSort("title")}>
                Task Name {getSortIndicator("title")}
              </th>
              <th className="py-2 px-4" onClick={() => handleSort("status")}>
                Status {getSortIndicator("status")}
              </th>
              <th className="py-2 px-4" onClick={() => handleSort("priority")}>
                Priority {getSortIndicator("priority")}
              </th>
              <th className="py-2 px-4">
                Suggested Priority
              </th>
              {isAdminOrManager && (
                <th className="py-2 px-4" onClick={() => handleSort("assignedToId")}>
                  Assignee {getSortIndicator("assignedToId")}
                </th>
              )}
              <th className="py-2 px-4" onClick={() => handleSort("dueDate")}>
                Due Date {getSortIndicator("dueDate")}
              </th>
              <th className="py-2 px-4" onClick={() => handleSort("createdAt")}>
                Created At {getSortIndicator("createdAt")}
              </th>
              <th className="py-2 px-4" onClick={() => handleSort("timeSpent")}>
                Time Spent {getSortIndicator("timeSpent")}
              </th>
              {isUser && (
                <th className="py-2 px-4">Actions</th>
                )}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, idx) => (
              <TaskRow 
                key={idx} 
                task={task} 
                userRole= {userRole}
                onTaskSelected={onTaskSelected}
                showCheckbox={isAdminOrManager}
                isChecked={selectedTaskIds.includes(task.id)}
                onCheckToggle={() => toggleTaskSelection(task.id)}/>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
