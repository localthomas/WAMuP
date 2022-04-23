import { Accessor, createEffect, createMemo, JSXElement } from "solid-js";

export default function DbScale(props: {
    label: {
        left: JSXElement;
        right: JSXElement;
    };
    minDb: number;
    maxDb: number;
    value: number;
}) {
    const valueAsString = createMemo(() =>
        props.value.toFixed(1)
    );
    const valueAsPercentOf100 = createMemo(() =>
        // note that the percent value should not be negative
        Math.max(0, (1 - (props.value / props.minDb)) * 100)
    );

    // the progress bar is not used, as it does not allow proper text placement on top
    return (
        <>
            <div class="db-scale-label">
                <div>
                    {props.label.left}
                </div>
                <div>
                    {props.label.right}
                </div>
            </div>
            <div class="db-scale">
                <div class="db-scale-bar" style={{
                    "width": valueAsPercentOf100() + "%"
                }}></div>
                <div class="db-scale-text">
                    {valueAsString()}
                </div>
            </div>
        </>
    );
}
