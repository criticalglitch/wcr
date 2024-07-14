namespace WCR.Endpoints;

public static class TranscriptionEndpoint
{
    public static IEndpointRouteBuilder MapTranscriptionEndpoint(this IEndpointRouteBuilder builder)
    {
        builder.MapPost("/api/v1/transcribe", TranscribeImage);
        return builder;
    }

    private static async Task<IResult> TranscribeImage(Stream body)
    {
        return Results.Ok();
    }
}
