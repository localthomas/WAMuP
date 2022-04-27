import { Accessor, createMemo, createSignal, Signal } from "solid-js";

/**
 * Holds state and information about the current status of this progressive web app (PWA).
 * There should be only one manager instance.
 */
export default class PWAManager {
    private static instance: PWAManager = new PWAManager();
    private deferredPrompt: Signal<BeforeInstallPromptEvent | undefined> = createSignal(undefined);

    /**
     * Get a reference to the current instance of this class.
     * @returns the reference to the current instance
     */
    public static getInstance(): PWAManager {
        return this.instance;
    }

    private constructor() {
        window.addEventListener('beforeinstallprompt', ((event: any) => {
            this.setDeferredPromptFromEvent(event as BeforeInstallPromptEvent);
        }).bind(this));
    }

    private setDeferredPromptFromEvent(event: BeforeInstallPromptEvent) {
        // Prevent the mini-infobar from appearing on mobile
        event.preventDefault();
        // Stash the event so it can be triggered later.
        this.deferredPrompt[1](event);
        // Optionally, send analytics event that PWA install promo was shown.
        console.debug("'beforeinstallprompt' event was fired", event);
    }

    /**
     * Test if a call to `promptForPWAInstall` is possible in this browser context.
     * Note that this state might change over time, so it returns an accessor.
     * @returns true, if the prompt can be shown
     */
    public readyForPrompt(): Accessor<boolean> {
        return createMemo(() => {
            const prompt = this.deferredPrompt[0]();
            return prompt ? true : false;
        });
    }

    /**
     * Try to prompt the user for installation as PWA app.
     * Note: this throws an error, if this action is not supported by the browser.
     */
    public async promptForPWAInstall() {
        const deferredPrompt = this.deferredPrompt[0]();
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.debug(`User response to the install prompt: ${outcome}`);
        } else {
            throw "Could not prompt user for PWA install, because no deferred prompt was created. Does the browser support PWA install?";
        }
    }
}