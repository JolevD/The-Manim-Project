import type { JSONSchemaType } from 'ajv';

// First, define the interface for element properties
interface ElementType {
  type: string;
  shape: string;
  color: string;
  position: string;
  // Add other optional properties that might be in the /* ... */ section
}

// Define the main analysis interface
interface AnalysisType {
  title_scene: string;
  intro_text: string;
  elements: ElementType[];
  steps: string[];
  conclusion_scene: string;
}

export const analysisSchema: JSONSchemaType<AnalysisType> = {
  type: "object",
  required: ["title_scene", "intro_text", "elements", "steps", "conclusion_scene"],
  properties: {
    title_scene: { type: "string" },
    intro_text: { type: "string" },
    elements: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "shape", "color", "position"],
        properties: {
          type: { type: "string" },
          shape: { type: "string" },
          color: { type: "string" },
          position: { type: "string" }
        },
        additionalProperties: false
      }
    },
    steps: {
      type: "array",
      items: { type: "string" }
    },
    conclusion_scene: { type: "string" }
  },
  additionalProperties: false
}
