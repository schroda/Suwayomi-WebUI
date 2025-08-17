/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { DownloaderState } from '@/lib/graphql/generated/graphql.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';

export const DownloadQueueStateButton = ({
    isQueueEmpty,
    status,
}: {
    isQueueEmpty: boolean;
    status: DownloaderState;
}) => {
    const { t } = useTranslation();

    const toggleQueueStatus = () => {
        if (status === DownloaderState.Stopped) {
            requestManager.startDownloads();
        } else {
            requestManager.stopDownloads();
        }
    };

    return (
        <CustomTooltip
            title={t(status === DownloaderState.Started ? 'global.button.start' : 'global.button.stop')}
            disabled={isQueueEmpty}
        >
            <IconButton onClick={toggleQueueStatus} disabled={isQueueEmpty} color="inherit">
                {status === DownloaderState.Stopped ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
        </CustomTooltip>
    );
};
