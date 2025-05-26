import TaskRow from './TaskRow';

export default function TaskTable({ tasks, onTaskSelected, userRole  }) {

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Task List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-600 border-b">
              <th className="py-2 px-4">Task Name</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Priority</th>
              <th className="py-2 px-4">Assignee</th>
              <th className="py-2 px-4">Due Date</th>
              <th className="py-2 px-4">Created At</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => (
              <TaskRow 
                key={idx} 
                task={task} 
                userRole= {userRole}
                onTaskSelected={onTaskSelected}/>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
