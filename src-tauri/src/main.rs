#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use notify::Watcher;
use tauri::{Manager, WindowEvent};
use tess::command::{option::*, term::*, window::*};
use tess::configuration::deserialized::Option;
use tess::configuration::types::BackgroundType;
use tess::logger::Logger;

use std::sync::{Arc, Mutex};

fn main() {
    let start = std::time::Instant::now();
    let logger = Logger{};

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

    let option_clone = option.clone();

    let app = tauri::Builder::default()
        .manage(Mutex::new(tess::state::pty_manager::PtyManager::new()))
        .manage(option.clone())
        .invoke_handler(tauri::generate_handler![
            create_terminal,
            terminal_input,
            resize_terminal,
            close_terminal,
            close_window,
            check_close_availability,
            get_pty_title,
            get_configuration
        ])
        .build(tauri::generate_context!());

    let app_handle = app.as_ref().unwrap().app_handle();

    match &option.lock().unwrap().background {
        BackgroundType::Media(media) => {
            app_handle.fs_scope().allow_file(&media.location);
        }
        #[cfg(target_family = "unix")]
        BackgroundType::Blurred => {
            todo!()
        }
        #[cfg(target_os = "windows")]
        BackgroundType::Mica => {
            if let Err(_) = window_vibrancy::apply_mica(app_handle.get_window("main").unwrap()) {
                logger.warn("Cannot apply mica background effect. Switching back to transparent background");
            }
        }
        #[cfg(target_os = "windows")]
        BackgroundType::Acrylic => {
            if let Err(_) = window_vibrancy::apply_acrylic(app_handle.get_window("main").unwrap(), None) {
                logger.warn("Cannot apply acrylic background effect. Switching back to transparent background");
            }
        }
        #[cfg(target_os = "macos")]
        BackgroundType::Vibrancy => {
            todo!()
        }
        _ => {}
    }

    app_handle.get_window("main").unwrap().set_decorations(true);


    app_handle
        .fs_scope()
        .allow_file(&option.lock().unwrap().app_theme);


    let mut watcher =
        notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
            match res {
                Ok(event) => {
                    match event.kind {
                        notify::EventKind::Access(notify::event::AccessKind::Close(..)) => {
                            let config_file = std::fs::read_to_string(format!(
                                "{}/tess/config.json",
                                dirs_next::config_dir().unwrap_or_default().display()
                            ));
                            let option = if let Ok(config_file) = config_file {
                                serde_json::from_str(&config_file).unwrap_or_default()
                            } else {
                                Option::default()
                            };

                            let mut reff = option_clone.lock().unwrap();

                            *reff = option;

                            logger.info("Refreshing config...");

                            app_handle.emit_all("global_config_updated", format!("{:?}", reff));
                        }
                        _ => (),
                    };
                }
                Err(e) => println!("Config watching error: {}", e),
            };
        })
        .unwrap();

    if let Err(watching_error) = watcher.watch(
        std::path::Path::new(&format!(
            "{}/tess/config.json",
            dirs_next::config_dir().unwrap_or_default().display()
        )),
        notify::RecursiveMode::Recursive,
    ) {
        println!("Cannot start config watching: {}", watching_error)
    }

    app.unwrap().run(move |app, event| match event {
        tauri::RunEvent::Ready => {
            logger.info(&format!("Launched in {}ms", start.elapsed().as_millis()));

            #[cfg(debug_assertions)]
            app.get_window("main").unwrap().open_devtools();
        },
        tauri::RunEvent::WindowEvent { label, event, .. } => {
            if let WindowEvent::CloseRequested{api, ..} = event {
                if option.lock().unwrap().close_confirmation.window {
                    app.get_window(&label).unwrap().emit("request_window_closing", "");

                    api.prevent_close()
                }
            };
        },
        _ => (),
    })
}
