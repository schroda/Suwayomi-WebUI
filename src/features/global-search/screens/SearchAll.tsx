/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StringParam, useQueryParam } from 'use-query-params';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import PushPinIcon from '@mui/icons-material/PushPin';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useElementSize } from '@mantine/hooks';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { AppbarSearch } from '@/base/components/AppbarSearch.tsx';
import { useDebounce } from '@/base/hooks/useDebounce.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { Sources } from '@/features/source/services/Sources.ts';
import { SourceDisplayNameInfo, SourceIdInfo, SourceMetaInfo } from '@/features/source/Source.types.ts';
import {
    createUpdateMetadataServerSettings,
    useMetadataServerSettings,
} from '@/features/settings/services/ServerSettingsMetadata.ts';
import { useAppTitleAndAction } from '@/features/navigation-bar/hooks/useAppTitleAndAction.ts';
import { getSourceMetadata } from '@/features/source/services/SourceMetadata.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { SourceLanguageSelect } from '@/features/source/components/SourceLanguageSelect.tsx';
import { SearchParam } from '@/base/Base.types.ts';
import { SourceSearchPreview } from '@/features/global-search/components/SourceSearchPreview.tsx';
import { SourceLoadingState, SourceToLoadingStateMap } from '@/features/global-search/SearchAll.types.ts';

const compareSourceByName = (sourceA: SourceDisplayNameInfo, sourceB: SourceDisplayNameInfo): number =>
    sourceA.displayName.localeCompare(sourceB.displayName);

const compareSourcesBySearchResult = (
    sourceA: SourceIdInfo & SourceMetaInfo,
    sourceB: SourceIdInfo & SourceMetaInfo,
    sourceToFetchedStateMap: SourceToLoadingStateMap,
): -1 | 0 | 1 => {
    const isSourceAPinned = getSourceMetadata(sourceA).isPinned;
    const isSourceBPinned = getSourceMetadata(sourceB).isPinned;

    const sourceAState = sourceToFetchedStateMap.get(sourceA.id);
    const sourceBState = sourceToFetchedStateMap.get(sourceB.id);

    const isSourceAFetched = !sourceAState?.isLoading;
    const hasSourceAError = !!sourceAState?.error;
    const isSourceASearchResultEmpty = !sourceAState?.hasResults && !hasSourceAError;

    const isSourceBFetched = !sourceBState?.isLoading;
    const hasSourceBError = !!sourceBState?.error;
    const isSourceBSearchResultEmpty = !sourceBState?.hasResults && !hasSourceBError;

    if (isSourceAFetched && !isSourceBFetched) {
        return -1;
    }
    if (!isSourceAFetched && isSourceBFetched) {
        return 1;
    }

    if (isSourceASearchResultEmpty && !isSourceBSearchResultEmpty) {
        return 1;
    }
    if (isSourceBSearchResultEmpty && !isSourceASearchResultEmpty) {
        return -1;
    }

    if (!hasSourceAError && hasSourceBError) {
        return -1;
    }
    if (hasSourceAError && !hasSourceBError) {
        return 1;
    }

    if (isSourceAPinned && !isSourceBPinned) {
        return -1;
    }
    if (!isSourceAPinned && isSourceBPinned) {
        return 1;
    }

    return 0;
};
const TRIGGER_SEARCH_THRESHOLD = 1000; // ms

