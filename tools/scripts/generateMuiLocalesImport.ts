/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import path from 'path';
import fs from 'fs';

const outputFilePath = path.join(import.meta.dirname, '../../src/lib/mui/LocaleImporter.ts');
const resourcesDirPath = path.join(import.meta.dirname, '../../node_modules/@mui/material/locale/index.d.ts');

const muiLocalRegex = /export declare const ([a-zA-Z]+): Localization;/g;

const muiLocales: string[] = [];

let match: RegExpExecArray | null;
// eslint-disable-next-line no-cond-assign
while ((match = muiLocalRegex.exec(fs.readFileSync(resourcesDirPath, 'utf-8'))) !== null) {
    const muiLocaleImportName = match[1];

    // this handles the most common language tags which is of format <language-Region>, there shouldn't be any local
    // with less than 4 chars, but there can be tags which have additional info after the Region
    if (muiLocaleImportName.length < 4) {
        muiLocales.push(muiLocaleImportName);
        // eslint-disable-next-line no-continue
        continue;
    }

    const bcp47LocaleLanguage = muiLocaleImportName.slice(0, 2);
    const bcp47LocaleRegion = muiLocaleImportName.slice(2);

    const bcp47Locale = `${bcp47LocaleLanguage}-${bcp47LocaleRegion}`;

    muiLocales.push(bcp47Locale);
}

const outputFileContent = fs.readFileSync(outputFilePath, 'utf-8');

const updatedFileContent = outputFileContent.replace(
    /(const localesToImport: Record<\(typeof MUI_LOCALES\)\[number], \(\) => Promise<unknown>> = \{)[\s\S]*?(})/g,
    `$1${muiLocales.map((locale) => `'${locale}': () => import('@mui/material/locale')`).join(',')}$2`,
);

fs.writeFileSync(outputFilePath, updatedFileContent);
