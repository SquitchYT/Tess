use portable_pty::Child;
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::sync::{Arc, Mutex, RwLock};

use crate::common::errors::PtyError;
use crate::configuration::deserialized::Profile;
use tauri::{AppHandle, Manager};

use crate::common::payloads::{PtySendData, PtyTitleChanged};

#[cfg(target_os = "windows")]
use crate::common::utils::get_leader_process_name;
#[cfg(target_os = "windows")]
use lazy_static::lazy_static;
#[cfg(target_os = "windows")]
use regex::{Captures, Regex};
#[cfg(target_os = "windows")]
use remoteprocess::Process;
#[cfg(target_os = "windows")]
use std::ffi::OsString;

pub struct Pty {
    pub app: Arc<AppHandle>,
    pair: Arc<Mutex<portable_pty::PtyPair>>,
    child: Option<Arc<Mutex<Box<dyn Child + Send + Sync>>>>,
    #[cfg(target_family = "unix")]
    current_leader: Arc<RwLock<i32>>,
    #[cfg(target_os = "windows")]
    leader_programm_name: Arc<Mutex<OsString>>,
    writer: Option<Box<dyn std::io::Write + Send>>,
    is_running: Arc<RwLock<bool>>,
    title_is_running_process: Arc<RwLock<bool>>,
}

unsafe impl Send for Pty {}
unsafe impl Sync for Pty {}

impl Pty {
    pub fn new(
        app: Arc<AppHandle>,
        profile: Profile,
        cols: u16,
        rows: u16,
        id: String,
    ) -> Result<Self, PtyError> {
        let pty_system = native_pty_system();

        if let Ok(pair) = pty_system.openpty(PtySize {
            rows: rows,
            cols: cols,
            pixel_width: 0,
            pixel_height: 0,
        }) {
            let mut pty = Pty {
                app,
                pair: Arc::new(Mutex::from(pair)),
                child: None,
                #[cfg(target_family = "unix")]
                current_leader: Arc::new(RwLock::new(0)),
                #[cfg(target_os = "windows")]
                leader_programm_name: Arc::new(Mutex::from(OsString::new())),
                writer: None,
                is_running: Arc::new(RwLock::new(true)),
                title_is_running_process: Arc::new(RwLock::new(
                    profile.terminal_options.title_is_running_process,
                )),
            };

            pty.run(profile, id)?;

            Ok(pty)
        } else {
            Err(PtyError::Create(String::from(
                "An error occured when creating a new terminal.",
            )))
        }
    }

