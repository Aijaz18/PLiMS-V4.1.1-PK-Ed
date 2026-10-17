
Unicode True
Name "PLiMS 4.1.1 PK Edition"
OutFile "/app/applet/.staging-desktop/PLiMS.exe"
Icon "/app/applet/.staging-desktop/plims.ico"
SilentInstall silent
RequestExecutionLevel user
AutoCloseWindow true
ShowInstDetails nevershow

Section "LaunchPLiMS"
  SetOutPath "$EXEDIR"
  nsExec::Exec '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process powershell.exe -ArgumentList \"-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `\"$EXEDIR\server.ps1`\" -LaunchBrowser\" -WindowStyle Hidden"'
SectionEnd
