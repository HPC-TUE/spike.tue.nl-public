import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        audience: z.string().optional(),
        maturity: z.enum(['Verified', 'Experimental', 'Admin', 'Historical']).optional(),
        lastVerified: z.union([z.string(), z.date()]).optional(),
        products: z.array(z.string()).default([]),
        requiresVpn: z.boolean().default(false),
        sourceRefs: z.array(z.string()).default([]),
        sensitivity: z.enum(['public', 'internal', 'admin']).default('public'),
      }),
    }),
  }),
};
