/**
 * Formats phone number input live as the user types, auto-inserting the "+90"
 * country code and grouping digits as +90 XXX XXX XX XX (Turkish mobile format),
 * so users can just type digits without worrying about spacing or the prefix.
 */
export function formatPhoneInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");

  // Every re-render feeds this function its own "+90 " prefix back as part of
  // `value`, so "90" must always be stripped when present — not just once the
  // number is long enough — otherwise it re-accumulates into the digits on
  // every keystroke instead of staying as the prefix. Turkish mobile numbers
  // always start with 5, so this is never ambiguous with a real digit.
  let national = digitsOnly.startsWith("90") ? digitsOnly.slice(2) : digitsOnly;
  // Also strip a leading trunk "0", as in the common "0555 123 45 67" form
  if (national.startsWith("0")) {
    national = national.slice(1);
  }
  national = national.slice(0, 10);

  if (national.length === 0) return "";

  const parts = [
    national.slice(0, 3),
    national.slice(3, 6),
    national.slice(6, 8),
    national.slice(8, 10)
  ].filter(Boolean);

  return `+90 ${parts.join(" ")}`;
}
