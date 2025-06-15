using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace TaskManagementApp.Hubs
{
    public class TaskHub : Hub
    {
        // Example: notify client a task was created
        public async Task SendTaskUpdate(string userId, object task)
        {
            await Clients.User(userId).SendAsync("ReceiveTaskUpdate", task);
        }

        public async Task NotifyAssignedTask(string userId, object task)
        {
            await Clients.User(userId).SendAsync("NewTaskAssigned", task);
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"SignalR connected for user: {userId}");
            return base.OnConnectedAsync();
        }
    }
}
