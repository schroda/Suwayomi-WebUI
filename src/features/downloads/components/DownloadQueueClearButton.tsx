/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { makeToast } from '@/base/utils/Toast.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

export const DownloadQueueClearButton = () => {
    const { t } = useTranslation();

    const clearQueue = async () => {
        try {
            await requestManager.clearDownloads().response;
        } catch (e) {
            makeToast(t('download.queue.error.label.failed_delete_all'), 'error', getErrorMessage(e));
        }
    };

    return (
        <CustomTooltip title={t('download.queue.label.delete_all')}>
            <IconButton onClick={clearQueue} color="inherit">
                <DeleteSweepIcon />
            </IconButton>
        </CustomTooltip>
    );
};
