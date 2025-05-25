export default function TaskRow({ task }) {
  return (
    <tr className="border-t">
      <td className="py-2 px-4">{task.name}</td>
      <td className="py-2 px-4">{task.status}</td>
      <td className="py-2 px-4">{task.priority}</td>
      <td className="py-2 px-4">{task.assignee}</td>
      <td className="py-2 px-4">{task.dueDate?.split('T')[0]}</td>
      <td className="py-2 px-4 text-xl text-gray-600 cursor-pointer">⋮</td>
    </tr>
  );
}