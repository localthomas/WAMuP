import { createSignal, onMount } from "solid-js";
import { secondsToString } from "../miscellaneous/time-conversion";
import AudioPlayer from "../player/audio-player";
import { NextTrackBtn, PauseBtn, PlayBtn, StopBtn } from "./icon-btns";

export function AudioControls(props: {
    player: AudioPlayer;
    onNextTrack: () => void;
}) {
    const [audioState, setAudioState] = createSignal({
        currentTime: 0,
        duration: 0,
    });

    function setPlaying(play: boolean) {
        props.player.setPlaying(play);
    }

    function seek(time: number) {
        props.player.seek(time);
    }

    function stop() {
        props.player.setPlaying(false);
        props.player.seek(0);
    }

    onMount(() => {
        props.player.addTimeUpdateListener(newTime => {
            setAudioState({ ...audioState(), currentTime: newTime });
        });
        props.player.addDurationUpdateListener(newDuration => {
            setAudioState({ ...audioState(), duration: newDuration });
        });
        props.player.addOnEndedListener(() => {
            props.onNextTrack();
        });

        document.onkeydown = event => {
            //32 = Space
            if (event.keyCode === 32) {
                setPlaying(props.player.isPaused());
            }
        }
    });

    const disabled = props.player.getCurrentAsset() ? false : true;

    return (
        <div class="columns is-vcentered">
            {props.player.isPaused() ?
                <PlayBtn disabled={disabled}
                    onClick={() => {
                        setPlaying(true);
                    }} />
                :
                <PauseBtn disabled={disabled}
                    onClick={() => {
                        setPlaying(false);
                    }} />
            }
            <StopBtn disabled={disabled}
                onClick={() => {
                    stop();
                }} />
            <progress class="time-slider mx-2" max={audioState().duration} value={audioState().currentTime}
                onClick={(event: any) => {
                    // calculate the relative x position of the users click to the progress-bar
                    const offset = getGlobalOffsetLeft(event.target);
                    const x = event.pageX - offset;
                    const clickedValue = x * event.target.max / event.target.offsetWidth;
                    seek(clickedValue);
                }}></progress>
            <div style={{ "whiteSpace": "nowrap" }} class="mr-2">
                {secondsToString(audioState().currentTime)} / {secondsToString(audioState().duration)}
            </div>
            <NextTrackBtn disabled={disabled}
                onClick={() => {
                    props.onNextTrack();
                }} />
        </div >
    );
}

function getGlobalOffsetLeft(element: HTMLElement): number {
    let offset = 0;
    //go through all the offset-parents and add up the offset
    let current: any = element;
    do {
        offset += current.offsetLeft;
        current = current.offsetParent;
    } while (current.offsetParent)
    return offset;
}
