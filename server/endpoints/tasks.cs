using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TaskManagementApp.Endpoints;

public static class TaskEndpoints
{
    public static RouteGroupBuilder MapTaskEndpoints(this RouteGroupBuilder group, IConfiguration config, SymmetricSecurityKey key)
    {

        group.MapGet("/", async (AppDbContext db) =>
        {
            var users = await db.Tasks
                .Include(t => t.CreatedBy)
                .Select(t => new {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.Status,
                    t.Priority,
                    t.SuggestedPriority,
                    t.CreatedAt,
                    t.DueDate,
                    AssignToName = (t.AssignedTo != null) 
                    ? t.AssignedTo.FirstName + " " + t.AssignedTo.LastName : null,
                    CreatedByName = t.CreatedBy.FirstName + " " + t.CreatedBy.LastName })
                .ToListAsync();

            return Results.Ok(users);
        });

        group.MapPost("/", async ([FromBody] Models.Task task, AppDbContext db) =>
        {

            var userExists = await db.Users.AnyAsync(u => u.Id == task.CreatedById);
            if (!userExists)
                return Results.BadRequest($"User with ID {task.CreatedById} does not exist.");
           
            db.Tasks.Add(task);
            await db.SaveChangesAsync();
            return Results.Ok("Task Created");
        });

        group.MapPatch("/{id}", async (Guid id, [FromBody] TaskDto updatedTask, AppDbContext db) =>
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

            task.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
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




        return group;
    }
}

