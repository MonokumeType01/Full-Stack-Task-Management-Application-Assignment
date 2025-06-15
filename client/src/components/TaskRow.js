import { useState, useEffect, useRef } from "react";
import { formatTime } from '../utils/timeUtils';
import axios from "axios";
import { ROLES } from "../utils/constants";

export default function TaskRow({ task, onTaskSelected, userRole, showCheckbox, isChecked, onCheckToggle }) {
    const [timerRunning, setTimerRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(task.duration || 0);
    const apiUrl = process.env.REACT_APP_API_URL;
    const token = localStorage.getItem("token");

    const isUser = userRole === ROLES.USER;

    const intervalRef = useRef(null);

    const fetchTotalTime = async () => {
        try {
            const res = await axios.get(`${apiUrl}/tasks/${task.id}/time-tracking`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setElapsedTime(res.data.totalTimeInSeconds);
        } catch (err) {
            console.error('Error fetching time:', err);
        }
    };

    const startTimer = async () => {
        try {

            if (task.status === "Not Started") {
                onTaskSelected("in-progress", task);
            }
            
            if (task.status === "In Progress"){
                await axios.post(`${apiUrl}/tasks/${task.id}/start-timer`, null, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setTimerRunning(true);
            }
            
        } catch (err) {
            alert('Error starting timer.');
        }
    };

    const stopTimer = async () => {
        try {
            await axios.post(`${apiUrl}/tasks/${task.id}/stop-timer`, null, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTimerRunning(false);
            await fetchTotalTime();
        } catch (err) {
            alert('Error stopping timer.');
        }
    };

    useEffect(() => {
        setTimerRunning(task.isRunning || false);
        setElapsedTime(task.duration || 0);
    }, [task.isRunning, task.duration]);

    useEffect(() => {
        if (timerRunning) {
            intervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [timerRunning]);

    return (
        <tr className="border-t hover:bg-gray-100 cursor-pointer transition-colors" onClick={() =>
            onTaskSelected(userRole === ROLES.USER ? "view" : "edit", task)
        }>  
            {showCheckbox && (
                <td className="py-2 px-4" onClick={e => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={onCheckToggle}
                />
                </td>
            )}
            <td className="py-2 px-4">{task.title}</td>
            <td className="py-2 px-4">{task.status}</td>
            <td className="py-2 px-4">{task.priority}</td>
            <td className="py-2 px-4">{task.suggestedPriority}</td>
            {(!isUser) && (<td className="py-2 px-4">{task.assignToName}</td>)}
            <td className="py-2 px-4">{task.dueDate?.split('T')[0]}</td>
            <td className="py-2 px-4">{task.createdAt?.split('T')[0]}</td>
            <td className="py-2 px-4">{formatTime(elapsedTime)}</td>
            {isUser && (
                <td className="py-2 px-4">
                    {timerRunning ? (
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        stopTimer();
                        onTaskSelected("pending", task);
                        }}
                        disabled={task.status === "Pending Check"}
                        className={`border rounded-md px-3 py-1 transition ${
                        task.status === "Pending Check"
                            ? "border-gray-400 text-gray-400 cursor-not-allowed bg-gray-100"
                            : "border-red-500 text-red-500 hover:bg-red-100"
                        }`}
                    >
                        Stop Timer
                    </button>
                    ) : (
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        startTimer();
                        }}
                        disabled={task.status === "Pending Check"}
                        className={`border rounded-md px-3 py-1 transition ${
                        task.status === "Pending Check"
                            ? "border-gray-400 text-gray-400 cursor-not-allowed bg-gray-100"
                            : "border-green-500 text-green-500 hover:bg-green-100"
                        }`}
                    >
                        {task.status === "Not Started" ? "Start Task" : "Start Timer"}
                    </button>
                    )}
                </td>
                )}

            {/* <td className="relative py-2 px-4 text-xl text-gray-600">
                <div className="relative inline-block text-left">
                    <TaskMenu
                        task={task}
                        userRole={userRole}
                        onTaskSelected={onTaskSelected}
                    />
                </div>
            </td> */}
        </tr>
    );
}
