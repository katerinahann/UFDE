export const institute = {
  acronym: 'UFDE',
  name: 'Ukrainian-French Institute for Science, Innovation and European Development',
  email: 'institut.ufde@gmail.com', location: '27, boulevard Saint-Martin, 75003 Paris, France',
  languages: ['en','fr','uk'] as const,
  logo: { light: '/brand/ufde-refined.png', dark: '/brand/ufde-refined.png', symbol: '/brand/ufde-refined.png', supplied: true },
  homeHero: { src: '/images/france-europe-ukraine.png', alt: 'Illustrative Paris panorama with the flags of France, the European Union and Ukraine', credit: 'UFDE · AI-generated illustration', source: '/images/france-europe-ukraine.png', license: '', licenseLabel: '' },
  hero: { src: '/images/paris.webp', alt: 'The Eiffel Tower and the Seine in Paris', credit: 'Yann Caradec', source: 'https://commons.wikimedia.org/wiki/File:La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques,_Paris_ao%C3%BBt_2014_(2).jpg', license: 'https://creativecommons.org/licenses/by-sa/2.0/' }
} as const;
export type Locale = typeof institute.languages[number];
