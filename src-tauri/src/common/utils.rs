use crate::configuration::deserialized::TerminalTheme;

#[cfg(target_os = "windows")]
use std::ffi::OsString;

pub fn parse_theme(location: String) -> (Option<String>, Option<TerminalTheme>) {
    let theme_path = if std::path::Path::new(&format!(
        "{}/tess/themes/{}",
        dirs_next::config_dir().unwrap_or_default().display(),
        location
    ))
    .exists()
    {
        Some(format!(
            "{}/tess/themes/{}",
            dirs_next::config_dir().unwrap_or_default().display(),
            location
        ))
    } else if std::path::Path::new(&location).exists() {
        Some(location)
    } else {
        None
    };

    if let Some(theme_path) = theme_path {
        let app_theme = if std::path::Path::new(&format!("{}/style.css", theme_path)).exists() {
            Some(format!("{}/style.css", theme_path))
        } else {
            None
        };
        let terminal_theme =
            if std::path::Path::new(&format!("{}/terminal.json", theme_path)).exists() {
                Some(
                    serde_json::from_str(
                        &std::fs::read_to_string(std::path::Path::new(&format!(
                            "{}/terminal.json",
                            theme_path
                        )))
                        .unwrap_or_default(),
                    )
                    .unwrap_or_default(),
                )
            } else {
                None
            };

        (app_theme, terminal_theme)
    } else {
        (None, None)
    }
}

#[cfg(target_os = "windows")]
pub fn get_leader_process_name(process: remoteprocess::Process) -> Option<OsString> {
    if let Ok(childs) = process.child_processes() {
        let mut childs = childs
            .iter()
            .filter(|tmp| {
                tmp.1 == process.pid
                    && remoteprocess::Process::new(tmp.0)
                        .is_ok_and(|sub_process| sub_process.exe().is_ok())
            })
            .collect::<Vec<&(u32, u32)>>();

        if childs.is_empty() {
            std::path::Path::new(&process.exe().ok().unwrap_or_default())
                .file_name()
                .map(|x| x.to_owned())
        } else {
            childs.sort();

            if let Ok(child_process) =
                remoteprocess::Process::new(childs.as_slice().last().unwrap().0)
            {
                get_leader_process_name(child_process)
            } else {
                std::path::Path::new(&process.exe().ok().unwrap_or_default())
                    .file_name()
                    .map(|x| x.to_owned())
            }
        }
    } else {
        std::path::Path::new(&process.exe().ok().unwrap_or_default())
            .file_name()
            .map(|x| x.to_owned())
    }
}
