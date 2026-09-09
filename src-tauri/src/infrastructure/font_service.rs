use font_kit::source::SystemSource;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Serialize)]
pub struct FontInfo {
    pub family: String,
    pub variants: Vec<String>,
}

pub fn get_system_fonts() -> Vec<FontInfo> {
    let source = SystemSource::new();
    let mut font_map: HashMap<String, Vec<String>> = HashMap::new();

    if let Ok(families) = source.all_families() {
        for family_name in families {
            if let Ok(family) = source.select_family_by_name(&family_name) {
                let mut variants = Vec::new();
                for handle in family.fonts() {
                    if let Ok(font) = handle.load() {
                        let properties = font.properties();
                        let weight = properties.weight.0.round() as u32;
                        let style = match properties.style {
                            font_kit::properties::Style::Normal => "Normal",
                            font_kit::properties::Style::Italic => "Italic",
                            font_kit::properties::Style::Oblique => "Oblique",
                        };
                        variants.push(format!("{} {}", weight, style));
                    }
                }
                variants.sort();
                variants.dedup();
                font_map.insert(family_name.clone(), variants);
            }
        }
    }

    let mut result: Vec<FontInfo> = font_map
        .into_iter()
        .map(|(family, variants)| FontInfo { family, variants })
        .collect();

    result.sort_by(|a, b| a.family.cmp(&b.family));
    result
}
