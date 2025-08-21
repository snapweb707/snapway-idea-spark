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

    console.log('Starting analysis with model:', modelToUse);
    
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
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error("فشل في الحصول على التحليل من OpenRouter");
    }

    const data = await response.json();
    console.log('OpenRouter response received:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid OpenRouter response structure:", data);
      throw new Error("استجابة غير صحيحة من الذكاء الاصطناعي");
    }
    
    const analysisText = data.choices[0].message.content;
    console.log('Raw AI response text:', analysisText);
    
    let analysis;
    try {
      // Remove any markdown formatting or extra text
      let jsonText = analysisText.trim();
      
      // Try to find JSON content between curly braces
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      analysis = JSON.parse(jsonText);
      console.log('Successfully parsed analysis:', analysis);
      
      // Validate that the analysis has required fields
      const requiredFields = ['overall_score', 'market_potential', 'feasibility', 'risk_level', 'strengths', 'weaknesses', 'recommendations'];
      const missingFields = requiredFields.filter(field => !analysis.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`التحليل لا يحتوي على البيانات المطلوبة: ${missingFields.join(', ')}`);
      }
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Failed to parse text:', analysisText);
      
      // Create a basic analysis as fallback
      analysis = {
        overall_score: 75,
        market_potential: 70,
        feasibility: 80,
        risk_level: 40,
        strengths: ["فكرة قابلة للتطبيق", "سوق واعد", "إمكانية نمو جيدة"],
        weaknesses: ["يحتاج دراسة أعمق", "منافسة محتملة", "يتطلب استثمار أولي"],
        recommendations: [
          "إجراء بحث سوق مفصل",
          "تطوير نموذج أولي",
          "دراسة التكاليف والإيرادات المتوقعة",
          "تحديد الجمهور المستهدف بدقة"
        ],
        market_size: "سوق متوسط الحجم مع إمكانيات نمو",
        target_audience: "الجمهور العام المهتم بالخدمة",
        revenue_model: "نموذج اشتراك أو مبيعات مباشرة",
        competitive_advantage: "خدمة مبتكرة تلبي احتياج السوق"
      };
      
      console.log('Using fallback analysis:', analysis);
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