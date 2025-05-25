import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CounterCard from '../components/CounterCard';
import TaskTable from '../components/TaskTable';
import TaskDetailsModal from "../components/TaskDetailsModal";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mode, setMode] = useState("");


  const handleTaskType = (modeType) => {
    if (modeType!="delete"){
      setMode(modeType);
      setSelectedTask(null);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = (taskData) => {
    if (taskData.id) {
      console.log("Update task:", taskData);
      // Call API to update
    } else {
      console.log("Create new task:", taskData);
      // Call API to create
    }
    setModalOpen(false);
  };

  

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5005/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

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
       
        onTaskSelected={handleTaskType}
        />
      </div>

      {modalOpen && (
        <TaskDetailsModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
          onSaveTask={handleSaveTask}
          mode={mode}
        />
       )}
    </div>

    
  );
}
