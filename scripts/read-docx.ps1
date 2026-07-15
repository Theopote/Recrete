param([string]$Path)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$sr = New-Object System.IO.StreamReader($entry.Open())
$xml = $sr.ReadToEnd()
$sr.Close()
$zip.Dispose()
$text = [regex]::Replace($xml, '</w:p>', "`n")
$text = [regex]::Replace($text, '<[^>]+>', '')
$text = [System.Net.WebUtility]::HtmlDecode($text)
Write-Output $text
