import { toInstagramUrl, toWhatsAppUrl } from "@/lib/social-links";

type MenuHeaderProps = {
  name: string;
  description: string | null;
  instagram: string | null;
  whatsapp: string | null;
};

export function MenuHeader({ name, description, instagram, whatsapp }: MenuHeaderProps): React.JSX.Element {
  return (
    <header className="grid gap-2 sm:grid-cols-12">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-muted sm:col-span-12">Carta</p>
      <h1 className="min-w-0 font-display text-6xl italic text-ink break-words sm:col-span-9">{name}</h1>
      {description && (
        <p className="font-sans text-ink-muted sm:col-span-5 sm:col-start-8 sm:self-end sm:text-right">
          {description}
        </p>
      )}
      {(instagram || whatsapp) && (
        <div className="mt-2 flex gap-4 sm:col-span-12">
          {instagram && (
            <a
              href={toInstagramUrl(instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              Instagram
            </a>
          )}
          {whatsapp && (
            <a
              href={toWhatsAppUrl(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              WhatsApp
            </a>
          )}
        </div>
      )}
    </header>
  );
}
