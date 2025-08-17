/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from '@mui/material/Box';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { closestCenter, DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useWindowEvent } from '@mantine/hooks';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { EmptyViewAbsoluteCentered } from '@/base/components/feedback/EmptyViewAbsoluteCentered.tsx';
import { LoadingPlaceholder } from '@/base/components/feedback/LoadingPlaceholder.tsx';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { DownloaderState } from '@/lib/graphql/generated/graphql.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';
import { DndSortableItem } from '@/lib/dnd-kit/DndSortableItem.tsx';
import { DndKitUtil } from '@/lib/dnd-kit/DndKitUtil.ts';
import { DndOverlayItem } from '@/lib/dnd-kit/DndOverlayItem.tsx';
import { DownloadQueueChapterCard } from '@/features/downloads/components/DownloadQueueChapterCard.tsx';
import { useAppTitle } from '@/features/navigation-bar/hooks/useAppTitle.ts';
import { useAppAction } from '@/features/navigation-bar/hooks/useAppAction.ts';
import { ChapterDownloadStatus } from '@/features/chapter/Chapter.types.ts';
import { VirtuosoPersisted } from '@/lib/virtuoso/Component/VirtuosoPersisted.tsx';
import { DownloadQueueStateButton } from '@/features/downloads/components/DownloadQueueStateButton.tsx';
import { DownloadQueueClearButton } from '@/features/downloads/components/DownloadQueueClearButton.tsx';

export const DownloadQueue: React.FC = () => {
    const { t } = useTranslation();

    useAppTitle(t('download.title.queue'));

    const [reorderDownload, { reset: revertReorder }] = requestManager.useReorderChapterInDownloadQueue();

    const {
        data: downloadStatusData,
        loading: isLoading,
        error,
        refetch,
    } = requestManager.useGetDownloadStatus({ notifyOnNetworkStatusChange: true });
    const downloaderData = downloadStatusData?.downloadStatus;

    const queue = downloaderData?.queue ?? [];
    const status = downloaderData?.state ?? DownloaderState.Started;
    const isQueueEmpty = !queue.length;

    const dndItems = useMemo(() => queue.map((download) => download.chapter), [queue]);
    const dndSensors = DndKitUtil.useSensorsForDevice();
    const [dndActiveDownload, setDndActiveDownload] = useState<ChapterDownloadStatus | null>(null);

    const categoryReorder = (list: ChapterDownloadStatus[], from: number, to: number) => {
        if (from === to) {
            return;
        }

        reorderDownload({ variables: { input: { chapterId: list[from].chapter.id, to } } }).catch(() => {
            revertReorder();
        });
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setDndActiveDownload(null);

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = queue.findIndex((download) => download.chapter.id === active.id);
        const newIndex = queue.findIndex((download) => download.chapter.id === over.id);

        categoryReorder(queue, oldIndex, newIndex);
    };

    useAppAction(
        <>
            <DownloadQueueClearButton />
            <DownloadQueueStateButton isQueueEmpty={isQueueEmpty} status={status} />
        </>,
        [status, isQueueEmpty],
    );

    // Virtuoso's resize observer can throw this error,
    // which is caught by DnD and aborts dragging.
    useWindowEvent('error', (e) => {
        if (
            e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
            e.message === 'ResizeObserver loop limit exceeded'
        ) {
            e.stopImmediatePropagation();
        }
    });

    if (isLoading) {
        return <LoadingPlaceholder />;
    }

    if (error) {
        return (
            <EmptyViewAbsoluteCentered
                message={t('global.error.label.failed_to_load_data')}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(defaultPromiseErrorHandler('DownloadQueue::refetch'))}
            />
        );
    }

    if (isQueueEmpty) {
        return <EmptyViewAbsoluteCentered message={t('download.queue.label.no_downloads')} />;
    }

    return (
        <Box sx={{ pb: 1 }}>
            <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragStart={(event) =>
                    setDndActiveDownload(queue.find((download) => download.chapter.id === event.active.id) ?? null)
                }
                onDragEnd={onDragEnd}
                onDragCancel={() => setDndActiveDownload(null)}
                onDragAbort={() => setDndActiveDownload(null)}
            >
                <SortableContext items={dndItems} strategy={verticalListSortingStrategy}>
                    <VirtuosoPersisted
                        persistKey="download-queue"
                        useWindowScroll
                        overscan={window.innerHeight * 0.5}
                        totalCount={queue.length}
                        computeItemKey={(index) => queue[index].chapter.id}
                        itemContent={(index) => (
                            <DndSortableItem
                                id={queue[index].chapter.id}
                                isDragging={queue[index].chapter.id === dndActiveDownload?.chapter.id}
                            >
                                <DownloadQueueChapterCard item={queue[index]} status={status} />
                            </DndSortableItem>
                        )}
                    />
                </SortableContext>
                <DndOverlayItem isActive={!!dndActiveDownload}>
                    <DownloadQueueChapterCard item={dndActiveDownload!} status={status} />
                </DndOverlayItem>
            </DndContext>
        </Box>
    );
};
