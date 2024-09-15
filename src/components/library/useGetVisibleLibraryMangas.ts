/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { StringParam, useQueryParam } from 'use-query-params';
import { useMemo } from 'react';
import { LibraryOptions, LibrarySortMode, NullAndUndefined } from '@/typings.ts';
import { useLibraryOptionsContext } from '@/components/context/LibraryOptionsContext.tsx';
import { useMetadataServerSettings } from '@/lib/metadata/metadataServerSettings.ts';
import { ChapterType, MangaType, SourceType, TrackRecordType } from '@/lib/graphql/generated/graphql.ts';
import { MangaChapterCountInfo, MangaIdInfo, MangaTrackRecordScoreInfo } from '@/lib/data/Mangas.ts';
import { enhancedCleanup } from '@/lib/data/Strings.ts';

const triStateFilter = (
    triState: NullAndUndefined<boolean>,
    enabledFilter: () => boolean,
    disabledFilter: () => boolean,
): boolean => {
    switch (triState) {
        case true:
            return enabledFilter();
        case false:
            return disabledFilter();
        default:
            return true;
    }
};

const triStateFilterNumber = (triState: NullAndUndefined<boolean>, count?: number): boolean =>
    triStateFilter(
        triState,
        () => !!count && count >= 1,
        () => count === 0,
    );

const triStateFilterBoolean = (triState: NullAndUndefined<boolean>, status?: boolean): boolean =>
    triStateFilter(
        triState,
        () => !!status,
        () => !status,
    );

const performSearch = (
    queries: NullAndUndefined<string>[] | undefined,
    strings: NullAndUndefined<string>[],
): boolean => {
    const actualQueries = queries?.filter((query) => query != null);
    const actualStrings = strings?.filter((str) => str != null);

    if (!actualQueries?.length) return true;

    const cleanedUpQueries = actualQueries.map(enhancedCleanup);
    const cleanedUpStrings = actualStrings.map(enhancedCleanup).join(', ');

    return cleanedUpQueries.every((query) => cleanedUpStrings.includes(query));
};

type TMangaQueryFilter = Pick<MangaType, 'title' | 'genre' | 'description' | 'artist' | 'author'> & {
    source?: NullAndUndefined<Pick<SourceType, 'displayName'>>;
};
const querySearchManga = (
    query: NullAndUndefined<string>,
    { title, genre: genres, description, artist, author, source }: TMangaQueryFilter,
): boolean =>
    performSearch([query], [title]) ||
    performSearch(
        query?.split(','),
        genres.map((genre) => enhancedCleanup(genre)),
    ) ||
    performSearch([query], [description]) ||
    performSearch([query], [artist]) ||
    performSearch([query], [author]) ||
    performSearch([query], [source?.displayName]);

type TMangaTrackerFilter = { trackRecords: { nodes: Pick<TrackRecordType, 'id' | 'trackerId'>[] } };
const trackerFilter = (trackFilters: LibraryOptions['tracker'], manga: TMangaTrackerFilter): boolean =>
    Object.entries(trackFilters)
        .map(([trackFilterId, trackFilterState]) => {
            const isTrackerBound = manga.trackRecords.nodes.some(
                (trackRecord) => trackRecord.trackerId === Number(trackFilterId),
            );

            return triStateFilter(
                trackFilterState,
                () => isTrackerBound,
                () => !isTrackerBound,
            );
        })
        .every(Boolean);

type TMangaStatusFilter = Pick<MangaType, 'status'>;
const statusFilter = (statusFilters: LibraryOptions['status'], manga: TMangaStatusFilter): boolean =>
    Object.entries(statusFilters)
        .map(([status, statusFilterState]) => triStateFilterBoolean(statusFilterState, status === manga.status))
        .every(Boolean);

type TMangaFilterOptions = Pick<
    LibraryOptions,
    'unread' | 'downloaded' | 'bookmarked' | 'hasDuplicateChapters' | 'tracker' | 'status'
>;
type TMangaFilter = Pick<MangaType, 'downloadCount' | 'unreadCount' | 'bookmarkCount' | 'hasDuplicateChapters'> &
    TMangaTrackerFilter &
    TMangaStatusFilter;
const filterManga = (
    manga: TMangaFilter,
    { unread, downloaded, bookmarked, hasDuplicateChapters, tracker, status }: TMangaFilterOptions,
): boolean =>
    triStateFilterNumber(downloaded, manga.downloadCount) &&
    triStateFilterNumber(unread, manga.unreadCount) &&
    triStateFilterNumber(bookmarked, manga.bookmarkCount) &&
    triStateFilterBoolean(hasDuplicateChapters, manga.hasDuplicateChapters) &&
    trackerFilter(tracker, manga) &&
    statusFilter(status, manga);

