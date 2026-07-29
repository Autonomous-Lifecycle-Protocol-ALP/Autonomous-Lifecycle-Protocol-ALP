use crate::{AlpError, AlpObject};
use std::collections::HashMap;

pub struct AlpParser;

impl AlpParser {
    pub fn parse(source: &str) -> Result<Vec<AlpObject>, AlpError> {
        let blocks: Vec<&str> = source.split("\n\n").collect();
        let mut objects = Vec::new();
        for block in blocks {
            let trimmed = block.trim();
            if !trimmed.is_empty() {
                if let Some(obj) = Self::parse_block(trimmed)? {
                    objects.push(obj);
                }
            }
        }
        Ok(objects)
    }

    pub fn parse_single(source: &str) -> Result<AlpObject, AlpError> {
        let trimmed = source.trim();
        if trimmed.is_empty() {
            return Err(AlpError::new("Empty source provided to parser"));
        }
        let result = Self::parse_block(trimmed)?;
        result.ok_or_else(|| AlpError::new("Failed to parse ALP block"))
    }

    fn parse_block(block: &str) -> Result<Option<AlpObject>, AlpError> {
        let mut id = None;
        let mut object_type = None;
        for line in block.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("id:") {
                id = Some(trimmed[3..].trim().to_string());
            } else if trimmed.starts_with("type:") {
                object_type = Some(trimmed[5..].trim().to_string());
            }
        }
        match (id, object_type) {
            (Some(id), Some(object_type)) => Ok(Some(AlpObject::new(id, object_type))),
            _ => Ok(None),
        }
    }
}
