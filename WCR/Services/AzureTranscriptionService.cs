using Microsoft.Azure.CognitiveServices.Vision.ComputerVision;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision.Models;

namespace WCR.Services;

public class AzureTranscriptionService(ComputerVisionClient client) : ITranscriptionService
{
    public async Task<IEnumerable<TranscriptionEntry>> TranscribeImageAsync(Stream Image)
    {
        var response = await client.ReadInStreamAsync(Image);
        var results_location = response.OperationLocation.Substring(response.OperationLocation.Length - 36);
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

    private TranscriptionEntry AzureOCRLineToTranscriptionEntry(Line result)
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