export const SearchAll: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname, state } = useLocation<{ mangaTitle?: string; shouldShowOnlyPinnedSources?: boolean }>();
    const { ref: filterHeaderRef, height: filterHeaderHeight } = useElementSize();

    const shouldShowOnlyPinnedSources = state?.shouldShowOnlyPinnedSources ?? true;
    const isMigrateMode = pathname.startsWith('/migrate/source');

    const [query] = useQueryParam(SearchParam.QUERY, StringParam);
    const searchString = useDebounce(query, TRIGGER_SEARCH_THRESHOLD);

    const { languages: shownLangs, setLanguages: setShownLangs } = Sources.useLanguages();
    const {
        settings: { showNsfw, shouldShowOnlySourcesWithResults },
    } = useMetadataServerSettings();

    const { data, loading, error, refetch } = requestManager.useGetSourceList({ notifyOnNetworkStatusChange: true });
    const sources = useMemo(() => data?.sources.nodes ?? [], [data?.sources.nodes]);

    const [sourceToLoadingStateMap, setSourceToLoadingStateMap] = useState<SourceToLoadingStateMap>(new Map());
    const debouncedSourceToLoadingStateMap = useDebounce(sourceToLoadingStateMap, 500);

    const sourceLanguages = useMemo(() => Sources.getLanguages(sources), [sources]);

    const filteredSources = useMemo(
        () =>
            Sources.filter(sources, {
                showNsfw,
                languages: shownLangs,
                keepLocalSource: true,
                pinned: shouldShowOnlyPinnedSources,
                enabled: true,
            }),
        [sources, shownLangs, shouldShowOnlyPinnedSources],
    );
    const sourcesSortedByName = useMemo(() => [...filteredSources].toSorted(compareSourceByName), [filteredSources]);
    const sourcesSortedByResult = useMemo(
        () =>
            [...sourcesSortedByName].sort((sourceA, sourceB) =>
                compareSourcesBySearchResult(sourceA, sourceB, debouncedSourceToLoadingStateMap),
            ),
        [sourcesSortedByName, debouncedSourceToLoadingStateMap],
    );

    const updateSourceLoadingState = useCallback(
        ({ id }: SourceIdInfo, loadState: SourceLoadingState) => {
            setSourceToLoadingStateMap((currentMap) => {
                const mapCopy = new Map(currentMap);
                mapCopy.set(id, loadState);
                return mapCopy;
            });
        },
        [setSourceToLoadingStateMap],
    );

    const updateMetadataSettings = createUpdateMetadataServerSettings<'shouldShowOnlySourcesWithResults'>((e) =>
        makeToast(t('global.error.label.failed_to_save_changes'), 'error', getErrorMessage(e)),
    );

    useAppTitleAndAction(
        t(isMigrateMode ? 'migrate.search.title' : 'search.title.global_search', { title: state?.mangaTitle }),
        <>
            <AppbarSearch isClosable={false} />
            <SourceLanguageSelect
                selectedLanguages={shownLangs}
                setSelectedLanguages={setShownLangs}
                languages={sourceLanguages}
                sources={sources ?? []}
            />
        </>,
        [shownLangs, setShownLangs, sourceLanguages, sources],
    );

    if (loading) {
        return <LoadingPlaceholder />;
    }

    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t('global.error.label.failed_to_load_data')}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(defaultPromiseErrorHandler('SearchAll::refetch'))}
            />
        );
    }

    return (
        <Box sx={{ position: 'relative', px: 1, pb: 1 }}>
            <Stack
                ref={filterHeaderRef}
                sx={{
                    width: '100%',
                    position: 'fixed',
                    zIndex: 1,
                    flexDirection: 'row',
                    gap: 2,
                    pt: 1,
                    pb: 2,
                    background: (theme) => theme.palette.background.default,
                }}
            >
                <Stack sx={{ flexDirection: 'row', gap: 1 }}>
                    <Button
                        startIcon={<PushPinIcon />}
                        variant={shouldShowOnlyPinnedSources ? 'contained' : 'outlined'}
                        onClick={() =>
                            navigate(
                                {
                                    pathname: '',
                                    search: query ? `query=${query}` : '',
                                },
                                {
                                    replace: true,
                                    state: { ...state, shouldShowOnlyPinnedSources: true },
                                },
                            )
                        }
                    >
                        {t('global.label.pinned')}
                    </Button>
                    <Button
                        startIcon={<DoneAllIcon />}
                        variant={!shouldShowOnlyPinnedSources ? 'contained' : 'outlined'}
                        onClick={() =>
                            navigate(
                                {
                                    pathname: '',
                                    search: query ? `query=${query}` : '',
                                },
                                {
                                    replace: true,
                                    state: { ...state, shouldShowOnlyPinnedSources: false },
                                },
                            )
                        }
                    >
                        {t('extension.language.all')}
                    </Button>
                </Stack>
                <Button
                    startIcon={<FilterListIcon />}
                    variant={shouldShowOnlySourcesWithResults ? 'contained' : 'outlined'}
                    onClick={() =>
                        updateMetadataSettings('shouldShowOnlySourcesWithResults', !shouldShowOnlySourcesWithResults)
                    }
                >
                    {t('search.filter.has_results')}
                </Button>
            </Stack>
            <Box sx={{ pt: `${filterHeaderHeight}px` }}>
                {sourcesSortedByResult.map((source) => (
                    <SourceSearchPreview
                        key={source.id}
                        source={source}
                        onSearchRequestFinished={updateSourceLoadingState}
                        searchString={searchString}
                        emptyQuery={!query}
                        mode={isMigrateMode ? 'migrate.select' : 'source'}
                        shouldShowOnlySourcesWithResults={shouldShowOnlySourcesWithResults}
                    />
                ))}
            </Box>
        </Box>
    );
};
