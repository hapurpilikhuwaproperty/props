import { BRAND, CONTACT } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 py-10 mt-12">
      <div className="container grid gap-6 md:grid-cols-3 items-center">
        <div>
          <p className="text-lg font-semibold">{BRAND.NAME}</p>
          <p className="text-sm text-slate-400">{BRAND.TAGLINE}</p>
          <p className="text-sm mt-2 text-slate-300">Call: <a href={`tel:${CONTACT.PHONE}`} className="underline">{CONTACT.PHONE}</a></p>
          <p className="text-sm text-slate-300">Email: <a href={`mailto:${CONTACT.EMAIL}`} className="underline">{CONTACT.EMAIL}</a></p>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p>HQ: 221B Residency Lane, CA</p>
          <p>Email: {CONTACT.EMAIL}</p>
        </div>
        <div className="text-right text-xs text-slate-500">© {new Date().getFullYear()} {BRAND.NAME}. All rights reserved.</div>
      </div>
    </footer>
  );
}
