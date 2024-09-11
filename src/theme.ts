/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    ColorSystemOptions,
    createTheme as createMuiTheme,
    darken,
    Direction,
    lighten,
    Palette,
    responsiveFontSizes,
    SupportedColorScheme,
    Theme,
} from '@mui/material/styles';
import { ThemeMode } from '@/components/context/ThemeModeContext.tsx';
import { MediaQuery } from '@/lib/ui/MediaQuery.tsx';
import { AppTheme, loadThemeFonts } from '@/lib/ui/AppThemes.ts';
import { defaultPromiseErrorHandler } from '@/util/defaultPromiseErrorHandler.ts';

const SCROLLBAR_SIZE = 14;

declare module '@mui/material/styles' {
    interface CssThemeVariables {
        enabled: true;
    }
}

export const createTheme = (
    themeMode: ThemeMode,
    appTheme: AppTheme,
    pureBlackMode: boolean = false,
    direction: Direction = 'ltr',
) => {
    const systemMode = MediaQuery.getSystemThemeMode();
    const tmpThemeMode = themeMode === ThemeMode.SYSTEM ? systemMode : themeMode;

    const appThemeColorSchemes = appTheme.muiTheme.colorSchemes;
    const appThemePalette =
        appTheme.muiTheme.palette ??
        (appThemeColorSchemes?.[tmpThemeMode as SupportedColorScheme] as ColorSystemOptions | undefined)?.palette;

    const isStaticPaletteThemeMode = !!(appTheme.muiTheme.palette as any)?.type ?? appTheme.muiTheme.palette?.mode;
    const isStaticColorSchemesThemeMode =
        !!appThemeColorSchemes && !(!!appThemeColorSchemes?.dark && !!appThemeColorSchemes?.light);
    const isStaticThemeMode = isStaticPaletteThemeMode || isStaticColorSchemesThemeMode;

    const isStaticDarkModePalette =
        ((appTheme.muiTheme.palette as any)?.type ?? appTheme.muiTheme.palette?.mode) === ThemeMode.DARK;
    const isStaticDarkModeColorSchemes = !!appThemeColorSchemes?.dark && !appThemeColorSchemes?.light;
    const isStaticDarkMode = isStaticDarkModePalette || isStaticDarkModeColorSchemes;

    const appThemeMode = isStaticDarkMode ? ThemeMode.DARK : ThemeMode.LIGHT;
    const staticThemeMode = isStaticThemeMode ? appThemeMode : undefined;

    const mode = staticThemeMode ?? tmpThemeMode;

    const isDarkMode = mode === ThemeMode.DARK;
    const setPureBlackMode = isDarkMode && pureBlackMode;

    const baseTheme = createMuiTheme({
        direction,
        ...appTheme.muiTheme,
        ...(appTheme.muiTheme.palette ? { palette: { mode, ...appTheme.muiTheme.palette } } : {}),
        ...(appTheme.muiTheme.colorSchemes ? { colorSchemes: { ...appTheme.muiTheme.colorSchemes } } : {}),
    });

    const baseThemePalette = appThemeColorSchemes
        ? baseTheme.colorSchemes[mode as SupportedColorScheme]?.palette!
        : baseTheme.palette;

    const backgroundTrueBlack: Palette['background'] = {
        paper: '#111',
        default: '#000',
    };

    const backgroundDark: Palette['background'] = {
        paper: darken(baseThemePalette?.primary.main, 0.75),
        default: darken(baseThemePalette?.primary.main, 0.85),
    };
    const backgroundLight: Palette['background'] = {
        paper: lighten(baseThemePalette?.primary.main, 0.8),
        default: lighten(baseThemePalette?.primary.main, 0.9),
    };
    const backgroundThemeMode = isDarkMode ? backgroundDark : backgroundLight;
    const automaticBackground = setPureBlackMode ? backgroundTrueBlack : backgroundThemeMode;
    const appThemeBackground = appThemePalette?.background;

    const requiresAutomaticBackground = setPureBlackMode || !appThemeBackground;
    const background = requiresAutomaticBackground ? automaticBackground : appThemeBackground;

    const colorTheme = createMuiTheme(baseTheme, {
        ...(appTheme.muiTheme.palette ? { palette: { background } } : {}),
        // TODO - MUI does not deep merge the colorSchemes property, rendering the automatic background color and pure black background useless
        ...(appTheme.muiTheme.colorSchemes ? { colorSchemes: { [mode]: { palette: { background } } } } : {}),
    });

    const suwayomiTheme = createMuiTheme(colorTheme, {
        components: {
            ...appTheme.muiTheme.components,
            MuiUseMediaQuery: {
                defaultProps: {
                    noSsr: true,
                },
            },
            MuiCssBaseline: {
                ...appTheme.muiTheme.components?.MuiCssBaseline,
                styleOverrides:
                    typeof appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides === 'object'
                        ? {
                              ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides,
                              '*::-webkit-scrollbar': {
                                  width: `${SCROLLBAR_SIZE}px`,
                                  height: `${SCROLLBAR_SIZE}px`,
                                  // @ts-ignore - '*::-webkit-scrollbar' is a valid key
                                  ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides?.[
                                      '*::-webkit-scrollbar'
                                  ],
                              },
                              '*::-webkit-scrollbar-thumb': {
                                  border: '4px solid rgba(0, 0, 0, 0)',
                                  backgroundClip: 'padding-box',
                                  borderRadius: '9999px',
                                  backgroundColor: `${colorTheme.palette.primary[isDarkMode ? 'dark' : 'light']}`,
                                  // @ts-ignore - '*::-webkit-scrollbar-thumb' is a valid key
                                  ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides?.[
                                      '*::-webkit-scrollbar-thumb'
                                  ],
                              },
                              '*::-webkit-scrollbar-thumb:hover': {
                                  borderWidth: '2px',
                                  // @ts-ignore - '*::-webkit-scrollbar-thumb:hover' is a valid key
                                  ...appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides?.[
                                      '*::-webkit-scrollbar-thumb:hover'
                                  ],
                              },
                          }
                        : `
                        *::-webkit-scrollbar {
                          width: ${SCROLLBAR_SIZE}px;
                          height: ${SCROLLBAR_SIZE}px;
                        }
                        *::-webkit-scrollbar-thumb {
                          border: 4px solid rgba(0, 0, 0, 0);
                          background-clip: padding-box;
                          border-radius: 9999px;
                          background-color: ${colorTheme.palette.primary[isDarkMode ? 'dark' : 'light']};
                        }
                        *::-webkit-scrollbar-thumb:hover {
                          border-width: 2px;
                        }
                        
                        ${appTheme.muiTheme.components?.MuiCssBaseline?.styleOverrides ?? ''}
                    `,
            },
        },
    });

    return responsiveFontSizes(suwayomiTheme);
};

let theme: Theme;
export const getCurrentTheme = () => theme;
export const createAndSetTheme = (...args: Parameters<typeof createTheme>) => {
    theme = createTheme(...args);
    loadThemeFonts(theme).catch(defaultPromiseErrorHandler('theme::createAndSetTheme'));

    return theme;
};

export const getOptionForDirection = <T>(ltrOption: T, rtlOption: T): T =>
    (theme?.direction ?? 'ltr') === 'ltr' ? ltrOption : rtlOption;
