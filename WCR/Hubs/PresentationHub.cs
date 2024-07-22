using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;

namespace WCR.Hubs;

public class PresentationHub : Hub
{
    private class Presentation
    {
        public required string Channel { get; set; }
        public required string PresentationId { get; set; }
        public required string HostConnection { get; set; }
        public List<string> Participants { get; } = [];
    }

    private static List<Presentation> KnownOpenChannels { get; } = [];

    public async Task Send(string name, string msg)
	{
		dynamic message = JsonConvert.DeserializeObject<dynamic>(msg);
		if (message["eventName"] == "check-presence")
		{
            await CheckPresence(name, message);
			return;
		}

        if (message["eventName"] == "open-room")
        {
            await OpenRoom(name, message);
            return;
        }

        if (message["eventName"] == "join-room")
        {
            await JoinRoom(name, message);
            return;
        }

        await Clients.All.SendAsync("broadcastMessage", name, msg);
    }

    private async Task OpenRoom(string name, dynamic message)
    {
        string presentationId = message["data"]["sessionid"].ToString();
        KnownOpenChannels.Add(new() {
            Channel = name,
            PresentationId = presentationId,
            HostConnection = Context.ConnectionId
        });
        await Clients.Caller.SendAsync("open-room-result", true, null);
    }

    private async Task JoinRoom(string name, dynamic message)
    {
        string presentationId = message["data"]["sessionid"].ToString();
        var presentation = KnownOpenChannels.First(x => x.PresentationId == presentationId);
        presentation.Participants.Add(Context.ConnectionId);
        await Clients.Caller.SendAsync("open-room-result", true, null);
    }

    private async Task CheckPresence(string name, dynamic message)
    {
        string presentationId = message["data"].ToString();
        bool open = !string.IsNullOrEmpty(presentationId) && KnownOpenChannels.Any(e => e.Channel == name && e.PresentationId == presentationId);
        await Clients.Caller.SendAsync("check-presence-result", open, presentationId, string.Empty);
    }
}

/**
 * TODO: Reimplement the Socket IO code here in signalr
 * 
 * The main problem is that the code in the RTCMulticonnection Library makes too many
 * assumptions that you will be using socket.io instead of your own socket connection
 * like SignalR
 * 
 * The main problem with that is the bare ass bones message handling we have here.
 * In order to make this work properly, we need to reimplement all of the messaging
 * code that is in the Signaling-Server.js[1] file into this Presentation Hub class.
 * 
 * Then we need to ensure the SignalRConnection code is updated to reflect the changes
 * and ensure we try to match up as close as possible the SocketConnection.js[2]
 * handlers for the events.
 * 
 * tl;dr: Rewrite the entire fucking library...
 * 
 * [1]: https://github.com/swhgoon/RTCMultiConnection/blob/master/Signaling-Server.js
 * [2]: https://github.com/muaz-khan/RTCMultiConnection/blob/master/dev/SocketConnection.js
 */