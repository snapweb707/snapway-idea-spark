import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, analysisType, userId } = await req.json();

    // Get OpenRouter API key from settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'openrouter_api_key')
      .single();

    if (!settingData?.setting_value) {
      return new Response(
        JSON.stringify({ error: 'لم يتم تكوين OpenRouter API Key' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openRouterKey = settingData.setting_value;

    // Get selected model from admin settings
    const { data: modelData } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'selected_ai_model')
      .single();

    const modelToUse = modelData?.setting_value || "openai/gpt-4o-mini";

    // Configure analysis based on type
    let systemPrompt = "";

    switch (analysisType) {
      case 'interactive':
        systemPrompt = `أنت محلل أعمال تفاعلي خبير. قم بتحليل فكرة المشروع التجاري وقدم تحليلاً تفاعلياً يتضمن أسئلة إضافية وتوصيات قابلة للتطبيق. استجب بصيغة JSON منظمة.`;
        break;
      case 'deep':
        systemPrompt = `أنت محلل أعمال متقدم ومتخصص. قم بإجراء تحليل عميق ومفصل لفكرة المشروع التجاري يشمل تحليل السوق المتقدم، دراسة المنافسين، النمذجة المالية، وتحليل المخاطر التفصيلي. استجب بصيغة JSON منظمة.`;
        break;
      default:
        systemPrompt = `أنت محلل أعمال خبير. قم بتحليل فكرة المشروع التجاري وقدم تقييماً شاملاً وسريعاً. استجب بصيغة JSON منظمة.`;
    }

    const fullPrompt = `${systemPrompt}

استجب بصيغة JSON بالتنسيق التالي:
{
  "overall_score": number (0-100),
  "market_potential": number (0-100), 
  "feasibility": number (0-100),
  "risk_level": number (0-100),
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", ...],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", ...],
  "recommendations": ["توصية 1", "توصية 2", ...],
  "market_size": "وصف حجم السوق",
  "target_audience": "وصف الجمهور المستهدف",
  "revenue_model": "نموذج الإيرادات المقترح",
  "competitive_advantage": "المزايا التنافسية المحتملة"
}

استجب باللغة العربية لجميع الحقول النصية. كن شاملاً وقدم رؤى قابلة للتطبيق.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: fullPrompt
          },
          {
            role: "user",
            content: `حلل فكرة المشروع التالية: ${idea}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error("فشل في الحصول على التحليل من OpenRouter");
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("استجابة غير صحيحة من الذكاء الاصطناعي");
    }
    
    const analysisText = data.choices[0].message.content;
    console.log('Raw AI response:', analysisText);
    
    let analysis;
    try {
      // Try to parse the JSON response
      analysis = JSON.parse(analysisText);
      
      // Validate that the analysis has required fields
      if (!analysis.overall_score || !analysis.strengths || !analysis.recommendations) {
        throw new Error("التحليل لا يحتوي على البيانات المطلوبة");
      }
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Raw response that failed to parse:', analysisText);
      
      // If JSON parsing fails, try to get another response with more explicit instructions
      const retryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: `أنت محلل أعمال خبير. قم بتحليل فكرة المشروع واستجب بصيغة JSON صحيحة فقط بدون أي نص إضافي. استخدم هذا التنسيق بالضبط:
{
  "overall_score": 85,
  "market_potential": 80,
  "feasibility": 75,
  "risk_level": 30,
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "recommendations": ["توصية 1", "توصية 2"],
  "market_size": "وصف حجم السوق",
  "target_audience": "وصف الجمهور المستهدف",
  "revenue_model": "نموذج الإيرادات المقترح",
  "competitive_advantage": "المزايا التنافسية المحتملة"
}`
            },
            {
              role: "user",
              content: `حلل فكرة المشروع التالية واستجب بـ JSON صحيح فقط: ${idea}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryText = retryData.choices[0].message.content;
        
        try {
          analysis = JSON.parse(retryText);
        } catch (retryParseError) {
          throw new Error("فشل في الحصول على تحليل صحيح من الذكاء الاصطناعي");
        }
      } else {
        throw new Error("فشل في إعادة محاولة التحليل");
      }
    }

    // Save the analysis to database
    const { error: insertError } = await supabase
      .from('project_ideas')
      .insert({
        idea_text: idea,
        analysis_result: analysis,
        user_id: userId,
        status: 'completed'
      });

    if (insertError) {
      console.error('Error saving analysis:', insertError);
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-idea function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'حدث خطأ غير متوقع' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});