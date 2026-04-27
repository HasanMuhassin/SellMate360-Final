import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Attribute {
  id: string;
  name: string;
  type: string;
  attribute_options?: AttributeOption[];
}

export interface AttributeOption {
  id: string;
  attribute_id: string;
  value: string;
  meta: any;
}

export interface ProductAttribute {
  product_id: string;
  attribute_id: string;
  option_id: string;
}

// ==================== APIs / Hooks ====================

// 1. Fetch all attributes with their options
export function useAttributes() {
  return useQuery({
    queryKey: ["attributes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attributes")
        .select(`
          id, name, type,
          attribute_options(id, attribute_id, value, meta)
        `)
        .order("name");

      if (error) {
        console.error("Supabase attributes fetch error:", error);
        throw error;
      }
      return (data || []) as Attribute[];
    },
  });
}

// 2. Create a new attribute
export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attr: { name: string; type: string }) => {
      const { data, error } = await supabase
        .from("attributes")
        .insert(attr)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attributes"] }),
  });
}

// 3. Add options to an attribute
export function useCreateAttributeOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (option: { attribute_id: string; value: string; meta?: any }) => {
      const { data, error } = await supabase
        .from("attribute_options")
        .insert(option)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attributes"] }),
  });
}

// 4. Assign an attribute option to a product
export function useAssignProductAttribute() {
  return useMutation({
    mutationFn: async (mapping: ProductAttribute) => {
      const { data, error } = await supabase
        .from("product_attributes")
        .insert(mapping)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });
}

// 5. Fetch assigned attributes for a specific product
export function useProductAttributes(productId: string) {
  return useQuery({
    queryKey: ["product-attributes", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_attributes")
        .select(`
          product_id,
          attribute_id,
          option_id,
          attributes(id, name, type),
          attribute_options(id, value, meta)
        `)
        .eq("product_id", productId);

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}
