"use client";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { CONTACT } from "../lib/constants";

export default function WhatsAppChat() {
  const href = `https://wa.me/${CONTACT.WHATSAPP.replace(/[^0-9]/g, '')}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-40 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-green-600"
    >
      <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7" aria-hidden="true" />
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}
