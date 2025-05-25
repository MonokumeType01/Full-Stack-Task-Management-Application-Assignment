using System.ComponentModel.DataAnnotations;

namespace TaskManagementApp.Models
{
    public class TimeLog
    {

        [Key]
        public int Id { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int? Duration { get; set; }

        public int TaskId { get; set; }
        public Task? Task { get; set; }
    }
}