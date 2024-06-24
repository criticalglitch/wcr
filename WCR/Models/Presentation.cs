namespace WCR.Models
{
	public class Presentation
	{
		public Guid Id { get; } = Guid.NewGuid();
		
		public required string ConnectionId { get; set; }
	}
}
