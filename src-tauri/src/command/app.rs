#[tauri::command]
pub fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}
