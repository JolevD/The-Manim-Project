import Ajv from 'ajv';

const templateSchema = {
  type: "object",
  properties: {
    scene_template: {
      type: "object",
      properties: {
        imports: {
          type: "array",
          items: { type: "string" },
          minItems: 1
        },
        scene_class: {
          type: "object",
          properties: {
            name: { 
              type: "string",
              minLength: 1
            },
            parent_class: { 
              type: "string",
              minLength: 1
            },
            components: {
              type: "object",
              properties: {
                setup: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      name: { type: "string" },
                      code: { type: "string" }
                    },
                    required: ["type", "code"],
                    additionalProperties: false
                  }
                },
                animations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      code: { type: "string" }
                    },
                    required: ["type", "code"],
                    additionalProperties: false
                  },
                  minItems: 1
                }
              },
              required: ["setup", "animations"],
              additionalProperties: false
            }
          },
          required: ["name", "parent_class", "components"],
          additionalProperties: false
        },
        config: {
          type: "object",
          properties: {
            background_color: { type: "string" },
            pixel_height: { type: "number" },
            pixel_width: { type: "number" },
            frame_rate: { type: "number" }
          },
          additionalProperties: false
        }
      },
      required: ["imports", "scene_class"], // config is now optional
      additionalProperties: false
    }
  },
  required: ["scene_template"],
  additionalProperties: false
};

const ajv = new Ajv({ allErrors: true });

export const validateTemplate = ajv.compile(templateSchema);

export function getTemplateValidationErrors(data: any) {
  const isValid = validateTemplate(data);
  if (!isValid) {
    return {
      isValid: false,
      errors: validateTemplate.errors?.map(error => ({
        path: error.instancePath || error.schemaPath,
        message: error.message,
        allowedValues: error.params?.allowedValues,
        data: error.data
      })) || []
    };
  }
  return { isValid: true, errors: [] };
}