using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagementApp.Models
{
    public class TimeLog
    {

        [Key]
        public int Id { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int? Duration { get; set; }

        [ForeignKey("TaskId")]
        public int TaskId { get; set; }
        public Task? Task { get; set; }
    }
}