import { useState, useEffect } from "react";
import { ROLES } from "../utils/constants";

export default function TaskDetailsModal({
  task = {},
  userList = [],
  userRole,
  isOpen,
  onClose,
  onSaveTask,
  mode, // "view", "edit", or "create"
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [priority, setPriority] = useState("Low");
  const [dueDate, setDueDate] = useState(""); 
  const [assignedToId, setAssignedToId] = useState(""); 
  const [timeTakenMinutes, setTimeTakenMinutes] = useState("");

  const isViewMode = mode === "view";

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "Not Started");
      setPriority(task.priority || "Low");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : ""); // Format for input[type=date]
      setAssignedToId(task.assignedToId || "");
      setTimeTakenMinutes(task.timeTakenMinutes?.toString() || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("Not Started");
      setPriority("Low");
      setDueDate("");
      setAssignedToId("");
    }
  }, [task]);

  const handleSave = () => {
    const newTask = {
      ...task,
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null, // Convert to ISO format
      assignedToId: assignedToId || null, // Send null if empty
      timeTakenMinutes: timeTakenMinutes ? parseInt(timeTakenMinutes) : undefined,
    };
    onSaveTask(newTask);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {isViewMode ? "Task Details" : task?.id ? "Edit Task" : "Create Task"}
          </h2>

          {userRole === ROLES.USER && task?.status === "In Progress" && (
            <button
              onClick={() => {
                const updatedTask = { ...task, status: "Pending Check" };
                onSaveTask(updatedTask);
                onClose();
              }}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Finish Task 
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border w-full p-2 rounded"
              placeholder="Enter title"
              disabled={isViewMode}
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border w-full p-2 rounded"
              placeholder="Enter description"
              disabled={isViewMode}
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border w-full p-2 rounded"
              disabled={isViewMode}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Check">Pending Check</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="border w-full p-2 rounded"
              disabled={isViewMode}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border w-full p-2 rounded"
              disabled={isViewMode}
            />
          </div>

          {userRole !== ROLES.USER && (
            <div>
              <label className="text-sm text-gray-700">Assign To</label>
              <select
                value={assignedToId || ""}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="border w-full p-2 rounded"
                disabled={isViewMode}
              >
                <option value="">Unassigned</option>
                {userList.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {userRole !== ROLES.USER && task?.status === "Pending Check" && (
            <div>
              <label className="text-sm text-gray-700">Time Taken (in minutes)</label>
              <input
                type="number"
                min={0}
                value={timeTakenMinutes}
                onChange={(e) => setTimeTakenMinutes(e.target.value)}
                className="border w-full p-2 rounded"
                placeholder="Enter time taken"
                disabled={isViewMode}
              />
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>

          {!isViewMode && (
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {task?.id ? "Save" : "Create"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
