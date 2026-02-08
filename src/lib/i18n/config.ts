// src/lib/i18n/config.ts
export const languages = {
  en: 'English',
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
};

export const defaultLanguage = 'en';

export type Language = keyof typeof languages;

export const translations = {
  en: {
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      settings: 'Settings',
      logout: 'Logout',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Create Account',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
    },
    products: {
      title: 'Products',
      create: 'Create Product',
      edit: 'Edit',
      delete: 'Delete',
      price: 'Price',
      description: 'Description',
    },
    payment: {
      checkout: 'Checkout',
      payNow: 'Pay Now',
      total: 'Total',
      applyCoupon: 'Apply Coupon',
      success: 'Payment Successful',
      failed: 'Payment Failed',
    },
    errors: {
      unauthorized: 'Unauthorized',
      notFound: 'Not found',
      serverError: 'Server error',
      validation: 'Validation error',
    },
  },
  hi: {
    nav: {
      home: 'होम',
      dashboard: 'डैशबोर्ड',
      products: 'उत्पाद',
      orders: 'ऑर्डर',
      settings: 'सेटिंग्स',
      logout: 'लॉगआउट',
    },
    auth: {
      signIn: 'साइन इन करें',
      signUp: 'खाता बनाएं',
      email: 'ईमेल',
      password: 'पासवर्ड',
      forgotPassword: 'पासवर्ड भूल गए?',
      noAccount: 'खाता नहीं है?',
      haveAccount: 'पहले से खाता है?',
    },
    products: {
      title: 'उत्पाद',
      create: 'उत्पाद बनाएं',
      edit: 'संपादित करें',
      delete: 'हटाएं',
      price: 'कीमत',
      description: 'विवरण',
    },
    payment: {
      checkout: 'चेकआउट',
      payNow: 'अभी भुगतान करें',
      total: 'कुल',
      applyCoupon: 'कूपन लागू करें',
      success: 'भुगतान सफल',
      failed: 'भुगतान विफल',
    },
    errors: {
      unauthorized: 'अनधिकृत',
      notFound: 'नहीं मिला',
      serverError: 'सर्वर त्रुटि',
      validation: 'सत्यापन त्रुटि',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      dashboard: 'Panel',
      products: 'Productos',
      orders: 'Pedidos',
      settings: 'Configuración',
      logout: 'Cerrar sesión',
    },
    auth: {
      signIn: 'Iniciar sesión',
      signUp: 'Crear cuenta',
      email: 'Correo electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidó su contraseña?',
      noAccount: '¿No tienes cuenta?',
      haveAccount: '¿Ya tienes cuenta?',
    },
    products: {
      title: 'Productos',
      create: 'Crear producto',
      edit: 'Editar',
      delete: 'Eliminar',
      price: 'Precio',
      description: 'Descripción',
    },
    payment: {
      checkout: 'Pagar',
      payNow: 'Pagar ahora',
      total: 'Total',
      applyCoupon: 'Aplicar cupón',
      success: 'Pago exitoso',
      failed: 'Pago fallido',
    },
    errors: {
      unauthorized: 'No autorizado',
      notFound: 'No encontrado',
      serverError: 'Error del servidor',
      validation: 'Error de validación',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      dashboard: 'Tableau de bord',
      products: 'Produits',
      orders: 'Commandes',
      settings: 'Paramètres',
      logout: 'Déconnexion',
    },
    auth: {
      signIn: 'Se connecter',
      signUp: 'Créer un compte',
      email: 'E-mail',
      password: 'Mot de passe',
      forgotPassword: 'Mot de passe oublié?',
      noAccount: "Pas de compte?",
      haveAccount: 'Vous avez un compte?',
    },
    products: {
      title: 'Produits',
      create: 'Créer un produit',
      edit: 'Modifier',
      delete: 'Supprimer',
      price: 'Prix',
      description: 'Description',
    },
    payment: {
      checkout: 'Passer la commande',
      payNow: 'Payer maintenant',
      total: 'Total',
      applyCoupon: 'Appliquer un coupon',
      success: 'Paiement réussi',
      failed: 'Échec du paiement',
    },
    errors: {
      unauthorized: 'Non autorisé',
      notFound: 'Non trouvé',
      serverError: 'Erreur serveur',
      validation: 'Erreur de validation',
    },
  },
};

export function t(lang: Language, path: string, defaultValue: string = ''): string {
  const keys = path.split('.');
  let value: any = translations[lang];

  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }

  return value || defaultValue;
}
