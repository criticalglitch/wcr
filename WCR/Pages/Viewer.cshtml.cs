using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace WCR.Pages
{
    public class ViewerModel : PageModel
    {
        public void OnGet([FromQuery] string? presentationId = null)
        {
            ViewData["presentationid"] = presentationId;
        }
    }
}
