/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { getErrorMessage, noOp } from '@/lib/HelperFunctions.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { dateTimeFormatter } from '@/base/utils/DateHelper.ts';
import { MangaJobStatus } from '@/lib/graphql/generated/graphql.ts';
import { Metadata } from '@/base/components/texts/Metadata.tsx';
import { UpdateChecker } from '@/features/updates/components/UpdateChecker.tsx';
import { MangaGrid } from '@/features/manga/components/MangaGrid.tsx';
import { GridLayout } from '@/base/Base.types.ts';

export const LibraryUpdatePreview = () => {
    const { t } = useTranslation();

    const lastUpdateTimestamp = requestManager.useGetLastGlobalUpdateTimestamp().data?.lastUpdateTimestamp.timestamp;
    const summary = requestManager.useGetGlobalUpdateSummary();

    const updateStatus = summary.data?.libraryUpdateStatus;
    const {
        isRunning,
        totalJobs = 0,
        finishedJobs = 0,
        skippedCategoriesCount = 0,
        skippedMangasCount = 0,
    } = updateStatus?.jobsInfo ?? {};
    const failedJobs =
        updateStatus?.mangaUpdates.filter((update) => update.status === MangaJobStatus.Failed).length ?? 0;

    return (
        <Stack sx={{ position: 'relative', gap: 1 }}>
            <Stack>
                <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack>
                        <Typography variant="h5" component="h2">
                            {t('library.settings.global_update.title')}
                        </Typography>
                    </Stack>
                    {isRunning && <UpdateChecker />}
                </Stack>
                <Typography variant="body2">
                    {t('library.settings.global_update.label.last_update', {
                        date: lastUpdateTimestamp ? dateTimeFormatter.format(+lastUpdateTimestamp) : '-',
                    })}
                </Typography>
            </Stack>
            <Stack sx={{ flexDirection: 'row', columnGap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Metadata title={t('global.queue.stats.total')} value={totalJobs} />
                <Metadata title={t('global.queue.stats.pending')} value={totalJobs - finishedJobs} />
                <Metadata title={t('global.queue.stats.finished')} value={finishedJobs - failedJobs} />
                <Metadata title={t('global.queue.stats.failed')} value={failedJobs} />
                <Metadata title={t('updates.queue.stats.skipped_mangas')} value={skippedMangasCount} />
                <Metadata title={t('updates.queue.stats.skipped_categories')} value={skippedCategoriesCount} />
            </Stack>
            {isRunning && (
                <MangaGrid
                    mode="duplicate"
                    mangas={
                        summary.data?.libraryUpdateStatus.mangaUpdates
                            .filter((update) =>
                                [MangaJobStatus.Running, MangaJobStatus.Pending].includes(update.status),
                            )
                            .slice(0, 5)
                            .map((update) => ({ ...update.manga, sourceId: '-1' })) ?? []
                    }
                    hasNextPage={false}
                    loadMore={noOp}
                    isLoading={false}
                    gridLayout={GridLayout.List}
                    message={t('global.error.label.failed_to_load_data')}
                    messageExtra={getErrorMessage(summary.error)}
                    retry={() => summary.refetch().catch(defaultPromiseErrorHandler('LibraryUpdatePreview::refetch'))}
                />
            )}
        </Stack>
    );
};
