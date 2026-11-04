import { PHOTOS } from './photos';

export interface Project {
  name: string;
  status: 'live' | 'beta' | 'coming-soon';
  tagline: string;
  description: string;
  features: string[];
  photo: { src: string; alt: string };
  /** Outbound link for projects people can use today (live or beta). */
  url?: string;
}

export const PROJECTS: Project[] = [
  {
    name: 'InfiniTrack',
    status: 'beta',
    tagline: 'Inventory and cost tracking for small sellers',
    description:
      "I built InfiniTrack to keep stock counts, costs, and an online store in sync without spreadsheets. It handles FIFO cost of goods sold, barcodes, and a Wix storefront connection, so the numbers stay right while you get on with selling. It's in beta now, with the full launch planned for January.",
    features: [
      'FIFO cost of goods sold, calculated for you',
      'Wix storefront sync',
      'Barcode labels and scanning',
      'Reports you can export when you need them',
    ],
    photo: PHOTOS.infinitrack,
    url: 'https://infinitrack.app',
  },
  {
    name: 'InfiniHerd',
    status: 'coming-soon',
    tagline: 'Livestock records for small farms and feedlots',
    description:
      "InfiniHerd started on my own farm. It keeps animal, breeding, health, and feed records in one place, including bulk vaccinations and Minnesota feedlot Animal Unit reporting. It's coming soon, and I'm looking for a few farms to try it early and tell me what works and what doesn't.",
    features: [
      'Animal, breeding, and health records',
      'Feed and hay inventory',
      'Bulk vaccination in a few taps',
      'MN feedlot Animal Unit reporting',
    ],
    photo: PHOTOS.infiniherd,
  },
];

/** Query param the contact page uses to prefill a beta signup message. */
export const BETA_TOPIC = 'infiniherd-beta';
