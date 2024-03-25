#[derive(serde::Serialize, Clone)]
pub struct PtySendData<'a> {
    pub id: &'a str,
    pub data: &'a str,
}

#[derive(serde::Serialize, Clone)]
pub struct PtyTitleChanged<'a> {
    pub id: &'a str,
    pub title: &'a str,
}

#[derive(serde::Serialize, Clone)]
pub struct PtyProgressUpdated<'a> {
    pub id: &'a str,
    pub progress: u8,
}
