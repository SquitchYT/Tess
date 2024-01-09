#[derive(Debug, thiserror::Error)]
pub enum PtyError {
    #[error("There is no terminal corresponding to this ID.")]
    UnknownPty,
    #[error("A problem occurred while creating the terminal: {0}.")]
    Creation(String),
    #[error("A problem occurred while writing to the terminal: {0}.")]
    Write(String),
    #[error("A problem occurred while resizing the terminal: {0}.")]
    Resize(String),
    #[error("A problem occurred while closing the terminal: {0}.")]
    Kill(String),
}

impl serde::Serialize for PtyError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
