/** JSON-LD structured data, one graph per page. */
import {
  MUNICIPIOS_COUNT,
  MUNICIPIOS_TEXTO,
} from '#/data/municipios'

const DONDE_SE_USA = `Revi está en producción en ${MUNICIPIOS_COUNT} municipios de Chile: ${MUNICIPIOS_TEXTO}.`

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': 'https://bipbop.cl/#org',
  name: 'BipBop Labs',
  url: 'https://bipbop.cl',
  logo: 'https://bipbop.cl/brand/generated/social/github-avatar.png',
  image: 'https://bipbop.cl/brand/generated/og.png',
  email: 'juan@bipbop.cl',
  description:
    'Estudio de software chileno especializado en sistemas con IA, herramientas internas y plataformas operacionales.',
  founder: {
    '@type': 'Person',
    name: 'Juan Vargas',
    url: 'https://v4rgas.com',
    sameAs: ['https://github.com/v4rgas', 'https://linkedin.com/in/v4rgas'],
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Santiago',
    addressCountry: 'CL',
  },
  sameAs: ['https://github.com/v4rgas', 'https://linkedin.com/in/v4rgas'],
  knowsAbout: [
    'Desarrollo de software a medida',
    'Inteligencia artificial aplicada',
    'Permisos de edificación en Chile',
  ],
  areaServed: { '@type': 'Country', name: 'Chile' },
}

const ORG_REF = { '@id': 'https://bipbop.cl/#org' }

export const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    ORGANIZATION,
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://bipbop.cl/revi#software',
      name: 'Revi',
      url: 'https://app.ia-revi.cl/',
      creator: ORG_REF,
      publisher: {
        '@type': 'Organization',
        name: 'Cámara Chilena de la Construcción',
        alternateName: 'CChC',
        url: 'https://www.cchc.cl',
      },
      subjectOf: { '@id': 'https://bipbop.cl/revi#article' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'BipBop Labs',
          item: 'https://bipbop.cl/',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://bipbop.cl/#website',
      url: 'https://bipbop.cl/',
      name: 'BipBop Labs',
      publisher: { '@id': 'https://bipbop.cl/#org' },
      inLanguage: ['es-CL', 'en'],
    },
  ],
}

export const reviSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    ORGANIZATION,
    {
      '@type': 'Article',
      '@id': 'https://bipbop.cl/revi#article',
      headline:
        'Revi: IA para permisos de edificación, desarrollada por BipBop Labs junto a la CChC',
      inLanguage: 'es-CL',
      articleSection: 'Casos',
      keywords:
        'Revi, Cámara Chilena de la Construcción, permisos de edificación Chile, inteligencia artificial, DOM, BipBop Labs',
      about: [
        { '@type': 'Thing', name: 'Permisos de edificación en Chile' },
        { '@type': 'Thing', name: 'Direcciones de Obras Municipales (DOM)' },
      ],
      author: [
        ORG_REF,
        {
          '@type': 'Person',
          name: 'Juan Vargas',
          url: 'https://v4rgas.com',
          jobTitle: 'Founder, BipBop Labs',
          worksFor: ORG_REF,
          sameAs: [
            'https://github.com/v4rgas',
            'https://linkedin.com/in/v4rgas',
          ],
        },
      ],
      publisher: ORG_REF,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://bipbop.cl/revi',
      },
      datePublished: '2026-05-17',
      dateModified: '2026-09-01',
      image: {
        '@type': 'ImageObject',
        '@id': 'https://bipbop.cl/revi#primaryimage',
        url: 'https://bipbop.cl/brand/projects/revi/og-revi.jpg',
        contentUrl: 'https://bipbop.cl/brand/projects/revi/og-revi.jpg',
        width: 1200,
        height: 630,
        caption:
          'Revi CChC, asistente con IA para permisos de edificación en Chile',
      },
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Glosario de permisos de edificación en Chile',
      hasDefinedTerm: [
        {
          '@type': 'DefinedTerm',
          name: 'DOM',
          description:
            'Dirección de Obras Municipales. Unidad de cada municipalidad chilena encargada de revisar y aprobar los permisos de edificación.',
        },
        {
          '@type': 'DefinedTerm',
          name: 'LGUC',
          description:
            'Ley General de Urbanismo y Construcciones. Cuerpo legal que regula la planificación urbana y la construcción en Chile.',
        },
        {
          '@type': 'DefinedTerm',
          name: 'OGUC',
          description:
            'Ordenanza General de Urbanismo y Construcciones. Reglamento que detalla la aplicación de la LGUC.',
        },
        {
          '@type': 'DefinedTerm',
          name: 'Revi',
          description:
            'Asistente con inteligencia artificial de la Cámara Chilena de la Construcción para permisos de edificación. Disponible en app.ia-revi.cl.',
        },
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://bipbop.cl/revi#software',
      name: 'Revi',
      alternateName: ['Revi CChC', 'ia-revi', 'Revi IA'],
      url: 'https://app.ia-revi.cl/',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      creator: ORG_REF,
      maintainer: ORG_REF,
      description:
        'Asistente con IA para permisos de edificación en Chile. Lee planos arquitectónicos y documentos, y guía a solicitantes y revisores municipales por la normativa.',
      publisher: {
        '@type': 'Organization',
        name: 'Cámara Chilena de la Construcción',
        alternateName: 'CChC',
        url: 'https://www.cchc.cl',
      },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'CLP' },
      areaServed: { '@type': 'Country', name: 'Chile' },
      inLanguage: 'es-CL',
      isAccessibleForFree: true,
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Qué es Revi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Revi es un asistente con inteligencia artificial creado para la Cámara Chilena de la Construcción (CChC) que facilita los permisos de edificación en Chile. Lee planos y documentos, y guía a solicitantes y revisores municipales por la normativa.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Dónde se usa Revi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: DONDE_SE_USA,
          },
        },
        {
          '@type': 'Question',
          name: '¿Quiénes son Clara y Norman?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Clara y Norman son los dos asistentes de Revi. Clara ayuda a los solicitantes de permisos de edificación, y Norman ayuda a los revisores de las Direcciones de Obras Municipales (DOM).',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo accedo a Revi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Revi está disponible en app.ia-revi.cl.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuánto cuesta Revi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Revi es gratuito para todos los usuarios. Actualmente solo se apoya a las municipalidades con convenio con la Cámara Chilena de la Construcción (CChC).',
          },
        },
        {
          '@type': 'Question',
          name: '¿Quién hizo Revi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Revi fue desarrollado por BipBop Labs, un estudio de software chileno, en colaboración con la Cámara Chilena de la Construcción (CChC).',
          },
        },
        {
          '@type': 'Question',
          name: '¿Revi reemplaza al revisor municipal?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Revi es un apoyo, no un reemplazo. Tanto el solicitante como la DOM mantienen sus roles y decisiones; Revi acelera la revisión documental y ayuda a detectar observaciones contra la normativa antes de la revisión formal.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'BipBop Labs',
          item: 'https://bipbop.cl/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Revi',
          item: 'https://bipbop.cl/revi',
        },
      ],
    },
  ],
}
