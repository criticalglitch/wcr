using Microsoft.Azure.CognitiveServices.Vision.ComputerVision;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision.Models;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace WCR.Services;

public class AzureTranscriptionService(ComputerVisionClient client) : ITranscriptionService
{
    public async Task<IEnumerable<TranscriptionEntry>> TranscribeImageAsync(Stream Image)
    {
        var message = await CreateRequest(client, Image);

        var response = await client.HttpClient.SendAsync(message);

        if (!response.IsSuccessStatusCode)
            return [];

        var results_location = response.Headers.GetValues("Operation-Location").First()[^36..];
        ReadOperationResult results;
        do
        {
            results = await client.GetReadResultAsync(Guid.Parse(results_location));
        } while (results.Status == OperationStatusCodes.NotStarted || results.Status == OperationStatusCodes.Running);
        List<TranscriptionEntry> entries = [];
        foreach (var result in results.AnalyzeResult.ReadResults.First().Lines)
        {
            entries.Add(AzureOCRLineToTranscriptionEntry(result));
        }
        return entries;
    }

    private static async Task<HttpRequestMessage> CreateRequest(ComputerVisionClient client, Stream Image)
    {
        MemoryStream ms = new();
        await Image.CopyToAsync(ms);

        ByteArrayContent content = new(ms.ToArray());
        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

        HttpRequestMessage message = new(HttpMethod.Post, $"{client.Endpoint}vision/v3.2/read/analyze?overload=stream&language=en") {
            Content = content
        };

        await client.Credentials.ProcessHttpRequestAsync(message, default);
     
        return message;
    }

    private static TranscriptionEntry AzureOCRLineToTranscriptionEntry(Line result)
    {
        TranscriptionEntry entry = new() { Text = result.Text };
        for (int i = 0; i < 4; i++)
        {
            int X = Convert.ToInt32(result.BoundingBox[i * 2 + 0]);
            int Y = Convert.ToInt32(result.BoundingBox[i * 2 + 1]);
            entry.BoundingBoxPoints[i] = new(X, Y);
        }
        return entry;
    }
}
