
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutOptions {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export const stripeService = {
  /**
   * Create a checkout session for the user
   */
  async createCheckoutSession(options: CheckoutOptions): Promise<{ url: string; sessionId: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: options
      });

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },
};
