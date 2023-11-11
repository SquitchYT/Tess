#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, WindowEvent};
use tess::command::{app::*, option::*, term::*, window::*};
use tess::configuration::deserialized::Option;
use tess::configuration::types::BackgroundType;
use tess::logger::Logger;

#[cfg(target_family = "unix")]
use futures::stream::StreamExt;
#[cfg(target_family = "unix")]
use signal_hook::consts::signal::*;

use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() {
    let start = std::time::Instant::now();
    let logger = Logger {};

    #[cfg(target_family = "unix")]
    let config_file = std::fs::read_to_string(format!(
        "{}/tess/config.json",
        dirs_next::config_dir().unwrap_or_default().display()
    ));
    #[cfg(target_os = "windows")]
    let config_file = std::fs::read_to_string(format!(
        "{}/Tess/config.json",
        dirs_next::config_dir().unwrap_or_default().display()
    ));

    let option = Arc::from(Mutex::from(if let Ok(config_file) = config_file {
        // TODO: Log error
        serde_json::from_str(&config_file).unwrap_or_default()
    } else {
        Option::default()
    }));

    tauri::async_runtime::set(tokio::runtime::Handle::current());
    let app = tauri::Builder::default()
        .manage(Mutex::new(tess::state::pty_manager::PtyManager::new()))
        .manage(option.clone())
        .invoke_handler(tauri::generate_handler![
            create_terminal,
            terminal_input,
            resize_terminal,
            close_terminal,
            close_window,
            close_app,
            check_close_availability,
            get_pty_title,
            get_configuration
        ])
        .build(tauri::generate_context!());

    let app_handle = app.as_ref().unwrap().app_handle();

    match &option.lock().unwrap().background {
        BackgroundType::Media(media) => {
            app_handle.fs_scope().allow_file(&media.location).ok();
        }
        #[cfg(target_family = "unix")]
        BackgroundType::Blurred => {
            todo!()
        }
        #[cfg(target_os = "windows")]
        BackgroundType::Mica => {
            if window_vibrancy::apply_mica(app_handle.get_window("main").unwrap()).is_err() {
                logger.warn(
                    "Cannot apply mica background effect. Switching back to transparent background",
                );
            }
        }
        #[cfg(target_os = "windows")]
        BackgroundType::Acrylic => {
            if window_vibrancy::apply_acrylic(app_handle.get_window("main").unwrap(), None).is_err()
            {
                logger.warn("Cannot apply acrylic background effect. Switching back to transparent background");
            }
        }
        #[cfg(target_os = "macos")]
        BackgroundType::Vibrancy => {
            todo!()
        }
        _ => {}
    }

    app_handle
        .get_window("main")
        .unwrap()
        .set_decorations(true)
        .ok();

    app_handle
        .fs_scope()
        .allow_file(&option.lock().unwrap().app_theme)
        .ok();

    app.unwrap().run(move |app, event| match event {
        tauri::RunEvent::Ready => {
            #[cfg(debug_assertions)]
            app.get_window("main").unwrap().open_devtools();

            #[cfg(target_family = "unix")]
            {
                let app_cloned = app.clone();
                tokio::spawn(async move {
                    if let Ok(mut signals_stream) = signal_hook_tokio::Signals::new(&[SIGQUIT, SIGTERM]) {
                        while let Some(_) = signals_stream.next().await {
                            let windows_count = app_cloned.windows().len();
                            if windows_count > 1 {
                                app_cloned
                                    .get_window("main")
                                    .unwrap()
                                    .emit("request_app_exit", windows_count)
                                    .ok();
                            } else {
                                app_cloned
                                    .get_window("main")
                                    .unwrap()
                                    .emit("request_window_closing", ())
                                    .ok();
                            }
                        }
                    } else {
                        logger.fatal("Unable to register the signal handler")
                    }
                });
            }

            logger.info(&format!("Launched in {}ms", start.elapsed().as_millis()));
        }
        tauri::RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } => {
            if option.lock().unwrap().close_confirmation.window {
                app.get_window(&label)
                    .unwrap()
                    .emit("request_window_closing", "")
                    .ok();

                api.prevent_close()
            }
        }
        _ => (),
    })
}
