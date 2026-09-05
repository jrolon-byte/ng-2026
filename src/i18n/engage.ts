// Engage-page i18n dictionary — same pattern as ./paywall.ts, same register
// rules: Dominican-leaning Spanish ("tu negocio", "de baja") with standard
// orthography. Copy mirrors the iOS app's NGStrings so both clients tell the
// same shop the same thing.
//
// Scoped to the Engage surface (the product page). Nav/dashboard stay
// English for now.

import type { Locale } from './paywall';

export interface EngageCopy {
  title: string;
  addCustomer: string;
  close: string;
  customerName: string;
  mobileNumber: string;
  addCustomerCta: string;
  nameAndPhoneRequired: string;
  phoneAlreadyExists: string;

  personalizeTip: string;
  composePlaceholder: string;
  emptyMessageWarning: (count: number) => string;
  messagePreview: string;
  edit: string;
  headerLabel: string;
  footerLabel: string;
  headerPlaceholder: string;
  footerPlaceholder: string;
  charactersLeftForMessage: (n: number) => string;
  language: string;
  languageNote: string;
  save: string;
  saving: string;
  cancel: string;
  failedToSave: string;
  sendCta: string;
  sendSuccess: (n: number) => string;
  sendFailed: string;
  sendStillRunning: (n: number) => string;

  searchPlaceholder: string;
  yourCustomers: (n: number) => string;
  optedOutCount: (n: number) => string;
  noSearchMatches: string;
  emptyList: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeDismiss: string;
  memberSince: string;
  newBadge: (n: number) => string;
  optedOut: string;
  lastTextsNeverArrived: (n: number) => string;
  unreachableHeader: (n: number) => string;
  unreachableExplainer: string;
  fixNumber: string;
  remove: string;
  removeConfirm: (name: string) => string;
  yes: string;
  no: string;

  conversation: string;
  earlierHidden: (n: number) => string;
  nothingYet: (name: string) => string;
  loadingConversation: string;
  editCustomer: string;
  emailOptional: string;
  saveChanges: string;
  couldntSave: string;
}

const en: EngageCopy = {
  title: 'Engage',
  addCustomer: 'Add New Customer',
  close: 'Close',
  customerName: 'Customer Name',
  mobileNumber: 'Mobile number',
  addCustomerCta: 'Add New Customer',
  nameAndPhoneRequired: 'Please enter name and mobile number',
  phoneAlreadyExists: 'This number is already in your customer list.',

  personalizeTip: 'Use @Name to personalize — each customer sees their own name',
  composePlaceholder: 'Ey @Name, come by the shop today! 🔥',
  emptyMessageWarning: (count) =>
    `Do you really want to text ${count} customers nothing? Type an engaging message to bring them through your door!`,
  messagePreview: 'Message Preview',
  edit: 'Edit',
  headerLabel: 'Header (before your message)',
  footerLabel: 'Footer (after your message)',
  headerPlaceholder: 'YourBusiness: ',
  footerPlaceholder: ' -- Call Now: 407-000-0000',
  charactersLeftForMessage: (n) => `${n} characters left for your message`,
  language: 'Language',
  languageNote: "Changes the app's language for everyone at this shop.",
  save: 'Save',
  saving: 'Saving...',
  cancel: 'Cancel',
  failedToSave: 'Failed to save settings',
  sendCta: 'Send Mass Text 📲',
  sendSuccess: (n) => `Success! Your message went out to ${n} customer${n === 1 ? '' : 's'}.`,
  sendFailed: 'The send failed — no messages could be delivered. Please try again or contact support.',
  sendStillRunning: (n) =>
    `Your blast to ${n} customers is still sending in the background — check Campaigns for the final count.`,

  searchPlaceholder: 'Search name or number',
  yourCustomers: (n) => `Your ${n} customer${n === 1 ? '' : 's'}`,
  optedOutCount: (n) => `${n} opted out`,
  noSearchMatches: 'No customers match your search.',
  emptyList: 'Add a customer to see them here.',
  welcomeTitle: 'Your texts are ready.',
  welcomeBody: 'Add your customers, write one message, hit send. That’s the whole thing.',
  welcomeDismiss: 'Got it',
  memberSince: 'Member since',
  newBadge: (n) => (n > 1 ? `${n} new` : 'new'),
  optedOut: 'Opted out',
  lastTextsNeverArrived: (n) => `Last ${n} texts never arrived`,
  unreachableHeader: (n) => `${n} unreachable`,
  unreachableExplainer:
    "These numbers stopped receiving. They're already excluded from your sends — remove them to tidy up your list.",
  fixNumber: 'Fix number',
  remove: 'Remove',
  removeConfirm: (name) => `Are you sure you want to remove ${name} as a client?`,
  yes: 'Yes',
  no: 'No',

  conversation: 'Conversation',
  earlierHidden: (n) => `${n} earlier broadcast${n === 1 ? '' : 's'} hidden`,
  nothingYet: (name) => `Nothing yet. Messages you send ${name} will show up here.`,
  loadingConversation: 'Loading conversation…',
  editCustomer: 'Edit customer',
  emailOptional: 'Email (optional)',
  saveChanges: 'Save changes',
  couldntSave: "Couldn't save those changes.",
};

