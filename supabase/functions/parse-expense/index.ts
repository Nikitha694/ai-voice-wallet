import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    console.log('Parsing expense from text:', text);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expense parser. Extract expense details from text. Return ONLY valid JSON with these fields:
- amount (number)
- category (one of: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Other)
- description (string, optional)
- date (YYYY-MM-DD format, default to today if not specified)

Examples:
"spent 50 dollars on groceries yesterday" -> {"amount": 50, "category": "Food & Dining", "description": "groceries", "date": "2024-01-14"}
"bought coffee for 5 bucks" -> {"amount": 5, "category": "Food & Dining", "description": "coffee", "date": "${new Date().toISOString().split('T')[0]}"}
"paid 100 for uber last friday" -> {"amount": 100, "category": "Transportation", "description": "uber", "date": "2024-01-12"}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'parse_expense',
              description: 'Parse expense details from text',
              parameters: {
                type: 'object',
                properties: {
                  amount: { type: 'number', description: 'The expense amount' },
                  category: { 
                    type: 'string', 
                    enum: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other']
                  },
                  description: { type: 'string', description: 'Optional description' },
                  date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
                },
                required: ['amount', 'category', 'date']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'parse_expense' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const parsedExpense = JSON.parse(toolCall.function.arguments);
    console.log('Parsed expense:', parsedExpense);

    return new Response(
      JSON.stringify(parsedExpense),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-expense function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
