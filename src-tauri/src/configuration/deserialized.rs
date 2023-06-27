use crate::configuration::partial::PartialOption;
use crate::configuration::types::CursorType;
use crate::configuration::types::RangedInt;
use crate::configuration::types::{BackgroundMedia, BackgroundType};
use serde::Deserialize;
use serde::{ser::SerializeSeq, Serialize, Serializer};

use crate::common::utils::parse_theme;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Option {
    pub app_theme: String,
    pub terminal_theme: TerminalTheme,
    pub background: BackgroundType,
    pub background_transparency: RangedInt<0, 100, 100>,
    pub custom_titlebar: bool,
    pub profiles: Vec<Profile>,
    pub terminal: TerminalOption,
    pub close_confirmation: bool,
    pub shortcuts: Vec<Shortcut>,
    pub macros: Vec<Macro>,
    pub default_profile: Profile,

    #[serde(skip_serializing)]
    theme: String,
}

impl Default for Option {
    fn default() -> Self {
        let uuid = uuid::Uuid::new_v4().to_string();

        Self {
            app_theme: String::default(),
            terminal_theme: TerminalTheme::default(),
            background: BackgroundType::default(),
            custom_titlebar: true, // TODO: Set false on linux
            profiles: vec![default_profile(uuid.clone())],
            terminal: TerminalOption::default(),
            close_confirmation: true,
            background_transparency: RangedInt::default(),
            shortcuts: default_shortcuts(),
            macros: Vec::default(),
            default_profile: default_profile(uuid),

            theme: String::default(),
        }
    }
}

impl<'de> serde::Deserialize<'de> for Option {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let partial_option = PartialOption::deserialize(deserializer).unwrap_or_default();

        let (app_theme, terminal_theme) = parse_theme(partial_option.theme.clone());
        let app_theme = app_theme.unwrap_or_default();
        let terminal_theme = terminal_theme.unwrap_or_default();

        let mut profiles = vec![];

        if partial_option.profiles.is_empty() {
            profiles.push(Profile {
                name: String::from("Default profile"),
                terminal_options: partial_option.terminal.clone(),
                theme: terminal_theme.clone(),
                background_transparency: RangedInt::default(),
                uuid: uuid::Uuid::new_v4().to_string(),
                #[cfg(target_family = "unix")]
                command: String::from("sh -c $SHELL"),
                #[cfg(target_os = "windows")]
                command: String::from(
                    "%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
                ),
                background: None,
            })
        } else {
            for partial_profile in partial_option.profiles {
                let profile_option = TerminalOption {
                    buffer_size: partial_profile
                        .buffer_size
                        .unwrap_or(partial_option.terminal.buffer_size),
                    cursor: partial_profile
                        .cursor
                        .unwrap_or(partial_option.terminal.cursor),
                    font_size: partial_profile
                        .font_size
                        .unwrap_or(partial_option.terminal.font_size),
                    bell: partial_profile.bell.unwrap_or(partial_option.terminal.bell),
                    font_ligature: partial_profile
                        .font_ligature
                        .unwrap_or(partial_option.terminal.font_ligature),
                    show_picture: partial_profile
                        .show_picture
                        .unwrap_or(partial_option.terminal.show_picture),
                    cursor_blink: partial_profile
                        .cursor_blink
                        .unwrap_or(partial_option.terminal.cursor_blink),
                    draw_bold_in_bright: partial_profile
                        .draw_bold_in_bright
                        .unwrap_or(partial_option.terminal.draw_bold_in_bright),
                    show_unread_data_indicator: partial_profile
                        .show_unread_data_indicator
                        .unwrap_or(partial_option.terminal.show_unread_data_indicator),
                    line_height: partial_profile
                        .line_height
                        .unwrap_or(partial_option.terminal.line_height),
                    letter_spacing: partial_profile
                        .letter_spacing
                        .unwrap_or(partial_option.terminal.letter_spacing),
                    font_weight: partial_profile
                        .font_weight
                        .unwrap_or(partial_option.terminal.font_weight),
                    font_weight_bold: partial_profile
                        .font_weight_bold
                        .unwrap_or(partial_option.terminal.font_weight_bold),
                    title_is_running_process: partial_profile
                        .title_is_running_process
                        .unwrap_or(partial_option.terminal.title_is_running_process),
                };

                let profile_theme = if let Some(partial_profile_theme) = partial_profile.theme {
                    parse_theme(partial_profile_theme)
                        .1
                        .unwrap_or(terminal_theme.clone())
                } else {
                    terminal_theme.clone()
                };

                profiles.push(Profile {
                    name: partial_profile.name,
                    terminal_options: profile_option,
                    theme: profile_theme,
                    background_transparency: partial_profile
                        .background_transparency
                        .unwrap_or(partial_option.background_transparency),
                    uuid: uuid::Uuid::parse_str(partial_profile.uuid.unwrap_or_default().as_str())
                        .unwrap_or(uuid::Uuid::new_v4())
                        .to_string(),
                    command: partial_profile.command,
                    background: partial_profile.background,
                })
            }
        }

