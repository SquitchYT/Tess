use serde::Deserialize;

use crate::common::theme::{Theme, TerminalTheme};
use crate::common::types::{RangedInt, CursorType, BackgroundType, PartialShortcutAction, ShortcutAction};

use super::types::{PartialShortcut, Shortcut, Macro, PartialMacro};

#[derive(Debug)]
pub struct Option {
    // TODO: Finish

    pub theme: Theme,
    pub background: BackgroundType,
    pub background_transparency: RangedInt<0, 100, 100>,
    pub custom_titlebar: bool,
    pub profiles: Vec<Profile>,
    pub terminal: TerminalOption,
    pub close_confirmation: bool,
    pub shortcuts: Vec<Shortcut>,
    pub macros: Vec<Macro>
}

impl Default for Option {
    fn default() -> Self {
        Self {
            theme: Theme::default(),
            background: BackgroundType::default(),
            custom_titlebar: true, // TODO: Set false on linux
            profiles: Vec::default(),
            terminal: TerminalOption::default(),
            close_confirmation: true,
            background_transparency: RangedInt::default(),
            shortcuts: Vec::default(), // TODO: Replace with correct defaults shortcuts list
            macros: Vec::default()
        }
    }
}

impl<'de> serde::Deserialize<'de> for Option {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let partial_option = PartialOption::deserialize(deserializer).unwrap_or_default();


        let mut profiles = vec![];
        for partial_profile in partial_option.profiles {
            let profile_option = TerminalOption {
                buffersize: partial_profile.buffersize.unwrap_or(partial_option.terminal.buffersize),
                cursor: partial_profile.cursor.unwrap_or(partial_option.terminal.cursor),
                fontsize: partial_profile.fontsize.unwrap_or(partial_option.terminal.fontsize),
                bell: partial_profile.bell.unwrap_or(partial_option.terminal.bell),
                font_ligature: partial_profile.font_ligature.unwrap_or(partial_option.terminal.font_ligature),
                show_picture: partial_profile.show_picture.unwrap_or(partial_option.terminal.show_picture),
                cursor_blink: partial_profile.cursor_blink.unwrap_or(partial_option.terminal.cursor_blink),
                draw_bold_in_bright: partial_profile.draw_bold_in_bright.unwrap_or(partial_option.terminal.draw_bold_in_bright),
                show_unread_data_indicator: partial_profile.show_unread_data_indicator.unwrap_or(partial_option.terminal.show_unread_data_indicator),
                line_height: partial_profile.line_height.unwrap_or(partial_option.terminal.line_height),
                letter_spacing: partial_profile.letter_spacing.unwrap_or(partial_option.terminal.letter_spacing),
                font_weight: partial_profile.font_weight.unwrap_or(partial_option.terminal.font_weight),
                font_weight_bold: partial_profile.font_weight_bold.unwrap_or(partial_option.terminal.font_weight_bold),
                title_is_running_process: partial_profile.title_is_running_process.unwrap_or(partial_option.terminal.title_is_running_process)
            };

            profiles.push(Profile {
                name: partial_profile.name,
                terminal: profile_option,
                theme: partial_profile.theme.unwrap_or(partial_option.theme.clone()).terminal,
                background_transparency: partial_profile.background_transparency.unwrap_or(RangedInt::default()),
                uuid: uuid::Uuid::parse_str(partial_profile.uuid.unwrap_or_default().as_str()).unwrap_or(uuid::Uuid::new_v4()).to_string()
            })
        }


        let mut macros = vec![];
        if let Some(partial_macros) = partial_option.macros {
            for macro_command in partial_macros {
                macros.push(Macro {
                    content: macro_command.content,
                    uuid: macro_command.uuid.unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
                })
            }
        }


