/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { MultiValueButtonProps } from '@/modules/core/Core.types.ts';

export const ButtonSelect = <Value extends string | number>({
    value,
    values,
    defaultValue,
    setValue,
    valueToDisplayData,
    isDefaultable,
    onDefault,
}: MultiValueButtonProps<Value>) => {
    const { t } = useTranslation();

    return (
        <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
            {isDefaultable && (
                <Button key="default" onClick={onDefault} variant={value === undefined ? 'contained' : 'outlined'}>
                    {t('global.label.default')}
                </Button>
            )}
            {values.map((displayValue) => {
                const isDefault = value === undefined && displayValue === defaultValue;

                const text = valueToDisplayData[displayValue].isTitleString
                    ? valueToDisplayData[displayValue].title
                    : t(valueToDisplayData[displayValue].title);
                const defaultValueText = t('global.label.footnote', { text });
                const finalText = isDefault ? defaultValueText : text;

                return (
                    <Tooltip key={displayValue} title={isDefault ? t('reader.settings.active_setting') : ''}>
                        <Button
                            onClick={() => setValue(displayValue)}
                            variant={displayValue === value ? 'contained' : 'outlined'}
                            startIcon={valueToDisplayData[displayValue].icon}
                        >
                            {finalText}
                        </Button>
                    </Tooltip>
                );
            })}
        </Stack>
    );
};
