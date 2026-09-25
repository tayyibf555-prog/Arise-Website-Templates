/*
  Every template shown on the index page.

  To add a site: put its files in the variant's folder (e.g. sites/aeo/vsl/index.html).
  Each agency has two variants:
    vsl       → sales page built around a video sales letter
    site      → normal agency website, no VSL
    thank-you → post-booking page (accept the calendar invite + client results),
                linked from the index with its own button rather than a preview
*/
window.ARISE_VARIANTS = {
  vsl: 'VSL sales page',
  site: 'Standard site',
};

window.ARISE_REGISTRY = [
  { slug: 'aeo', name: 'AEO Agency' },
  { slug: 'ai-website', name: 'AI Website Agency' },
  { slug: 'ai-solution', name: 'AI Solution Agency' },
  { slug: 'copywriting', name: 'Copywriting Agency (LinkedIn / Email Ghostwriting)' },
  { slug: 'lead-gen', name: 'AI Lead Gen Agency' },
];
