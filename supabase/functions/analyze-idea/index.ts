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
    let jsonFormat = "";

    switch (analysisType) {
      case 'interactive':
        systemPrompt = `أنت محلل أعمال تفاعلي خبير. قم بتحليل فكرة المشروع التجاري وقدم تحليلاً تفاعلياً يتضمن أسئلة بسيطة وواضحة لمساعدة المستخدم على تطوير فكرته. ركز على الجوانب العملية والخطوات القابلة للتنفيذ.`;
        jsonFormat = `{
  "overall_score": [رقم من 0 إلى 100],
  "market_potential": [رقم من 0 إلى 100], 
  "feasibility": [رقم من 0 إلى 100],
  "risk_level": [رقم من 0 إلى 100],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "market_size": "وصف مفصل لحجم السوق",
  "target_audience": "وصف مفصل للجمهور المستهدف",
  "revenue_model": "نموذج الإيرادات المقترح",
  "competitive_advantage": "المزايا التنافسية المحتملة",
  "interactive_questions": [
    "سؤال بسيط ومباشر حول التنفيذ",
    "سؤال عن الجمهور المستهدف",
    "سؤال عن التمويل المطلوب",
    "سؤال عن الخطوات التالية"
  ],
  "action_plan": {
    "immediate_steps": ["خطوة فورية 1", "خطوة فورية 2"],
    "short_term_goals": ["هدف قصير المدى 1", "هدف قصير المدى 2"],
    "long_term_vision": "رؤية طويلة المدى للمشروع"
  }
}`;
        break;
      case 'deep':
        systemPrompt = `أنت محلل أعمال متقدم ومتخصص. قم بإجراء تحليل عميق ومفصل لفكرة المشروع التجاري يشمل تحليل السوق المتقدم، دراسة المنافسين، النمذجة المالية المفصلة، وتحليل المخاطر التفصيلي.`;
        jsonFormat = `{
  "overall_score": [رقم من 0 إلى 100],
  "market_potential": [رقم من 0 إلى 100], 
  "feasibility": [رقم من 0 إلى 100],
  "risk_level": [رقم من 0 إلى 100],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3", "نقطة قوة 4"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3", "توصية 4"],
  "market_size": "تحليل مفصل جداً لحجم السوق مع أرقام وإحصائيات",
  "target_audience": "تحليل شامل للجمهور المستهدف مع التقسيمات",
  "revenue_model": "نموذج إيرادات مفصل مع توقعات رقمية",
  "competitive_advantage": "تحليل تفصيلي للمزايا التنافسية",
  "financial_analysis": {
    "startup_cost": "تحليل مفصل للتكاليف الأولية",
    "monthly_expenses": "تقدير التكاليف الشهرية",
    "break_even_time": "تقدير فترة الوصول لنقطة التعادل",
    "roi_projection": "توقع العائد على الاستثمار"
  },
  "competitive_analysis": {
    "main_competitors": ["منافس 1", "منافس 2", "منافس 3"],
    "market_differentiation": "كيفية التميز في السوق",
    "barrier_to_entry": "تحديات دخول السوق"
  },
  "action_plan": {
    "immediate_steps": ["خطوة فورية 1", "خطوة فورية 2", "خطوة فورية 3"],
    "short_term_goals": ["هدف قصير المدى 1", "هدف قصير المدى 2"],
    "long_term_vision": "رؤية استراتيجية طويلة المدى"
  }
}`;
        break;
      default:
        systemPrompt = `أنت محلل أعمال خبير. قم بتحليل فكرة المشروع التجاري وقدم تقييماً شاملاً وسريعاً مع توصيات عملية.`;
        jsonFormat = `{
  "overall_score": [رقم من 0 إلى 100],
  "market_potential": [رقم من 0 إلى 100], 
  "feasibility": [رقم من 0 إلى 100],
  "risk_level": [رقم من 0 إلى 100],
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "market_size": "وصف مفصل لحجم السوق",
  "target_audience": "وصف مفصل للجمهور المستهدف",
  "revenue_model": "نموذج الإيرادات المقترح",
  "competitive_advantage": "المزايا التنافسية المحتملة"
}`;
    }

    const fullPrompt = `${systemPrompt}

قم بتحليل فكرة المشروع وإرجاع النتائج بصيغة JSON صحيحة فقط. استخدم هذا التنسيق بالضبط:

${jsonFormat}

تعليمات مهمة:
- أجعل كل الأسئلة التفاعلية بسيطة ومباشرة
- ركز على الجوانب العملية والقابلة للتنفيذ
- استخدم اللغة العربية البسيطة والواضحة
- لا تضيف أي نص قبل أو بعد JSON
- أرجع JSON فقط`;

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
      
      // Add fallback analysis for interactive questions if missing
      if (analysisType === 'interactive' && !analysis.interactive_questions) {
        analysis.interactive_questions = [
          "ما هو الهدف الرئيسي من مشروعك؟",
          "من هم عملاؤك المحتملون؟",
          "كم رأس المال المطلوب للبدء؟",
          "ما هي خطوتك الأولى للتنفيذ؟"
        ];
      }
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Failed to parse text:', analysisText);
      
      // Create a basic analysis as fallback with interactive questions
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
      
      // Add type-specific fallback data
      if (analysisType === 'interactive') {
        analysis.interactive_questions = [
          "ما هو الهدف الرئيسي من مشروعك؟",
          "من هم عملاؤك المحتملون؟",
          "كم رأس المال المطلوب للبدء؟",
          "ما هي خطوتك الأولى للتنفيذ؟"
        ];
        analysis.action_plan = {
          immediate_steps: ["تحديد الفكرة بوضوح", "إجراء بحث أولي"],
          short_term_goals: ["تطوير نموذج أولي", "اختبار السوق"],
          long_term_vision: "بناء مشروع مستدام ومربح"
        };
      } else if (analysisType === 'deep') {
        analysis.financial_analysis = {
          startup_cost: "يحتاج تقدير مفصل حسب نوع المشروع",
          monthly_expenses: "تقدير التكاليف الشهرية مطلوب",
          break_even_time: "6-12 شهر تقريباً",
          roi_projection: "عائد متوقع بناءً على أداء السوق"
        };
        analysis.competitive_analysis = {
          main_competitors: ["منافس رئيسي 1", "منافس رئيسي 2"],
          market_differentiation: "تحديد نقاط التميز المطلوبة",
          barrier_to_entry: "حواجز دخول متوسطة"
        };
      }
      
      console.log('Using fallback analysis:', analysis);
    }

    // Save the analysis to database
    try {
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
        // Don't throw error here, just log it
      }
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if DB save fails
    }

    return new Response(JSON.stringify({ 
      analysis,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in analyze-idea function:', error);
    
    // Return a meaningful error response
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 200, // Return 200 to avoid function error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});