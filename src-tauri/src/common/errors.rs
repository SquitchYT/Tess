#[derive(Debug)]
pub enum PtyError {
    Kill(String),
    Resize(String),
    Write(String),
    Create(String),
    ManagerUnresponding
}

impl serde::Serialize for PtyError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: serde::ser::Serializer {
      serializer.serialize_str(self.to_string().as_ref())
    }
}

impl std::fmt::Display for PtyError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            PtyError::Kill(r) => write!(f, "Unable to terminate the process. Reason: {}", r),
            PtyError::Resize(r) => write!(f, "Unable to resize the given terminal. Reason: {}", r),
            PtyError::Write(r) => write!(f, "Unable to write to the given terminal. Reason: {}", r),
            PtyError::Create(r) => write!(f, "Unable to create a new terminal. Reason: {}", r),
            PtyError::ManagerUnresponding => write!(f, "Terminal manager is unresponding.")
        }
    }
}