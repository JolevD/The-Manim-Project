import Ajv, { JSONSchemaType } from 'ajv';
import { analysisSchema } from '../schemas/analysis.schema';

const ajv = new Ajv();
export const validateAnalysis = ajv.compile(analysisSchema);
