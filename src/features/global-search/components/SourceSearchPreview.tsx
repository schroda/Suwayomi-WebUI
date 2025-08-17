/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton'; // ms
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BaseMangaGrid } from '@/features/manga/components/BaseMangaGrid.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { EmptyView } from '@/base/components/feedback/EmptyView.tsx';
import { MUIUtil } from '@/lib/mui/MUI.util.ts';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { translateExtensionLanguage } from '@/features/extension/Extensions.utils.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { MetadataBrowseSettings } from '@/features/browse/Browse.types.ts';
import { MangaCardProps } from '@/features/manga/Manga.types.ts';
import {
    SourceDisplayNameInfo,
    SourceIdInfo,
    SourceLanguageInfo,
    SourceNameInfo,
} from '@/features/source/Source.types.ts';
import { SourceLoadingState } from '@/features/global-search/SearchAll.types.ts';

export const SourceSearchPreview = React.memo(
    ({
        source,
        onSearchRequestFinished,
        searchString,
        emptyQuery,
        mode,
        shouldShowOnlySourcesWithResults,
    }: {
        source: SourceIdInfo & SourceDisplayNameInfo & SourceNameInfo & SourceLanguageInfo;
        onSearchRequestFinished: (source: SourceIdInfo, state: SourceLoadingState) => void;
        searchString: string | null | undefined;
        emptyQuery: boolean;
    } & Pick<MangaCardProps, 'mode'> &
        Pick<MetadataBrowseSettings, 'shouldShowOnlySourcesWithResults'>) => {
        const { t } = useTranslation();

        const { id, name, lang } = source;

        const currentSearchString = useRef(searchString);
        const currentAbortRequest = useRef<(reason: any) => void>(() => {});

        const didSearchChange = currentSearchString.current !== searchString;
        if (didSearchChange) {
            currentSearchString.current = searchString;
            currentAbortRequest.current(new Error(`SourceSearchPreview(${id}, ${name}): search string changed`));
        }

        const [refetch, results] = requestManager.useSourceSearch(id, searchString ?? '', undefined, 1, {
            skipRequest: !searchString,
            addAbortSignal: true,
        });

        const { data: searchResult, isLoading, error, abortRequest } = results[0]!;
        currentAbortRequest.current = abortRequest;

        const mangas = searchResult?.fetchSourceManga?.mangas ?? [];
        const noMangasFound = !error && !isLoading && !mangas.length;

        useEffect(() => {
            onSearchRequestFinished(source, {
                isLoading,
                hasResults: !noMangasFound,
                emptySearch: !searchString,
                error,
            });
        }, [isLoading, noMangasFound, searchString, error]);

        let errorMessage: string | undefined;
        if (error) {
            errorMessage = t('search.error.label.source_search_failed');
        } else if (noMangasFound) {
            errorMessage = t('manga.error.label.no_mangas_found');
        }

        if ((!isLoading && !searchString) || emptyQuery) {
            return null;
        }

        if (shouldShowOnlySourcesWithResults && (noMangasFound || error)) {
            return null;
        }

        return (
            <Box sx={{ pb: 2 }}>
                <Card sx={{ mb: 1 }}>
                    <CardActionArea
                        component={Link}
                        to={AppRoutes.sources.childRoutes.browse.path(id, searchString)}
                        sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <Box>
                            <Typography variant="h5">{name}</Typography>
                            <Typography variant="caption">{translateExtensionLanguage(lang)}</Typography>
                        </Box>
                        <CustomTooltip title={t('global.button.show_more')}>
                            <IconButton {...MUIUtil.preventRippleProp()}>
                                <ArrowForwardIcon />
                            </IconButton>
                        </CustomTooltip>
                    </CardActionArea>
                </Card>
                {errorMessage ? (
                    <EmptyView
                        sx={{ alignItems: 'start', height: undefined }}
                        noFaces
                        message={errorMessage}
                        messageExtra={getErrorMessage(error)}
                        retry={
                            error
                                ? () =>
                                      refetch(1).catch(
                                          defaultPromiseErrorHandler(`SourceSearchPreview(${source.id})::refetch`),
                                      )
                                : undefined
                        }
                    />
                ) : (
                    <BaseMangaGrid
                        // the key needs to include filters and query to force a re-render of the virtuoso grid to prevent https://github.com/petyosi/react-virtuoso/issues/1242
                        key={searchString}
                        gridWrapperProps={{ sx: { px: 0 } }}
                        mangas={mangas}
                        isLoading={isLoading}
                        hasNextPage={false}
                        loadMore={() => undefined}
                        horizontal
                        noFaces
                        message={errorMessage}
                        inLibraryIndicator
                        mode={mode}
                    />
                )}
            </Box>
        );
    },
);
