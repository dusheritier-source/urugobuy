import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StoreReview = { id: string; productId: string; author: string; rating: number; title: string; comment: string; createdAt: string; verified: boolean; status: "pending" | "published" | "rejected"; helpful: number };
type Store = { reviews: StoreReview[]; add: (review: StoreReview) => void; moderate: (id: string, status: StoreReview["status"]) => void; helpful: (id: string) => void };
export const useReviewStore = create<Store>()(persist((set) => ({ reviews: [], add: (review) => set((state) => ({ reviews: [review, ...state.reviews] })), moderate: (id, status) => set((state) => ({ reviews: state.reviews.map((review) => review.id === id ? { ...review, status } : review) })), helpful: (id) => set((state) => ({ reviews: state.reviews.map((review) => review.id === id ? { ...review, helpful: review.helpful + 1 } : review) })) }), { name: "urugo-reviews" }));
