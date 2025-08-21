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
    const { 
      idea, 
      analysisType = 'basic', 
      userId,
      language = 'ar',
      currentQuestion,
      userAnswer,
      allAnswers = [],
      previousAnalysis
    } = await req.json();

    // للتحديث التفاعلي
    if (analysisType === 'interactive_update') {
      return await handleInteractiveUpdate(req, {
        idea,
        currentQuestion,
        userAnswer,
        allAnswers,
        previousAnalysis,
        userId,
        language
      });
    }

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
        if (language === 'en') {
          systemPrompt = `You are an expert interactive business analyst. Analyze the business idea and provide a detailed interactive analysis with simple and clear questions to help the user develop their idea. Focus on practical aspects and actionable steps with a clear phased plan.`;
          jsonFormat = `{
  "overall_score": [number from 0 to 100],
  "market_potential": [number from 0 to 100], 
  "feasibility": [number from 0 to 100],
  "risk_level": [number from 0 to 100],
  "strengths": ["detailed strength 1", "detailed strength 2", "detailed strength 3", "detailed strength 4"],
  "weaknesses": ["detailed weakness 1", "detailed weakness 2", "detailed weakness 3"],
  "recommendations": ["detailed recommendation 1", "detailed recommendation 2", "detailed recommendation 3", "detailed recommendation 4"],
  "market_size": "detailed analysis of market size with data and forecasts",
  "target_audience": "detailed analysis of target audience with demographic segmentation",
  "revenue_model": "detailed revenue model with multiple sources",
  "competitive_advantage": "detailed competitive advantages",
  "next_steps": {
    "phase_1": ["phase 1 step 1", "phase 1 step 2", "phase 1 step 3"],
    "phase_2": ["phase 2 step 1", "phase 2 step 2", "phase 2 step 3"],
    "phase_3": ["phase 3 step 1", "phase 3 step 2"],
    "timeline": "suggested timeline for phases (e.g., 3-6 months per phase)"
  },
  "interactive_questions": [
    "detailed question about implementation strategy",
    "question about precisely identifying target audience",
    "question about funding and investment sources",
    "question about expected challenges and solutions",
    "question about required team"
  ],
  "action_plan": {
    "immediate_steps": ["detailed immediate step 1", "detailed immediate step 2", "detailed immediate step 3"],
    "short_term_goals": ["detailed short-term goal 1", "detailed short-term goal 2", "detailed short-term goal 3"],
    "long_term_vision": "detailed long-term strategic vision for the project with growth expectations"
  }
}`;
        } else {
          systemPrompt = `أنت محلل أعمال تفاعلي خبير ومتخصص. قم بتحليل فكرة المشروع التجاري وقدم تحليلاً تفاعلياً مفصلاً وشاملاً يتضمن أسئلة بسيطة وواضحة لمساعدة المستخدم على تطوير فكرته. ركز على الجوانب العملية والخطوات القابلة للتنفيذ مع خطة مرحلية واضحة.`;
          jsonFormat = `{
  "overall_score": [رقم من 0 إلى 100],
  "market_potential": [رقم من 0 إلى 100], 
  "feasibility": [رقم من 0 إلى 100],
  "risk_level": [رقم من 0 إلى 100],
  "strengths": ["نقطة قوة مفصلة 1", "نقطة قوة مفصلة 2", "نقطة قوة مفصلة 3", "نقطة قوة مفصلة 4"],
  "weaknesses": ["نقطة ضعف مفصلة 1", "نقطة ضعف مفصلة 2", "نقطة ضعف مفصلة 3"],
  "recommendations": ["توصية مفصلة 1", "توصية مفصلة 2", "توصية مفصلة 3", "توصية مفصلة 4"],
  "market_size": "تحليل مفصل وشامل لحجم السوق مع بيانات وتوقعات",
  "target_audience": "تحليل مفصل للجمهور المستهدف مع تقسيمات ديموغرافية",
  "revenue_model": "نموذج إيرادات مفصل مع مصادر متعددة",
  "competitive_advantage": "المزايا التنافسية المحتملة بالتفصيل",
  "next_steps": {
    "phase_1": ["خطوة مرحلة أولى مفصلة 1", "خطوة مرحلة أولى مفصلة 2", "خطوة مرحلة أولى مفصلة 3"],
    "phase_2": ["خطوة مرحلة ثانية مفصلة 1", "خطوة مرحلة ثانية مفصلة 2", "خطوة مرحلة ثانية مفصلة 3"],
    "phase_3": ["خطوة مرحلة ثالثة مفصلة 1", "خطوة مرحلة ثالثة مفصلة 2"],
    "timeline": "جدول زمني مقترح للمراحل (3-6 أشهر لكل مرحلة مثلاً)"
  },
  "interactive_questions": [
    "سؤال مفصل حول استراتيجية التنفيذ",
    "سؤال عن تحديد الجمهور المستهدف بدقة",
    "سؤال عن مصادر التمويل والاستثمار",
    "سؤال عن التحديات المتوقعة وحلولها",
    "سؤال عن فريق العمل المطلوب"
  ],
  "action_plan": {
    "immediate_steps": ["خطوة فورية مفصلة 1", "خطوة فورية مفصلة 2", "خطوة فورية مفصلة 3"],
    "short_term_goals": ["هدف قصير المدى مفصل 1", "هدف قصير المدى مفصل 2", "هدف قصير المدى مفصل 3"],
    "long_term_vision": "رؤية استراتيجية طويلة المدى مفصلة للمشروع مع توقعات النمو"
  }
}`;
        }
        break;
      case 'deep':
        if (language === 'en') {
          systemPrompt = `You are an advanced business analyst with high expertise. Conduct a comprehensive and detailed analysis of the business idea including advanced market analysis with data, detailed competitor research, comprehensive financial modeling, detailed risk analysis, and a clear phased implementation plan.`;
          jsonFormat = `{
  "overall_score": [number from 0 to 100],
  "market_potential": [number from 0 to 100], 
  "feasibility": [number from 0 to 100],
  "risk_level": [number from 0 to 100],
  "strengths": ["detailed strength 1", "detailed strength 2", "detailed strength 3", "detailed strength 4", "detailed strength 5"],
  "weaknesses": ["detailed weakness 1", "detailed weakness 2", "detailed weakness 3", "detailed weakness 4"],
  "recommendations": ["strategic detailed recommendation 1", "operational detailed recommendation 2", "financial detailed recommendation 3", "marketing detailed recommendation 4", "technical detailed recommendation 5"],
  "market_size": "extremely detailed market size analysis with numbers, statistics, growth trends and future forecasts",
  "target_audience": "comprehensive and detailed target audience analysis with demographic, psychographic and behavioral segmentation",
  "revenue_model": "detailed multi-source revenue model with numerical projections and different scenarios",
  "competitive_advantage": "comprehensive detailed analysis of competitive advantages with strategies to maintain them",
  "next_steps": {
    "phase_1": ["detailed phase 1 step 1", "detailed phase 1 step 2", "detailed phase 1 step 3", "detailed phase 1 step 4"],
    "phase_2": ["detailed phase 2 step 1", "detailed phase 2 step 2", "detailed phase 2 step 3", "detailed phase 2 step 4"],
    "phase_3": ["detailed phase 3 step 1", "detailed phase 3 step 2", "detailed phase 3 step 3"],
    "timeline": "detailed and specific timeline for phases with clear milestones and performance indicators"
  },
  "financial_analysis": {
    "startup_cost": "detailed and accurate analysis of initial costs with breakdown of each item",
    "monthly_expenses": "comprehensive estimate of monthly operational and administrative costs",
    "break_even_time": "accurate estimate of break-even period with sensitivity analysis",
    "roi_projection": "detailed return on investment projection over different time periods",
    "funding_requirements": "detailed analysis of funding needs and potential sources"
  },
  "competitive_analysis": {
    "main_competitors": ["main competitor 1 with analysis", "main competitor 2 with analysis", "main competitor 3 with analysis", "main competitor 4 with analysis"],
    "market_differentiation": "detailed strategy for market differentiation with core difference points",
    "barrier_to_entry": "comprehensive analysis of market entry challenges and barriers and how to overcome them",
    "swot_analysis": "detailed SWOT analysis of the project compared to competitors"
  },
  "action_plan": {
    "immediate_steps": ["strategic immediate step 1", "operational immediate step 2", "financial immediate step 3", "marketing immediate step 4"],
    "short_term_goals": ["specific short-term goal 1", "specific short-term goal 2", "specific short-term goal 3"],
    "long_term_vision": "comprehensive strategic long-term vision with roadmap for growth and expansion"
  }
}`;
        } else {
          systemPrompt = `أنت محلل أعمال متقدم ومتخصص ذو خبرة عالية. قم بإجراء تحليل عميق ومفصل للغاية لفكرة المشروع التجاري يشمل تحليل السوق المتقدم مع بيانات، دراسة المنافسين التفصيلية، النمذجة المالية الشاملة، تحليل المخاطر التفصيلي، وخطة تنفيذ مرحلية واضحة.`;
          jsonFormat = `{
  "overall_score": [رقم من 0 إلى 100],
  "market_potential": [رقم من 0 إلى 100], 
  "feasibility": [رقم من 0 إلى 100],
  "risk_level": [رقم من 0 إلى 100],
  "strengths": ["نقطة قوة مفصلة 1", "نقطة قوة مفصلة 2", "نقطة قوة مفصلة 3", "نقطة قوة مفصلة 4", "نقطة قوة مفصلة 5"],
  "weaknesses": ["نقطة ضعف مفصلة 1", "نقطة ضعف مفصلة 2", "نقطة ضعف مفصلة 3", "نقطة ضعف مفصلة 4"],
  "recommendations": ["توصية استراتيجية مفصلة 1", "توصية تشغيلية مفصلة 2", "توصية مالية مفصلة 3", "توصية تسويقية مفصلة 4", "توصية تقنية مفصلة 5"],
  "market_size": "تحليل مفصل جداً لحجم السوق مع أرقام وإحصائيات واتجاهات نمو وتوقعات مستقبلية",
  "target_audience": "تحليل شامل ومفصل للجمهور المستهدف مع التقسيمات الديموغرافية والنفسية والسلوكية",
  "revenue_model": "نموذج إيرادات مفصل ومتعدد المصادر مع توقعات رقمية وسيناريوهات مختلفة",
  "competitive_advantage": "تحليل تفصيلي شامل للمزايا التنافسية مع استراتيجيات الحفاظ عليها",
  "next_steps": {
    "phase_1": ["خطوة مرحلة أولى مفصلة 1", "خطوة مرحلة أولى مفصلة 2", "خطوة مرحلة أولى مفصلة 3", "خطوة مرحلة أولى مفصلة 4"],
    "phase_2": ["خطوة مرحلة ثانية مفصلة 1", "خطوة مرحلة ثانية مفصلة 2", "خطوة مرحلة ثانية مفصلة 3", "خطوة مرحلة ثانية مفصلة 4"],
    "phase_3": ["خطوة مرحلة ثالثة مفصلة 1", "خطوة مرحلة ثالثة مفصلة 2", "خطوة مرحلة ثالثة مفصلة 3"],
    "timeline": "جدول زمني مفصل ومحدد للمراحل مع معالم واضحة ومؤشرات أداء"
  },
  "financial_analysis": {
    "startup_cost": "تحليل مفصل ودقيق للتكاليف الأولية مع تفاصيل كل بند",
    "monthly_expenses": "تقدير شامل للتكاليف الشهرية التشغيلية والإدارية",
    "break_even_time": "تقدير دقيق لفترة الوصول لنقطة التعادل مع تحليل الحساسية",
    "roi_projection": "توقع مفصل للعائد على الاستثمار على فترات زمنية مختلفة",
    "funding_requirements": "تحليل مفصل لاحتياجات التمويل ومصادره المحتملة"
  },
  "competitive_analysis": {
    "main_competitors": ["منافس رئيسي 1 مع تحليل", "منافس رئيسي 2 مع تحليل", "منافس رئيسي 3 مع تحليل", "منافس رئيسي 4 مع تحليل"],
    "market_differentiation": "استراتيجية مفصلة للتميز في السوق مع نقاط الاختلاف الجوهرية",
    "barrier_to_entry": "تحليل شامل لتحديات وحواجز دخول السوق وكيفية التغلب عليها",
    "swot_analysis": "تحليل SWOT مفصل للمشروع مقارنة بالمنافسين"
  },
  "action_plan": {
    "immediate_steps": ["خطوة فورية استراتيجية 1", "خطوة فورية تشغيلية 2", "خطوة فورية مالية 3", "خطوة فورية تسويقية 4"],
    "short_term_goals": ["هدف قصير المدى محدد 1", "هدف قصير المدى محدد 2", "هدف قصير المدى محدد 3"],
    "long_term_vision": "رؤية استراتيجية شاملة وطويلة المدى مع خارطة طريق للنمو والتوسع"
  }
}`;
        }
        break;
      default:
        if (language === 'en') {
          systemPrompt = `You are an expert professional business analyst. Analyze the business idea and provide a comprehensive and quick assessment with practical recommendations and clear implementation steps.`;
          jsonFormat = `{
  "overall_score": [number from 0 to 100],
  "market_potential": [number from 0 to 100], 
  "feasibility": [number from 0 to 100],
  "risk_level": [number from 0 to 100],
  "strengths": ["detailed strength 1", "detailed strength 2", "detailed strength 3", "detailed strength 4"],
  "weaknesses": ["detailed weakness 1", "detailed weakness 2", "detailed weakness 3"],
  "recommendations": ["detailed practical recommendation 1", "detailed practical recommendation 2", "detailed practical recommendation 3", "detailed practical recommendation 4"],
  "market_size": "detailed market size analysis with data and forecasts",
  "target_audience": "detailed target audience analysis with clear characteristics",
  "revenue_model": "suggested revenue model with multiple sources",
  "competitive_advantage": "detailed competitive advantages",
  "next_steps": {
    "phase_1": ["phase 1 step 1", "phase 1 step 2", "phase 1 step 3"],
    "phase_2": ["phase 2 step 1", "phase 2 step 2", "phase 2 step 3"],
    "phase_3": ["phase 3 step 1", "phase 3 step 2"],
    "timeline": "suggested timeline for phases"
  }
}`;
        } else {
          systemPrompt = `أنت محلل أعمال خبير ومحترف. قم بتحليل فكرة المشروع التجاري وقدم تقييماً شاملاً وسريعاً مع توصيات عملية وخطوات تنفيذية واضحة.`;
          jsonFormat = `{
  "overall_score": [رقم من 0 إلى 100],
  "market_potential": [رقم من 0 إلى 100], 
  "feasibility": [رقم من 0 إلى 100],
  "risk_level": [رقم من 0 إلى 100],
  "strengths": ["نقطة قوة مفصلة 1", "نقطة قوة مفصلة 2", "نقطة قوة مفصلة 3", "نقطة قوة مفصلة 4"],
  "weaknesses": ["نقطة ضعف مفصلة 1", "نقطة ضعف مفصلة 2", "نقطة ضعف مفصلة 3"],
  "recommendations": ["توصية عملية مفصلة 1", "توصية عملية مفصلة 2", "توصية عملية مفصلة 3", "توصية عملية مفصلة 4"],
  "market_size": "تحليل مفصل لحجم السوق مع بيانات وتوقعات",
  "target_audience": "تحليل مفصل للجمهور المستهدف مع خصائص واضحة",
  "revenue_model": "نموذج الإيرادات المقترح مع مصادر متعددة",
  "competitive_advantage": "المزايا التنافسية المحتملة بالتفصيل",
  "next_steps": {
    "phase_1": ["خطوة مرحلة أولى 1", "خطوة مرحلة أولى 2", "خطوة مرحلة أولى 3"],
    "phase_2": ["خطوة مرحلة ثانية 1", "خطوة مرحلة ثانية 2", "خطوة مرحلة ثانية 3"],
    "phase_3": ["خطوة مرحلة ثالثة 1", "خطوة مرحلة ثالثة 2"],
    "timeline": "جدول زمني مقترح للمراحل"
  }
}`;
        }
    }

    const fullPrompt = `${systemPrompt}

${language === 'en' ? 
  'Analyze the project idea and return results in valid JSON format only. Use this exact format:' :
  'قم بتحليل فكرة المشروع وإرجاع النتائج بصيغة JSON صحيحة فقط. استخدم هذا التنسيق بالضبط:'
}

${jsonFormat}

${language === 'en' ? `Important instructions:
- Make all percentages realistic and logical (don't be overly optimistic)
- Most new ideas get 40-70% scores initially
- Be honest in evaluation and show real challenges
- Make all interactive questions simple and direct
- Focus on practical and actionable aspects
- Use clear and simple English
- Don't add any text before or after JSON
- Return JSON only` :
`تعليمات مهمة:
- أجعل كل النسب واقعية ومنطقية (لا تكن متفائلاً بشكل مفرط)
- معظم الأفكار الجديدة تحصل على نسب 40-70% في البداية
- كن صادقاً في التقييم وأظهر التحديات الحقيقية
- أجعل كل الأسئلة التفاعلية بسيطة ومباشرة
- ركز على الجوانب العملية والقابلة للتنفيذ
- استخدم اللغة العربية البسيطة والواضحة
- لا تضيف أي نص قبل أو بعد JSON
- أرجع JSON فقط`}`;

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
            content: language === 'en' ? 
              `Analyze the following project idea: ${idea}` :
              `حلل فكرة المشروع التالية: ${idea}`
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
      
      // Try to extract more specific error information
      let specificError = "فشل في الحصول على التحليل من OpenRouter";
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          specificError = `خطأ OpenRouter: ${errorData.error.message}`;
        } else if (errorData.message) {
          specificError = `خطأ OpenRouter: ${errorData.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, use status code
        if (response.status === 401) {
          specificError = "خطأ في مفتاح API - يرجى التحقق من إعدادات OpenRouter";
        } else if (response.status === 429) {
          specificError = "تم تجاوز حد الاستخدام - يرجى المحاولة لاحقاً";
        } else if (response.status >= 500) {
          specificError = "خطأ في خدمة OpenRouter - يرجى المحاولة لاحقاً";
        }
      }
      
      throw new Error(specificError);
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
      
      // Create a basic analysis as fallback with interactive questions - more realistic scores
      analysis = {
        overall_score: 55,
        market_potential: 50,
        feasibility: 60,
        risk_level: 65,
        strengths: language === 'en' ? 
          ["Implementable idea", "Promising market", "Good growth potential"] :
          ["فكرة قابلة للتطبيق", "سوق واعد", "إمكانية نمو جيدة"],
        weaknesses: language === 'en' ?
          ["Needs deeper study", "Potential competition", "Requires initial investment"] :
          ["يحتاج دراسة أعمق", "منافسة محتملة", "يتطلب استثمار أولي"],
        recommendations: language === 'en' ? [
          "Conduct detailed market research",
          "Develop a prototype",
          "Study costs and expected revenues",
          "Precisely identify target audience"
        ] : [
          "إجراء بحث سوق مفصل",
          "تطوير نموذج أولي",
          "دراسة التكاليف والإيرادات المتوقعة",
          "تحديد الجمهور المستهدف بدقة"
        ],
        market_size: language === 'en' ? 
          "Medium-sized market with growth potential" :
          "سوق متوسط الحجم مع إمكانيات نمو",
        target_audience: language === 'en' ?
          "General public interested in the service" :
          "الجمهور العام المهتم بالخدمة",
        revenue_model: language === 'en' ?
          "Subscription or direct sales model" :
          "نموذج اشتراك أو مبيعات مباشرة",
        competitive_advantage: language === 'en' ?
          "Innovative service that meets market need" :
          "خدمة مبتكرة تلبي احتياج السوق"
      };
      
      // Add type-specific fallback data and next_steps for all types
      analysis.next_steps = {
        phase_1: language === 'en' ? 
          ["Define idea and goal clearly", "Conduct initial market research", "Identify target audience"] :
          ["تحديد الفكرة والهدف بوضوح", "إجراء بحث السوق الأولي", "تحديد الجمهور المستهدف"],
        phase_2: language === 'en' ?
          ["Develop prototype", "Prepare business plan", "Search for funding sources"] :
          ["تطوير نموذج أولي", "إعداد خطة العمل", "البحث عن مصادر التمويل"],
        phase_3: language === 'en' ?
          ["Launch project as pilot", "Measure performance and improve", "Expand gradually"] :
          ["إطلاق المشروع تجريبياً", "قياس الأداء والتحسين", "التوسع تدريجياً"],
        timeline: language === 'en' ? 
          "6-12 months for the three phases" :
          "6-12 شهر للمراحل الثلاث"
      };
      
      if (analysisType === 'interactive') {
        analysis.interactive_questions = language === 'en' ? [
          "What is the main objective of your project?",
          "Who are your potential customers specifically?",
          "How much startup capital is required?",
          "What is your first step for implementation?",
          "What are the expected challenges?"
        ] : [
          "ما هو الهدف الرئيسي من مشروعك؟",
          "من هم عملاؤك المحتملون بالتحديد؟",
          "كم رأس المال المطلوب للبدء؟",
          "ما هي خطوتك الأولى للتنفيذ؟",
          "ما هي التحديات المتوقعة؟"
        ];
        analysis.action_plan = {
          immediate_steps: language === 'en' ? 
            ["Define idea clearly", "Conduct initial research", "Determine business model"] :
            ["تحديد الفكرة بوضوح", "إجراء بحث أولي", "تحديد نموذج العمل"],
          short_term_goals: language === 'en' ?
            ["Develop prototype", "Test market", "Build team"] :
            ["تطوير نموذج أولي", "اختبار السوق", "بناء فريق العمل"],
          long_term_vision: language === 'en' ?
            "Build a sustainable and profitable project with expansion plans" :
            "بناء مشروع مستدام ومربح مع خطط للتوسع"
        };
      } else if (analysisType === 'deep') {
        analysis.financial_analysis = {
          startup_cost: language === 'en' ?
            "Needs detailed estimation based on project type and target market" :
            "يحتاج تقدير مفصل حسب نوع المشروع والسوق المستهدف",
          monthly_expenses: language === 'en' ?
            "Monthly operational and administrative costs estimation required" :
            "تقدير التكاليف الشهرية التشغيلية والإدارية مطلوب",
          break_even_time: language === 'en' ?
            "Approximately 6-18 months depending on project nature" :
            "6-18 شهر تقريباً حسب طبيعة المشروع",
          roi_projection: language === 'en' ?
            "Expected return based on market performance and strategy" :
            "عائد متوقع بناءً على أداء السوق والاستراتيجية",
          funding_requirements: language === 'en' ?
            "Determine funding needs and appropriate sources" :
            "تحديد احتياجات التمويل ومصادره المناسبة"
        };
        analysis.competitive_analysis = {
          main_competitors: language === 'en' ?
            ["Main local competitor", "Main regional competitor", "Digital competitor"] :
            ["منافس رئيسي محلي", "منافس رئيسي إقليمي", "منافس رقمي"],
          market_differentiation: language === 'en' ?
            "Identify differentiation points and required innovation" :
            "تحديد نقاط التميز والابتكار المطلوبة",
          barrier_to_entry: language === 'en' ?
            "Medium entry barriers requiring clear strategy" :
            "حواجز دخول متوسطة تتطلب استراتيجية واضحة",
          swot_analysis: language === 'en' ?
            "Analysis of strengths, weaknesses, opportunities and threats" :
            "تحليل نقاط القوة والضعف والفرص والتهديدات"
        };
        analysis.action_plan = {
          immediate_steps: language === 'en' ?
            ["Detailed feasibility study", "Market and competitor analysis", "Financial model preparation"] :
            ["دراسة جدوى مفصلة", "تحليل السوق والمنافسين", "إعداد نموذج مالي"],
          short_term_goals: language === 'en' ?
            ["Secure funding", "Build team", "Develop product/service"] :
            ["تأمين التمويل", "بناء الفريق", "تطوير المنتج/الخدمة"],
          long_term_vision: language === 'en' ?
            "Build strong brand with local and regional expansion strategy" :
            "بناء علامة تجارية قوية مع استراتيجية توسع محلية وإقليمية"
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

      // Also save to analysis_history table for user tracking
      if (userId) {
        await supabase
          .from('analysis_history')
          .insert({
          user_id: userId,
          idea_text: idea,
          analysis_result: analysis,
          analysis_type: analysisType,
          language: language || 'ar'
          });
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

async function handleInteractiveUpdate(req: Request, params: any) {
  const { idea, currentQuestion, userAnswer, allAnswers, previousAnalysis, userId, language = 'ar' } = params;
  
  try {
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
        JSON.stringify({ 
          success: false, 
          error: 'لم يتم تكوين OpenRouter API Key' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openRouterKey = settingData.setting_value;

    // تحديث النسب بناءً على الإجابة
    const updatePrompt = language === 'en' ? 
      `You are an expert business analyst. You have a previous analysis of a business idea, and now the user has answered an interactive question.

Business idea: ${idea}

Question: ${currentQuestion}
User's answer: ${userAnswer}

Previous analysis: ${JSON.stringify(previousAnalysis)}

Required tasks:
1. Update the percentages (overall_score, market_potential, feasibility, risk_level) based on the new answer
2. Update strengths, weaknesses, and recommendations if necessary
3. Improve financial and competitive analysis if the answer contains useful information
4. Keep the same structure but with updated and more realistic percentages

Percentage rules:
- Percentages must be very realistic (not higher than 85% except in exceptional cases)
- Reflect new information from user's answer
- Be balanced and logical
- If the answer is positive and detailed, raise percentages slightly (5-10 points)
- If the answer is vague or shows lack of clarity, lower percentages slightly

Return only JSON with the same previous structure with updates, without any additional text.` :
      `أنت محلل أعمال خبير. لديك تحليل سابق لفكرة مشروع، والآن المستخدم أجاب على سؤال تفاعلي.

فكرة المشروع: ${idea}

السؤال: ${currentQuestion}
إجابة المستخدم: ${userAnswer}

التحليل السابق: ${JSON.stringify(previousAnalysis)}

مطلوب منك:
1. تحديث النسب (overall_score, market_potential, feasibility, risk_level) بناءً على الإجابة الجديدة
2. تحديث نقاط القوة والضعف والتوصيات إذا لزم الأمر
3. تحسين التحليل المالي والتنافسي إذا كانت الإجابة تحتوي على معلومات مفيدة
4. الحفاظ على نفس الهيكل ولكن بنسب محدثة وواقعية أكثر

قواعد النسب:
- النسب يجب أن تكون واقعية جداً (ليس أعلى من 85% إلا في حالات استثنائية)
- تعكس المعلومات الجديدة من إجابة المستخدم
- متوازنة ومنطقية
- إذا كانت الإجابة إيجابية ومفصلة، ارفع النسب قليلاً (5-10 نقاط)
- إذا كانت الإجابة غامضة أو تظهر عدم وضوح، اخفض النسب قليلاً

أرجع فقط JSON بنفس الهيكل السابق مع التحديثات، بدون أي نص إضافي.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [
          {
            role: 'user',
            content: updatePrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const responseData = await response.json();
    console.log('OpenRouter update response received:', responseData);

    if (!responseData.choices || !responseData.choices[0]) {
      throw new Error('Invalid response from AI service');
    }

    const rawText = responseData.choices[0].message.content;
    console.log('Raw AI update response text:', rawText);

    let analysisData;
    try {
      // استخراج JSON من النص
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[0]
          .replace(/```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        
        analysisData = JSON.parse(jsonText);
        console.log('Successfully parsed updated analysis:', analysisData);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // تحديث ذكي للنسب بناءً على طول وجودة الإجابة
      const answerQuality = userAnswer.length > 50 ? 'good' : 'basic';
      const scoreAdjustment = answerQuality === 'good' ? 
        Math.floor(Math.random() * 8) + 2 : // 2-10 نقاط للإجابات الجيدة
        Math.floor(Math.random() * 6) - 3; // -3 إلى +3 للإجابات البسيطة
      
      analysisData = {
        ...previousAnalysis,
        overall_score: Math.max(30, Math.min(85, (previousAnalysis.overall_score || 70) + scoreAdjustment)),
        market_potential: Math.max(40, Math.min(90, (previousAnalysis.market_potential || 75) + Math.floor(scoreAdjustment * 0.8))),
        feasibility: Math.max(35, Math.min(85, (previousAnalysis.feasibility || 70) + Math.floor(scoreAdjustment * 1.2))),
        risk_level: Math.max(25, Math.min(80, (previousAnalysis.risk_level || 60) - Math.floor(scoreAdjustment * 0.5)))
      };
      
      // إضافة توصية بناءً على الإجابة
      if (answerQuality === 'good' && analysisData.recommendations) {
        const newRecommendation = language === 'en' ?
          `Continue developing the idea based on "${userAnswer.substring(0, 50)}..."` :
          `متابعة تطوير الفكرة بناءً على "${userAnswer.substring(0, 50)}..."`;
        analysisData.recommendations = [
          ...analysisData.recommendations.slice(0, 2),
          newRecommendation
        ];
      }
    }

    console.log('Final updated analysis data:', analysisData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisData,
        message: language === 'en' ? 'Analysis updated based on your answer' : 'تم تحديث التحليل بناءً على إجابتك'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Interactive update error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: language === 'en' ? 'Error occurred while updating analysis' : 'حدث خطأ في تحديث التحليل' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}