import type { FromSchema } from 'json-schema-to-ts';
import { asJsonSchema } from '../lib/util/typings';

export const spotifyCallbackQuerySchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['code', 'state'],
  properties: {
    code: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
  },
});
export type SpotifyCallbackQuery = FromSchema<
  typeof spotifyCallbackQuerySchema
>;
