"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse, ProductCard } from "@/types";

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: ProductCard;
}

export interface CartData {
  id: string;
  items: CartItem[];
  total: number;
}

interface ApiCartResponse {
  id: string;
  items: {
    id: string;
    productId: string;
    quantity: number;
    product: ProductCard;
  }[];
  total: number;
}

async function fetchCart(): Promise<CartData> {
  const res = await fetch("/api/cart", { credentials: "include" });
  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดตะกร้าสินค้าได้");
  }
  const json: ApiResponse<ApiCartResponse> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message ?? "ไม่สามารถโหลดตะกร้าสินค้าได้");
  }
  return {
    id: json.data.id,
    items: json.data.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    })),
    total: json.data.total,
  };
}

async function apiAddToCart(params: {
  productId: string;
  quantity: number;
}): Promise<void> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    credentials: "include",
  });
  if (!res.ok) {
    const json: ApiResponse = await res.json();
    throw new Error(json.message ?? "ไม่สามารถเพิ่มสินค้าได้");
  }
}

async function apiUpdateCart(params: {
  cartId: string;
  quantity: number;
}): Promise<void> {
  const res = await fetch(`/api/cart/${params.cartId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: params.quantity }),
    credentials: "include",
  });
  if (!res.ok) {
    const json: ApiResponse = await res.json();
    throw new Error(json.message ?? "ไม่สามารถอัปเดตตะกร้าได้");
  }
}

async function apiRemoveFromCart(cartId: string): Promise<void> {
  const res = await fetch(`/api/cart/${cartId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const json: ApiResponse = await res.json();
    throw new Error(json.message ?? "ไม่สามารถลบสินค้าได้");
  }
}

async function apiClearCart(): Promise<void> {
  const res = await fetch("/api/cart/clear", {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const json: ApiResponse = await res.json();
    throw new Error(json.message ?? "ไม่สามารถล้างตะกร้าได้");
  }
}

export function useCart() {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<CartData>({
    queryKey: ["cart"],
    queryFn: fetchCart,
    staleTime: 1000 * 30,
    retry: 1,
  });

  const addToCartMutation = useMutation({
    mutationFn: apiAddToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: apiUpdateCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: apiRemoveFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: apiClearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const cartItemCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart: cart ?? null,
    cartItemCount,
    isLoading,
    addToCart: (productId: string, quantity: number) =>
      addToCartMutation.mutateAsync({ productId, quantity }),
    updateCart: (cartId: string, quantity: number) =>
      updateCartMutation.mutateAsync({ cartId, quantity }),
    removeFromCart: (cartId: string) =>
      removeFromCartMutation.mutateAsync(cartId),
    clearCart: () => clearCartMutation.mutateAsync(),
  } as const;
}
