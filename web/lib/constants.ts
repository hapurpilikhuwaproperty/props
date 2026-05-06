const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Hapur Pilkhuwa Property';
const PAGE_TITLE = process.env.NEXT_PUBLIC_PAGE_TITLE || 'Hapur Pilkhuwa Property';
const META_DESCRIPTION =
  process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Discover curated properties in Hapur and Pilkhuwa.';

export const BRAND = {
  NAME: BRAND_NAME,
  TAGLINE: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Modern real estate experiences crafted for humans.',
  PAGE_TITLE,
  META_TITLE: `${BRAND_NAME} | ${PAGE_TITLE}`,
  META_DESCRIPTION,
  ABOUT_HEADLINE: process.env.NEXT_PUBLIC_ABOUT_HEADLINE || 'Thoughtfully curated real estate guidance.',
};

export const CONTACT = {
  PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+917678171738',
  EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hapurpilikhuwaproperty@gmail.com',
  WHATSAPP: process.env.NEXT_PUBLIC_WHATSAPP || '+917678171738',
};