        let mut macros = vec![];

        if let Some(partial_macros) = partial_option.macros {
            for macro_command in partial_macros {
                macros.push(Macro {
                    content: macro_command.content,
                    uuid: macro_command
                        .uuid
                        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
                })
            }
        }

        let shortcuts = if let Some(partial_option_shortcuts) = partial_option.shortcuts {
            let mut shortcuts = vec![];

            for partial_shortcut in partial_option_shortcuts {
                match partial_shortcut.action {
                    ShortcutAction::OpenProfile(profile_id) => {
                        if let Some(profile) =
                            profiles.iter().find(|profile| profile.uuid == profile_id)
                        {
                            shortcuts.push(Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::OpenProfile(profile.uuid.clone()),
                            })
                        }
                    }
                    ShortcutAction::ExecuteMacro(macro_id) => {
                        if let Some(macro_command) = macros
                            .iter()
                            .find(|macro_command| macro_command.uuid == macro_id)
                        {
                            shortcuts.push(Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::ExecuteMacro(macro_command.uuid.clone()),
                            })
                        }
                    }
                    _ => shortcuts.push(Shortcut {
                        shortcut: partial_shortcut.shortcut,
                        action: partial_shortcut.action,
                    }),
                };
            }

            shortcuts
        } else {
            default_shortcuts()
        };

        Ok(Option {
            theme: partial_option.theme.clone(),

            terminal_theme: terminal_theme,
            app_theme: app_theme,
            background: partial_option.background,
            custom_titlebar: partial_option.custom_titlebar,
            terminal: partial_option.terminal,
            profiles: profiles.clone(),
            close_confirmation: partial_option.close_confirmation,
            background_transparency: partial_option.background_transparency,
            shortcuts: shortcuts,
            macros: macros,
            default_profile: profiles
                .iter()
                .find(|&profile| profile.uuid == partial_option.default_profile)
                .unwrap_or(&profiles[0])
                .clone(),
        })
    }
}

#[derive(Deserialize, Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TerminalOption {
    #[serde(default)]
    buffer_size: RangedInt<500, 5000, 3000>,
    #[serde(default)]
    cursor: CursorType,
    #[serde(default)]
    font_size: RangedInt<10, 30, 16>,
    #[serde(default)]
    font_ligature: bool,
    #[serde(default)]
    show_picture: bool,
    #[serde(default)]
    bell: bool,
    #[serde(default)]
    cursor_blink: bool,
    #[serde(default)]
    draw_bold_in_bright: bool,
    #[serde(default = "default_to_true")]
    show_unread_data_indicator: bool,
    #[serde(default)]
    line_height: RangedInt<100, 200, 100>,
    #[serde(default)]
    letter_spacing: RangedInt<0, 8, 0>,
    #[serde(default)]
    font_weight: RangedInt<1, 9, 4>,
    #[serde(default)]
    font_weight_bold: RangedInt<1, 9, 6>,
    #[serde(default = "default_to_true")]
    pub title_is_running_process: bool,
}

