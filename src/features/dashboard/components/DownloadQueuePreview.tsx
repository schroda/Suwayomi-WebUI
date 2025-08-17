/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { DownloadQueueStateButton } from '@/features/downloads/components/DownloadQueueStateButton.tsx';
import { DownloaderState, DownloadState } from '@/lib/graphql/generated/graphql.ts';
import { DownloadQueueChapterCard } from '@/features/downloads/components/DownloadQueueChapterCard.tsx';
import { Metadata } from '@/base/components/texts/Metadata.tsx';

export const DownloadQueuePreview = () => {
    const { t } = useTranslation();

    const { data } = requestManager.useGetDownloadStatus();

    const status = data?.downloadStatus.state ?? DownloaderState.Stopped;
    const downloadsCount = data?.downloadStatus.queue.length ?? 0;
    const activeCount =
        data?.downloadStatus.queue.filter((download) => download.state === DownloadState.Downloading).length ?? 0;
    const failedCount =
        data?.downloadStatus.queue.filter((download) => download.state === DownloadState.Error).length ?? 0;
    const pendingCount = downloadsCount - activeCount - failedCount;
    const isQueueEmpty = !downloadsCount;

    return (
        <Stack sx={{ gap: 1 }}>
            <Stack>
                <Link to={AppRoutes.downloads.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" component="h2">
                            {t('download.title.download')}
                        </Typography>
                        <Stack sx={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                            <DownloadQueueStateButton isQueueEmpty={isQueueEmpty} status={status} />
                            <ArrowForwardIcon />
                        </Stack>
                    </Stack>
                </Link>
                <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 2 }}>
                    <Metadata title={t('global.queue.stats.total')} value={downloadsCount} />
                    <Metadata title={t('global.queue.stats.pending')} value={pendingCount} />
                    <Metadata title={t('global.queue.stats.downloading')} value={activeCount} />
                    <Metadata title={t('global.queue.stats.failed')} value={failedCount} />
                </Stack>
            </Stack>
            <Stack sx={{ mx: -1 }}>
                {data?.downloadStatus.queue.slice(0, 5).map((chapter) => (
                    <DownloadQueueChapterCard item={chapter} status={status} />
                ))}
            </Stack>
        </Stack>
    );
};
