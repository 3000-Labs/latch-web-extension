import React from 'react'
import { Plus } from 'lucide-react'

import { PermissionsEmptyState } from './PermissionsEmptyState'
import { PermissionsPopulatedState } from './PermissionsPopulatedState'
import { SettingsScreenHeader } from './SettingsScreenHeader'
import type { SessionKeyPermission } from './permissions/types'

export function PermissionsScreen({
  onBack,
  onAdd,
  sessions,
}: {
  onBack: () => void
  onAdd: () => void
  sessions: SessionKeyPermission[]
}) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
      <SettingsScreenHeader
        title="Permissions"
        onBack={onBack}
        rightAction={
          <button
            type="button"
            onClick={onAdd}
            className="flex size-5 shrink-0 items-center justify-center"
            aria-label="Add permission"
          >
            <Plus className="size-5 text-[#cdcdcd]" strokeWidth={1.5} />
          </button>
        }
      />

      {sessions.length === 0 ? (
        <PermissionsEmptyState />
      ) : (
        <PermissionsPopulatedState session={sessions[0]} />
      )}
    </div>
  )
}
