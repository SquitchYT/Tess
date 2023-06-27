#[derive(serde::Serialize, Clone)]
pub struct PtySendData {
    pub id: String,
    pub data: String,
}

#[derive(serde::Serialize, Clone)]
pub struct PtyTitleChanged {
    pub id: String,
    pub title: String,
}
