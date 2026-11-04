/**
 * Every photo on the site, in one place. Files live in public/images/.
 * The stock photos are placeholders until Jeremy's own photos replace them:
 * drop a new file in at the same path (or change the path here).
 */
export const PHOTOS = {
  homeHero: { src: 'images/home-hero.jpg', alt: 'A desk with a laptop and notes, ready to plan a project' },
  aboutFarm: { src: 'images/about-farm.jpg', alt: 'A small farm at sunrise' },
  aboutMarket: { src: 'images/about-market.jpg', alt: 'Fresh products laid out at a farmers market' },
  aboutWorkspace: { src: 'images/about-workspace.jpg', alt: 'Writing code on a laptop' },
  servicesApps: { src: 'images/services-apps.jpg', alt: 'A small business owner using an app at the counter' },
  servicesSupport: { src: 'images/services-support.jpg', alt: 'Talking through a project over coffee' },
  infinitrack: { src: 'images/infinitrack-logo.webp', alt: 'InfiniTrack logo' },
  infiniherd: { src: 'images/infiniherd-logo.webp', alt: 'InfiniHerd logo' },
} as const;
