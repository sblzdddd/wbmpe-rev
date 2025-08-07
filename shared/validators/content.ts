import { z } from 'zod';

// -----------CONTENT SCHEMAS-----------

export const recommendationSchema = z.object({
  type: z.string().meta({
    description: 'Recommendation type',
    example: 'playlist',
  }),
  id: z.string().meta({
    description: 'Content ID',
    example: '6863722013b04be86cb7a555',
  }),
  title: z.string().meta({
    description: 'Content title',
    example: 'Trending Now',
  }),
  description: z.string().optional().meta({
    description: 'Content description',
    example: 'The hottest tracks right now',
  }),
  coverUrl: z.string().meta({
    description: 'Cover image URL',
    example: 'https://example.com/cover.jpg',
  }),
  metadata: z.any().optional().meta({
    description: 'Additional metadata',
  }),
});

export const contentSectionSchema = z.object({
  id: z.string().meta({
    description: 'Section ID',
    example: 'trending',
  }),
  title: z.string().meta({
    description: 'Section title',
    example: 'Trending Now',
  }),
  type: z.string().meta({
    description: 'Section type',
    example: 'carousel',
  }),
  items: z.array(recommendationSchema).meta({
    description: 'Section items',
  }),
});

// -----------RESPONSE SCHEMAS-----------

export const homeResponse = z.object({
  data: z.array(contentSectionSchema).meta({
    description: 'Home page content sections',
  }),
});

export const exploreResponse = z.object({
  data: z.array(contentSectionSchema).meta({
    description: 'Explore page content sections',
  }),
});
