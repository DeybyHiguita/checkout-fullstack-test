import { useEffect } from 'react';

/** Actualiza el título del documento según la pantalla (accesibilidad/UX). */
export const useDocumentTitle = (title: string): void => {
  useEffect(() => {
    document.title = `${title} · Checkout`;
  }, [title]);
};
