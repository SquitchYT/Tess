use crate::common::payloads::{PtySendData, PtyTitleChanged};
use crate::common::states::Ptys;
use crate::configuration::deserialized::Option;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

use crate::common::error::PtyError;

use crate::pty::pty::Pty;

#[tauri::command]
pub async fn pty_open(
    app: tauri::AppHandle,
    id: String,
    profile_uuid: String,
    option: tauri::State<'_, Arc<Mutex<Option>>>,
    ptys: tauri::State<'_, Ptys>,
) -> Result<(), PtyError> {
    let id_cloned = id.clone();
    let id_cloned_twice = id.clone();
    let id_cloned_thrice = id.clone();
    let app_cloned = app.clone();
    let app_cloned_twice = app.clone();

    let locked_option = option.lock().await;
    let opening_profile = locked_option
        .profiles
        .iter()
        .find(|profile| profile.uuid == profile_uuid)
        .ok_or(PtyError::UnknownPty)?;

    let should_update_title = opening_profile.terminal_options.title_is_running_process;

    ptys.0.lock().await.insert(
        id.clone(),
        Pty::build_and_run(
            &opening_profile.command,
            move |readed| {
                app.emit_all(
                    "js_pty_data",
                    PtySendData {
                        data: std::str::from_utf8(&readed).unwrap_or_default(),
                        id: &id_cloned,
                    },
                )
                .ok();
            },
            move |tab_title| {
                if should_update_title {
                    app_cloned
                        .emit_all(
                            "js_pty_title_update",
                            PtyTitleChanged {
                                id: &id_cloned_twice,
                                title: tab_title,
                            },
                        )
                        .ok();
                }
            },
            move || {
                app_cloned_twice
                    .emit_all("js_pty_closed", id_cloned_thrice)
                    .ok();
            },
        )?,
    );

    Ok(())
}

#[tauri::command]
pub async fn pty_close(ptys: tauri::State<'_, Ptys>, id: String) -> Result<(), PtyError> {
    ptys.0
        .lock()
        .await
        .get(&id)
        .ok_or(PtyError::UnknownPty)?
        .kill()
        .await
}

#[tauri::command]
pub async fn pty_write(
    id: String,
    content: String,
    ptys: tauri::State<'_, Ptys>,
) -> Result<(), PtyError> {
    ptys.0
        .lock()
        .await
        .get_mut(&id)
        .ok_or(PtyError::UnknownPty)?
        .write(&content)
}

#[tauri::command]
pub async fn pty_resize(
    ptys: tauri::State<'_, Ptys>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), PtyError> {
    ptys.0
        .lock()
        .await
        .get(&id)
        .ok_or(PtyError::UnknownPty)?
        .resize(cols, rows)
        .await
}

#[tauri::command]
pub async fn pty_get_closable(
    ptys: tauri::State<'_, Ptys>,
    app_config: tauri::State<'_, Arc<Mutex<Option>>>,
    id: String,
) -> Result<bool, PtyError> {
    let app_config = app_config.lock().await;

    if app_config.close_confirmation.tab {
        let locked_ptys = ptys.0.lock().await;
        let pty = locked_ptys.get(&id).ok_or(PtyError::UnknownPty)?;

        Ok(pty.closed.load(std::sync::atomic::Ordering::Relaxed)
            || app_config
                .close_confirmation
                .excluded_process
                .contains(&*pty.title.lock().await))
    } else {
        Ok(true)
    }
}

#[tauri::command]
pub async fn pty_get_title(ptys: tauri::State<'_, Ptys>, id: String) -> Result<String, PtyError> {
    Ok(ptys
        .0
        .lock()
        .await
        .get_mut(&id)
        .ok_or(PtyError::UnknownPty)?
        .title
        .lock()
        .await
        .to_string())
}
