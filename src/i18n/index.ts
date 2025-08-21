import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  ar: {
    translation: {
      // Navigation
      home: "الرئيسية",
      about: "حول الموقع",
      services: "الخدمات",
      products: "المنتجات",
      contact: "اتصل بنا",
      history: "السجل",
      admin: "الإدارة",
      auth: "تسجيل الدخول",
      
      // Common
      language: "اللغة",
      arabic: "العربية",
      english: "English",
      loading: "جاري التحميل...",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تحرير",
      add: "إضافة",
      search: "بحث",
      close: "إغلاق",
      submit: "إرسال",
      back: "رجوع",
      next: "التالي",
      previous: "السابق",
      
      // Business Analysis
      businessAnalysis: "تحليل فكرة المشروع",
      analysisType: "نوع التحليل",
      basicAnalysis: "تحليل أساسي - سريع وشامل",
      interactiveAnalysis: "تحليل تفاعلي - مع أسئلة إضافية",
      deepAnalysis: "تحليل عميق - تفصيلي ومتقدم",
      ideaPlaceholder: "اشرح فكرة مشروعك بالتفصيل",
      startAnalysis: "بدء التحليل",
      analyzing: "جاري التحليل...",
      
      // Analysis Results
      overallScore: "التقييم العام",
      marketPotential: "إمكانية السوق",
      feasibility: "قابلية التنفيذ",
      riskLevel: "مستوى المخاطر",
      strengths: "نقاط القوة",
      weaknesses: "نقاط الضعف",
      recommendations: "التوصيات",
      targetAudience: "الجمهور المستهدف",
      marketSize: "حجم السوق",
      revenueModel: "نموذج الإيرادات",
      competitiveAdvantage: "الميزة التنافسية",
      nextSteps: "الخطوات التالية لمشروعك",
      downloadPDF: "تحميل التحليل كملف PDF",
      
      // Admin
      adminDashboard: "لوحة تحكم المدير",
      systemSettings: "إعدادات النظام",
      userManagement: "إدارة المستخدمين",
      addAdmin: "إضافة مدير",
      adminList: "قائمة المديرين",
      makeAdmin: "تعيين كمدير",
      removeAdmin: "إزالة من الإدارة",
      email: "البريد الإلكتروني",
      role: "الدور",
      admin_role: "مدير",
      user_role: "مستخدم",
      
      // Auth
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب جديد",
      signOut: "تسجيل الخروج",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      
      // Messages
      analysisSuccess: "تم التحليل بنجاح",
      analysisError: "خطأ في التحليل",
      loginRequired: "تسجيل الدخول مطلوب",
      adminAdded: "تم إضافة المدير بنجاح",
      adminRemoved: "تم حذف المدير بنجاح",
      userNotFound: "المستخدم غير موجود",
      
      // About page
      "about.title": "عن",
      "about.description": "منصة متقدمة لتحليل الأفكار التجارية باستخدام الذكاء الاصطناعي، نساعد رواد الأعمال والمستثمرين في اتخاذ قرارات مدروسة ومبنية على بيانات دقيقة",
      "about.whyChoose": "لماذا تختار Snapway؟",
      "about.startJourney": "ابدأ رحلتك التجارية",
      "about.startJourneyDesc": "حول فكرتك إلى مشروع ناجح مع تحليل شامل ومدروس",
      "about.analyzeNow": "تحليل فكرتك الآن",
      "about.features.aiAnalysis": "تحليل ذكي بالذكاء الاصطناعي",
      "about.features.aiAnalysisDesc": "نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل أفكارك التجارية بدقة عالية",
      "about.features.targetAudience": "تحديد الجمهور المستهدف",
      "about.features.targetAudienceDesc": "نساعدك في تحديد عملائك المثاليين ووضع استراتيجية دقيقة للوصول إليهم",
      "about.features.competitorAnalysis": "تحليل المنافسين",
      "about.features.competitorAnalysisDesc": "دراسة شاملة للسوق والمنافسين لتحديد نقاط القوة والضعف",
      "about.features.financialPredictions": "توقعات مالية",
      "about.features.financialPredictionsDesc": "تقديرات دقيقة للعوائد المتوقعة والتكاليف والنمو المستقبلي",
      "about.benefits.timeSaving": "توفير الوقت والجهد في دراسة الجدوى",
      "about.benefits.comprehensiveAnalysis": "تحليل شامل وموضوعي للفكرة",
      "about.benefits.riskIdentification": "تحديد المخاطر والفرص",
      "about.benefits.clearPlan": "خطة عمل واضحة ومفصلة",
      "about.benefits.accurateEvaluation": "تقييم مالي دقيق",
      "about.benefits.effectiveStrategy": "استراتيجية تسويقية فعالة",
      "about.stats.ideasAnalyzed": "فكرة تم تحليلها",
      "about.stats.accuracyRate": "معدل الدقة",
      "about.stats.continuousService": "خدمة متواصلة",
      "about.stats.avgAnalysisTime": "متوسط وقت التحليل",
      "about.stats.minutes": "د",

      // Services page
      "services.loading": "جاري تحميل الخدمات...",
      "services.personalConsultation": "استشارة شخصية",
      "services.personalConsultationDesc": "جلسة استشارية مع خبير لمناقشة فكرتك التجارية",
      "services.personalConsultationPrice": "99 ر.س/ساعة",
      "services.ideaProtection": "حماية الفكرة",
      "services.ideaProtectionDesc": "خدمات الحماية القانونية وتسجيل العلامة التجارية",
      "services.ideaProtectionPrice": "199 ر.س",
      "services.businessPlanDevelopment": "تطوير خطة العمل",
      "services.businessPlanDevelopmentDesc": "إعداد خطة عمل شاملة جاهزة للمستثمرين",
      "services.businessPlanDevelopmentPrice": "299 ر.س",

      // Footer
      poweredBy: "مدعوم بواسطة",
      allRightsReserved: "جميع الحقوق محفوظة"
    }
  },
  en: {
    translation: {
      // Navigation
      home: "Home",
      about: "About",
      services: "Services", 
      products: "Products",
      contact: "Contact",
      history: "History",
      admin: "Admin",
      auth: "Login",
      
      // Common
      language: "Language",
      arabic: "العربية",
      english: "English",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      close: "Close",
      submit: "Submit",
      back: "Back",
      next: "Next",
      previous: "Previous",
      
      // Business Analysis
      businessAnalysis: "Business Idea Analysis",
      analysisType: "Analysis Type",
      basicAnalysis: "Basic Analysis - Fast & Comprehensive",
      interactiveAnalysis: "Interactive Analysis - with Additional Questions",
      deepAnalysis: "Deep Analysis - Detailed & Advanced",
      ideaPlaceholder: "Describe your business idea in detail",
      startAnalysis: "Start Analysis",
      analyzing: "Analyzing...",
      
      // Analysis Results
      overallScore: "Overall Score",
      marketPotential: "Market Potential",
      feasibility: "Feasibility",
      riskLevel: "Risk Level",
      strengths: "Strengths",
      weaknesses: "Weaknesses",
      recommendations: "Recommendations",
      targetAudience: "Target Audience",
      marketSize: "Market Size",
      revenueModel: "Revenue Model",
      competitiveAdvantage: "Competitive Advantage",
      nextSteps: "Next Steps for Your Project",
      downloadPDF: "Download Analysis as PDF",
      
      // Admin
      adminDashboard: "Admin Dashboard",
      systemSettings: "System Settings",
      userManagement: "User Management",
      addAdmin: "Add Admin",
      adminList: "Admin List",
      makeAdmin: "Make Admin",
      removeAdmin: "Remove Admin",
      email: "Email",
      role: "Role",
      admin_role: "Admin",
      user_role: "User",
      
      // Auth
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      
      // Messages
      analysisSuccess: "Analysis completed successfully",
      analysisError: "Analysis error",
      loginRequired: "Login required",
      adminAdded: "Admin added successfully",
      adminRemoved: "Admin removed successfully",
      userNotFound: "User not found",
      
      // About page
      "about.title": "About",
      "about.description": "An advanced platform for analyzing business ideas using artificial intelligence, helping entrepreneurs and investors make informed decisions based on accurate data",
      "about.whyChoose": "Why Choose Snapway?",
      "about.startJourney": "Start Your Business Journey",
      "about.startJourneyDesc": "Turn your idea into a successful project with comprehensive and studied analysis",
      "about.analyzeNow": "Analyze Your Idea Now",
      "about.features.aiAnalysis": "Smart AI Analysis",
      "about.features.aiAnalysisDesc": "We use the latest artificial intelligence technologies to analyze your business ideas with high accuracy",
      "about.features.targetAudience": "Target Audience Identification",
      "about.features.targetAudienceDesc": "We help you identify your ideal customers and develop an accurate strategy to reach them",
      "about.features.competitorAnalysis": "Competitor Analysis",
      "about.features.competitorAnalysisDesc": "Comprehensive market and competitor study to identify strengths and weaknesses",
      "about.features.financialPredictions": "Financial Predictions",
      "about.features.financialPredictionsDesc": "Accurate estimates of expected returns, costs, and future growth",
      "about.benefits.timeSaving": "Save time and effort in feasibility studies",
      "about.benefits.comprehensiveAnalysis": "Comprehensive and objective idea analysis",
      "about.benefits.riskIdentification": "Risk and opportunity identification",
      "about.benefits.clearPlan": "Clear and detailed business plan",
      "about.benefits.accurateEvaluation": "Accurate financial evaluation",
      "about.benefits.effectiveStrategy": "Effective marketing strategy",
      "about.stats.ideasAnalyzed": "Ideas Analyzed",
      "about.stats.accuracyRate": "Accuracy Rate",
      "about.stats.continuousService": "Continuous Service",
      "about.stats.avgAnalysisTime": "Average Analysis Time",
      "about.stats.minutes": "min",

      // Services page
      "services.loading": "Loading services...",
      "services.personalConsultation": "Personal Consultation",
      "services.personalConsultationDesc": "Consultation session with an expert to discuss your business idea",
      "services.personalConsultationPrice": "$99/hour",
      "services.ideaProtection": "Idea Protection",
      "services.ideaProtectionDesc": "Legal protection services and trademark registration",
      "services.ideaProtectionPrice": "$199",
      "services.businessPlanDevelopment": "Business Plan Development",
      "services.businessPlanDevelopmentDesc": "Preparation of comprehensive business plan ready for investors",
      "services.businessPlanDevelopmentPrice": "$299",
      
      // Footer
      poweredBy: "Powered by",
      allRightsReserved: "All rights reserved"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;