$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot 'dist'
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:3000/')
$listener.Prefixes.Add('http://127.0.0.1:3000/')
$listener.Prefixes.Add('http://192.168.20.32:3000/')
$listener.Start()

$contentTypes = @{
  '.css'  = 'text/css; charset=utf-8'
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
}

function Get-FilePath([string]$relativePath) {
  $clean = $relativePath.Split('?')[0].TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($clean)) {
    return Join-Path $root 'index.html'
  }

  $candidate = Join-Path $root $clean
  if (Test-Path -LiteralPath $candidate -PathType Leaf) {
    return $candidate
  }

  return Join-Path $root 'index.html'
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  try {
    $path = Get-FilePath $context.Request.RawUrl
    $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
    $bytes = [System.IO.File]::ReadAllBytes($path)

    $context.Response.StatusCode = 200
    $context.Response.ContentType = $contentTypes[$extension]
    if (-not $context.Response.ContentType) {
      $context.Response.ContentType = 'application/octet-stream'
    }
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  catch {
    $payload = [System.Text.Encoding]::UTF8.GetBytes('Not found')
    $context.Response.StatusCode = 404
    $context.Response.ContentType = 'text/plain; charset=utf-8'
    $context.Response.ContentLength64 = $payload.Length
    $context.Response.OutputStream.Write($payload, 0, $payload.Length)
  }
  finally {
    $context.Response.OutputStream.Close()
  }
}
