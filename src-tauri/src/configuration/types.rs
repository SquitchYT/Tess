use serde::{Serializer, Serialize};
use serde::de::Error;
use serde::Deserialize;

#[derive(Debug, Clone, Copy)]
pub struct RangedInt<const MIN: u32, const MAX: u32, const DEF: u32> {
    value: u32,
}

impl<const MIN: u32, const MAX: u32, const DEF: u32> Default for RangedInt<MIN, MAX, DEF> {
    fn default() -> Self {
        Self { value: DEF }
    }
}

impl<'de, const MIN: u32, const MAX: u32, const DEF: u32> serde::Deserialize<'de>
    for RangedInt<MIN, MAX, DEF>
{
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        Ok(
            if let Ok(deserialized_value) = u32::deserialize(deserializer) {
                if deserialized_value < MIN {
                    Self { value: MIN }
                } else if deserialized_value > MAX {
                    Self { value: MAX }
                } else {
                    Self {
                        value: deserialized_value,
                    }
                }
            } else {
                RangedInt::default()
            },
        )
    }
}

impl<'de, const MIN: u32, const MAX: u32, const DEF: u32> serde::Serialize
    for RangedInt<MIN, MAX, DEF>
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u32(self.value)
    }
}


#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum BackgroundType {
    Opaque,
    Media(BackgroundMedia),
    Transparent,
    Blurred,
    #[cfg(target_os = "windows")]
    Acrylic,
    #[cfg(target_os = "windows")]
    Mica,
    #[cfg(target_os = "macos")]
    Vibrancy,
}

impl Default for BackgroundType {
    fn default() -> Self {
        Self::Opaque
    }
}

impl<'de> serde::Deserialize<'de> for BackgroundType {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Debug, Deserialize)]
        #[serde(untagged)]
        enum OptionRepresentation {
            Simple(String),
            Complex(BackgroundMedia),
        }

        let option_representation = OptionRepresentation::deserialize(deserializer)?;

        Ok(
            if let OptionRepresentation::Simple(option_value) = option_representation {
                match option_value.to_lowercase().as_str() {
                    "opaque" => BackgroundType::Opaque,
                    "transparent" => BackgroundType::Transparent,
                    "blurred" => BackgroundType::Blurred,
                    #[cfg(target_os = "windows")]
                    "acrylic" => BackgroundType::Acrylic,
                    #[cfg(target_os = "windows")]
                    "mica" => BackgroundType::Mica,
                    #[cfg(target_os = "macos")]
                    "vibrancy" => BackgroundType::Vibrancy,
                    _ => {
                        if let Some(background_media) =
                            BackgroundMedia::deserialize_from_string(option_value)
                        {
                            BackgroundType::Media(background_media)
                        } else {
                            BackgroundType::default()
                        }
                    }
                }
            } else if let OptionRepresentation::Complex(background_media) = option_representation {
                BackgroundType::Media(background_media)
            } else {
                BackgroundType::default()
            },
        )
    }
}

#[derive(Debug, Deserialize, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum CursorType {
    Block,
    Bar,
    Underline,
}

impl Default for CursorType {
    fn default() -> Self {
        Self::Block
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct BackgroundMedia {
    blur: RangedInt<0, 20, 0>,
    location: String,
}

impl BackgroundMedia {
    fn deserialize_from_string(value: String) -> Option<Self> {
        if let Ok(file) = std::fs::read(&value) {
            if infer::is_image(&file) || infer::is_video(&file) {
                Some(Self {
                    location: value,
                    blur: RangedInt::default(),
                })
            } else {
                None
            }
        } else {
            None
        }
    }
}

impl<'de> serde::Deserialize<'de> for BackgroundMedia {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Debug, Deserialize)]
        struct PartialBackgroundMedia {
            blur: Option<RangedInt<0, 20, 0>>,
            location: String,
        }

        let partial_background_media = PartialBackgroundMedia::deserialize(deserializer)?;

        if let Ok(file) = std::fs::read(&partial_background_media.location) {
            if infer::is_image(&file) || infer::is_video(&file) {
                Ok(Self {
                    blur: partial_background_media.blur.unwrap_or_default(),
                    location: partial_background_media.location,
                })
            } else {
                Err(D::Error::custom("Format not supported"))
            }
        } else {
            Err(D::Error::custom("Cannot read file"))
        }
    }
}