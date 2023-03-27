use serde::Deserialize;

#[derive(Debug, Clone)]
pub struct Theme {
    app: AppTheme,
    pub terminal: TerminalTheme,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            app: AppTheme::default(),
            terminal: TerminalTheme::default(),
        }
    }
}

impl<'de> serde::Deserialize<'de> for Theme {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize, Debug)]
        struct PartialTheme {
            app: AppTheme,
            terminal: TerminalTheme,
        }

        if let Ok(theme_value) = String::deserialize(deserializer) {
            if let Ok(theme_file) = std::fs::read_to_string(&theme_value) {
                if let Ok(tmp) = serde_json::from_str::<PartialTheme>(&theme_file) {
                    Ok(Theme {
                        app: tmp.app,
                        terminal: tmp.terminal,
                    })
                } else {
                    Ok(Theme::default())
                }
            } else {
                // TODO: Replace with definitive path
                
                if let Ok(theme_file) = std::fs::read_to_string(format!("/home/clement/{}.json", &theme_value))
                {
                    if let Ok(tmp) = serde_json::from_str::<PartialTheme>(&theme_file) {
                        Ok(Theme {
                            app: tmp.app,
                            terminal: tmp.terminal,
                        })
                    } else {
                        Ok(Theme::default())
                    }
                } else {
                    Ok(Theme::default())
                }
            }
        } else {
            Ok(Theme::default())
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct TerminalTheme {
    background: String,
    foreground: String,
    black: String,
    red: String,
    green: String,
    yellow: String,
    blue: String,
    magenta: String,
    cyan: String,
    white: String,
    #[serde(alias = "brightBlack")]
    bright_black: String,
    #[serde(alias = "brightRed")]
    bright_red: String,
    #[serde(alias = "brightGreen")]
    bright_green: String,
    #[serde(alias = "brightYellow")]
    bright_yellow: String,
    #[serde(alias = "brightBlue")]
    bright_blue: String,
    #[serde(alias = "brightMagenta")]
    bright_magenta: String,
    #[serde(alias = "brightCyan")]
    bright_cyan: String,
    #[serde(alias = "brightWhite")]
    bright_white: String,
}

#[derive(Debug, Deserialize, Clone)]
struct AppTheme {
    // TODO: Implement
}

impl Default for TerminalTheme {
    fn default() -> Self {
        let default_theme = include_str!("../../../default_theme");
        serde_json::from_str(default_theme).unwrap()
    }
}

impl Default for AppTheme {
    fn default() -> Self {
        Self {}
    }
}

/*#[derive(Deserialize)]
pub struct PartialTerminalTheme {
    background: Option<String>,
    foreground: Option<String>,
    black: Option<String>,
    red: Option<String>,
    green: Option<String>,
    yellow: Option<String>,
    blue: Option<String>,
    magenta: Option<String>,
    cyan: Option<String>,
    white: Option<String>,
    #[serde(alias = "brightBlack")]
    bright_black: Option<String>,
    #[serde(alias = "brightRed")]
    bright_red: Option<String>,
    #[serde(alias = "brightGreen")]
    bright_green: Option<String>,
    #[serde(alias = "brightYellow")]
    bright_yellow: Option<String>,
    #[serde(alias = "brightBlue")]
    bright_blue: Option<String>,
    #[serde(alias = "brightMagenta")]
    bright_magenta: Option<String>,
    #[serde(alias = "brightCyan")]
    bright_cyan: Option<String>,
    #[serde(alias = "brightWhite")]
    bright_white: Option<String>
}*/