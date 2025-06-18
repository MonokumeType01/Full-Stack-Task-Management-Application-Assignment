import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import CounterCard from '../components/CounterCard';
import { useNavigate } from "react-router-dom";
import TaskTable from '../components/TaskTable';
import UserTable from '../components/UserTable';
import TaskDetailsModal from "../components/TaskDetailsModal";
import {ROLES} from "../utils/constants";
import ConfirmModal from "../components/ConfirmModal";
import RegisterUserModal from '../components/RegisterUserModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { startSignalRConnection, stopSignalRConnection } from "../signalr";


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [userList, setUserList] = useState([]);
  const [allUserList, setAllUserList] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mode, setMode] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", firstName: "", lastName: "", password: "", roleId: "3" }); // default role: User
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  const token = localStorage.getItem("token");

  const apiUrl = process.env.REACT_APP_API_URL;
  const isAdmin = userInfo?.role === ROLES.ADMIN;
  const isManager = userInfo?.role === ROLES.MANAGER;
  const isUser = userInfo?.role === ROLES.USER;
  const isAdminOrManager = isAdmin || isManager;
  const filteredTasks = isUser ? 
    tasks.filter(task => task.assignedToId === userInfo.userId) : tasks;

  const navigate = useNavigate();

  const logout = async () => {
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
  

  const handleTaskType = (modeType, data) => {
    if (modeType === "delete") {
      handleDeleteTask(data);
    } else if (modeType === "pending") {
      handleUserCompleteTask(data);
    }else if (modeType === "in-progress") {
      handleUserStartTask(data);
    } else if (modeType ==="create-user"){
      setRegisterModalOpen(true)
    } else if (modeType ==="delete-user"){
      handleDeleteUser(data)
    } else if (modeType ==="view-user"){
      handleViewUser(data)
    } else {
      setMode(modeType);
      setSelectedTask(data);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleViewUser = (e) => {
    setNewUser(e);
    setRegisterModalOpen(true);
  };

  const handleRegisterUserSubmit = async () => {
    try {
      await axios.post(`${apiUrl}/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("User registered successfully!");
      setRegisterModalOpen(false);
      setNewUser({ username: "", firstName: "", lastName: "", password: "", roleId: "3" });
      await fetchUsers();
      await fetchAllUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to register user.");
    }
  };

  const handleUserEdit = async () => {
    try {
        const payload = {
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roleId: parseInt(newUser.roleId),
      };

      // Only include password if it's not empty
      if (newUser.password && newUser.password.trim() !== "") {
        payload.password = newUser.password;
      }

      await axios.patch(`${apiUrl}/users/${newUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("User updated successfully!");
      setRegisterModalOpen(false);
      setNewUser({ username: "", firstName: "", lastName: "", password: "", roleId: "3" });


      setAllUserList(prev =>
        prev.map(u => (u.id === newUser.id ? { ...u, ...payload } : u))
      );
      setUserList(prev =>
        prev.map(u => (u.id === newUser.id ? { ...u, ...payload } : u))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = (user) => {
    setConfirmTitle(`Delete user: ${user.firstName} ${user.lastName}`);
    setConfirmMessage("Are you sure you want to delete this user? This action cannot be undone.");
    setConfirmAction(() => async () => {
      try {
        await axios.delete(`${apiUrl}/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // remove from local state
        setAllUserList(prev => prev.filter(u => u.id !== user.id));
        setUserList(prev => prev.filter(u => u.id !== user.id));

        setConfirmModalOpen(false);
        alert("User deleted successfully.");
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user.");
      }
    });

    setConfirmModalOpen(true);
  };

  const clearSelection = () => setSelectedTaskIds([]);

  const handleDeleteTask = (taskOrTasks) => {
    const idsToDelete = Array.isArray(taskOrTasks) ? taskOrTasks : [taskOrTasks.id];

    const taskNames = tasks
      .filter(t => idsToDelete.includes(t.id))
      .map(t => t.title)
      .join(", ");

    setConfirmTitle(`Delete task${idsToDelete.length > 1 ? "s" : ""}${taskNames ? `: ${taskNames}` : ""}`);
    setConfirmMessage("Are you sure you want to delete this task? This action cannot be undone.");
    setConfirmAction(() => async () => {
      try {
        await Promise.all(
          idsToDelete.map(id =>
            axios.delete(`${apiUrl}/tasks/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        setTasks(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        clearSelection();
        setConfirmModalOpen(false);
      } catch (err) {
        console.error("Error deleting task(s):", err);
        alert("Failed to delete task(s).");
      }
    });
    setConfirmModalOpen(true);
  };

  const handleUserCompleteTask = (task) => {
    setConfirmTitle(`Have you complete task: ${task.title}?`);
    setConfirmMessage("Task status will be changed to 'Pending Check' upon confirmation.");
    setConfirmAction(() => async () => {
      try {
        await axios.patch(`${apiUrl}/tasks/${task.id}`, { status: "Pending Check" }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Refresh task list
        const res = await axios.get(`${apiUrl}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data);
        setConfirmModalOpen(false);
      } catch (err) {
        console.error("Error marking task complete:", err);
        alert("Failed to update task status.");
      }
    });
    setConfirmModalOpen(true);
  };

  const handleUserStartTask = (task) => {
    setConfirmTitle(`Starting task: ${task.title}?`);
    setConfirmMessage("Task status will be changed to 'In Progress' upon confirmation.");
    setConfirmAction(() => async () => {
      try {
        await axios.patch(`${apiUrl}/tasks/${task.id}`, { status: "In Progress" }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Refresh task list
        const res = await axios.get(`${apiUrl}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data);
        setConfirmModalOpen(false);
      } catch (err) {
        console.error("Error marking task complete:", err);
        alert("Failed to update task status.");
      }
    });
    setConfirmModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {

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

  const fetchTaskCountStatusSummary = async (userId) => {
    try {
      const res = await axios.get(`${apiUrl}/tasks/count/by-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      console.error(`Failed to fetch task summary for user ${userId}`, err);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
      };
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/users/role?roleName=User`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const users = res.data;

      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const taskCount = await fetchTaskCountStatusSummary(user.id);
          return { ...user, taskCount };
        })
      );
      setUserList(usersWithCounts); 
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to load users. Please try again later.");
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/users`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const allUsers = res.data;

      const allUsersWithCounts = await Promise.all(
        allUsers.map(async (user) => {
          const taskCount = await fetchTaskCountStatusSummary(user.id);
          return { ...user, taskCount };
        })
      );
      setAllUserList(allUsersWithCounts); 
    } catch (err) {
      console.error("Error fetching all users:", err);
      alert("Failed to load all users. Please try again later.");
    }
  };

  useEffect(() => {

    async function fetchTasks () {
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

    fetchTasks();
    getUserInfo();
  }, []);

  useEffect(() => {

    let activeConnection;

    async function initializeSignalR() {
      
      if (!userInfo || !token) return;

      const handlers = {
        NewTaskAssigned: (task) => {
          console.log("Received NewTaskAssigned:", task);
          if (task.assignedToId === userInfo?.userId) {
            toast.success(`You have been assigned a new task: "${task.title}"`);
          }
          setTasks(prev => [...prev, task]);
        },
        ReceiveTaskUpdate: (task) => {
          console.log("Received ReceiveTaskUpdate:", task);
          if (task.assignedToId === userInfo?.userId) {
            toast.success(`Task assigned to you was updated: "${task.title}"`);
          }
          setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        },
        TaskDeleted: (taskId) => {
          toast.success(`A task was deleted.`);
          setTasks(prev => prev.filter(t => t.id !== taskId));
        },
        ReceiveNotification: (message) => {
          toast.success(message); 
        }
      };
      

      activeConnection = await startSignalRConnection(token, handlers);

      // ⬇️ Add these debugging/logging hooks
      if (activeConnection) {
        activeConnection.onclose(error =>
          console.error("❌ SignalR connection closed", error)
        );

        activeConnection.onreconnected(connectionId =>
          console.log("🔄 SignalR reconnected with ID:", connectionId)
        );
      }
    }

    initializeSignalR();

    return () => {
      stopSignalRConnection();
    };
  }, [userInfo, token]);

  useEffect(() => {
    if (!isAdminOrManager) return;

    const fetchAll = async () => {
      await fetchUsers();
      await fetchAllUsers();
    };

    fetchAll();
  }, [isAdminOrManager]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{userInfo?.role} Dashboard</h1>

        <div className="flex gap-4">

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CounterCard 
              num={filteredTasks.length} 
              title="Task Left" 
            />
            <CounterCard
              num={filteredTasks.filter(task => task.priority === "High").length}
              title="High Priority"
            />
            <CounterCard
              num={filteredTasks.filter(task => task.priority === "Medium").length}
              title="Medium Priority"
            />
            <CounterCard
              num={filteredTasks.filter(task => task.priority === "Low").length}
              title="Low Priority"
            />
          </div>
        </div>

        {/* Right: Placeholder */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center justify-center text-gray-400 text-lg">
          Placeholder for future content
        </div>
      </div>
      

      {/* Bottom Half: Task Table */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        { isAdminOrManager &&(<div className="mb-6 inline-flex space-x-1 rounded bg-gray-200 p-1">
          <button
            className={`px-4 py-2 rounded ${activeTab === "tasks" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </button>
          
            <button
            className={`px-4 py-2 rounded ${activeTab === "users" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        
        </div>)}
        {activeTab === "tasks" ? (
            <TaskTable 
              tasks={filteredTasks}
              userRole={userInfo?.role}
              onTaskSelected={handleTaskType}
              selectedTaskIds={selectedTaskIds}
              setSelectedTaskIds={setSelectedTaskIds}
              clearSelection={clearSelection}
            />
          ) : (
            <UserTable 
            users={allUserList}
            onTaskSelected={handleTaskType}
            isAdminOrManager={isAdminOrManager} />
          )}
      </div>

      {modalOpen && (
        <TaskDetailsModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
          userList={userList}
          userRole={userInfo?.role}
          onSaveTask={handleSaveTask}
          mode={mode}
        />
       )}


       <ConfirmModal
          isOpen={confirmModalOpen}
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={confirmAction}
          onCancel={() => setConfirmModalOpen(false)}
        />

        <RegisterUserModal
          isOpen={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          newUser={newUser}
          onChange={handleNewUserChange}
          onSubmit={handleRegisterUserSubmit}
          onEdit={handleUserEdit}
          userRole={userInfo?.role}
        />

    </div>

    
  );
}
