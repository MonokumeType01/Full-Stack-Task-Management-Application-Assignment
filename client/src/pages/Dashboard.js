import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import CounterCard from '../components/CounterCard';
import { useNavigate } from "react-router-dom";
import TaskTable from '../components/TaskTable';
import TaskDetailsModal from "../components/TaskDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import axios from 'axios';

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
    try{
      await axios.post(`${apiUrl}/auth/logout`, null,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }catch(err){
      console.error("Logout failed:", err);
      throw err; 
    }

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
    try{
      await axios.delete(`${apiUrl}/tasks/${taskToDelete.id}`,{
        headers: { Authorization: `Bearer ${token}` },
      });
     
    }catch(err){
      console.log("Error Deleting Task:", err);
      throw err; 
    }

    console.log("Deleted:", taskToDelete.id);
    setTasks(tasks.filter(t => t.id !== taskToDelete.id));
    
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
      if (taskData.id) {
        // Update existing task
        
          await axios.patch(`${apiUrl}/tasks/${taskData.id}`, taskData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("Task updated successfully");
        
      } else {
        // Create new task
        const newTask = {
          ...taskData,
          createdById: userInfo.userId,
        };
          await axios.post(`${apiUrl}/tasks`, newTask,{
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
          console.log("Task created successfully");
        
      }

      // Refresh task list 
      const updatedTasks = await axios.get(`${apiUrl}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.data);
      setTasks(updatedTasks);

      setModalOpen(false);
    } catch (error) {
      console.error("Error updating/creating task:", error);
      alert(error.message);
    }
  };

  

  useEffect(() => {

    async function fetchUsers() {
      const token = localStorage.getItem("token"); 
      try{
        const res = await axios.get(`${apiUrl}/users/role?roleName=User`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUserList(res.data); 
      }catch(err){
        console.error("Error fetching users:", err);
        alert("Failed to load users. Please try again later.");
      }
      
    }


    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      try{
        const res = await axios.get(`${apiUrl}/tasks`, {
        headers: { Authorization: `Bearer ${token}`},
      });
        setTasks(res.data);
      }catch(err){
        console.error("Error fetching tasks:", err);
        alert("Failed to load tasks. Please try again later.");
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
