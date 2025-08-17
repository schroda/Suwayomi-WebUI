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
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect } from 'react';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { Sources } from '@/features/source/services/Sources.ts';
import { MangaGrid } from '@/features/manga/components/MangaGrid.tsx';
import { SourceListFieldsFragment } from '@/lib/graphql/generated/graphql.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { getErrorMessage, noOp } from '@/lib/HelperFunctions.ts';
import { BrowseTab } from '@/features/browse/Browse.types.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyView } from '@/base/components/feedback/EmptyView.tsx';

const SourceLatest = ({ source }: { source: SourceListFieldsFragment }) => {
    const { t } = useTranslation();

    const [fetch, [{ data, isLoading, error }]] = requestManager.useGetSourceLatestMangas(source.id);

    useEffect(() => {
        if (source.supportsLatest) {
            fetch(1).catch(defaultPromiseErrorHandler('SourceLatestPreview::fetch'));
        }
    }, [source.supportsLatest]);

    if (!source.supportsLatest) {
        return null;
    }

    return (
        <Stack sx={{ gap: 1 }}>
            <Link to={AppRoutes.history.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="h3">
                        {source.displayName}
                    </Typography>
                    <ArrowForwardIcon />
                </Stack>
            </Link>
            {error ? (
                <EmptyView
                    sx={{ alignItems: 'start', height: undefined }}
                    noFaces
                    message={t('global.error.label.failed_to_load_data')}
                    messageExtra={getErrorMessage(error)}
                    retry={() => fetch(1).catch(defaultPromiseErrorHandler('SourceLatestPreview::fetch'))}
                />
            ) : (
                <MangaGrid
                    mangas={data?.fetchSourceManga?.mangas ?? []}
                    horizontal
                    hasNextPage={false}
                    loadMore={noOp}
                    isLoading={isLoading}
                />
            )}
        </Stack>
    );
};

export const SourceLatestPreview = () => {
    const { t } = useTranslation();

    const { data, loading, error, refetch } = requestManager.useGetSourceList();

    const sources = data?.sources.nodes;
    const pinnedSources = Sources.filter(sources ?? [], { pinned: true }).slice(0, 3);

    return (
        <Stack sx={{ gap: 1 }}>
            <Link to={AppRoutes.browse.path(BrowseTab.SOURCES)} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Typography variant="h5" component="h2">
                        {t('dashboard.latest_source.title')}
                    </Typography>
                    <ArrowForwardIcon />
                </Stack>
            </Link>
            {pinnedSources.map((source) => (
                <SourceLatest key={source.id} source={source} />
            ))}
            {!pinnedSources.length && <Typography>{t('dashboard.latest_source.info.no_pinned_source')}</Typography>}
            {loading && <LoadingPlaceholder />}
            {error && (
                <EmptyView
                    message={t('global.error.label.failed_to_load_data')}
                    messageExtra={getErrorMessage(error)}
                    retry={() => refetch().catch(defaultPromiseErrorHandler('SourceLatestPreview::refetch'))}
                />
            )}
        </Stack>
    );
};
