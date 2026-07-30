export interface SiteMeta {
  name: string;
  domain: string;
  url: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  ga4: string;
}

export interface IconText {
  icon: string;
  title?: string;
  label?: string;
  text?: string;
  value?: string;
}

export interface Restaurant {
  name: string;
  category: string;
  distance: string;
  icon: string;
  description: string;
  note: string;
}

export interface PlanItem {
  time: string;
  title: string;
  text: string;
}

export interface Plan {
  id: string;
  label: string;
  icon: string;
  time: string;
  items: PlanItem[];
}

export interface Faq {
  question: string;
  answer: string;
}
