import enCommon from './locales/en/common';
import enNav from './locales/en/nav';
import enOrders from './locales/en/orders';
import enTodo from './locales/en/todo';
import trCommon from './locales/tr/common';
import trNav from './locales/tr/nav';
import trOrders from './locales/tr/orders';
import trTodo from './locales/tr/todo';

export const defaultNS = 'common';

export const resources = {
  tr: {
    common: trCommon,
    nav: trNav,
    orders: trOrders,
    todo: trTodo,
  },
  en: {
    common: enCommon,
    nav: enNav,
    orders: enOrders,
    todo: enTodo,
  },
};

export type AppResources = (typeof resources)['tr'];