    pub fn run(&mut self, profile: Profile, id: String) -> Result<(), PtyError> {
        #[cfg(target_os = "windows")]
        lazy_static! {
            static ref PROGRAMM_PARSING_REGEX: Regex = Regex::new("%([[:word:]]*)%").unwrap();
        }

        #[cfg(target_os = "windows")]
        let cmd: String = PROGRAMM_PARSING_REGEX
            .replace_all(&profile.command, |env_variable: &Captures| {
                std::env::var(&env_variable[1]).unwrap_or_default()
            })
            .into();

        #[cfg(target_family = "unix")]
        let cmd = profile.command;

        #[allow(unused_mut)]
        let mut command_builder = CommandBuilder::from_argv(Vec::from_iter(
            cmd.split(' ')
               .map(|s| std::ffi::OsString::from(s)),
        ));

        #[cfg(target_family = "unix")]
        command_builder.env("TERM", "xterm-256color");

        let locked_pair = self.pair.lock().unwrap();

        if let Ok(child) = locked_pair.slave.spawn_command(command_builder) {
            #[cfg(target_os = "windows")]
            let tmp_pty_pid = child.process_id().unwrap();

            let child = Arc::from(Mutex::from(child));
            let child_clone = child.clone();

            if let Ok(mut reader) = locked_pair.master.try_clone_reader() {
                let app = self.app.as_ref().clone();
                let cloned_app = app.clone();

                let id_cloned = id.clone();

                self.child = Some(child);
                self.writer = Some(locked_pair.master.take_writer().unwrap());

                let is_running = self.is_running.clone();
                let is_running_cloned = is_running.clone();

                let title_is_running_process = self.title_is_running_process.clone();

                #[cfg(target_os = "windows")]
                let leader_programm_name = self.leader_programm_name.clone();

                #[cfg(target_family = "unix")]
                let cloned_pair = self.pair.clone();
                #[cfg(target_family = "unix")]
                let current_process_leader_pid = self.current_leader.clone();

                std::thread::spawn(move || {
                    while *is_running.read().unwrap() {
                        let mut buffer = [0; 4096];

                        if reader.read(&mut buffer).is_ok() {
                            app.emit_all(
                                "terminalData",
                                PtySendData {
                                    data: String::from_utf8(buffer.to_vec()).unwrap_or_default(),
                                    id: id.clone(),
                                },
                            )
                            .ok();
                        }
                    }
                });

                std::thread::spawn(move || {
                    while *is_running_cloned.read().unwrap() {
                        if let Ok(Some(_)) = child_clone.as_ref().lock().unwrap().try_wait() {
                            *is_running_cloned.write().unwrap() = false;

                            cloned_app
                                .emit_all("terminal_closed", id_cloned.clone())
                                .ok();

                            break;
                        } else {
                            if *title_is_running_process.read().unwrap() {
                                #[cfg(target_os = "windows")]
                                {
                                    let leader_process_name =
                                        get_leader_process_name(Process::new(tmp_pty_pid).unwrap());

                                    if let Some(new_leader_process_name) = leader_process_name {
                                        let mut leader_programm_name_locked =
                                            leader_programm_name.lock().unwrap();

                                        if new_leader_process_name != *leader_programm_name_locked {
                                            *leader_programm_name_locked = new_leader_process_name;

                                            cloned_app
                                                .emit_all(
                                                    "terminalTitleChanged",
                                                    PtyTitleChanged {
                                                        id: id_cloned.clone(),
                                                        title: leader_programm_name_locked
                                                            .clone()
                                                            .into_string()
                                                            .unwrap(),
                                                    },
                                                )
                                                .ok();
                                        }
                                    }
                                }

                                #[cfg(target_family = "unix")]
                                {
                                    let cloned_locked_pair = cloned_pair.lock().unwrap();

                                    if let Some(process_leader_pid) =
                                        cloned_locked_pair.master.process_group_leader()
                                    {
                                        if process_leader_pid
                                            != *current_process_leader_pid.read().unwrap()
                                        {
                                            std::thread::sleep(std::time::Duration::from_millis(5));

                                            *current_process_leader_pid.write().unwrap() =
                                                process_leader_pid;

                                            if let Ok(mut process_leader_title) =
                                                std::fs::read_to_string(format!(
                                                    "/proc/{}/comm",
                                                    process_leader_pid
                                                ))
                                            {
                                                process_leader_title.pop();

                                                cloned_app
                                                    .emit_all(
                                                        "terminalTitleChanged",
                                                        PtyTitleChanged {
                                                            id: id_cloned.clone(),
                                                            title: process_leader_title,
                                                        },
                                                    )
                                                    .ok();
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        std::thread::sleep(std::time::Duration::from_millis(10));
                    }
                });
            };

            Ok(())
        } else {
            Err(PtyError::Create(String::from(
                "An error occured when creating a new terminal.",
            )))
        }
    }

    pub fn write(&mut self, content: String) -> Result<(), PtyError> {
        if let Ok(()) = write!(self.writer.as_mut().unwrap(), "{}", content) {
            Ok(())
        } else {
            Err(PtyError::Write(String::from(
                "pty doesn't accept the incoming data",
            )))
        }
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), PtyError> {
        if let Ok(()) = self
            .pair
            .lock()
            .unwrap()
            .master
            .resize(portable_pty::PtySize {
                cols,
                rows,
                pixel_height: 0,
                pixel_width: 0,
            })
        {
            Ok(())
        } else {
            Err(PtyError::Resize(String::from(
                "pty doesn't accept the resize operation.",
            )))
        }
    }

    pub fn close(&mut self) -> Result<(), PtyError> {
        if let Some(child) = self.child.as_deref() {
            *self.is_running.write().unwrap() = false;

            if let Ok(mut child) = child.lock() {
                if child.try_wait().is_ok_and(|x| x.is_some()) {
                    Ok(())
                } else if let Ok(()) = child.kill() {
                    Ok(())
                } else {
                    todo!()
                }
            } else {
                todo!()
            }
        } else {
            todo!()
        }
    }
}