impl Default for TerminalOption {
    fn default() -> Self {
        Self {
            buffer_size: RangedInt::default(),
            cursor: CursorType::default(),
            font_size: RangedInt::default(),
            font_ligature: false,
            show_picture: false,
            bell: false,
            cursor_blink: false,
            draw_bold_in_bright: false,
            show_unread_data_indicator: true,
            line_height: RangedInt::default(),
            letter_spacing: RangedInt::default(),
            font_weight: RangedInt::default(),
            font_weight_bold: RangedInt::default(),
            title_is_running_process: true,
        }
    }
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct Macro {
    pub content: String,
    pub uuid: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct Shortcut {
    pub shortcut: String,
    pub action: ShortcutAction,
}

#[derive(Debug, Clone, Deserialize)]
pub enum ShortcutAction {
    CloseFocusedTab,
    CloseAllTabs,
    OpenStartProfile,
    OpenProfile(String),
    ExecuteMacro(String),
    Copy,
    Paste,
    FocusFirstTab,
    FocusLastTab,
    FocusNextTab,
    FocusPrevTab,
    FocusTab(usize),
}

impl Serialize for ShortcutAction {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self {
            Self::CloseFocusedTab => serializer.serialize_str("closeFocusedTab"),
            Self::CloseAllTabs => serializer.serialize_str("closeAllTabs"),
            Self::OpenStartProfile => serializer.serialize_str("openDefaultProfile"),
            Self::Copy => serializer.serialize_str("copy"),
            Self::Paste => serializer.serialize_str("paste"),
            Self::FocusFirstTab => serializer.serialize_str("focusFirstTab"),
            Self::FocusLastTab => serializer.serialize_str("focusLastTab"),
            Self::FocusNextTab => serializer.serialize_str("focusNextTab"),
            Self::FocusPrevTab => serializer.serialize_str("focusPrevTab"),
            Self::OpenProfile(value) => {
                let mut a = serializer.serialize_seq(Some(2))?;
                a.serialize_element("openProfile");
                a.serialize_element(value);
                a.end()
            }
            Self::ExecuteMacro(value) => {
                let mut a = serializer.serialize_seq(Some(2))?;
                a.serialize_element("executeMacro");
                a.serialize_element(value);
                a.end()
            }
            Self::FocusTab(value) => {
                let mut a = serializer.serialize_seq(Some(2))?;
                a.serialize_element("focusTab");
                a.serialize_element(value);
                a.end()
            }
        }
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    // TODO: Add Icon
    // TODO: Add background_media
    name: String,
    pub terminal_options: TerminalOption,
    theme: TerminalTheme,
    background_transparency: RangedInt<0, 100, 100>,
    background: std::option::Option<BackgroundMedia>,
    pub uuid: String,
    pub command: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TerminalTheme {
    foreground: String,
    background: String,
    black: String,
    red: String,
    green: String,
    yellow: String,
    blue: String,
    magenta: String,
    cyan: String,
    white: String,
    bright_black: String,
    bright_red: String,
    bright_green: String,
    bright_yellow: String,
    bright_blue: String,
    bright_magenta: String,
    bright_cyan: String,
    bright_white: String,
    cursor: String,
    cursor_accent: String,
}

impl Default for TerminalTheme {
    fn default() -> Self {
        Self {
            foreground: String::from("#DEEAF8"),
            background: String::from("#141A29"),
            black: String::from("#22303F"),
            red: String::from("#Ef3134"),
            green: String::from("#2DF4B7"),
            yellow: String::from("#FFC738"),
            blue: String::from("#156CE6"),
            magenta: String::from("#FF5CB8"),
            cyan: String::from("#01DEFE"),
            white: String::from("#9AA5CE"),
            bright_black: String::from("#2B3D50"),
            bright_red: String::from("#F1494B"),
            bright_green: String::from("#76F8D0"),
            bright_yellow: String::from("#FFCE52"),
            bright_blue: String::from("#297AEB"),
            bright_magenta: String::from("#FF76C3"),
            bright_cyan: String::from("#4DE8FE"),
            bright_white: String::from("#ABB4D6"),
            cursor: String::from("#DEEAF8"),
            cursor_accent: String::from("#141A29"),
        }
    }
}

impl<'de> Deserialize<'de> for TerminalTheme {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize, Default)]
        struct PartialTerminalTheme {
            #[serde(default)]
            pub foreground: std::option::Option<String>,
            #[serde(default)]
            pub background: std::option::Option<String>,
            #[serde(default)]
            pub black: std::option::Option<String>,
            #[serde(default)]
            pub red: std::option::Option<String>,
            #[serde(default)]
            pub green: std::option::Option<String>,
            #[serde(default)]
            pub yellow: std::option::Option<String>,
            #[serde(default)]
            pub blue: std::option::Option<String>,
            #[serde(default)]
            pub magenta: std::option::Option<String>,
            #[serde(default)]
            pub cyan: std::option::Option<String>,
            #[serde(default)]
            pub white: std::option::Option<String>,
            #[serde(default)]
            pub bright_black: std::option::Option<String>,
            #[serde(default)]
            pub bright_red: std::option::Option<String>,
            #[serde(default)]
            pub bright_green: std::option::Option<String>,
            #[serde(default)]
            pub bright_yellow: std::option::Option<String>,
            #[serde(default)]
            pub bright_blue: std::option::Option<String>,
            #[serde(default)]
            pub bright_magenta: std::option::Option<String>,
            #[serde(default)]
            pub bright_cyan: std::option::Option<String>,
            #[serde(default)]
            pub bright_white: std::option::Option<String>,
            #[serde(default)]
            pub cursor: std::option::Option<String>,
            #[serde(default)]
            pub cursor_accent: std::option::Option<String>,
        }

        let partial_terminal_theme =
            PartialTerminalTheme::deserialize(deserializer).unwrap_or_default();
        let default_terminal_theme = TerminalTheme::default();

        Ok(TerminalTheme {
            foreground: partial_terminal_theme
                .foreground
                .unwrap_or(default_terminal_theme.foreground),
            background: partial_terminal_theme
                .background
                .unwrap_or(default_terminal_theme.background),
            black: partial_terminal_theme
                .black
                .unwrap_or(default_terminal_theme.black),
            red: partial_terminal_theme
                .red
                .unwrap_or(default_terminal_theme.red),
            green: partial_terminal_theme
                .green
                .unwrap_or(default_terminal_theme.green),
            yellow: partial_terminal_theme
                .yellow
                .unwrap_or(default_terminal_theme.yellow),
            blue: partial_terminal_theme
                .blue
                .unwrap_or(default_terminal_theme.blue),
            magenta: partial_terminal_theme
                .magenta
                .unwrap_or(default_terminal_theme.magenta),
            cyan: partial_terminal_theme
                .cyan
                .unwrap_or(default_terminal_theme.cyan),
            white: partial_terminal_theme
                .white
                .unwrap_or(default_terminal_theme.white),
            bright_black: partial_terminal_theme
                .bright_black
                .unwrap_or(default_terminal_theme.bright_black),
            bright_red: partial_terminal_theme
                .bright_red
                .unwrap_or(default_terminal_theme.bright_red),
            bright_green: partial_terminal_theme
                .bright_green
                .unwrap_or(default_terminal_theme.bright_green),
            bright_yellow: partial_terminal_theme
                .bright_yellow
                .unwrap_or(default_terminal_theme.bright_yellow),
            bright_blue: partial_terminal_theme
                .bright_blue
                .unwrap_or(default_terminal_theme.bright_blue),
            bright_magenta: partial_terminal_theme
                .bright_magenta
                .unwrap_or(default_terminal_theme.bright_magenta),
            bright_cyan: partial_terminal_theme
                .bright_cyan
                .unwrap_or(default_terminal_theme.bright_cyan),
            bright_white: partial_terminal_theme
                .bright_white
                .unwrap_or(default_terminal_theme.bright_white),
            cursor: partial_terminal_theme
                .cursor
                .unwrap_or(default_terminal_theme.cursor),
            cursor_accent: partial_terminal_theme
                .cursor_accent
                .unwrap_or(default_terminal_theme.cursor_accent),
        })
    }
}

