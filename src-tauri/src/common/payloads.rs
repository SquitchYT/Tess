#[derive(serde::Serialize, Clone)]
pub struct PtySendData {
    pub id: String,
    pub data: String,
}