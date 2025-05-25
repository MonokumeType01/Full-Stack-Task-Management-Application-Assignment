using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TaskManagementApp.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder group, IConfiguration config, SymmetricSecurityKey key)
    {
        group.MapPost("/register", async ([FromBody] User user, AppDbContext db) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == user.Username))
                return Results.BadRequest("User already exists");

            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Ok("User registered");
        });

        group.MapPost("/login", async ([FromBody] User user, AppDbContext db) =>
        {
            var foundUser = await db.Users
                .FirstOrDefaultAsync(u => u.Username == user.Username && u.Password == user.Password);

            if (foundUser is null)
                return Results.Unauthorized();

            var token = GenerateJwtToken(user.Username, config["Jwt:Issuer"]!, config["Jwt:Audience"]!, key);
            return Results.Ok(new { token });
        });

        return group;
    }

    private static string GenerateJwtToken(string username, string issuer, string audience, SymmetricSecurityKey key)
    {
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims: new[] { new Claim(ClaimTypes.Name, username) },
            expires: DateTime.Now.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
