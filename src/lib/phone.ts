// No "server-only" guard — this needs to be importable from Client Components
// (e.g. Header.tsx) that render a `tel:` link from the configured phone number.
export function phoneToTelHref(phone: string) {
  return `tel:${phone.replace(/\D/g, "")}`;
}
