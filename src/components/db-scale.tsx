export default function DbScale(props: {
    minDb: number;
    maxDb: number;
    value: number;
}) {
    // TODO replace with progress bar?
    return (
        <div class="db-scale">
            <div class="db-scale-bar" style={{
                "width": (1 - (props.value / props.minDb)) * 100 + "%"
            }}></div>
            <div class="db-scale-text">
                {props.value.toFixed(1)}
            </div>
        </div>
    );
}
