import React from "react"

import { LatchRoot } from "./LatchRoot"

export function LatchAppPopup({ surface }: { surface: "popup" | "sidepanel" }) {
  return <LatchRoot surface={surface} />
}
