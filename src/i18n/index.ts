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