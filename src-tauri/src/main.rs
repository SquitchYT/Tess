#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{Manager, WindowEvent};
use tess::configuration::deserialized::Option;
use tess::configuration::types::BackgroundType;
use tess::logger::Logger;

use tess::common::commands;

#[cfg(target_family = "unix")]
use futures::stream::StreamExt;
#[cfg(target_family = "unix")]
use signal_hook::consts::signal::*;

use tess::common::states::Ptys;

use std::sync::Arc;
use tokio::sync::Mutex;

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
        let parsed_option = serde_json::from_str(&config_file);
        if let Err(err) = &parsed_option {
            logger.warn(&format!("Malformed configuration file: {err}."));
        }
        parsed_option.unwrap_or_default()
    } else {
        logger.warn("Cannot read configuration file.");
        Option::default()
    }));

    tauri::async_runtime::set(tokio::runtime::Handle::current());
    let app = tauri::Builder::default()
        .manage(option.clone())
        .manage(Ptys::default())
        .invoke_handler(tauri::generate_handler![
            commands::pty_open,
            commands::pty_close,
            commands::pty_write,
            commands::pty_resize,
            commands::pty_get_title,
            commands::pty_get_closable,
            commands::pty_resume,
            commands::pty_pause,
            commands::utils_close_app,
            commands::utils_get_configuration,
            commands::window_close,
            commands::window_set_title
        ])
        .build(tauri::generate_context!())
        .unwrap();

    match &option.lock().await.background {
        BackgroundType::Media(media) => {
            app.fs_scope().allow_file(&media.location).ok();
        }
        #[cfg(target_family = "unix")]
        BackgroundType::Blurred => {
            todo!()
        }
        #[cfg(target_os = "windows")]
        BackgroundType::Mica => {
            if window_vibrancy::apply_mica(app.get_window("main").unwrap()).is_err() {
                logger.warn(
                    "Cannot apply mica background effect. Switching back to transparent background",
                );
            }
        }
        #[cfg(target_os = "windows")]
        BackgroundType::Acrylic => {
            if window_vibrancy::apply_acrylic(app.get_window("main").unwrap(), None).is_err() {
                logger.warn("Cannot apply acrylic background effect. Switching back to transparent background");
            }
        }
        #[cfg(target_os = "macos")]
        BackgroundType::Vibrancy => {
            todo!()
        }
        _ => {}
    }

    app.get_window("main").unwrap().set_decorations(true).ok();

    app.fs_scope()
        .allow_file(&option.lock().await.app_theme)
        .ok();

    app.run(move |app, event| match event {
        tauri::RunEvent::Ready => {
            #[cfg(debug_assertions)]
            app.get_window("main").unwrap().open_devtools();

            #[cfg(target_family = "unix")]
            {
                let app_cloned = app.clone();
                tokio::spawn(async move {
                    if let Ok(mut signals_stream) =
                        signal_hook_tokio::Signals::new([SIGQUIT, SIGTERM])
                    {
                        while signals_stream.next().await.is_some() {
                            let windows_count = app_cloned.windows().len();
                            if windows_count > 1 {
                                app_cloned
                                    .get_window("main")
                                    .unwrap()
                                    .emit("js_app_request_exit", windows_count)
                                    .ok();
                            } else {
                                app_cloned
                                    .get_window("main")
                                    .unwrap()
                                    .emit("js_window_request_closing", ())
                                    .ok();
                            }
                        }
                    } else {
                        logger.fatal("Unable to register the signal handler")
                    }
                });
            }

            logger.info(&format!("Launched in {}ms.", start.elapsed().as_millis()));
        }
        tauri::RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } => tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(async {
                if option.lock().await.close_confirmation.window {
                    app.get_window(&label)
                        .unwrap()
                        .emit("js_window_request_closing", ())
                        .ok();

                    api.prevent_close()
                }
            })
        }),
        _ => (),
    })
}
