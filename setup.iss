[Setup]
AppName=Tess
AppVersion=0.5.0
DefaultDirName={autopf}\Tess
OutputBaseFilename=tess-0.5.0-setup.exe
AppVerName=Tess
SetupIconFile="build\icon.ico"
UninstallDisplayIcon="{app}\tess.exe"
DisableDirPage=yes

[files]
Source: dist\win-unpacked\*; DestDir: "{app}"; Flags: recursesubdirs

[Registry]
Root: HKCU; SubKey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment\"; ValueType: string; ValueName: "Path"; ValueData: "{reg:HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment\,Path};{app}"

Root: HKCU; SubKey: "Software\Classes\Directory\Background\shell\Tess"; ValueType: string; ValueName: ""; ValueData: "Open Tess here"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCU; SubKey: "Software\Classes\Directory\Background\shell\Tess"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\tess.exe"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCU; SubKey: "Software\Classes\Directory\Background\shell\Tess\command"; ValueType: string; ValueName: ""; ValueData: "{app}\tess.exe --newtab --workdir=%V"; Flags: uninsdeletevalue uninsdeletekeyifempty

Root: HKCU; SubKey: "Software\Classes\Directory\shell\Tess"; ValueType: string; ValueName: ""; ValueData: "Open Tess here"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCU; SubKey: "Software\Classes\Directory\shell\Tess"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\tess.exe"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCU; SubKey: "Software\Classes\Directory\shell\Tess\command"; ValueType: string; ValueName: ""; ValueData: "{app}\tess.exe --newtab --workdir=%V"; Flags: uninsdeletevalue uninsdeletekeyifempty

Root: HKCU; SubKey: "Software\Classes\Drive\shell\Tess"; ValueType: string; ValueName: ""; ValueData: "Open Tess here"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCU; SubKey: "Software\Classes\Drive\shell\Tess"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\tess.exe"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCU; SubKey: "Software\Classes\Drive\shell\Tess\command"; ValueType: string; ValueName: ""; ValueData: "{app}\tess.exe --newtab --workdir=%V"; Flags: uninsdeletevalue uninsdeletekeyifempty

Root: HKCR; SubKey: "exefile\shell\Tess"; ValueType: string; ValueName: ""; ValueData: "Execute App in Tess"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCR; SubKey: "exefile\shell\Tess"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\tess.exe"; Flags: uninsdeletevalue uninsdeletekeyifempty
Root: HKCR; SubKey: "exefile\shell\Tess\command"; ValueType: string; ValueName: ""; ValueData: "{app}\tess.exe --newtab --e=%V"; Flags: uninsdeletevalue uninsdeletekeyifempty

[Icons]
Name: "{userdesktop}\Tess"; Filename: "{app}\tess.exe"

[Code]
procedure RemovePath(Path: string);
var
  Paths: string;
  P: Integer;
begin
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', Paths) then
  begin
    Log('PATH not found');
  end
    else
  begin
    Log(Format('PATH is [%s]', [Paths]));

    P := Pos(';' + Uppercase(Path) + ';', ';' + Uppercase(Paths) + ';');
    if P = 0 then
    begin
      Log(Format('Path [%s] not found in PATH', [Path]));
    end
      else
    begin
      if P > 1 then P := P - 1;
      Delete(Paths, P, Length(Path) + 1);
      Log(Format('Path [%s] removed from PATH => [%s]', [Path, Paths]));

      if RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', Paths) then
      begin
        Log('PATH written');
      end
        else
      begin
        Log('Error writing PATH');
      end;
    end;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    RemovePath(ExpandConstant('{app}'));
  end;
end;

function SetTimer(hWnd, nIDEvent, uElapse, lpTimerFunc: LongWord): LongWord;
  external 'SetTimer@User32.dll stdcall';
function KillTimer(hWnd, nIDEvent: LongWord): LongWord;
  external 'KillTimer@User32.dll stdcall';

var
  SubmitPageTimer: LongWord;

procedure KillSubmitPageTimer;
begin
  KillTimer(0, SubmitPageTimer);
  SubmitPageTimer := 0;
end;  

procedure SubmitPageProc(H: LongWord; Msg: LongWord; IdEvent: LongWord; Time: LongWord);
begin
  WizardForm.NextButton.OnClick(WizardForm.NextButton);
  KillSubmitPageTimer;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = wpReady then
  begin
    SubmitPageTimer := SetTimer(0, 0, 100, CreateCallback(@SubmitPageProc));
  end
    else
  begin
    if SubmitPageTimer <> 0 then
    begin
      KillSubmitPageTimer;
    end;
  end;
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := True;
end;