type TMangasFilter = TMangaQueryFilter & TMangaFilter;
const filterMangas = <Manga extends TMangasFilter>(
    mangas: Manga[],
    query: NullAndUndefined<string>,
    options: TMangaFilterOptions & { ignoreFilters: boolean },
): Manga[] => {
    const ignoreFiltersWhileSearching = options.ignoreFilters && query?.length;

    return mangas.filter((manga) => {
        const matchesSearch = querySearchManga(query, manga);
        const matchesFilters = ignoreFiltersWhileSearching || filterManga(manga, options);

        return matchesSearch && matchesFilters;
    });
};

const sortByNumber = (a: number | string = 0, b: number | string = 0) => Number(a) - Number(b);

const sortByString = (a: string, b: string): number => a.localeCompare(b);

type TMangaSort = Pick<MangaType, 'title' | 'inLibraryAt' | 'unreadCount'> &
    MangaChapterCountInfo &
    MangaTrackRecordScoreInfo & {
        lastReadChapter?: Pick<ChapterType, 'lastReadAt'> | null;
        latestUploadedChapter?: Pick<ChapterType, 'uploadDate'> | null;
        latestFetchedChapter?: Pick<ChapterType, 'fetchedAt'> | null;
    };
const sortManga = <Manga extends TMangaSort>(
    manga: Manga[],
    sort: NullAndUndefined<LibrarySortMode>,
    desc: NullAndUndefined<boolean>,
): Manga[] => {
    const result = [...manga];

    switch (sort) {
        case 'sortAlph':
            result.sort((a, b) => sortByString(a.title, b.title));
            break;
        case 'sortDateAdded':
            result.sort((a, b) => sortByNumber(a.inLibraryAt, b.inLibraryAt));
            break;
        case 'sortToRead':
            result.sort((a, b) => sortByNumber(a.unreadCount, b.unreadCount));
            break;
        case 'sortLastRead':
            result.sort((a, b) => sortByNumber(a.lastReadChapter?.lastReadAt, b.lastReadChapter?.lastReadAt));
            break;
        case 'sortLatestUploadedChapter':
            result.sort((a, b) =>
                sortByNumber(a.latestUploadedChapter?.uploadDate, b.latestUploadedChapter?.uploadDate),
            );
            break;
        case 'sortLatestFetchedChapter':
            result.sort((a, b) => sortByNumber(a.latestFetchedChapter?.fetchedAt, b.latestFetchedChapter?.fetchedAt));
            break;
        case 'sortTotalChapters':
            result.sort((a, b) => sortByNumber(a.chapters.totalCount, b.chapters.totalCount));
            break;
        case 'sortTrackerScore':
            result.sort(
                (a, b) =>
                    a.trackRecords.nodes.map(({ score }) => (score > 10 ? score / 10 : score)).length -
                    b.trackRecords.nodes.map(({ score }) => (score > 10 ? score / 10 : score)).length,
            );
            break;
        default:
            break;
    }

    if (desc) {
        result.reverse();
    }

    return result;
};

export const useGetVisibleLibraryMangas = <Manga extends MangaIdInfo & TMangasFilter & TMangaSort>(
    mangas: Manga[],
): {
    visibleMangas: Manga[];
    showFilteredOutMessage: boolean;
} => {
    const [query] = useQueryParam('query', StringParam);
    const { options } = useLibraryOptionsContext();
    const { unread, downloaded, bookmarked, tracker, hasDuplicateChapters, status } = options;
    const { settings } = useMetadataServerSettings();

    const filteredMangas = useMemo(
        () =>
            filterMangas(mangas, query, {
                unread,
                downloaded,
                bookmarked,
                hasDuplicateChapters,
                tracker,
                status,
                ignoreFilters: settings.ignoreFilters,
            }),
        [mangas, query, unread, downloaded, bookmarked, hasDuplicateChapters, tracker, settings.ignoreFilters],
    );
    const sortedMangas = useMemo(
        () => sortManga(filteredMangas, options.sorts, options.sortDesc),
        [filteredMangas, options.sorts, options.sortDesc],
    );

    const isATrackFilterActive = Object.values(options.tracker).some((trackFilterState) => trackFilterState != null);
    const showFilteredOutMessage =
        (unread != null || downloaded != null || bookmarked != null || !!query || isATrackFilterActive) &&
        filteredMangas.length === 0 &&
        mangas.length > 0;

    return {
        visibleMangas: sortedMangas,
        showFilteredOutMessage,
    };
};
