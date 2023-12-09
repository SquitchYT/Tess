#[tauri::command]
pub fn window_close(window: tauri::Window) {
    window.close().ok();
}
