/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { useAppTitleAndAction } from '@/features/navigation-bar/hooks/useAppTitleAndAction.ts';
import { ContinueReadingPreview } from '@/features/dashboard/components/ContinueReadingPreview.tsx';
import { LatestUpdatesPreview } from '@/features/dashboard/components/LatestUpdatesPreview.tsx';
import { DownloadQueuePreview } from '@/features/dashboard/components/DownloadQueuePreview.tsx';
import { LibraryUpdatePreview } from '@/features/dashboard/components/LibraryUpdatePreview.tsx';
import { SourceLatestPreview } from '@/features/dashboard/components/SourcesLatestPreview.tsx';

export const Dashboard = () => {
    const { t } = useTranslation();
    const theme = useTheme();

    useAppTitleAndAction(t('dashboard.title'), null);

    return (
        <Stack sx={{ p: 1, gap: 3 }}>
            <Stack
                sx={{
                    gap: 3,
                    [theme.breakpoints.up('lg')]: { flexDirection: 'row' },
                }}
            >
                <Box sx={{ flexBasis: '50%' }}>
                    <DownloadQueuePreview />
                </Box>
                <Box sx={{ flexBasis: '50%' }}>
                    <LibraryUpdatePreview />
                </Box>
            </Stack>
            <Stack
                sx={{
                    gap: 3,
                    [theme.breakpoints.up('lg')]: { flexDirection: 'row' },
                }}
            >
                <Box sx={{ flexBasis: '50%' }}>
                    <ContinueReadingPreview />
                </Box>
                <Box sx={{ flexBasis: '50%' }}>
                    <LatestUpdatesPreview />
                </Box>
            </Stack>
            <SourceLatestPreview />
        </Stack>
    );
};
