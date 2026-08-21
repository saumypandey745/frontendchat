import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_fs0i1ca';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_5gpxdjs';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'lyT5DJ-2Mnd8YzyZ_';

export const sendEmail = async (templateParams) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error('[EMAILJS ERROR] Missing configuration credentials');
    throw new Error('Email service configuration is incomplete.');
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      {
        publicKey: PUBLIC_KEY,
      }
    );
    console.log('[EMAILJS] Email sent successfully:', response.status, response.text);
    return response;
  } catch (error) {
    console.error('[EMAILJS ERROR] Failed to send email:', error?.text || error?.message || error);
    throw error;
  }
};

export default sendEmail;
