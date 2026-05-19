using BackendApi.Data;
using BackendApi.Models;
using BackendApi.Services;
using BackendApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Dependency Injection for Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHostedService<NotificationBackgroundService>();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key_needs_to_be_long_enough_for_hmac_sha256_for_dev";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Startup Seeder: ensure admin account is valid ──────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync(); // apply any pending migrations

    const string adminEmail = "admin@system.com";
    const string adminPassword = "Admin@123";

    var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
    if (admin == null)
    {
        // Create fresh admin if not seeded
        db.Users.Add(new User
        {
            Username = "Admin",
            Email = adminEmail,
            PhoneNumber = "+1234567890",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            Role = UserRoles.Admin,
            IsActive = true
        });
        await db.SaveChangesAsync();
        Console.WriteLine("[Seeder] Admin account created.");
    }
    else if (!BCrypt.Net.BCrypt.Verify(adminPassword, admin.PasswordHash))
    {
        // Fix broken hash from migration seed
        admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
        await db.SaveChangesAsync();
        Console.WriteLine("[Seeder] Admin password hash fixed.");
    }
    else
    {
        Console.WriteLine("[Seeder] Admin account OK.");
    }
}
// ───────────────────────────────────────────────────────────────────────────

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
