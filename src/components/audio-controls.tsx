import { createMemo, createSignal } from "solid-js";
import { secondsToString } from "../miscellaneous/time-conversion";
import { AudioPlayerState } from "../player/audio-player";
import { AudioSession } from "../player/audio-session";
import { NextTrackBtn, PauseBtn, PlayBtn, StopBtn } from "./icon-btns";

export function AudioControls(props: {
    audioSession: AudioSession;
}) {
    const [audioState, setAudioState] = createSignal<AudioPlayerState>(props.audioSession.getPlayerState());
    props.audioSession.addOnStateChangeListener((newState) => setAudioState(newState));

    const setPlaying = (play: boolean) => {
        props.audioSession.setNewPlayerState({
            isPlaying: play
        });
    };

    function seek(time: number) {
        props.audioSession.setNewPlayerState({
            currentTime: time
        });
    }

    function stop() {
        props.audioSession.setNewPlayerState({
            isPlaying: false,
            currentTime: 0,
        });
    }

    const disabled = createMemo(() => audioState().assetID !== "" ? false : true);

    return (
        <div class="columns is-vcentered">
            {audioState().isPlaying ?
                <PauseBtn disabled={disabled()}
                    onClick={() => {
                        setPlaying(false);
                    }} />
                :
                <PlayBtn disabled={disabled()}
                    onClick={() => {
                        setPlaying(true);
                    }} />
            }
            <StopBtn disabled={disabled()}
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
            <NextTrackBtn disabled={disabled()}
                onClick={() => {
                    props.audioSession.nextTrack();
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
