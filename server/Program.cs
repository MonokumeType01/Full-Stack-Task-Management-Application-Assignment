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
            Console.WriteLine("Token validated: " + context.SecurityToken);
            var rawToken = context.Request.Headers["Authorization"]
                .FirstOrDefault()?
                .Replace("Bearer ", "")
                .Trim();

            if (string.IsNullOrWhiteSpace(rawToken))
            {
                context.Fail("Invalid token.");
                return System.Threading.Tasks.Task.CompletedTask;
            }

            var blacklistService = context.HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();
            Console.WriteLine("Checking blacklist for token: " + rawToken);

            if (blacklistService.IsTokenBlacklisted(rawToken))
            {
                Console.WriteLine("Token is blacklisted!");
                context.Fail("This token has been revoked.");
                return System.Threading.Tasks.Task.CompletedTask;
            }

            Console.WriteLine("Token is valid and not blacklisted.");
            return System.Threading.Tasks.Task.CompletedTask;
        },

        OnChallenge = context =>
        {
            if (!context.Response.HasStarted)
            {
                Console.WriteLine("OnChallenge triggered - sending 401 Unauthorized.");
                context.HandleResponse(); // Prevents the default 403 response
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                var errorResponse = new { error = context.ErrorDescription ?? "Unauthorized: Invalid or blacklisted token" };
                return context.Response.WriteAsJsonAsync(errorResponse);
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
var userGroup = app.MapGroup("/api/users").RequireAuthorization();
var taskGroup = app.MapGroup("/api/tasks").RequireAuthorization();

authGroup.MapAuthEndpoints(builder.Configuration, key);
userGroup.MapUserEndpoints(builder.Configuration, key);
taskGroup.MapTaskEndpoints(builder.Configuration, key);

// Example Protected route
app.MapGet("/protected", () => "Authorized!")
   .RequireAuthorization(); 


app.Run();
