export type Locale = "vi" | "en";

export type Dictionary = {
  common: {
    pauseCarousel: string;
    playCarousel: string;
    prevSlide: string;
    nextSlide: string;
    backToTop: string;
    scrollToBottom: string;
    since: string;
  };
  meta: {
    title: string;
    description: string;
  };
  topbar: {
    hotline: string;
    email: string;
    tagline: string;
  };
  nav: {
    home: string;
    products: string;
    about: string;
    partners: string;
    news: string;
    activities: string;
    careers: string;
    contact: string;
    cta: string;
  };
  home: {
    hero: {
      eyebrow: string;
      titleBefore: string;
      titleAccent: string;
      titleAfter: string;
      subtitle: string;
      ctaPrimary: string;
      ctaSecondary: string;
      marketplaceNote: string;
      antibacterialBadge: string;
      scrollHint: string;
    };
    stats: {
      eyebrow: string;
      title: string;
      subtitle: string;
      million: string;
      orders: string;
      units: string;
      views: string;
      lives: string;
      creators: string;
    };
    trust: string[];
    videos: {
      eyebrow: string;
      title: string;
    };
    catalog: {
      eyebrow: string;
      title: string;
      subtitle: string;
      viewAll: string;
      viewDetails: string;
    };
    whyUs: {
      eyebrow: string;
      title: string;
      items: { number: string; title: string; desc: string }[];
    };
    kol: {
      eyebrow: string;
      title: string;
      subtitle: string;
    };
    news: {
      eyebrow: string;
      title: string;
      viewAll: string;
    };
    offices: {
      eyebrow: string;
      title: string;
    };
    bottomCta: {
      title: string;
      subtitle: string;
      button: string;
    };
  };
  productsPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    buyShopee: string;
    buyTiktok: string;
  };
  aboutPage: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    vision: { title: string; body: string };
    mission: { title: string; body: string };
    values: { title: string; body: string };
    capabilities: { title: string; body: string };
    galleryTitle: string;
  };
  partnersPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: { number: string; title: string; desc: string }[];
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
  };
  newsPage: {
    eyebrow: string;
    title: string;
    empty: string;
    postFallbackTitle: string;
  };
  activitiesPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: string;
    statusRunning: string;
    statusUpcoming: string;
    statusEnded: string;
    viewDetails: string;
    topPrizeLabel: string;
    periodLabel: string;
  };
  campaignPage: {
    backToList: string;
    topPrizeLabel: string;
    payoutLabel: string;
    payoutValue: string;
    periodLabel: string;
    redeemLabel: string;
    organizerLabel: string;
    ctaBuy: string;
    ctaRules: string;
    scratchTitle: string;
    scratchHint: string;
    scratchRevealed: string;
    scratchAgain: string;
    scratchDemoNote: string;
    stepsEyebrow: string;
    stepsTitle: string;
    prizesEyebrow: string;
    prizesTitle: string;
    prizeTopBadge: string;
    comboEyebrow: string;
    comboTitle: string;
    comboCardsUnit: string;
    comboBestBadge: string;
    rulesEyebrow: string;
    rulesTitle: string;
    rulesSubtitle: string;
    rulesExpandAll: string;
    rulesCollapseAll: string;
    legalPrevail: string;
    notFound: string;
  };
  careersPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    noResults: string;
    applyCta: string;
    requirementsLabel: string;
    benefitsLabel: string;
    viewDetails: string;
    applyFormFallback: string;
    positionLabel: string;
    departmentLabel: string;
    locationLabel: string;
    employmentTypeLabel: string;
    salaryLabel: string;
    descriptionLabel: string;
  };
  contactPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    hotlineLabel: string;
    emailLabel: string;
    office1Label: string;
    office2Label: string;
    formTitle: string;
    formSubtitle: string;
    placeholders: {
      name: string;
      phone: string;
      email: string;
      region: string;
      message: string;
    };
    submit: string;
    sent: string;
  };
  footer: {
    tagline: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    aboutHeading: string;
    productsHeading: string;
    contactHeading: string;
    copyright: string;
    credit: string;
  };
  offices: {
    hcm: string;
    danang: string;
  };
  productDetail: {
    specBrand: string;
    specType: string;
    specForm: string;
    specShelfLife: string;
    specScent: string;
    specIngredients: string;
    tabInfo: string;
    tabUsage: string;
    tabNotes: string;
    featuresTitle: string;
    volumeLabel: string;
    priceLabel: string;
    priceContact: string;
    ctaQuote: string;
    ctaCall: string;
  };
};
