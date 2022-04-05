import { NavLink } from "solid-app-router";

export default function Navigation() {
    return (
        <nav>
            <NavLink href="/" end>Start</NavLink>
            <NavLink href="/artists">Artists</NavLink>
            <NavLink href="/albums">Albums</NavLink>
            <NavLink href="/queue">Queue</NavLink>
            <NavLink href="/visualizer">Visualizer</NavLink>
        </nav>
    );
}