        let mut shortcuts = vec![];
        if let Some(partial_option_shortcuts) = partial_option.shortcuts {
            for partial_shortcut in partial_option_shortcuts {
                match partial_shortcut.action {
                    PartialShortcutAction::OpenProfile(profile_id) => {
                        if let Some(profile) = profiles.iter().find(|profile| profile.uuid == profile_id) {
                            shortcuts.push(
                                Shortcut {
                                    shortcut: partial_shortcut.shortcut,
                                    action: ShortcutAction::OpenProfile(profile.uuid.clone()) 
                                }
                            )
                        }
                    }
                    PartialShortcutAction::ExecuteMacro(macro_id) => {
                        if let Some(macro_command) = macros.iter().find(|macro_command| macro_command.uuid == macro_id) {
                            shortcuts.push(Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::ExecuteMacro(macro_command.uuid.clone())
                            })
                        }
                    }
                    PartialShortcutAction::Copy => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::Copy
                            }
                        )
                    }
                    PartialShortcutAction::Paste => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::Paste 
                            }
                        )
                    }
                    PartialShortcutAction::CloseAllTabs => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::CloseAllTabs 
                            }
                        )
                    }
                    PartialShortcutAction::CloseFocusedTab => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::CloseFocusedTab
                            }
                        )
                    }
                    PartialShortcutAction::OpenDefaultProfile => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::OpenDefaultProfile
                            }
                        )
                    }
                    PartialShortcutAction::FocusFirstTab => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::FocusFirstTab 
                            }
                        )
                    }
                    PartialShortcutAction::FocusLastTab => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::FocusLastTab 
                            }
                        )
                    }
                    PartialShortcutAction::FocusNextTab => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::FocusNextTab 
                            }
                        )
                    }
                    PartialShortcutAction::FocusPrevTab => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::FocusPrevTab 
                            }
                        )
                    }
                    PartialShortcutAction::FocusTab(tab_index) => {
                        shortcuts.push(
                            Shortcut {
                                shortcut: partial_shortcut.shortcut,
                                action: ShortcutAction::FocusTab(tab_index)
                            }
                        )
                    }
                };
            }
        } else {
            shortcuts.append(&mut vec![
                Shortcut {
                    shortcut: String::from("CTRL+C"),
                    action: ShortcutAction::Copy
                },
                Shortcut {
                    shortcut: String::from("CTRL+V"),
                    action: ShortcutAction::Paste
                },
                Shortcut {
                    shortcut: String::from("CTRL+T"),
                    action: ShortcutAction::OpenDefaultProfile
                },
                Shortcut {
                    shortcut: String::from("CTRL+W"),
                    action: ShortcutAction::CloseFocusedTab
                },
                Shortcut {
                    shortcut: String::from("CTRL+MAJ+W"),
                    action: ShortcutAction::CloseAllTabs
                },
                Shortcut {
                    shortcut: String::from("CTRL+TAB"),
                    action: ShortcutAction::FocusNextTab
                },
                Shortcut {
                    shortcut: String::from("CTRL+MAJ+TAB"),
                    action: ShortcutAction::FocusPrevTab
                }
            ]);
        }


        Ok(Option {
            theme: partial_option.theme,
            background: partial_option.background,
            custom_titlebar: partial_option.custom_titlebar,
            terminal: partial_option.terminal,
            profiles: profiles,
            close_confirmation: partial_option.close_confirmation,
            background_transparency: partial_option.background_transparency,
            shortcuts: shortcuts,
            macros: macros
        })
    }
}


#[derive(Debug)]
pub struct Profile {
    // TODO: Implement
    // TODO: Add Icon
    // TODO: Implement background_media

    name: String,
    terminal: TerminalOption,
    theme: TerminalTheme,
    background_transparency: RangedInt<0, 100, 0>,
    uuid: String
}


#[derive(Deserialize, Debug)]
pub struct TerminalOption {
    #[serde(default)]
    buffersize: RangedInt<500, 5000, 3000>,
    #[serde(default)]
    cursor: CursorType,
    #[serde(default)]
    fontsize: RangedInt<10, 30, 16>,
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
    #[serde(default="default_to_true")]
    show_unread_data_indicator: bool,
    #[serde(default)]
    line_height: RangedInt<100, 200, 100>,
    #[serde(default)]
    letter_spacing: RangedInt<1, 8, 1>,
    #[serde(default)]
    font_weight: RangedInt<1, 9, 4>,
    #[serde(default)]
    font_weight_bold: RangedInt<1, 9, 6>,
    #[serde(default="default_to_true")]
    title_is_running_process: bool
}

impl Default for TerminalOption {
    fn default() -> Self {
        Self {
            buffersize: RangedInt::default(),
            cursor: CursorType::default(),
            fontsize: RangedInt::default(),
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
            title_is_running_process: true
        }
    }
}


#[derive(Deserialize, Debug)]
struct PartialOption {
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub background: BackgroundType,
    #[serde(default)]
    pub custom_titlebar: bool, // TODO: Set correct default value here
    #[serde(default)]
    pub profiles: Vec<PartialProfile>,
    #[serde(default, flatten)]
    pub terminal: TerminalOption,
    #[serde(default)]
    background_transparency: RangedInt<0, 100, 100>,

    #[serde(default)]
    shortcuts: std::option::Option<Vec<PartialShortcut>>,
    #[serde(default)]
    macros: std::option::Option<Vec<PartialMacro>>,

    // TODO: Save individually for each pane or only in global ?
    #[serde(default="default_to_true")]
    close_confirmation: bool
}

impl Default for PartialOption {
    fn default() -> Self {
        Self {
            theme: Theme::default(),
            background: BackgroundType::default(),
            custom_titlebar: true, // TODO: Set false on linux
            profiles: Vec::default(),
            terminal: TerminalOption::default(),
            close_confirmation: true,
            background_transparency: RangedInt::default(),
            shortcuts: Some(Vec::default()),
            macros: Some(Vec::default())
        }
    }
}


#[derive(Deserialize, Debug)]
struct PartialProfile {
    name: String,
    uuid: std::option::Option<String>,
    
    buffersize: std::option::Option<RangedInt<500, 5000, 3000>>,
    cursor: std::option::Option<CursorType>,
    fontsize: std::option::Option<RangedInt<10, 30, 16>>,
    font_ligature: std::option::Option<bool>,
    show_picture: std::option::Option<bool>,
    bell: std::option::Option<bool>,
    theme: std::option::Option<Theme>,
    background_transparency: std::option::Option<RangedInt<0, 100, 0>>,
    cursor_blink: std::option::Option<bool>,
    draw_bold_in_bright: std::option::Option<bool>,
    show_unread_data_indicator: std::option::Option<bool>,
    line_height: std::option::Option<RangedInt<100, 200, 100>>,
    letter_spacing: std::option::Option<RangedInt<1, 8, 1>>,
    font_weight: std::option::Option<RangedInt<1, 9, 4>>,
    font_weight_bold: std::option::Option<RangedInt<1, 9, 6>>,
    title_is_running_process: std::option::Option<bool>
}


fn default_to_true() -> bool {
    true
}