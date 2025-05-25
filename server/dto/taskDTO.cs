public class TaskDto
{
    public string? Title { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public Guid? AssignedToId { get; set; }
    public DateTime? DueDate { get; set; }
}