fn default_to_true() -> bool {
    true
}

fn default_profile(uuid: String) -> Profile {
    Profile {
        name: String::from("Default profile"),
        terminal_options: TerminalOption::default(),
        theme: TerminalTheme::default(),
        background_transparency: RangedInt::default(),
        uuid,
        #[cfg(target_family = "unix")]
        command: String::from("sh -c $SHELL"),
        #[cfg(target_os = "windows")]
        command: String::from("%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"),
        background: None,
    }
}

fn default_shortcuts() -> Vec<Shortcut> {
    vec![
        Shortcut {
            shortcut: String::from("CTRL+C"),
            action: ShortcutAction::Copy,
        },
        Shortcut {
            shortcut: String::from("CTRL+V"),
            action: ShortcutAction::Paste,
        },
        Shortcut {
            shortcut: String::from("CTRL+T"),
            action: ShortcutAction::OpenStartProfile,
        },
        Shortcut {
            shortcut: String::from("CTRL+W"),
            action: ShortcutAction::CloseFocusedTab,
        },
        Shortcut {
            shortcut: String::from("CTRL+MAJ+W"),
            action: ShortcutAction::CloseAllTabs,
        },
        Shortcut {
            shortcut: String::from("CTRL+TAB"),
            action: ShortcutAction::FocusNextTab,
        },
        Shortcut {
            shortcut: String::from("CTRL+MAJ+TAB"),
            action: ShortcutAction::FocusPrevTab,
        },
    ]
}
