#[tauri::command]
pub fn close_window(window: tauri::Window) -> Result<(), ()> {
    window.close().unwrap();

    Ok(())
}
