/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { createRoot } from 'react-dom/client';
import { ConfirmDialog } from '@/modules/core/components/ConfirmDialog.tsx';
import { ControlledPromise } from '@/lib/ControlledPromise.ts';
import { AppContext } from '@/modules/core/contexts/AppContext.tsx';

export const awaitConfirmation = async (
    dialogProps: Omit<React.ComponentProps<typeof ConfirmDialog>, 'onCancel' | 'onConfirm'>,
) => {
    const dialogContainer = document.createElement('div');
    document.body.appendChild(dialogContainer);

    const root = createRoot(dialogContainer);

    const confirmationPromise = new ControlledPromise();
    const handleConfirmation = (accepted: boolean) => {
        if (accepted) {
            confirmationPromise.resolve();
        } else {
            confirmationPromise.reject(new Error('Confirmation declined'));
        }

        root.unmount();
        document.body.removeChild(dialogContainer);
    };

    root.render(
        <AppContext>
            <ConfirmDialog
                {...dialogProps}
                onExtra={() => {
                    handleConfirmation(false);
                    dialogProps.onExtra?.();
                }}
                onCancel={() => handleConfirmation(false)}
                onConfirm={() => handleConfirmation(true)}
            />
            ,
        </AppContext>,
    );

    return confirmationPromise.promise;
};
