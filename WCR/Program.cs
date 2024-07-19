using Azure.Identity;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision;
using WCR.Endpoints;
using WCR.Hubs;
using WCR.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddSignalR();
builder.Services.AddTransient(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new ComputerVisionClient(new ApiKeyServiceClientCredentials(config["Transcription:Azure:ApiKey"]))
    {
        Endpoint = config["Transcription:Azure:Endpoint"]
    };
});
builder.Services.AddTransient<ITranscriptionService, AzureTranscriptionService>();

if(builder.Environment.IsProduction())
{
    builder.Configuration.AddAzureKeyVault(new Uri($"https://{builder.Configuration["Config:Azure:VaultName"]}.vault.azure.net/"), new DefaultAzureCredential());
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
// app.UseHsts();
}

// app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapHub<PresentationHub>("/PresentationHub");

app.MapTranscriptionEndpoint();

app.MapRazorPages();

app.Run();
