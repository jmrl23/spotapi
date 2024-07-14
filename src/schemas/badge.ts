import type { FromSchema } from 'json-schema-to-ts';
import { asJsonSchema } from '../lib/util/typings';

export const badgeSpotifySchema = asJsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['key'],
  properties: {
    key: {
      type: 'string',
    },
  },
});
export type BadgeSpotify = FromSchema<typeof badgeSpotifySchema>;
