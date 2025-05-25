using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagementApp.Models
{
    public class Task
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";  // Pending, In Progress, Completed
        public string Priority { get; set; } = "Medium"; // Low, Medium, High
        public string SuggestedPriority { get; set; } = "Medium"; // AI-suggested

        // Relationships
        [ForeignKey("CreatedById")]
        public Guid CreatedById { get; set; }
        public User CreatedBy { get; set; } = null!;

        [ForeignKey("AssignedToId")]
        public Guid? AssignedToId { get; set; }

        public User? AssignedTo { get; set; }

        // Time Tracking
        public List<TimeLog> TimeLogs { get; set; } = new();
        public int TotalTrackedTime { get; set; } = 0; // In seconds
        public bool TimerActive { get; set; } = false;
        public DateTime? TimerStart { get; set; }
        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        
    }
}
