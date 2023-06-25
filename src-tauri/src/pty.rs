use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use portable_pty::Child;
use std::sync::{Arc, Mutex};

use crate::common::errors::PtyError;
use std::sync::mpsc::{Receiver, Sender, TryRecvError};
use tauri::{AppHandle, Manager};

use crate::common::payloads::PtySendData;

#[cfg(target_os = "windows")]
use lazy_static::lazy_static;
#[cfg(target_os = "windows")]
use regex::{Regex, Captures};

use crate::common::utils::get_leader_process_name;


pub struct Pty {
    pub app: Arc<AppHandle>,
    pair: portable_pty::PtyPair,
    close_channel_sender: Sender<()>,
    child: Option<Arc<Mutex<Box<dyn Child + Send + Sync>>>>,
    current_leader: i32,
    writer: Option<Box<dyn std::io::Write + Send>>
}

unsafe impl Send for Pty {}
unsafe impl Sync for Pty {}

impl Pty {
    pub fn new(
        app: Arc<AppHandle>,
        cmd: &str,
        cols: u16,
        rows: u16,
        id: String,
    ) -> Result<Self, PtyError> {
        let pty_system = native_pty_system();

        let pair = pty_system.openpty(PtySize {
            rows: rows,
            cols: cols,
            pixel_width: 0,
            pixel_height: 0,
        });

        let (sender, receiver) = std::sync::mpsc::channel::<()>();

        if let Ok(pair) = pair {
            let mut pty = Pty {
                app,
                pair,
                child: None,
                close_channel_sender: sender,
                current_leader: 0,
                writer: None
            };

            pty.run(cmd, id, receiver)?;

            Ok(pty)
        } else {
            Err(PtyError::Create(String::from(
                "An error occured when creating a new terminal.",
            )))
        }
    }

    pub fn run(
        &mut self,
        cmd: &str,
        id: String,
        close_channel_receiver: Receiver<()>,
    ) -> Result<(), PtyError> {
        #[cfg(target_os = "windows")]
        lazy_static! {
            static ref PROGRAMM_PARSING_REGEX: Regex = Regex::new("%([[:word:]]*)%").unwrap();
        }

        #[cfg(target_os = "windows")]
        let cmd: String = PROGRAMM_PARSING_REGEX.replace_all(&cmd, |env_variable: &Captures| {
            std::env::var(&env_variable[1]).unwrap_or_default()
        }).into();

        let mut command_builder = CommandBuilder::from_argv(Vec::from_iter(
            cmd.split(' ').map(|s| std::ffi::OsString::from(s)),
        ));

        #[cfg(target_family = "unix")]
        command_builder.env("TERM", "xterm-256color");

        if let Ok(child) = self.pair.slave.spawn_command(command_builder) {
            let child = Arc::from(Mutex::from(child));
            let child_clone = child.clone();

            if let Ok(mut reader) = self.pair.master.try_clone_reader() {
                let app = self.app.as_ref().clone();
                let cloned_app = app.clone();

                let id_cloned = id.clone();

                self.child = Some(child);
                self.writer = Some(self.pair.master.take_writer().unwrap());

                std::thread::spawn(move || loop {
                    match close_channel_receiver.try_recv() {
                        Err(TryRecvError::Empty) => {
                            let mut buffer = [0; 4096];

                            if reader.read(&mut buffer).is_ok() {
                                app.emit_all(
                                    "terminalData",
                                    PtySendData {
                                        data: String::from_utf8(buffer.to_vec())
                                            .unwrap_or_default(),
                                        id: id.clone(),
                                    },
                                )
                                .ok();
                            }
                        }
                        _ => {
                            break;
                        }
                    }
                });

                std::thread::spawn(move || loop {
                    if let Ok(Some(_)) = child_clone.as_ref().lock().unwrap().try_wait() {
                        cloned_app
                            .emit_all("terminal_closed", id_cloned.clone())
                            .ok();

                        break;
                    }

                    std::thread::sleep(std::time::Duration::from_millis(5));
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
        if let Ok(()) = write!(
            self.writer.as_mut().unwrap(),
            "{}",
            content
        ) {
            Ok(())
        } else {
            Err(PtyError::Write(String::from(
                "pty doesn't accept the incoming data",
            )))
        }
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), PtyError> {
        if let Ok(()) = self.pair.master.resize(portable_pty::PtySize {
            cols,
            rows,
            pixel_height: 0,
            pixel_width: 0,
        }) {
            Ok(())
        } else {
            Err(PtyError::Resize(String::from(
                "pty doesn't accept the resize operation.",
            )))
        }
    }

    pub fn close(&mut self) -> Result<(), PtyError> {
        if let Some(child) = self.child.as_deref() {
            if let Ok(mut child) = child.lock() {
                if let Ok(()) = child.kill() {
                    if let Ok(()) = self.close_channel_sender.send(()) {
                        Ok(())
                    } else {
                        Err(PtyError::Kill(String::from(
                            "process didn't terminate correctly.",
                        )))
                    }
                } else if let Ok(_) = child.try_wait() {
                    if let Ok(()) = self.close_channel_sender.send(()) {
                        Ok(())
                    } else {
                        Err(PtyError::Kill(String::from(
                            "process didn't terminate correctly.",
                        )))
                    }
                } else {
                    Err(PtyError::Kill(String::from(
                        "process didn't terminate correctly.",
                    )))
                }
            } else {
                Err(PtyError::Kill(String::from(
                    "doesn't have access to the pty.",
                )))
            }
        } else {
            Err(PtyError::Kill(String::from(
                "doesn't have access to the pty.",
            )))
        }
    }

    pub fn get_title(&mut self) {
        #[cfg(target_family = "unix")]
        if let Some(process_leader_pid) = self.pair.master.process_group_leader() {
            if self.current_leader != process_leader_pid {
                self.current_leader = process_leader_pid;

                if let Ok(mut process_leader_title) = std::fs::read_to_string(format!("/proc/{}/comm", process_leader_pid)) {
                    process_leader_title.pop();
                    println!("{:?}", process_leader_title);
                }
            }
        }

        #[cfg(target_os = "windows")]
        todo!()
    }
}
