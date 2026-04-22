"use client";
import { CONTACT } from "../lib/constants";

export default function WhatsAppChat() {
  const href = `https://wa.me/${CONTACT.WHATSAPP.replace(/[^0-9]/g, '')}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-20 right-4 z-40 bg-green-500 text-white px-4 py-3 rounded-full shadow-lg font-semibold"
    >
      Chat on WhatsApp
    </a>
  );
}

