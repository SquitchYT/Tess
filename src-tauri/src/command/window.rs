use tauri::window;

#[tauri::command]
pub async fn close_window(window: tauri::Window) -> Result<(), ()> {
    window.close().unwrap();

    Ok(())
}