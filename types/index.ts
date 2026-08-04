export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  discount: number;
  images: string[];
  rating: number;
  stock: number;
  colors: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
}
