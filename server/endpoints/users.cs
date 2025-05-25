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

        return group;
    }
}

