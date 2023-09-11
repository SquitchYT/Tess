use crate::configuration::deserialized::CloseConfirmation;
use crate::configuration::deserialized::ShortcutAction;
use crate::configuration::deserialized::TerminalOption;
use crate::configuration::types::CursorType;
use crate::configuration::types::RangedInt;
use crate::configuration::types::{BackgroundMedia, BackgroundType};
use serde::Deserialize;
use serde::Deserializer;

#[derive(Deserialize, Debug)]
pub struct PartialOption {
    #[serde(default)]
    pub theme: String,
    #[serde(default)]
    pub background: BackgroundType,
    #[serde(default)]
    pub custom_titlebar: bool, // TODO: Set correct default value
    #[serde(default)]
    pub profiles: Vec<PartialProfile>,
    #[serde(default, flatten)]
    pub terminal: TerminalOption,
    #[serde(default)]
    pub background_transparency: RangedInt<0, 100, 100>,

    #[serde(default)]
    pub shortcuts: std::option::Option<Vec<PartialShortcut>>,
    #[serde(default)]
    pub macros: std::option::Option<Vec<PartialMacro>>,

    #[serde(default)]
    pub close_confirmation: CloseConfirmation,

    #[serde(default)]
    pub default_profile: String,
}

impl Default for PartialOption {
    fn default() -> Self {
        Self {
            theme: String::default(),
            background: BackgroundType::default(),
            custom_titlebar: true, // TODO: Set false on linux
            profiles: Vec::default(),
            terminal: TerminalOption::default(),
            background_transparency: RangedInt::default(),
            shortcuts: Some(Vec::default()),
            macros: Some(Vec::default()),
            default_profile: String::new(),
            close_confirmation: CloseConfirmation::default(),
        }
    }
}

#[derive(Deserialize, Debug)]
pub struct PartialProfile {
    pub name: String,
    pub uuid: std::option::Option<String>,
    pub command: String,
    pub buffer_size: std::option::Option<RangedInt<500, 5000, 3000>>,
    pub cursor: std::option::Option<CursorType>,
    pub font_size: std::option::Option<RangedInt<10, 30, 16>>,
    pub font_ligature: std::option::Option<bool>,
    pub show_picture: std::option::Option<bool>,
    pub bell: std::option::Option<bool>,
    pub theme: std::option::Option<String>,
    pub background_transparency: std::option::Option<RangedInt<0, 100, 100>>,
    pub cursor_blink: std::option::Option<bool>,
    pub draw_bold_in_bright: std::option::Option<bool>,
    pub show_unread_data_indicator: std::option::Option<bool>,
    pub line_height: std::option::Option<RangedInt<100, 200, 100>>,
    pub letter_spacing: std::option::Option<RangedInt<0, 8, 0>>,
    pub font_weight: std::option::Option<RangedInt<1, 9, 4>>,
    pub font_weight_bold: std::option::Option<RangedInt<1, 9, 6>>,
    pub title_is_running_process: std::option::Option<bool>,
    #[serde(deserialize_with = "deserialize_profile_background")]
    #[serde(default)]
    pub background: std::option::Option<BackgroundMedia>,
}

#[derive(Deserialize, Debug)]
pub struct PartialMacro {
    pub content: String,
    pub uuid: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct PartialShortcut {
    pub shortcut: String,
    pub action: ShortcutAction,
}

fn deserialize_profile_background<'de, D>(
    data: D,
) -> Result<std::option::Option<BackgroundMedia>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize, Debug)]
    #[serde(untagged)]
    enum Representation {
        Simple(String),
        Complex(BackgroundMedia),
    }

    Ok(Representation::deserialize(data).map_or(
        None,
        |todo_name_to_find| match todo_name_to_find {
            Representation::Simple(path) => BackgroundMedia::deserialize_from_string(path),
            Representation::Complex(background) => Some(background),
        },
    ))
}
