/**
 * Every photo on the site, in one place. Files live in public/images/.
 * The stock photos are placeholders until Jeremy's own photos replace them:
 * drop a new file in at the same path (or change the path here).
 */
export const PHOTOS = {
  homeHero: { src: 'images/home-hero.jpg', alt: 'A laptop, open notebook and cup of coffee on a wooden table' },
  aboutFarm: { src: 'images/about-farm.jpg', alt: 'An old barn and silo at sunrise with a fence line in the foreground' },
  aboutMarket: { src: 'images/about-market.jpg', alt: 'Market stalls with fresh produce under a covered market' },
  aboutWorkspace: { src: 'images/about-workspace.jpg', alt: 'Hands at a keyboard with code on two monitors' },
  servicesApps: { src: 'images/services-apps.jpg', alt: 'A shop owner checking out a customer on a tablet at the counter' },
  servicesSupport: { src: 'images/services-support.jpg', alt: 'Two people talking through a project over a laptop' },
  infinitrack: { src: 'images/infinitrack-logo.webp', alt: 'InfiniTrack logo' },
  infiniherd: { src: 'images/infiniherd-logo.webp', alt: 'InfiniHerd logo' },
} as const;
