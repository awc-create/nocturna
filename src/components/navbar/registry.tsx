import type { ComponentType } from 'react';

import StickyTop from './variants/sticky-top';
import ScrollUpExpand from './variants/scroll-up-expand';
import ScrollPeek from './variants/scroll-peek';
import ScrollPeekBottomNavbar from './variants/scroll-peek-bottom';
import ScrollHandoffSync from './variants/scroll-handoff-sync';
import LinksToLogoMorph from './variants/links-to-logo-morph';

export type NavSlug =
  | 'sticky-top'
  | 'scroll-up-expand'
  | 'scroll-peek'
  | 'scroll-peek-bottom'
  | 'scroll-handoff-sync'
  | 'links-to-logo-morph';

type NavEntry = {
  component: ComponentType<unknown>; // no explicit props → use unknown (not any)
  label: string;
};

export const NAV_REGISTRY: Record<NavSlug, NavEntry> = {
  'sticky-top': { component: StickyTop, label: 'Sticky (Top)' },
  'scroll-up-expand': { component: ScrollUpExpand, label: 'Scroll Up Expand' },
  'scroll-peek': { component: ScrollPeek, label: 'Scroll Peek' },
  'scroll-peek-bottom': { component: ScrollPeekBottomNavbar, label: 'Scroll Peek Bottom' },
  'scroll-handoff-sync': { component: ScrollHandoffSync, label: 'Scroll Handoff sync' },
  'links-to-logo-morph': { component: LinksToLogoMorph, label: 'Links to Logo Morph' },
};

export const NAV_ORDER: NavSlug[] = [
  'sticky-top',
  'scroll-up-expand',
  'scroll-peek',
  'scroll-peek-bottom',
  'scroll-handoff-sync',
  'links-to-logo-morph',
];
export const DEFAULT_NAV: NavSlug = NAV_ORDER[0];
