/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';

type Action = {
    show?: boolean;
    title?: string;
    contain?: boolean;
};

type Actions = {
    extra?: Action & { url?: string };
    cancel?: Action;
    confirm?: Action;
};

export const ConfirmDialog = ({
    title,
    message,
    actions: passedActions,
    onExtra,
    onCancel,
    onConfirm,
}: {
    title: string;
    message: string;
    actions?: Actions;
    onExtra?: () => void;
    onCancel: () => void;
    onConfirm: () => void;
}) => {
    const { t } = useTranslation();

    const actions = {
        extra: {
            show: passedActions?.extra?.show ?? false,
            title: passedActions?.extra?.title ?? '',
            contain: passedActions?.extra?.contain ?? false,
            url: passedActions?.extra?.url,
        },
        cancel: {
            show: passedActions?.cancel?.show ?? true,
            title: passedActions?.cancel?.title ?? t('global.button.cancel'),
            contain: passedActions?.cancel?.contain ?? false,
        },
        confirm: {
            show: passedActions?.confirm?.show ?? true,
            title: passedActions?.confirm?.title ?? t('global.button.ok'),
            contain:
                !passedActions?.extra?.contain &&
                !passedActions?.cancel?.contain &&
                !passedActions?.confirm?.contain &&
                true,
        },
    } satisfies Actions;
    console.log('asdf', actions.extra);
    return (
        <Dialog open onClose={onCancel}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent
                sx={{
                    whiteSpace: 'pre-line',
                }}
            >
                {message}
            </DialogContent>
            <DialogActions>
                <Stack
                    direction="row"
                    sx={{
                        justifyContent: actions.extra.show ? 'space-between' : 'end',
                        width: '100%',
                    }}
                >
                    {actions.extra.show &&
                        (actions.extra.url ? (
                            <Button
                                component={Link}
                                to={actions.extra.url}
                                onClick={onExtra}
                                variant={actions.extra.contain ? 'contained' : undefined}
                            >
                                {actions.extra.title}
                            </Button>
                        ) : (
                            <Button onClick={onExtra} variant={actions.extra.contain ? 'contained' : undefined}>
                                {actions.extra.title}
                            </Button>
                        ))}
                    <Stack direction="row">
                        {actions.cancel.show && (
                            <Button onClick={onCancel} variant={actions.cancel.contain ? 'contained' : undefined}>
                                {actions.cancel.title}
                            </Button>
                        )}
                        {actions.confirm.show && (
                            <Button onClick={onConfirm} variant={actions.confirm.contain ? 'contained' : undefined}>
                                {actions.confirm.title}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};
