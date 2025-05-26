using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApp.Models;
using TaskManagementApp.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TaskManagementApp.Endpoints;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder group, IConfiguration config, SymmetricSecurityKey key)
    {
        group.MapPost("/register", async ([FromBody] Models.User user, AppDbContext db) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == user.Username))
                return Results.BadRequest("User already exists");

            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Ok("User registered");
        });

        group.MapPost("/login", async ([FromBody] Models.User user, AppDbContext db) =>
        {
            var foundUser = await db.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == user.Username && u.Password == user.Password);

            if (foundUser is null)
                return Results.Unauthorized();


            var token = GenerateJwtToken(foundUser.Username, foundUser.Id.ToString(), foundUser.Role?.Name ?? "",config["Jwt:Issuer"]!, config["Jwt:Audience"]!, key);
            return Results.Ok(new { token });
        });


        group.MapPost("/logout", (HttpContext context, TokenBlacklistService blacklistService) =>
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "").Trim();

            if (string.IsNullOrWhiteSpace(token))
                return Results.BadRequest("No token provided");

            blacklistService.BlacklistToken(token);

            return Results.Ok(new { message = "Logged out and token blacklisted" });
        });

        return group;
    }

    private static string GenerateJwtToken(string username, string userId, string roleName, string issuer, string audience, SymmetricSecurityKey key)
    {
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, roleName)
        };

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims: claims,
            expires: DateTime.Now.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
