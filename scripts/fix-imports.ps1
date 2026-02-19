$files = Get-ChildItem -Path "src" -Include "*.ts", "*.tsx" -Recurse
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName | Out-String
        if ($content -match "import dbConnect from '@/lib/db/dbConnect'") {
            Write-Host "Fixing $($file.FullName)"
            $content = $content.Replace("import dbConnect from '@/lib/db/dbConnect'", "import { connectToDatabase as dbConnect } from '@/lib/db/mongodb'")
            $content = $content.Replace("import dbConnect from '@/lib/db/dbConnect';", "import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';")
            # Trim trailing newline from Out-String if needed, but Replace handles matching content
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        }
    }
    catch {
        Write-Host "Error processing $($file.FullName): $_"
    }
}
Write-Host "Done fixing imports."
