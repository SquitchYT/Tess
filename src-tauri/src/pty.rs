use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use portable_pty::Child;
use std::sync::{Arc, Mutex};

use crate::common::errors::PtyError;
use std::sync::mpsc::{Receiver, Sender, TryRecvError};
use tauri::{AppHandle, Manager};

use crate::common::payloads::PtySendData;

pub struct Pty {
    pub app: Arc<AppHandle>,
    pair: Arc<portable_pty::PtyPair>,
    close_channel_sender: Sender<()>,
    child: Option<Arc<Mutex<Box<dyn Child + Send + Sync>>>>,
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
                app: app,
                pair: Arc::new(pair),
                child: None,
                close_channel_sender: sender,
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
        let cmd = CommandBuilder::from_argv(Vec::from_iter(
            cmd.split(' ').map(|s| std::ffi::OsString::from(s)),
        ));

        if let Ok(child) = self.pair.slave.spawn_command(cmd) {
            let child = Arc::from(Mutex::from(child));
            let child_cloned = child.clone();
            let second_child_clone = child.clone();

            if let Ok(mut reader) = self.pair.clone().master.try_clone_reader() {
                let app = self.app.as_ref().clone();
                let cloned_app = app.clone();

                let id_cloned = id.clone();

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
                    if let Ok(Some(_)) = second_child_clone.as_ref().lock().unwrap().try_wait() {
                        cloned_app
                            .emit_all("terminal_closed", id_cloned.clone())
                            .ok();

                        break;
                    }

                    std::thread::sleep(std::time::Duration::from_millis(5));
                });
            };

            self.child = Some(child);

            Ok(())
        } else {
            Err(PtyError::Create(String::from(
                "An error occured when creating a new terminal.",
            )))
        }
    }

    pub fn write(&mut self, content: String) -> Result<(), PtyError> {
        if let Ok(()) = write!(
            self.pair.clone().master.try_clone_writer().unwrap(),
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
}
