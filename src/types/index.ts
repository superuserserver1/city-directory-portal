export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'VISITOR';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  password?: never;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  _count?: { businesses: number };
}

export interface Locality {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
  _count?: { businesses: number };
}

export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BusinessHour {
  id: string;
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  businessId: string;
}

export interface BusinessImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  businessId: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  aboutUs?: string;
  type: 'BUSINESS' | 'AMENITY';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  lat?: number;
  lng?: number;
  logo?: string;
  coverImage?: string;
  rating: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  status: BusinessStatus;
  rejectionReason?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  whatsapp?: string;
  googleMaps?: string;
  categoryId: string;
  localityId: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessWithRelations extends Business {
  category: Category;
  locality: Locality;
  owner?: Pick<User, 'id' | 'name' | 'email' | 'phone'> | null;
  products: Product[];
  images: BusinessImage[];
  hours: BusinessHour[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: string;
  priceUnit?: string;
  image?: string;
  images: string;
  type: 'PRODUCT' | 'SERVICE';
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  businessId: string;
  visitorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryWithRelations extends Enquiry {
  business: Pick<Business, 'id' | 'name' | 'type' | 'phone' | 'email'>;
  visitor: Pick<User, 'id' | 'name' | 'email'>;
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  enquiryId: string;
  senderId: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  businessId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  totalEnquiries: number;
  totalCategories: number;
  totalLocalities: number;
  pendingBusinesses: number;
  recentEnquiries: EnquiryWithRelations[];
}

export interface SiteSettings {
  id: string;
  cityName: string;
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  footerText: string;
  copyrightText: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  updatedAt: string;
  createdAt: string;
}