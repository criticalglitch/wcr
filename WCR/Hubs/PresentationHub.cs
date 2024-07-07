using Microsoft.AspNetCore.SignalR;

namespace WCR.Hubs;

public class PresentationHub : Hub
{
	public async Task Send(string name, string msg)
	{
		await Clients.All.SendAsync("broadcastMessage", name, msg); 
	}
}