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
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { GetMangasLibraryQuery, GetMangasLibraryQueryVariables } from '@/lib/graphql/generated/graphql.ts';
import { GET_MANGAS_LIBRARY } from '@/lib/graphql/queries/MangaQuery.ts';
import { getErrorMessage, noOp } from '@/lib/HelperFunctions.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { AppRoutes } from '@/base/AppRoute.constants.ts';
import { MangaGrid } from '@/features/manga/components/MangaGrid.tsx';

export const LatestUpdatesPreview = () => {
    const { t } = useTranslation();

    const { data, loading, error, refetch } = requestManager.useGetMangas<
        GetMangasLibraryQuery,
        GetMangasLibraryQueryVariables
    >(GET_MANGAS_LIBRARY, { first: 5 });

    const mangas = data?.mangas.nodes ?? [];

    return (
        <Stack sx={{ gap: 1 }}>
            <Link to={AppRoutes.updates.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Typography variant="h5" component="h2">
                        {t('dashboard.latest_updates')}
                    </Typography>
                    <ArrowForwardIcon />
                </Stack>
            </Link>
            <MangaGrid
                mangas={mangas}
                hasNextPage={false}
                loadMore={noOp}
                isLoading={loading}
                horizontal
                message={t('global.error.label.failed_to_load_data')}
                messageExtra={getErrorMessage(error)}
                retry={() => refetch().catch(defaultPromiseErrorHandler('ContinueReading::refetch'))}
            />
        </Stack>
    );
};
