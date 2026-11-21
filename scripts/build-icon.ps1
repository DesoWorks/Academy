# Builds a multi-resolution ICO from build/icon.png.
# Sizes: 16, 32, 48, 64, 128, 256. PNG payload, Vista-style.
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $root "build\icon.png"
$outPath = Join-Path $root "build\icon.ico"
$src = [System.Drawing.Image]::FromFile($srcPath)
$sizes = @(16, 32, 48, 64, 128, 256)
$pngs = New-Object System.Collections.Generic.List[byte[]]
foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($src, 0, 0, $s, $s)
  $g.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  $pngs.Add($ms.ToArray())
  $ms.Dispose()
}
$src.Dispose()
$out = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $out
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$sizes.Count)
$offset = 6 + (16 * $sizes.Count)
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = [int]$sizes[$i]
  $dim = [byte]0
  if ($s -lt 256) { $dim = [byte]$s }
  $bw.Write($dim)
  $bw.Write($dim)
  $bw.Write([byte]0)
  $bw.Write([byte]0)
  $bw.Write([uint16]1)
  $bw.Write([uint16]32)
  $bw.Write([uint32]$pngs[$i].Length)
  $bw.Write([uint32]$offset)
  $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
$bw.Flush()
[System.IO.File]::WriteAllBytes($outPath, $out.ToArray())
$bw.Dispose()
Write-Output ("wrote " + $outPath + " " + (Get-Item $outPath).Length)
