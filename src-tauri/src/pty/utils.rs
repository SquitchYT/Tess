#[cfg(target_os = "windows")]
pub fn get_leader_pid(foo: i32) -> i32 {
    todo!()
}

pub fn get_process_title(pid: i32) -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        todo!()
    }

    #[cfg(target_family = "unix")]
    {
        std::fs::read_to_string(format!("/proc/{pid}/comm")).map_or(
            None,
            |mut process_leader_title| {
                process_leader_title.pop();

                if process_leader_title == "tokio-runtime-w" {
                    None
                } else {
                    Some(process_leader_title)
                }
            },
        )
    }
}
