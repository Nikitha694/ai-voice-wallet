import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Other",
];

// Basic parser function
function parseExpenseText(text: string) {
  // Extract the first number as amount
  const amountMatch = text.match(/\b\d+(\.\d{1,2})?\b/);
  const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

  // Detect category by keywords
  let category = "Other";
  for (const cat of CATEGORIES) {
    const keyword = cat.toLowerCase().split(" ")[0];
    if (text.toLowerCase().includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Try to detect date (simple: today by default)
  const date = new Date().toISOString().split("T")[0];

  return {
    amount,
    category,
    description: text,
    date,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error("No text provided");

    const parsedExpense = parseExpenseText(text);

    return new Response(JSON.stringify(parsedExpense), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
