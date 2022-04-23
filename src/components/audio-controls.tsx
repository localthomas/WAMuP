import { createMemo } from "solid-js";
import { secondsToString } from "../miscellaneous/time-conversion";
import ReactiveAudioSession from "../player/reactive-audio-session";
import { NextTrackBtn, PauseBtn, PlayBtn, StopBtn } from "./icon-btns";

export function AudioControls(props: {
    audioSession: ReactiveAudioSession;
}) {
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

    const disabled = createMemo(() => props.audioSession.getAudioState()().assetID !== "" ? false : true);

    const currentTimeAsString = createMemo(() =>
        secondsToString(props.audioSession.getAudioState()().currentTime)
    );
    const durationAsString = createMemo(() =>
        secondsToString(props.audioSession.getAudioState()().duration)
    );

    return (
        <div class="audio-controls">
            {props.audioSession.getAudioState()().isPlaying ?
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
            <progress max={props.audioSession.getAudioState()().duration} value={props.audioSession.getAudioState()().currentTime}
                onClick={(event: any) => {
                    // calculate the relative x position of the users click to the progress-bar
                    const offset = getGlobalOffsetLeft(event.target);
                    const x = event.pageX - offset;
                    const clickedValue = x * event.target.max / event.target.offsetWidth;
                    seek(clickedValue);
                }}></progress>
            <div class="time-display">
                {currentTimeAsString()} / {durationAsString()}
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
