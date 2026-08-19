import { reportStartupFailure, runDesktopApp } from "./bootstrap.mjs";

void runDesktopApp().catch(reportStartupFailure);
