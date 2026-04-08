import { create } from "zustand";

interface FaceStore {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  clearImageFile: () => void;
}

export const useFaceStore = create<FaceStore>((set) => ({
  imageFile: null,
  setImageFile: (file) => set({ imageFile: file }),
  clearImageFile: () => set({ imageFile: null }),
}));
