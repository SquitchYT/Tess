#[cfg(target_os = "windows")]
pub fn get_leader_pid(shell_pid: u32) -> u32 {
    use std::mem::size_of;
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
    };

    use windows::Win32::System::Diagnostics::ToolHelp::TH32CS_SNAPPROCESS;

    let mut leader_pid = shell_pid;

    let handle = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0).unwrap() };
    let mut process_entry = PROCESSENTRY32W {
        dwSize: size_of::<PROCESSENTRY32W>().try_into().unwrap_or_default(),
        ..Default::default()
    };

    let mut next_entry_result: windows::core::Result<()> =
        unsafe { Process32FirstW(handle, &mut process_entry) };
    while next_entry_result.is_ok() {
        if process_entry.th32ParentProcessID == leader_pid {
            leader_pid = process_entry.th32ProcessID;
        }

        next_entry_result = unsafe { Process32NextW(handle, &mut process_entry) };
    }

    leader_pid
}

#[cfg(target_os = "windows")]
pub async fn get_process_title(pid: u32, fetched_title: &mut Option<String>) {
    use std::{ffi::OsString, os::windows::ffi::OsStringExt};
    use windows::Win32::{
        Foundation::CloseHandle,
        System::Threading::{PROCESS_QUERY_INFORMATION, PROCESS_VM_READ},
    };

    *fetched_title = tokio::task::spawn_blocking(move || {
        unsafe {
            windows::Win32::System::Threading::OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                false,
                pid,
            )
        }
        .map_or(None, |handle| {
            let mut path = [0; 4096];
            let path_len = unsafe {
                windows::Win32::System::ProcessStatus::GetModuleFileNameExW(handle, None, &mut path)
            };

            unsafe { CloseHandle(handle).ok() };

            std::path::PathBuf::from(OsString::from_wide(&path[..path_len as usize]))
                .file_name()
                .and_then(|filename| filename.to_os_string().into_string().ok())
        })
    })
    .await
    .unwrap_or(None);
}

#[cfg(target_family = "unix")]
pub async fn get_process_title(pid: i32, fetched_title: &mut Option<String>) {
    *fetched_title = tokio::task::spawn_blocking(move || {
        std::fs::read_to_string(format!("/proc/{pid}/comm")).map_or(
            None,
            |mut process_leader_title| {
                process_leader_title.pop();

                if process_leader_title == "tokio-runtime-w" {
                    None
                } else {
                    Some(process_leader_title)
                }
            },
        )
    })
    .await
    .unwrap();
}

#[cfg(target_family = "unix")]
pub async fn get_process_working_dir(pid: i32, fetched_pwd: &mut Option<String>) {
    *fetched_pwd = tokio::task::spawn_blocking(move || {
        std::fs::read_link(format!("/proc/{pid}/cwd"))
            .map_or(None, |path| path.into_os_string().into_string().ok())
    })
    .await
    .unwrap();
}

#[cfg(target_os = "windows")]
pub async fn get_process_working_dir(pid: u32, fetched_pwd: &mut Option<String>) {
    todo!()
}
