using BackendApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Part> Parts { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
        public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<SalesInvoice> SalesInvoices { get; set; }
        public DbSet<SalesInvoiceItem> SalesInvoiceItems { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<PartRequest> PartRequests { get; set; }
        public DbSet<ServiceReview> ServiceReviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Unique Indexes for performance and data integrity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Part>()
                .HasIndex(p => p.PartNumber)
                .IsUnique();

            modelBuilder.Entity<PurchaseInvoice>()
                .HasIndex(pi => pi.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<SalesInvoice>()
                .HasIndex(si => si.InvoiceNumber)
                .IsUnique();

            // SalesInvoice - Customer (no cascade to avoid cycles)
            modelBuilder.Entity<SalesInvoice>()
                .HasOne(s => s.Customer)
                .WithMany()
                .HasForeignKey(s => s.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // SalesInvoice - Staff (no cascade)
            modelBuilder.Entity<SalesInvoice>()
                .HasOne(s => s.Staff)
                .WithMany()
                .HasForeignKey(s => s.StaffId)
                .OnDelete(DeleteBehavior.SetNull);

            // SalesInvoice - Vehicle (no cascade)
            modelBuilder.Entity<SalesInvoice>()
                .HasOne(s => s.Vehicle)
                .WithMany()
                .HasForeignKey(s => s.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            // Vehicle - Customer
            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Customer)
                .WithMany()
                .HasForeignKey(v => v.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Appointment - Customer
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Customer)
                .WithMany()
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Appointment - Vehicle
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Vehicle)
                .WithMany()
                .HasForeignKey(a => a.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            // PartRequest - Customer
            modelBuilder.Entity<PartRequest>()
                .HasOne(pr => pr.Customer)
                .WithMany()
                .HasForeignKey(pr => pr.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ServiceReview - Customer
            modelBuilder.Entity<ServiceReview>()
                .HasOne(sr => sr.Customer)
                .WithMany()
                .HasForeignKey(sr => sr.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // ServiceReview - SalesInvoice
            modelBuilder.Entity<ServiceReview>()
                .HasOne(sr => sr.SalesInvoice)
                .WithMany()
                .HasForeignKey(sr => sr.SalesInvoiceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Seed static admin account
            // Pre-computed BCrypt hash for "Admin@123" to prevent EF Core migrations error.
            var adminPasswordHash = "$2a$11$7N2o4c.6k8E.T2aD1D0gE.3Z.W.0fK1t0C.M9.x9z8.1k5a3x5Z.q";

            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Username = "Admin",
                Email = "admin@system.com",
                PhoneNumber = "+1234567890",
                PasswordHash = adminPasswordHash,
                Role = UserRoles.Admin,
                IsActive = true
            });
        }
    }
}
