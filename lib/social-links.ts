// Owners type these in free-form ("@mi_restaurante", "mi_restaurante", a
// full URL, a phone number with or without spaces/dashes) — normalize to a
// real link here rather than force a strict input format on the settings
// form.

export function toInstagramUrl(value: string): string {
  if (/^https?:\/\//.test(value)) return value;
  return `https://instagram.com/${value.replace(/^@/, "")}`;
}

export function toWhatsAppUrl(value: string): string {
  if (/^https?:\/\//.test(value)) return value;
  return `https://wa.me/${value.replace(/\D/g, "")}`;
}
