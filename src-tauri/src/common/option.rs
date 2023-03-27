use serde::Deserialize;

use crate::common::theme::{Theme, TerminalTheme};
use crate::common::types::{RangedInt, CursorType, BackgroundType};

#[derive(Debug)]
pub struct Option {
    // TODO: Finish

    pub theme: Theme,
    pub background: BackgroundType,
    pub background_transparency: RangedInt<0, 100, 100>,
    pub custom_titlebar: bool,
    pub profiles: Vec<Profile>,
    pub terminal: TerminalOption,
    pub close_confirmation: bool
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
            background_transparency: RangedInt::default()
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
                show_unread_data_indicator: partial_profile.show_unread_data_indicator.unwrap_or(partial_option.terminal.show_unread_data_indicator)
            };

            profiles.push(Profile {
                name: partial_profile.name,
                terminal: profile_option,
                theme: partial_profile.theme.unwrap_or(partial_option.theme.clone()).terminal,
                background_transparency: partial_profile.background_transparency.unwrap_or(RangedInt::default())
            })
        }

        Ok(Option {
            theme: partial_option.theme,
            background: partial_option.background,
            custom_titlebar: partial_option.custom_titlebar,
            terminal: partial_option.terminal,
            profiles: profiles,
            close_confirmation: partial_option.close_confirmation,
            background_transparency: partial_option.background_transparency
        })
    }
}


#[derive(Debug)]
pub struct Profile {
    // TODO: Implement
    // TODO: Add uuid
    // TODO: Add Icon
    // TODO: Implement background_media

    name: String,
    terminal: TerminalOption,
    theme: TerminalTheme,
    background_transparency: RangedInt<0, 100, 0>,
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
    #[serde(default)] // TODO: Set to true
    show_unread_data_indicator: bool
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
            show_unread_data_indicator: true
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
            background_transparency: RangedInt::default()
        }
    }
}


#[derive(Deserialize, Debug)]
struct PartialProfile {
    name: String,

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
    show_unread_data_indicator: std::option::Option<bool>
}


fn default_to_true () -> bool {
    true
}