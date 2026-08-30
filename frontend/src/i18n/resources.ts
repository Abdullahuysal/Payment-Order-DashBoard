import enCommon from './locales/en/common';
import enNav from './locales/en/nav';
import enOrders from './locales/en/orders';
import trCommon from './locales/tr/common';
import trNav from './locales/tr/nav';
import trOrders from './locales/tr/orders';

export const defaultNS = 'common';

export const resources = {
  tr: {
    common: trCommon,
    nav: trNav,
    orders: trOrders,
  },
  en: {
    common: enCommon,
    nav: enNav,
    orders: enOrders,
  },
};

export type AppResources = (typeof resources)['tr'];
