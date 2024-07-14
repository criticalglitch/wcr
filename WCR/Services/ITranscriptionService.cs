using System.Reflection.Metadata.Ecma335;

namespace WCR.Services;

public record class BoundingBoxPoint(int X, int Y);

public class TranscriptionEntry
{
    public required string Text { get; init; }
    public BoundingBoxPoint[] BoundingBoxPoints { get; } = new BoundingBoxPoint[4];
}
public interface ITranscriptionService
{
    Task<IEnumerable<TranscriptionEntry>> TranscribeImageAsync(Stream Image);
}
