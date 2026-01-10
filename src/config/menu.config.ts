// src/config/menu.config.ts

export type NavLink = {
  id: string; // matches <section id="...">
  label: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'top', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'clients', label: 'Clients' },
  { id: 'enquire', label: 'Enquire' },
  { id: 'join', label: 'Join' },
  { id: 'contact', label: 'Contact' },
];
