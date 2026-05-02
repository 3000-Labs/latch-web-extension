import React from "react"

import { LatchRoot } from "./LatchRoot"

export function LatchApp({ surface }: { surface: "popup" | "sidepanel" }) {
  return <LatchRoot surface={surface} />
}
