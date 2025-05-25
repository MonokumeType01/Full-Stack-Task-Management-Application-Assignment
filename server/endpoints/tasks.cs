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
                .Select(t => new { t.Id, t.Title, t.Description, t.Status, t.Priority, t.SuggestedPriority, t.CreatedAt, t.CreatedBy })
                .ToListAsync();

            return Results.Ok(users);
        });

        return group;
    }
}

