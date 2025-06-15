using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.SignalR;
using TaskManagementApp.Hubs;

namespace TaskManagementApp.Endpoints;

public static class TaskEndpoints
{
    public static RouteGroupBuilder MapTaskEndpoints(this RouteGroupBuilder group, IConfiguration config, SymmetricSecurityKey key)
    {

        group.MapGet("/", async (AppDbContext db) =>
        {
            var users = await db.Tasks
                .Include(t => t.CreatedBy)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.Status,
                    t.Priority,
                    t.SuggestedPriority,
                    t.CreatedAt,
                    t.DueDate,
                    Duration = (t.TimeLogs != null) ? t.TimeLogs.Sum(log => log.Duration ?? 0) : 0,
                    IsRunning = t.TimeLogs.Any(log => log.EndTime == null),
                    t.AssignedToId,
                    AssignToName = (t.AssignedTo != null)
                    ? t.AssignedTo.FirstName + " " + t.AssignedTo.LastName : null,
                    CreatedByName = t.CreatedBy.FirstName + " " + t.CreatedBy.LastName
                })
                    
                .ToListAsync();

            return Results.Ok(users);
        });

        group.MapPost("/", async ([FromBody] Models.Task task, AppDbContext db, IHubContext<TaskHub> hubContext) =>
        {
            var userExists = await db.Users.AnyAsync(u => u.Id == task.CreatedById);
            if (!userExists)
                return Results.BadRequest($"User with ID {task.CreatedById} does not exist.");

            if (task.AssignedToId.HasValue)
            {
                var assignedUserExists = await db.Users.AnyAsync(u => u.Id == task.AssignedToId);
                if (!assignedUserExists)
                    return Results.BadRequest($"Assigned User with ID {task.AssignedToId} does not exist.");
            }
           
            db.Tasks.Add(task);
            await db.SaveChangesAsync();
            Console.WriteLine("Start notif line:", task.AssignedToId);
            // notification use
            if (task.AssignedToId.HasValue)
            {   
                var assignedUserId = task.AssignedToId.Value.ToString();
                Console.WriteLine($"Sending SignalR to user: {assignedUserId}");

                await hubContext.Clients.User(assignedUserId)
                    .SendAsync("NewTaskAssigned", new
                    {
                        task.Id,
                        task.Title,
                        task.Description,
                        task.Priority,
                        task.Status,
                        task.DueDate,
                        task.AssignedToId
                    });
            }

            return Results.Ok("Task Created");
        });

        group.MapPatch("/{id}", async (Guid id, [FromBody] TaskDto updatedTask, AppDbContext db, IHubContext<TaskHub> hubContext) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task is null)
                return Results.NotFound("Task not found");

            if (!string.IsNullOrEmpty(updatedTask.Title))
                task.Title = updatedTask.Title;

            if (!string.IsNullOrEmpty(updatedTask.Status))
                task.Status = updatedTask.Status;

            if (!string.IsNullOrEmpty(updatedTask.Priority))
                task.Priority = updatedTask.Priority;

            if (updatedTask.AssignedToId.HasValue)
                task.AssignedToId = updatedTask.AssignedToId.Value;

            if (updatedTask.DueDate.HasValue)
                task.DueDate = updatedTask.DueDate.Value;

            if (updatedTask.TimeTakenMinutes.HasValue && updatedTask.TimeTakenMinutes.Value > 0)
            {
                db.TimeLogs.Add(new TimeLog
                {
                    TaskId = id,
                    StartTime = DateTime.UtcNow.AddMinutes(-updatedTask.TimeTakenMinutes.Value),
                    EndTime = DateTime.UtcNow,
                    Duration = updatedTask.TimeTakenMinutes.Value * 60
                });
            }

            task.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            
            // notification
            if (task.AssignedToId.HasValue)
            {   
                var assignedUserId = task.AssignedToId.Value.ToString();
                await hubContext.Clients.User(assignedUserId)
                    .SendAsync("TaskUpdated", new
                    {
                        task.Id,
                        task.Title,
                        task.Status,
                        task.Priority,
                        task.DueDate
                    });
            }

            return Results.Ok("Task updated successfully");
        });

        group.MapDelete("/{id}", async (Guid id, AppDbContext db) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task is null)
                return Results.NotFound("Task not found");

            db.Tasks.Remove(task);
            await db.SaveChangesAsync();
            return Results.Ok("Task deleted successfully");
        });

        // Time tracker end points below

        group.MapPost("/{id}/start-timer", async (Guid id, AppDbContext db) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task == null)
                return Results.NotFound("Task not found.");
            
            var activeLog = await db.TimeLogs.FirstOrDefaultAsync(t => t.TaskId == id && t.EndTime == null);
            if (activeLog != null)
                return Results.BadRequest("Timer is already running for this task.");

            var newLog = new TimeLog{
                TaskId = id,
                StartTime = DateTime.UtcNow
            };

            db.TimeLogs.Add(newLog);
            task.Status = "In Progress";

            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Timer started.", startTime = newLog.StartTime });
        });


        group.MapPost("/{id}/stop-timer", async (Guid id, AppDbContext db) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task == null)
                return Results.NotFound("Task not found.");

            var activeLog = await db.TimeLogs.FirstOrDefaultAsync(t => t.TaskId == id && t.EndTime == null);
            if (activeLog == null)
                return Results.BadRequest("No active timer found for this task.");

            activeLog.EndTime = DateTime.UtcNow;
            activeLog.Duration = (int)(activeLog.EndTime.Value - activeLog.StartTime).TotalSeconds;

            await db.SaveChangesAsync();
            return Results.Ok("Timer stopped and time logged.");
        });

        group.MapPost("/{id}/log-time", async (Guid id, [FromBody] int minutes, AppDbContext db) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task == null)
                return Results.NotFound("Task not found.");

            var log = new TimeLog
            {
                TaskId = id,
                StartTime = DateTime.UtcNow.AddMinutes(-minutes),
                EndTime = DateTime.UtcNow,
                Duration = minutes * 60
            };

            db.TimeLogs.Add(log);
            await db.SaveChangesAsync();
            return Results.Ok("Manual time log added.");
        });

        group.MapGet("/{id}/time-tracking", async (Guid id, AppDbContext db) =>
        {
            var task = await db.Tasks.FindAsync(id);
            if (task == null)
                return Results.NotFound("Task not found.");

            var totalSeconds = await db.TimeLogs
                .Where(t => t.TaskId == id && t.Duration.HasValue)
                .SumAsync(t => t.Duration!.Value);

            return Results.Ok(new { TaskId = id, TotalTimeInSeconds = totalSeconds });
        });


        group.MapGet("/count/by-user/{userId}", async (Guid userId, AppDbContext db) =>
        {
            var assignedTasks = await db.Tasks
                .Where(t => t.AssignedToId == userId)
                .ToListAsync();

            var createdTasks = await db.Tasks
                .Where(t => t.CreatedById == userId)
                .ToListAsync();

             var result = new
            {
                assigned = new
                {
                    total = assignedTasks.Count,
                    notStarted = assignedTasks.Count(t => t.Status == "Not Started"),
                    inProgress = assignedTasks.Count(t => t.Status == "In Progress"),
                    pendingCheck = assignedTasks.Count(t => t.Status == "Pending Check"),
                    completed = assignedTasks.Count(t => t.Status == "Completed"),
                    overdue = assignedTasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != "Completed")
                },
                created = new
                {
                    total = createdTasks.Count,
                    notStarted = createdTasks.Count(t => t.Status == "Not Started"),
                    inProgress = createdTasks.Count(t => t.Status == "In Progress"),
                    pendingCheck = createdTasks.Count(t => t.Status == "Pending Check"),
                    completed = createdTasks.Count(t => t.Status == "Completed"),
                    overdue = createdTasks.Count(t => t.DueDate < DateTime.UtcNow && t.Status != "Completed")
                }
            };

            return Results.Ok(result);
        });



        return group;
    }
}

