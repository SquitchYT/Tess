$ErrorActionPreference = 'Stop';
$toolsDir   = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$fileLocation = Join-Path $toolsDir 'tess-setup.exe'

$packageArgs = @{
  packageName   = $env:ChocolateyPackageName
  unzipLocation = $toolsDir
  fileType      = 'exe'
  file         = $fileLocation
  softwareName  = 'tess*'

  checksum      = 'CE13083C122F596844C801127141EB83649CAE65F47F4933EB7F542307329040'
  checksumType  = 'sha256'
  checksum64    = 'CE13083C122F596844C801127141EB83649CAE65F47F4933EB7F542307329040'
  checksumType64= 'sha256'
  silentArgs   = '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-'
  validExitCodes= @(0)
}

Install-ChocolateyPackage @packageArgs 