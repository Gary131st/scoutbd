import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { video_id, bkash_number } = await req.json();

    // Simulate bKash payment (in production, integrate real bKash API)
    const transactionId = `BK${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment record
    const { data: payment, error: payError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        video_id,
        amount: 100.00,
        method: "bkash",
        status: "success",
        transaction_id: transactionId,
      })
      .select()
      .single();

    if (payError) {
      return new Response(JSON.stringify({ error: payError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update video status to live
    await supabase
      .from("videos")
      .update({ status: "live" })
      .eq("id", video_id)
      .eq("user_id", user.id);

    // Create certificate record
    const { data: cert } = await supabase
      .from("certificates")
      .insert({
        user_id: user.id,
        video_id,
        payment_id: payment.id,
        certificate_url: null, // Will be generated client-side as PDF
      })
      .select()
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      transaction_id: transactionId,
      payment_id: payment.id,
      certificate_id: cert?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
