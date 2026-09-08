# UFDE design system

Open `/design-system` for the component catalogue. It is marked noindex and is
not included in the public sitemap. All showcase content is demonstration only.

## Imports

Framework-neutral layout, typography, buttons and cards:

```tsx
import { Container, Section, SectionHeading, StrategicAreaCard } from '@ufde/ui';

<Section tone="soft">
  <Container>
    <SectionHeading title="Strategic areas" eyebrow="OUR FOCUS" underline />
    <StrategicAreaCard
      title="Science & research"
      description="Approved description from your content source."
      href="/strategic-areas"
      linkLabel="Explore this area"
    />
  </Container>
</Section>
```

Web-specific components, including existing header/footer and interactive controls:

```tsx
import { CategoryTabs, ContactForm, NewsletterForm, LanguageSwitcher }
  from '@/components/design-system';
```

The web root imports `packages/ui/src/tokens.css` once. The plain `@ufde/ui`
components work in Server Components and Client Components. Interactive controls
are isolated in `apps/web/components/design-system/interactive.tsx` and compose
existing Base UI / Shadcn / Embla primitives. Never import server-only content
utilities into these controls.

## Inventory

- Layout: Container, Section, PageHeader, Hero, Breadcrumbs, Header, MobileNavigation, Footer.
- Typography: Heading1, Heading2, Heading3, Eyebrow, Lead, Body, Caption.
- Actions: PrimaryButton, SecondaryButton, OutlineButton, TextLink.
- Cards: InstitutionalCard, StrategicAreaCard, ActivityCard, ProjectCard,
  PublicationCard, TeamCard, DocumentCard, PartnerCard.
- Controls and content: StatusBadge, CategoryTabs, Carousel, SectionHeading,
  PartnerCarousel, NewsletterForm, ContactForm, SocialLinks, LanguageSwitcher,
  Pagination, EmptyState, PDFDownload, MemberProfile, ProjectMetadata,
  PublicationMetadata.

## Conventions

- Spacing: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96px (rem tokens).
- Cards: 1px #DCE3ED border, 8px radius, extremely subtle navy shadow.
- Buttons: 50px minimum height, 6px radius. Gold uses navy text; navy uses white.
- Use `href` on buttons for navigation; omit it for a native button. Add click
  handlers only from a Client Component. Disabled state is available on buttons.
- Typography supports `as` for correct heading hierarchy. Hero accepts
  `headingAs="h2"` when used below the main page title.
- Card icons and images are ReactNode slots. Supply approved images using
  next/image with alt text and dimensions. Strategic card icons are gold.
- CategoryTabs supports filled/underline variants, disabled tabs, controlled
  value/onValueChange, and keyboard navigation inherited from Base UI.
- Carousels never autoplay. They support arrow controls and keyboard/touch input.
- Pagination is controlled: pass page, totalPages, and onPageChange. Labels and
  content must come from the relevant locale when integrated into translated pages.
- Form wrappers require an explicit `demo` flag. Showcase forms use `demo=true`;
  the underlying existing forms validate locally and never submit in that mode.
- PDFDownload without an approved href displays an unavailable state. Never link
  to an invented report. SocialLinks accepts verified links; empty input shows a
  pending state. Partner cards never generate substitute logos.
- ProjectMetadata and PublicationMetadata accept localized label/value pairs.
- Reuse the existing Header/Footer; MobileNavigation and LanguageSwitcher are
  the same implementations used in the live header, not separate demo copies.
