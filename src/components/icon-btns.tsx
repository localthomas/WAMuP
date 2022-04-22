//Icons used from Google Material Icons (https://material.io/icons/) (<svg>) with Apache 2.0 License and changes to the size

import { Component, JSX } from "solid-js";

type IconBtnProps = {
    /**
     * True if the button should be displayed as disabled.
     */
    disabled?: boolean;
    /**
     * True if the button should be displayed with an outline instead of a full color fill.
     */
    outlined?: boolean;
    /**
     * True if the button should be displayed with the icon only and without any button styling.
     */
    small?: boolean;
    /**
     * Callback for an action taking place when the button is pressed.
     */
    onClick: () => void;
}

const IconBtn: Component<IconBtnProps> = (props) => {
    return (
        <button class={"is-svg-btn " + (props.outlined ? "is-outlined " : "") + (props.small ? "small" : "")}
            disabled={props.disabled}
            onClick={() => {
                props.onClick();
            }}>
            {props.children}
        </button>
    );
}

export function PlayBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <PlayIcon viewBox="0 0 24 24" fill="black" width="2em" height="2em" />
        </IconBtn>
    );
}

export function PauseBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="2em" height="2em">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
        </IconBtn>
    );
}

export function StopBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="2em" height="2em">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M6 6h12v12H6z" />
            </svg>
        </IconBtn>
    );
}

export function PlusBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <PlusIcon viewBox="0 0 24 24" fill="black" width="2em" height="2em" />
        </IconBtn>
    );
}

export function MinusBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <MinusIcon viewBox="0 0 24 24" fill="black" width="2em" height="2em" />
        </IconBtn>
    );
}

export function NextTrackBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="2em" height="2em">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
        </IconBtn>
    );
}

export function InfoBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="2em" height="2em">
                <path d="m 11,6.9999998 h 2 v 2 h -2 z" />
                <path d="m 11,11 v 6 h 2 v -6 z" />
            </svg>
        </IconBtn>
    );
}

export function CrossBtn(props: IconBtnProps) {
    return (
        <IconBtn {...props}>
            <CrossIcon viewBox="0 0 24 24" fill="black" width="2em" height="2em" />
        </IconBtn>
    );
}

function PlayIcon(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function PlusIcon(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
    );
}

function MinusIcon(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M19 13H5v-2h14v2z" />
        </svg>
    );
}

function CrossIcon(props: JSX.IntrinsicElements["svg"]) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
    );
}
