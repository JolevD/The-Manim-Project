import type { JSONSchemaType } from 'ajv';

export const analysisSchema: JSONSchemaType<AnalysisType> = {
  "type": "object",
  "required": ["title_scene","intro_text","elements","steps","conclusion_scene"],
  "properties": {
    "title_scene":    { "type": "string" },
    "intro_text":     { "type": "string" },
    "elements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type","shape","color","position"],
        "properties": { /* … */ }
      }
    },
    "steps": {
      "type": "array",
      "items": { "type": "string" }
    },
    "conclusion_scene": { "type": "string" }
  }
}
