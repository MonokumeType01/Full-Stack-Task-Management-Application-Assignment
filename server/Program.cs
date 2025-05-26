using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TaskManagementApp.Models;
using TaskManagementApp.Services;
using TaskManagementApp.Endpoints;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

using System.Xml.Serialization;

var builder = WebApplication.CreateBuilder(args);

// JWT config
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

// EF core Dbcontext stuff
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWt Auth
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{   
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = key
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            var token = context.SecurityToken as JwtSecurityToken;
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Resolve the blacklist service from DI
            var blacklistService = context.HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();

            // Check if token is blacklisted
            if (blacklistService.IsTokenBlacklisted(tokenString))
            {
                context.Fail("Token is blacklisted.");
            }

            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddCors();
builder.Services.AddSingleton<TokenBlacklistService>();

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseCors(policy =>
    policy.AllowAnyOrigin()
          .AllowAnyMethod()
          .AllowAnyHeader());

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ErrorHandlingMiddleware>();

// register group endpoints
var authGroup = app.MapGroup("/api/auth");
var userGroup = app.MapGroup("/api/users");
var taskGroup = app.MapGroup("/api/tasks");

authGroup.MapAuthEndpoints(builder.Configuration, key);
userGroup.MapUserEndpoints(builder.Configuration, key);
taskGroup.MapTaskEndpoints(builder.Configuration, key);

// Example Protected route
app.MapGet("/protected", () => "Authorized!")
   .RequireAuthorization(); 


app.Run();
