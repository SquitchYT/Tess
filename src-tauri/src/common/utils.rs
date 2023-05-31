use crate::configuration::deserialized::TerminalTheme;

pub fn parse_theme(location: String) -> (Option<String>, Option<TerminalTheme>) {
    let theme_path = if std::path::Path::new(&format!(
        "{}/tess/themes/{}",
        dirs_next::config_dir().unwrap_or_default().display(),
        location
    ))
    .exists()
    {
        Some(format!(
            "{}/tess/themes/{}",
            dirs_next::config_dir().unwrap_or_default().display(),
            location
        ))
    } else if std::path::Path::new(&location).exists() {
        Some(location)
    } else {
        None
    };

    if let Some(theme_path) = theme_path {
        let app_theme = if std::path::Path::new(&format!("{}/style.css", theme_path)).exists() { Some(format!("{}/style.css", theme_path)) } else { None };
        let terminal_theme = if std::path::Path::new(&format!("{}/terminal.json", theme_path)).exists() { Some(serde_json::from_str(&std::fs::read_to_string(std::path::Path::new(&format!("{}/terminal.json", theme_path))).unwrap_or_default()).unwrap_or_default()) } else { None };

        (app_theme, terminal_theme)
    } else {
        (None, None)
    }
}