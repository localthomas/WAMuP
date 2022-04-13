/**
 * Displays a simple spinner with the size of typical text.
 */
export default function LoadingSpinnerSmall() {
    return (
        <span style={`
position: relative;
pointer-events: none;
opacity: 0.5;
&:after {
    @include loader;
    position: absolute;
    top: calc(50% - 0.5rem);
    left: calc(50% - 0.5rem);
    width: 1rem;
    height: 1rem;
    border-width: 0.25rem;
}
        `}>&nbsp;&nbsp;</span>
    );
}