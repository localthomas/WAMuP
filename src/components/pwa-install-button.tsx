import { createMemo } from "solid-js";
import PWAManager from "../miscellaneous/pwa";

export default function PWAInstallButton() {
    const pwaManager = PWAManager.getInstance();

    const buttonClass = "pwa-install";
    const buttonText = "Install This App";

    const buttonData = createMemo(() => {
        if (pwaManager.readyForPrompt()()) {
            return {
                text: buttonText,
                disabled: false,
                onclick: () => { pwaManager.promptForPWAInstall() },
            };
        } else {
            return {
                text: `${buttonText} (not supported in this browser)`,
                disabled: true,
            }
        }
    });

    return (
        <button class={buttonClass}
            disabled={buttonData().disabled}
            onclick={() => { buttonData().onclick?.() }}
        >
            {buttonData().text}
        </button>
    );
}