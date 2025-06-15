using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TaskManagementApp.Endpoints;

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group, IConfiguration config, SymmetricSecurityKey key)
    {

        group.MapGet("/", async (AppDbContext db) =>
        {
            var users = await db.Users
                .Include(u => u.Role) //this ensure the Role part is loaded
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    RoleName = u.Role.Name,
                    
                })
                .ToListAsync();

            return Results.Ok(users);
        });

        group.MapDelete("/{id}", async (Guid id, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user == null)
            {
                return Results.NotFound("User not found");
            }

            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return Results.Ok("User deleted successfully");
        });

        group.MapPatch("/{id}", async (Guid id, [FromBody] UpdateUserDto updatedUser, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user == null)
            {
                return Results.NotFound("User not found");
            }

            if (!string.IsNullOrEmpty(updatedUser.FirstName))
                user.FirstName = updatedUser.FirstName;

            if (!string.IsNullOrEmpty(updatedUser.LastName))
                user.LastName = updatedUser.LastName;

            if (!string.IsNullOrEmpty(updatedUser.Username))
                user.Username = updatedUser.Username;

            if (updatedUser.RoleId.HasValue)
                user.RoleId = updatedUser.RoleId.Value;

            await db.SaveChangesAsync();
            return Results.Ok("User updated successfully");
        });


        group.MapGet("/role", async ([FromQuery] string roleName, AppDbContext db) =>
        {
            if (string.IsNullOrEmpty(roleName))
            {
                return Results.BadRequest("Role name is required");
            }

            var users = await db.Users
                .Include(u => u.Role)
                .Where(u => u.Role.Name == roleName)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    RoleName = u.Role.Name,
                })
                .ToListAsync();

            return Results.Ok(users);
        });


        return group;
    }
}