const es: EngageCopy = {
  title: 'Engage',
  addCustomer: 'Añadir cliente',
  close: 'Cerrar',
  customerName: 'Nombre del cliente',
  mobileNumber: 'Número de móvil',
  addCustomerCta: 'Añadir cliente',
  nameAndPhoneRequired: 'Escribe el nombre y el número de móvil',
  phoneAlreadyExists: 'Este número ya está en tu lista de clientes.',

  personalizeTip: 'Usa @Name para personalizar — cada cliente ve su propio nombre',
  composePlaceholder: 'Ey @Name, pasa por la barbería hoy! 🔥',
  emptyMessageWarning: (count) =>
    `¿De verdad quieres textear a ${count} clientes sin decir nada? Escribe un mensaje que los traiga por tu puerta.`,
  messagePreview: 'Vista previa',
  edit: 'Editar',
  headerLabel: 'Encabezado (antes del mensaje)',
  footerLabel: 'Pie (después del mensaje)',
  headerPlaceholder: 'TuNegocio: ',
  footerPlaceholder: ' -- Llama ya: 407-000-0000',
  charactersLeftForMessage: (n) => `Quedan ${n} caracteres para tu mensaje`,
  language: 'Idioma',
  languageNote: 'Cambia el idioma de la app para todo el negocio.',
  save: 'Guardar',
  saving: 'Guardando...',
  cancel: 'Cancelar',
  failedToSave: 'No se pudieron guardar los ajustes',
  sendCta: 'Enviar mensaje masivo 📲',
  sendSuccess: (n) => `¡Listo! Tu mensaje llegó a ${n} cliente${n === 1 ? '' : 's'}.`,
  sendFailed: 'El envío falló — no se pudo entregar ningún mensaje. Intenta de nuevo o contacta soporte.',
  sendStillRunning: (n) =>
    `Tu envío a ${n} clientes sigue en camino — revisa Campañas para el conteo final.`,

  searchPlaceholder: 'Buscar nombre o número',
  yourCustomers: (n) => `Tus ${n} cliente${n === 1 ? '' : 's'}`,
  optedOutCount: (n) => `${n} de baja`,
  noSearchMatches: 'Ningún cliente coincide con tu búsqueda.',
  emptyList: 'Añade un cliente y aparecerá aquí.',
  welcomeTitle: 'Tus mensajes están listos.',
  welcomeBody: 'Agrega tus clientes, escribe un mensaje y envíalo. Eso es todo.',
  welcomeDismiss: 'Entendido',
  memberSince: 'Cliente desde',
  newBadge: (n) => (n > 1 ? `${n} nuevos` : 'nuevo'),
  optedOut: 'Dado de baja',
  lastTextsNeverArrived: (n) => `Los últimos ${n} mensajes no llegaron`,
  unreachableHeader: (n) => (n === 1 ? '1 no recibe' : `${n} no reciben`),
  unreachableExplainer:
    'Estos números dejaron de recibir. Ya están excluidos de tus envíos — elimínalos para limpiar tu lista.',
  fixNumber: 'Corregir',
  remove: 'Eliminar',
  removeConfirm: (name) => `¿Seguro que quieres eliminar a ${name} como cliente?`,
  yes: 'Sí',
  no: 'No',

  conversation: 'Conversación',
  earlierHidden: (n) => `${n} ${n === 1 ? 'envío anterior oculto' : 'envíos anteriores ocultos'}`,
  nothingYet: (name) => `Nada todavía. Los mensajes que le envíes a ${name} aparecerán aquí.`,
  loadingConversation: 'Cargando conversación…',
  editCustomer: 'Editar cliente',
  emailOptional: 'Correo (opcional)',
  saveChanges: 'Guardar cambios',
  couldntSave: 'No se pudieron guardar los cambios.',
};

export function getEngageCopy(locale: string | null | undefined): EngageCopy {
  return (locale as Locale) === 'es' ? es : en;
}
