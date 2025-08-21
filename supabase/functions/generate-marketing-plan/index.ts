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
    const { idea, analysis, language = 'ar', userId } = await req.json();

    console.log('Marketing plan request:', { idea, language, userId });

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
        JSON.stringify({ error: language === 'ar' ? 'لم يتم تكوين OpenRouter API Key' : 'OpenRouter API Key not configured' }),
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

    // Create marketing plan prompt
    const systemPrompt = language === 'ar' ? 
      `أنت خبير تسويق متخصص ومحترف. قم بإنشاء خطة تسويقية شاملة ومفصلة للمشروع التجاري بناءً على فكرة المشروع وتحليله الموجود.` :
      `You are a professional marketing expert. Create a comprehensive and detailed marketing plan for the business project based on the business idea and its existing analysis.`;

    const jsonFormat = language === 'ar' ? `{
  "strategy": "الاستراتيجية التسويقية الرئيسية والمبدأ العام للتسويق",
  "target_audience": "تحليل مفصل للجمهور المستهدف مع التقسيمات الديموغرافية والسلوكية",
  "channels": [
    "قناة تسويقية 1 (مثل وسائل التواصل الاجتماعي)",
    "قناة تسويقية 2 (مثل التسويق الرقمي)",
    "قناة تسويقية 3 (مثل التسويق التقليدي)",
    "قناة تسويقية 4 (مثل التسويق بالمحتوى)"
  ],
  "budget": "خطة الميزانية التسويقية مع تقسيم التكاليف والاستثمارات المطلوبة",
  "timeline": "الجدول الزمني للحملات التسويقية والمراحل المختلفة",
  "kpis": [
    "مؤشر أداء رئيسي 1",
    "مؤشر أداء رئيسي 2", 
    "مؤشر أداء رئيسي 3",
    "مؤشر أداء رئيسي 4"
  ],
  "action_items": [
    "إجراء عملي 1 - مع تفاصيل التنفيذ",
    "إجراء عملي 2 - مع تفاصيل التنفيذ",
    "إجراء عملي 3 - مع تفاصيل التنفيذ",
    "إجراء عملي 4 - مع تفاصيل التنفيذ"
  ]
}` : `{
  "strategy": "Main marketing strategy and general principle for marketing",
  "target_audience": "Detailed analysis of target audience with demographic and behavioral segments",
  "channels": [
    "Marketing channel 1 (e.g., social media)",
    "Marketing channel 2 (e.g., digital marketing)",
    "Marketing channel 3 (e.g., traditional marketing)",
    "Marketing channel 4 (e.g., content marketing)"
  ],
  "budget": "Marketing budget plan with cost breakdown and required investments",
  "timeline": "Timeline for marketing campaigns and different phases",
  "kpis": [
    "Key performance indicator 1",
    "Key performance indicator 2",
    "Key performance indicator 3", 
    "Key performance indicator 4"
  ],
  "action_items": [
    "Action item 1 - with implementation details",
    "Action item 2 - with implementation details",
    "Action item 3 - with implementation details",
    "Action item 4 - with implementation details"
  ]
}`;

    const fullPrompt = `${systemPrompt}

${language === 'ar' ? 
  'فكرة المشروع:' : 
  'Business idea:'
} ${idea}

${language === 'ar' ?
  'تحليل المشروع الموجود:' :
  'Existing project analysis:'
} ${JSON.stringify(analysis)}

${language === 'ar' ? 
  'قم بإنشاء خطة تسويقية شاملة ومفصلة. أرجع النتائج بصيغة JSON صحيحة فقط باستخدام هذا التنسيق بالضبط:' :
  'Create a comprehensive and detailed marketing plan. Return results in valid JSON format only using this exact format:'
}

${jsonFormat}

${language === 'ar' ? `تعليمات مهمة:
- اجعل الخطة عملية وقابلة للتطبيق
- ركز على نقاط القوة من التحليل الموجود
- تجنب المصطلحات المعقدة
- قدم حلول إبداعية ومبتكرة
- كن مفصلاً في كل قسم
- اربط الخطة بالجمهور المستهدف المحدد في التحليل` : `Important instructions:
- Make the plan practical and implementable
- Focus on strengths from the existing analysis
- Avoid complex terminology
- Provide creative and innovative solutions
- Be detailed in each section
- Connect the plan to the target audience identified in the analysis`}`;

    console.log('Sending request to OpenRouter for marketing plan...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      })
    });

    const responseData = await response.json();
    console.log('OpenRouter marketing plan response received:', responseData);

    if (!responseData.choices || !responseData.choices[0]) {
      throw new Error('Invalid response from AI service');
    }

    const rawText = responseData.choices[0].message.content;
    console.log('Raw AI marketing plan response text:', rawText);

    let planData;
    try {
      // استخراج JSON من النص
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[0]
          .replace(/```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        
        planData = JSON.parse(jsonText);
        console.log('Successfully parsed marketing plan:', planData);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // Create fallback marketing plan
      planData = {
        strategy: language === 'ar' ? 
          "استراتيجية تسويقية متدرجة تركز على بناء الوعي بالعلامة التجارية وجذب العملاء المستهدفين" :
          "Gradual marketing strategy focusing on brand awareness building and attracting target customers",
        target_audience: language === 'ar' ?
          "الجمهور المحدد في التحليل مع التركيز على الفئات الأكثر اهتماماً بالمنتج أو الخدمة" :
          "Target audience identified in analysis focusing on segments most interested in the product or service",
        channels: language === 'ar' ? [
          "وسائل التواصل الاجتماعي (فيسبوك، إنستغرام، تويتر)",
          "التسويق الرقمي والإعلانات المدفوعة",
          "التسويق بالمحتوى والمدونات",
          "العلاقات العامة والشراكات"
        ] : [
          "Social media (Facebook, Instagram, Twitter)",
          "Digital marketing and paid advertising",
          "Content marketing and blogging",
          "Public relations and partnerships"
        ],
        budget: language === 'ar' ?
          "ميزانية تدريجية تبدأ بمبلغ صغير للتجريب ثم تزيد تدريجياً حسب النتائج" :
          "Gradual budget starting with small amount for testing then increasing based on results",
        timeline: language === 'ar' ?
          "خطة 6 أشهر مقسمة إلى مراحل: شهرين للإعداد، شهرين للإطلاق، شهرين للتحسين" :
          "6-month plan divided into phases: 2 months preparation, 2 months launch, 2 months optimization",
        kpis: language === 'ar' ? [
          "عدد العملاء المحتملين المحصل عليهم",
          "معدل التحويل من زائر إلى عميل",
          "التفاعل على وسائل التواصل الاجتماعي",
          "العائد على الاستثمار التسويقي"
        ] : [
          "Number of leads generated",
          "Conversion rate from visitor to customer",
          "Social media engagement",
          "Marketing return on investment"
        ],
        action_items: language === 'ar' ? [
          "إنشاء هوية بصرية وعلامة تجارية واضحة",
          "تطوير محتوى تسويقي جذاب ومفيد",
          "إطلاق حملات إعلانية مستهدفة",
          "بناء شراكات استراتيجية مع الشركات ذات الصلة"
        ] : [
          "Create clear visual identity and branding",
          "Develop engaging and useful marketing content",
          "Launch targeted advertising campaigns",
          "Build strategic partnerships with relevant companies"
        ]
      };
    }

    console.log('Final marketing plan data:', planData);

    // Optional: Store marketing plan in database
    if (userId) {
      try {
        await supabase
          .from('analysis_history')
          .insert({
            user_id: userId,
            idea_text: idea,
            analysis_result: { marketing_plan: planData },
            analysis_type: 'marketing_plan',
            language: language
          });
      } catch (error) {
        console.error('Error storing marketing plan:', error);
        // Don't fail the request if storage fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: planData,
        message: language === 'ar' ? 'تم إنشاء الخطة التسويقية بنجاح' : 'Marketing plan generated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Marketing plan generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'حدث خطأ في إنشاء الخطة التسويقية'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});