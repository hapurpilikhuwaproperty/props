const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Property Platform';
const PAGE_TITLE = process.env.NEXT_PUBLIC_PAGE_TITLE || 'Modern Real Estate';
const META_DESCRIPTION =
  process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Discover curated properties with immersive visuals and seamless inquiry.';

export const BRAND = {
  NAME: BRAND_NAME,
  TAGLINE: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Modern real estate experiences crafted for humans.',
  PAGE_TITLE,
  META_TITLE: `${BRAND_NAME} | ${PAGE_TITLE}`,
  META_DESCRIPTION,
  ABOUT_HEADLINE: process.env.NEXT_PUBLIC_ABOUT_HEADLINE || 'Thoughtfully curated real estate guidance.',
};

export const CONTACT = {
  PHONE: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 12345 67890',
  EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@example.com',
  WHATSAPP: process.env.NEXT_PUBLIC_WHATSAPP || '+911234567890',
};
