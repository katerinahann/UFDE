import type {Partner} from '@ufde/types';
export const demoPartners:Partner[]=[];
export const partnerTypes=['Institutional Partner','Academic Partner','Research Partner','Public Authority','International Organisation','Local Authority','Strategic Partner'] as const;
export const partnerLabelOptions=['Our Partners','Institutional Partners','Selected Partners','Collaborating Institutions'] as const;
export const partnerLabels={en:['Our Partners','Institutional Partners','Selected Partners','Collaborating Institutions'],fr:['Nos partenaires','Partenaires institutionnels','Partenaires sélectionnés','Institutions collaboratrices'],uk:['Наші партнери','Інституційні партнери','Вибрані партнери','Установи, з якими співпрацюємо']};
export const partnerNotes={en:'Listing an institution does not imply its endorsement of UFDE or of other listed institutions.',fr:'La présence d’une institution ne signifie pas qu’elle approuve l’UFDE ou les autres institutions présentées.',uk:'Згадка установи не означає її схвалення UFDE або інших представлених установ.'};

// Confirmed institutional relationships; logos retain their original artwork.
export const approvedPartners: Record<string, Partner[]> = {
  "en": [
    {
      "id": "sorbonne-universite",
      "slug": "sorbonne-universite",
      "name": "Sorbonne Université",
      "logo": {
        "url": "/images/partners/sorbonne-universite.svg",
        "alt": "Sorbonne Université"
      },
      "website": "https://www.sorbonne-universite.fr/",
      "description": "",
      "country": "FR",
      "partnerType": "Academic Partner",
      "featured": true,
      "sortOrder": 0,
      "published": true
    },
    {
      "id": "ukraine-embassy-france",
      "slug": "ukraine-embassy-france",
      "name": "Embassy of Ukraine in France",
      "logo": {
        "url": "/images/partners/ukraine-embassy-france.jpg",
        "alt": "Embassy of Ukraine in France"
      },
      "website": "https://france.mfa.gov.ua/",
      "description": "",
      "country": "FR",
      "partnerType": "Institutional Partner",
      "featured": true,
      "sortOrder": 1,
      "published": true
    },
    {
      "id": "zbarazh-city-council",
      "slug": "zbarazh-city-council",
      "name": "Zbarazh City Council",
      "logo": {
        "url": "/images/partners/zbarazh-city-council.png",
        "alt": "Zbarazh City Council"
      },

      "description": "",
      "country": "UA",
      "partnerType": "Local Authority",
      "featured": true,
      "sortOrder": 2,
      "published": true
    }
  ],
  "fr": [
    {
      "id": "sorbonne-universite",
      "slug": "sorbonne-universite",
      "name": "Sorbonne Université",
      "logo": {
        "url": "/images/partners/sorbonne-universite.svg",
        "alt": "Sorbonne Université"
      },
      "website": "https://www.sorbonne-universite.fr/",
      "description": "",
      "country": "FR",
      "partnerType": "Academic Partner",
      "featured": true,
      "sortOrder": 0,
      "published": true
    },
    {
      "id": "ukraine-embassy-france",
      "slug": "ukraine-embassy-france",
      "name": "Ambassade d’Ukraine en France",
      "logo": {
        "url": "/images/partners/ukraine-embassy-france.jpg",
        "alt": "Ambassade d’Ukraine en France"
      },
      "website": "https://france.mfa.gov.ua/",
      "description": "",
      "country": "FR",
      "partnerType": "Institutional Partner",
      "featured": true,
      "sortOrder": 1,
      "published": true
    },
    {
      "id": "zbarazh-city-council",
      "slug": "zbarazh-city-council",
      "name": "Conseil municipal de Zbarazh",
      "logo": {
        "url": "/images/partners/zbarazh-city-council.png",
        "alt": "Conseil municipal de Zbarazh"
      },

      "description": "",
      "country": "UA",
      "partnerType": "Local Authority",
      "featured": true,
      "sortOrder": 2,
      "published": true
    }
  ],
  "uk": [
    {
      "id": "sorbonne-universite",
      "slug": "sorbonne-universite",
      "name": "Sorbonne Université",
      "logo": {
        "url": "/images/partners/sorbonne-universite.svg",
        "alt": "Sorbonne Université"
      },
      "website": "https://www.sorbonne-universite.fr/",
      "description": "",
      "country": "FR",
      "partnerType": "Academic Partner",
      "featured": true,
      "sortOrder": 0,
      "published": true
    },
    {
      "id": "ukraine-embassy-france",
      "slug": "ukraine-embassy-france",
      "name": "Посольство України у Франції",
      "logo": {
        "url": "/images/partners/ukraine-embassy-france.jpg",
        "alt": "Посольство України у Франції"
      },
      "website": "https://france.mfa.gov.ua/",
      "description": "",
      "country": "FR",
      "partnerType": "Institutional Partner",
      "featured": true,
      "sortOrder": 1,
      "published": true
    },
    {
      "id": "zbarazh-city-council",
      "slug": "zbarazh-city-council",
      "name": "Збаразька міська рада",
      "logo": {
        "url": "/images/partners/zbarazh-city-council.png",
        "alt": "Збаразька міська рада"
      },

      "description": "",
      "country": "UA",
      "partnerType": "Local Authority",
      "featured": true,
      "sortOrder": 2,
      "published": true
    }
  ]
};
