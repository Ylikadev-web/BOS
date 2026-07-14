/** Canonical href for expediente detail — works on GitHub Pages static hosting */
export function expedienteHref(codigo: string) {
  return `/operaciones/ver/?codigo=${encodeURIComponent(codigo)}`;
}
