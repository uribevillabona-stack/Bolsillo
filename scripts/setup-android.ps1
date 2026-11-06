<#
.SYNOPSIS
  Instala, sin permisos de administrador y sin costo, lo necesario para
  compilar BOLSILLO en Android desde Windows:
    - JDK 17 (Eclipse Temurin, open source)
    - Android SDK command-line tools + platform-tools (adb)
    - Plataforma, build-tools, NDK y CMake que pide React Native 0.88
  y configura JAVA_HOME, ANDROID_HOME y PATH para el usuario actual.

.NOTES
  No hace falta Android Studio para compilar. Solo se necesita si quieres el
  emulador; con un teléfono físico por USB basta este script.

  Uso (PowerShell):
    powershell -ExecutionPolicy Bypass -File scripts\setup-android.ps1
#>
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue' # Invoke-WebRequest es 10x más lento con barra

# Versiones exigidas por react-native/gradle/libs.versions.toml (RN 0.88 / Expo SDK 58).
$Platform   = 'platforms;android-37.0'  # compileSdk 37 = paquete android-37.0
$BuildTools = 'build-tools;37.0.0'
$Ndk        = 'ndk;27.1.12297006'
$CMake      = 'cmake;3.31.6'  # trae ninja 1.12 (rutas > 260; ver plugins/with-cmake-version.js)

$ToolsDir   = 'C:\dev\tools'
$JdkDir     = Join-Path $ToolsDir 'jdk-17'
$SdkDir     = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$CmdlineZip = 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip'
$JdkZip     = 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse'

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Green }

New-Item -ItemType Directory -Force $ToolsDir | Out-Null
$tmp = Join-Path $env:TEMP "bolsillo-setup-$(Get-Random)"
New-Item -ItemType Directory -Force $tmp | Out-Null

# --- JDK 17 ---------------------------------------------------------------
if (Test-Path (Join-Path $JdkDir 'bin\java.exe')) {
  Step "JDK 17 ya está en $JdkDir"
} else {
  Step 'Descargando JDK 17 (Temurin)...'
  $zip = Join-Path $tmp 'jdk.zip'
  Invoke-WebRequest -Uri $JdkZip -OutFile $zip
  Expand-Archive $zip -DestinationPath $tmp -Force
  $extracted = Get-ChildItem $tmp -Directory | Where-Object Name -like 'jdk-17*' | Select-Object -First 1
  Move-Item $extracted.FullName $JdkDir
}
$env:JAVA_HOME = $JdkDir
$env:Path = "$JdkDir\bin;$env:Path"
& "$JdkDir\bin\java.exe" -version

# --- Android command-line tools -------------------------------------------
$sdkmanager = Join-Path $SdkDir 'cmdline-tools\latest\bin\sdkmanager.bat'
if (Test-Path $sdkmanager) {
  Step 'Android command-line tools ya instaladas'
} else {
  Step 'Descargando Android command-line tools...'
  $zip = Join-Path $tmp 'cmdline.zip'
  Invoke-WebRequest -Uri $CmdlineZip -OutFile $zip
  Expand-Archive $zip -DestinationPath $tmp -Force
  # El zip trae "cmdline-tools/"; sdkmanager exige la ruta cmdline-tools/latest/.
  New-Item -ItemType Directory -Force (Join-Path $SdkDir 'cmdline-tools') | Out-Null
  Move-Item (Join-Path $tmp 'cmdline-tools') (Join-Path $SdkDir 'cmdline-tools\latest')
}

# --- Licencias y paquetes -------------------------------------------------
Step 'Aceptando licencias del SDK...'
# PowerShell no entrega bien stdin por tubería a un .bat: se redirige con cmd.
$yesFile = Join-Path $tmp 'yes.txt'
Set-Content -Path $yesFile -Value (@('y') * 40) -Encoding ascii
cmd /c "`"$sdkmanager`" --sdk_root=`"$SdkDir`" --licenses < `"$yesFile`"" | Out-Null
if (-not (Test-Path (Join-Path $SdkDir 'licenses\android-sdk-license'))) {
  throw 'No se pudieron aceptar las licencias del SDK.'
}

Step "Instalando platform-tools, $Platform, $BuildTools, $Ndk, $CMake (puede tardar)..."
& $sdkmanager --sdk_root=$SdkDir 'platform-tools' $Platform $BuildTools $Ndk $CMake
# sdkmanager devuelve 0 aunque un paquete no exista: se verifica cada uno en disco.
$expected = @(
  'platform-tools\adb.exe',
  ($Platform -replace ';', '\'),
  ($BuildTools -replace ';', '\'),
  ($Ndk -replace ';', '\'),
  ($CMake -replace ';', '\')
)
$missing = @($expected | Where-Object { -not (Test-Path (Join-Path $SdkDir $_)) })
if ($LASTEXITCODE -ne 0 -or $missing.Count -gt 0) {
  throw "sdkmanager no instaló: $($missing -join ', '). Revisa la salida de arriba."
}

# --- Variables de entorno del usuario -------------------------------------
Step 'Configurando JAVA_HOME, ANDROID_HOME y PATH (usuario)...'
[Environment]::SetEnvironmentVariable('JAVA_HOME', $JdkDir, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_HOME', $SdkDir, 'User')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($null -eq $userPath) { $userPath = '' }
# @(...) externo: si solo falta una entrada, Where-Object devuelve un string
# suelto y "+" lo concatenaría sin ';' (corrompiendo el PATH).
$current = @($userPath -split ';' | Where-Object { $_ -ne '' })
$add = @(@("$JdkDir\bin", "$SdkDir\platform-tools") | Where-Object { $current -notcontains $_ })
if ($add.Count -gt 0) {
  [Environment]::SetEnvironmentVariable('Path', (($add + $current) -join ';'), 'User')
}

# --- Rutas largas de Windows ----------------------------------------------
# React Native genera rutas de objetos C++ de más de 260 caracteres. ninja 1.12
# las soporta solo si Windows tiene LongPathsEnabled = 1 (requiere admin, por
# eso este script no lo cambia: solo avisa).
$fs = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem'
if ($fs.LongPathsEnabled -ne 1) {
  Write-Host "`n!! Falta activar las rutas largas de Windows (una sola vez)." -ForegroundColor Yellow
  Write-Host '   Abre PowerShell COMO ADMINISTRADOR y ejecuta:' -ForegroundColor Yellow
  Write-Host "   Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -Type DWord" -ForegroundColor Yellow
  Write-Host '   Sin esto la compilación falla con "Filename longer than 260 characters".' -ForegroundColor Yellow
}

Remove-Item -Recurse -Force $tmp
Step 'Listo. Cierra y vuelve a abrir la terminal para que tome las variables.'
Write-Host "  JAVA_HOME    = $JdkDir"
Write-Host "  ANDROID_HOME = $SdkDir"
& (Join-Path $SdkDir 'platform-tools\adb.exe') version
