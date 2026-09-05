import { createContext, createElement, useContext, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { fonts } from '@/lib/theme';

export type CypherFonts = {
  displayFamily: string;
  bodyFamily: string;
  bodyMediumFamily: string;
  bodySemiFamily: string;
  bodyBoldFamily: string;
  displayLoaded: boolean;
};

const iosDisplayFallback = 'AvenirNextCondensed-Bold';
const androidDisplayFallback = 'sans-serif-condensed';
const systemBody = Platform.OS === 'ios' ? 'System' : 'sans-serif';

export const fallbackFonts: CypherFonts = {
  displayFamily: Platform.select({
    ios: iosDisplayFallback,
    android: androidDisplayFallback,
    default: 'System',
  }) as string,
  bodyFamily: systemBody,
  bodyMediumFamily: systemBody,
  bodySemiFamily: systemBody,
  bodyBoldFamily: systemBody,
  displayLoaded: false,
};

export const loadedFonts: CypherFonts = {
  displayFamily: fonts.display,
  bodyFamily: fonts.body,
  bodyMediumFamily: fonts.bodyMedium,
  bodySemiFamily: fonts.bodySemi,
  bodyBoldFamily: fonts.bodyBold,
  displayLoaded: true,
};

const FontsContext = createContext<CypherFonts>(fallbackFonts);

export function FontsProvider({
  value,
  children,
}: {
  value: CypherFonts;
  children: ReactNode;
}) {
  return createElement(FontsContext.Provider, { value }, children);
}

export function useCypherFonts(): CypherFonts {
  return useContext(FontsContext);
}
