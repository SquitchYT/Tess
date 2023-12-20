use std::ffi::OsString;
use std::io::{Read, Write};
use std::sync::{mpsc, Arc};
use std::time::Duration;

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use regex::Captures;
use tokio::sync::Mutex;

use std::sync::atomic::{AtomicBool, Ordering};

use crate::common::error::PtyError;
use crate::pty::utils;

#[cfg(target_os = "windows")]
use regex::Regex;

pub struct Pty {
    writer: Box<dyn Write + Send>,
    child: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
    master: Arc<Mutex<Box<dyn MasterPty + Send>>>,
    paused: Arc<AtomicBool>,

    pub title: Arc<Mutex<String>>,
    pub closed: Arc<AtomicBool>,
}

unsafe impl Send for Pty {}
unsafe impl Sync for Pty {}

impl Pty {
    pub async fn build_and_run(
        command: &str,
        on_read: impl Fn(&str) + std::marker::Send + 'static,
        on_tab_title_update: impl Fn(&str) + std::marker::Send + 'static,
        once_exit: impl FnOnce() + std::marker::Send + 'static,
    ) -> Result<Self, PtyError> {
        #[cfg(target_os = "windows")]
        lazy_static::lazy_static! {
            static ref PROGRAMM_PARSING_REGEX: Regex = Regex::new("%([[:word:]]*)%").unwrap();
        }

        #[cfg(target_os = "windows")]
        let builded_command = CommandBuilder::from_argv(
            PROGRAMM_PARSING_REGEX
                .replace_all(command, |env_variable: &Captures| {
                    std::env::var(&env_variable[1]).unwrap_or_default()
                })
                .split(' ')
                .map(std::ffi::OsString::from)
                .collect::<Vec<OsString>>(),
        );

        #[cfg(target_family = "unix")]
        #[allow(unused_mut)]
        let mut builded_command = CommandBuilder::from_argv(
            command
                .split(' ')
                .map(std::ffi::OsString::from)
                .collect::<Vec<OsString>>(),
        );

        #[cfg(target_family = "unix")]
        builded_command.env("TERM", "xterm-256color");

        let pty_pair = native_pty_system()
            .openpty(PtySize::default())
            .map_err(|err| PtyError::Creation(err.to_string()))?;

        let writer = pty_pair
            .master
            .take_writer()
            .map_err(|err| PtyError::Creation(err.to_string()))?;
        let mut reader = pty_pair
            .master
            .try_clone_reader()
            .map_err(|err| PtyError::Creation(err.to_string()))?;
        let master = Arc::new(Mutex::from(pty_pair.master));

        let child = Arc::from(Mutex::new(
            pty_pair
                .slave
                .spawn_command(builded_command)
                .map_err(|err| PtyError::Creation(err.to_string()))?,
        ));

        let cloned_child = child.clone();
        let title = Arc::new(Mutex::from(String::new()));
        let cloned_title = title.clone();

        let closed = Arc::new(AtomicBool::new(false));
        let closed_cloned = closed.clone();

        let (exit_sender, exit_receiver) = mpsc::channel::<()>();
        let paused = Arc::from(AtomicBool::new(false));
        let paused_cloned = paused.clone();

        let shell_pid = child.lock().await.process_id().ok_or(PtyError::Creation("PID not found".to_owned()))?;

        std::thread::spawn(move || {
            let mut buf = [0; 4096];
            let mut remaining = 0;

            loop {
                if !paused_cloned.load(Ordering::Relaxed) {
                    buf[remaining..].fill(0);

                    if reader
                        .read(&mut buf[remaining..])
                        .is_ok_and(|bytes| bytes > 0)
                    {
                        match std::str::from_utf8(&buf) {
                            Ok(parsed_buf) => {
                                on_read(parsed_buf);
                                remaining = 0;
                            }
                            Err(utf8) => {
                                on_read(unsafe {
                                    std::str::from_utf8_unchecked(&buf[..utf8.valid_up_to()])
                                });
                                remaining = buf[utf8.valid_up_to()..].len();
                                buf.rotate_left(utf8.valid_up_to());
                            }
                        }
                    }
                }

                if exit_receiver.try_recv().is_ok() {
                    break;
                }
            }
        });

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(20));

            loop {
                interval.tick().await;

                if matches!(cloned_child.lock().await.try_wait(), Ok(Some(_))) {
                    exit_sender.send(()).ok();

                    closed_cloned.store(true, Ordering::Relaxed);
                    once_exit();

                    break;
                }

                #[cfg(target_family = "unix")]
                let process_leader_pid = cloned_master.lock().await.process_group_leader();
                #[cfg(target_os = "windows")]
                let process_leader_pid = Some(utils::get_leader_pid(shell_pid));

                if let Some(fetched_leader_pid) = process_leader_pid {
                    let fetched_title = tokio::task::spawn_blocking(move || {
                        super::utils::get_process_title(fetched_leader_pid)
                    })
                    .await
                    .unwrap();

                    let mut current_process_title = cloned_title.lock().await;

                    if fetched_title
                        .as_ref()
                        .is_some_and(|fetched_title| fetched_title != &*current_process_title)
                    {
                        let fetched_title = fetched_title.unwrap();

                        on_tab_title_update(&fetched_title);
                        *current_process_title = fetched_title;
                    }
                }
            }
        });

        Ok(Self {
            writer,
            child,
            master,
            paused,
            title,
            closed,
        })
    }

    pub fn write(&mut self, content: &str) -> Result<(), PtyError> {
        self.writer
            .write(content.as_bytes())
            .map_err(|err| PtyError::Write(err.to_string()))
            .map(|_| ())
    }

    pub async fn kill(&self) -> Result<(), PtyError> {
        if self.closed.load(Ordering::Relaxed) {
            Ok(())
        } else {
            self.closed.store(true, Ordering::Relaxed);
            self.child
                .lock()
                .await
                .kill()
                .map_err(|err| PtyError::Kill(err.to_string()))
        }
    }

    pub async fn resize(&self, cols: u16, rows: u16) -> Result<(), PtyError> {
        self.master
            .lock()
            .await
            .resize(PtySize {
                rows,
                cols,
                ..Default::default()
            })
            .map_err(|err| PtyError::Resize(err.to_string()))
    }

    pub fn pause(&self) {
        self.paused.store(true, Ordering::Relaxed);
    }

    pub fn resume(&self) {
        self.paused.store(false, Ordering::Relaxed);
    }
}
