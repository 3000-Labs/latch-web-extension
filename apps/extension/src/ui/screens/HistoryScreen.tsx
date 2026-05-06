import React, { useMemo, useState } from "react"
import { ChevronLeft } from "lucide-react"

import { FilterChip } from "../components/FilterChip"
import { SearchInput } from "../components/SearchInput"
import { SectionCard } from "../components/SectionCard"
import type { HistoryKind } from "../mock/wallet"
import { mockHistoryBySection } from "../mock/wallet"

type Filter = "all" | HistoryKind

export function HistoryScreen({
  onBack
}: {
  onBack: () => void
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const view = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sections = mockHistoryBySection
      .map((s) => {
        const items = s.items.filter((it) => {
          const okFilter = filter === "all" ? true : it.kind === filter
          const okQuery = q.length === 0 ? true : it.asset.toLowerCase().includes(q)
          return okFilter && okQuery
        })
        return { ...s, items }
      })
      .filter((s) => s.items.length > 0)

    return sections
  }, [query, filter])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/40 text-fg/80 hover:bg-surface/60"
          aria-label="Back"
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <div className="text-base font-extrabold">History</div>
        <div className="w-9" />
      </div>

      <div className="mt-5">
        <SearchInput value={query} onChange={setQuery} placeholder="Search for transactions ..." />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterChip>
        <FilterChip active={filter === "sent"} onClick={() => setFilter("sent")}>
          Sent
        </FilterChip>
        <FilterChip active={filter === "received"} onClick={() => setFilter("received")}>
          Received
        </FilterChip>
        <FilterChip active={filter === "deposit"} onClick={() => setFilter("deposit")}>
          Deposit
        </FilterChip>
        <FilterChip active={filter === "swap"} onClick={() => setFilter("swap")}>
          Swaps
        </FilterChip>
      </div>

      <div className="mt-5 min-h-0 flex-1 space-y-6 overflow-auto pb-1">
        {view.length === 0 ? (
          <SectionCard className="text-center text-sm font-bold text-muted">
            No transactions match your filters.
          </SectionCard>
        ) : (
          view.map((section) => (
            <div key={section.title}>
              <div className="text-xs font-extrabold text-muted">{section.title}</div>
              <div className="mt-3 space-y-3">
                {section.items.map((it) => (
                  <button
                    key={it.id}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/40 px-4 py-4 text-left hover:bg-surface/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-surface/80">
                        <span className="text-sm font-extrabold text-fg/90">
                          {it.asset.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-extrabold">{it.asset}</div>
                        <div className="text-xs font-bold text-muted">
                          {it.status === "pending" ? "Pending Transaction" : "Completed"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold">{it.amountUsd}</div>
                      <div className="text-xs font-bold text-muted">{it.timeLabel}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
