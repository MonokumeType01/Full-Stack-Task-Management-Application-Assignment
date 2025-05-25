using System.ComponentModel.DataAnnotations;

namespace TaskManagementApp.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

    }
}