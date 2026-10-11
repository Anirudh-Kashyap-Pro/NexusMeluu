# NexusCare - Local HTTP Server (Built-in PowerShell .NET HttpListener)
# Zero external runtime or dependencies required.

$Port = 8080
$Folder = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   NexusCare - Hospital Operations & Patient-Flow Engine" -ForegroundColor Green
Write-Host "   Serving from: $Folder" -ForegroundColor DarkGray
Write-Host "   Access URL:   http://localhost:$Port/" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")

try {
    $Listener.Start()
    Write-Host "Server running at http://localhost:$Port/ (Press Ctrl+C to stop)..." -ForegroundColor Green
    Start-Process "http://localhost:$Port/"

    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($UrlPath) -or $UrlPath -eq "/") {
            $UrlPath = "index.html"
        }

        $FilePath = Join-Path $Folder $UrlPath

        if (Test-Path $FilePath -PathType Leaf) {
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Extension = [System.IO.Path]::GetExtension($FilePath).ToLower()

            $ContentType = switch ($Extension) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                default { "application/octet-stream" }
            }

            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Response.StatusCode = 404
            $NotFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found: $UrlPath")
            $Response.OutputStream.Write($NotFoundMsg, 0, $NotFoundMsg.Length)
        }
        $Response.Close()
    }
} catch {
    Write-Host "Server stopped: $_" -ForegroundColor Red
} finally {
    $Listener.Stop()
}
