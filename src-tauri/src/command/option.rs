use crate::common::option::Option;
use std::sync::{Arc, Mutex};
#[tauri::command]
pub async fn get_configuration(option: tauri::State<'_, Arc<Mutex<Option>>>) -> Result<Option, ()> {
    Ok(option.lock().unwrap().clone())
}
