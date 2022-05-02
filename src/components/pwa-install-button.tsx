import { createMemo } from "solid-js";
import PWAManager from "../miscellaneous/pwa";

export default function PWAInstallButton() {
    const pwaManager = PWAManager.getInstance();

    const buttonData = createMemo(() => {
        if (pwaManager.readyForPrompt()()) {
            return {
                disabled: false,
                onclick: () => { pwaManager.promptForPWAInstall() },
            };
        } else {
            return {
                disabled: true,
            }
        }
    });

    const disabledText = createMemo(() => {
        if (pwaManager.readyForPrompt()()) {
            return <></>;
        } else {
            return <p>Installing this web application as a progressive web app is not supported in this browser or the app is already installed.</p>
        }
    });

    return (
        <>
            {disabledText()}
            <button
                disabled={buttonData().disabled}
                onclick={() => { buttonData().onclick?.() }}
            >
                Install This App
            </button>
            <button onclick={() => { window.location.reload(); }}>
                Reload This App
            </button>
        </>
    );
}