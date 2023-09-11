use std::collections::HashMap;
use std::sync::Arc;

use crate::configuration::deserialized::Profile;
use crate::pty::Pty;

use crate::common::errors::PtyError;

pub struct PtyManager {
    ptys: HashMap<String, crate::pty::Pty>,
    pub app: Option<Arc<tauri::AppHandle>>,
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl PtyManager {
    #[must_use]
    pub fn new() -> Self {
        Self {
            ptys: HashMap::new(),
            app: None,
        }
    }

    pub fn create_pty(
        &mut self,
        cols: u16,
        rows: u16,
        id: String,
        profile: Profile,
    ) -> Result<(), PtyError> {
        if let Some(app_ref) = self.app.as_ref() {
            let pty = Pty::new(app_ref.clone(), profile, cols, rows, id.clone())?;

            self.ptys.insert(id, pty);

            Ok(())
        } else {
            Err(PtyError::Create(String::from(
                "Unable to give app access to the new process",
            )))
        }
    }

    pub fn write(&mut self, id: &str, content: &str) -> Result<(), PtyError> {
        self.ptys
            .get_mut(id)
            .ok_or_else(|| PtyError::Write(String::from("Unable to access to the terminal.")))?
            .write(content)?;
        Ok(())
    }

    pub fn resize(&mut self, id: &str, cols: u16, rows: u16) -> Result<(), PtyError> {
        self.ptys
            .get_mut(id)
            .ok_or_else(|| PtyError::Resize(String::from("Unable to access to the terminal.")))?
            .resize(cols, rows)?;
        Ok(())
    }

    pub fn close(&mut self, id: &str) -> Result<(), PtyError> {
        self.ptys
            .remove(id)
            .ok_or_else(|| PtyError::Kill(String::from("Unable to access to the terminal.")))?
            .close()
    }

    pub fn get_running_process(&self, id: &str) -> Result<String, PtyError> {
        self.ptys
            .get(id)
            .ok_or_else(|| {
                PtyError::CloseableStatus(String::from("Unable to access to the terminal."))
            })?
            .running_process()
    }
}
