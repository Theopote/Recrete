$dir = "c:\Users\navib\Desktop\development\RC"
$docx = Get-ChildItem $dir -Filter "*.docx" | Where-Object { $_.Name -match "MVP" } | Select-Object -First 1
$out = "c:\Users\navib\Desktop\development\RC\Recrete\docs\mvp-roadmap-extract.txt"
& "c:\Users\navib\Desktop\development\RC\Recrete\scripts\read-docx.ps1" -Path $docx.FullName | Out-File -FilePath $out -Encoding utf8
Write-Host "Written to $out"
