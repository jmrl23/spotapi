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

export const spotifyBadgeSchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['key'],
  properties: {
    key: {
      type: 'string',
      minLength: 6,
      maxLength: 6,
    },
  },
});
export type SpotifyBadge = FromSchema<typeof spotifyBadgeSchema>;
