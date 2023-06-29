use crate::configuration::deserialized::Option;
use crate::state::pty_manager::PtyManager;
use std::sync::{Arc, Mutex};

use crate::common::errors::PtyError;

#[tauri::command]
pub async fn terminal_input(
    pty_manager: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
    content: String,
) -> Result<(), PtyError> {
    if let Ok(mut pty_manager) = pty_manager.lock() {
        pty_manager.write(&id, content)?;
        Ok(())
    } else {
        Err(PtyError::ManagerUnresponding)
    }
}

#[tauri::command]
pub async fn create_terminal(
    app: tauri::AppHandle,
    pty_manager: tauri::State<'_, Mutex<PtyManager>>,
    cols: u16,
    rows: u16,
    id: String,
    profile_uuid: String,
    option: tauri::State<'_, Arc<Mutex<Option>>>,
) -> Result<(), PtyError> {
    if let Some(profile) = option
        .lock()
        .unwrap()
        .profiles
        .iter()
        .find(|profile| profile.uuid == profile_uuid)
    {
        if let Ok(mut pty_manager) = pty_manager.lock() {
            if pty_manager.app.is_none() {
                pty_manager.app = Some(Arc::new(app));
            }

            pty_manager.create_pty(cols, rows, id, profile.clone())?;
            Ok(())
        } else {
            Err(PtyError::ManagerUnresponding)
        }
    } else {
        todo!()
    }
}

#[tauri::command]
pub async fn resize_terminal(
    pty_manager: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), PtyError> {
    if let Ok(mut pty_manager) = pty_manager.lock() {
        pty_manager.resize(&id, cols, rows)?;
        Ok(())
    } else {
        Err(PtyError::ManagerUnresponding)
    }
}

#[tauri::command]
pub async fn close_terminal(
    pty_manager: tauri::State<'_, Mutex<PtyManager>>,
    id: String,
) -> Result<(), PtyError> {
    if let Ok(mut pty_manager) = pty_manager.lock() {
        pty_manager.close(&id)?;
        Ok(())
    } else {
        Err(PtyError::ManagerUnresponding)
    }
}
