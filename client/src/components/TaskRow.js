import { useState } from "react";
import TaskMenu from "./TaskMenu";

export default function TaskRow({ key, task, onViewTask, onEditTask, onDeleteTask }) {

  return (
    <tr className="border-t">
      <td className="py-2 px-4">{task.title}</td>
      <td className="py-2 px-4">{task.status}</td>
      <td className="py-2 px-4">{task.priority}</td>
      <td className="py-2 px-4">{task.assignToName}</td>
      <td className="py-2 px-4">{task.dueDate?.split('T')[0]}</td>
      <td className="py-2 px-4">{task.createdAt?.split('T')[0]}</td>
      <td className="relative py-2 px-4 text-xl text-gray-600">
        <div className="relative inline-block text-left">
          <TaskMenu
          task={task}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onViewTask={onViewTask}
        />
        </div>
      </td>
    </tr>
  );
}