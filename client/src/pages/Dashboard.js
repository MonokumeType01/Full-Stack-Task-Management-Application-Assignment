import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import CounterCard from '../components/CounterCard';
import { useNavigate } from "react-router-dom";
import TaskTable from '../components/TaskTable';
import TaskDetailsModal from "../components/TaskDetailsModal";
import ConfirmModal from "../components/ConfirmModal";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [userList, setUserList] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mode, setMode] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  const navigate = useNavigate();

  const logout = async () => {
    const token = localStorage.getItem("token"); 
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getUserInfo = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo({
          userId: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
          role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
          username: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
        });
      } catch (err) {
        console.error("Invalid token:", err);
        setUserInfo(null);
      }
    }
  };

  const handleTaskType = (modeType, task) => {
    if (modeType!=="delete"){
      // If not delete
      setMode(modeType);
      setSelectedTask(task);
      setModalOpen(true);
    }else{
      handleDeleteTask(task);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (task) => {
    setTaskToDelete(task);
    setConfirmModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiUrl}/tasks/${taskToDelete.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      console.log("Deleted:", taskToDelete.id);
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
    }
    setConfirmModalOpen(false);
    setTaskToDelete(null);
  };

  const cancelDelete = () => {
    setConfirmModalOpen(false);
    setTaskToDelete(null);
  };

  const handleSaveTask = async (taskData) => {
    const token = localStorage.getItem("token");

    if (!userInfo) return alert("User info not available. Please log in again.");

    try {
      let response;
      if (taskData.id) {
        // Update existing task

        response = await fetch(`${apiUrl}/tasks/${taskData.id}`, {
          method: "PATCH", 
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error("Failed to update task");
        console.log("Task updated successfully");
      } else {
        // Create new task
        const newTask = {
          ...taskData,
          createdById: userInfo.userId,
        };

        response = await fetch(`${apiUrl}/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTask),
        });
        if (!response.ok) throw new Error("Failed to create task");
        console.log("Task created successfully");
      }

      // Refresh task list 
      const updatedTasks = await fetch(`${apiUrl}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json());
      setTasks(updatedTasks);

      setModalOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
      alert(error.message);
    }
  };

  

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch(`${apiUrl}/users/role?roleName=User`);
      const data = await res.json();
      setUserList(data); 
    }


    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    };

    getUserInfo();
    fetchUsers();
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard {userInfo?.role}</h1>

        <div className="flex gap-4">
          {(userInfo?.role === "Admin" || userInfo?.role === "Manager") && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => handleTaskType("create", null)}
            >
              + New Task
            </button>
          )}
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Top Half */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Left: Stats */}
        <div className="bg-white rounded-2xl shadow-md p-6">
           <CounterCard num={tasks.length} title={"Task Left"} />
        </div>

        {/* Right: Placeholder */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-center text-gray-400 text-lg">
          Placeholder for future content
        </div>
      </div>

      {/* Bottom Half: Task Table */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <TaskTable 
        tasks={tasks} 
        userRole={userInfo?.role}
        onTaskSelected={handleTaskType}
        />
      </div>

      {modalOpen && (
        <TaskDetailsModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
          userList={userList}
          onSaveTask={handleSaveTask}
          mode={mode}
        />
       )}


       <ConfirmModal
          isOpen={confirmModalOpen}
          title={`Delete task: ${tasks.title}`}
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={confirmDeleteTask}
          onCancel={cancelDelete}
        />
    </div>

    
  );
}
