using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using WCR.Models;

namespace WCR.Hubs
{
	public class PresentationHub:Hub
	{
		private static RoomMgr roomMgr = new();

		public async Task CreateRoom()
		{
			var presentation = roomMgr.CreateRoom(Context.ConnectionId);
			await Groups.AddToGroupAsync(Context.ConnectionId, presentation.Id.ToString());
			await Clients.Caller.SendAsync("created", presentation.Id.ToString());
		}
		
		public async Task JoinRoom(Guid presentationId)
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, presentationId.ToString());
			await Clients.Caller.SendAsync("joined", presentationId.ToString());
			await Clients.Group(presentationId.ToString()).SendAsync("ready");
		}

		public async Task LeaveRoom(Guid presentationId)
		{
			await Clients.Group(presentationId.ToString()).SendAsync("bye");
		}

		public override Task OnDisconnectedAsync(Exception? exception)
		{
			roomMgr.RemoveRoom(Context.ConnectionId);
			return base.OnDisconnectedAsync(exception);
		}

		/// <summary>
		///  This keeps all of the rooms alive
		/// </summary>
		private class RoomMgr:ConcurrentDictionary<Guid, Presentation>
		{
			public Presentation CreateRoom(string ConnectionId) {
				var Presentation = new Presentation { ConnectionId = ConnectionId };
				TryAdd(Presentation.Id, Presentation);
				return Presentation;
			}

			public void RemoveRoom(Guid ConnectionId)
			{
				TryRemove(ConnectionId, out _); // host closes the room
			}

			public void RemoveRoom(string ConnectionId) 
			{
				Guid? presentationId = null;
				foreach (var pair in this)
				{
					if (pair.Value.ConnectionId == ConnectionId) 
					{ 
						presentationId = pair.Key;
						break;
					}
				}
				if(presentationId != null)
				{
					RemoveRoom(presentationId.Value);
				}
			}
		}
	}
}