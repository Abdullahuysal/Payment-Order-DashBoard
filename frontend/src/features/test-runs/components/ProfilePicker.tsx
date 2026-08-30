import type { ReactNode } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import type { Profile } from '../types';
import { LoadingLines } from './kit';

interface ProfilePickerProps {
  profiles: Profile[];
  selectedId?: string | undefined;
  onSelect: (id: string | undefined) => void;
  onNew: () => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  loading?: boolean | undefined;
}

export function ProfilePicker({
  profiles,
  selectedId,
  onSelect,
  onNew,
  onEdit,
  onDelete,
  loading,
}: ProfilePickerProps) {
  if (loading) return <LoadingLines rows={3} />;

  return (
    <div className="space-y-2">
      <Row
        active={selectedId == null}
        onClick={() => onSelect(undefined)}
        title="Profilsiz"
        subtitle="Alanları elle doldur"
      />

      {profiles.map((profile) => (
        <Row
          key={profile.id}
          active={profile.id === selectedId}
          onClick={() => onSelect(profile.id)}
          title={profile.name}
          subtitle={`güncellendi ${formatRelative(profile.updatedAt)}`}
          actions={
            <>
              <IconAction label="Profili düzenle" onClick={() => onEdit(profile)}>
                <Pencil size={13} />
              </IconAction>
              <IconAction label="Profili sil" onClick={() => onDelete(profile)}>
                <Trash2 size={13} />
              </IconAction>
            </>
          }
        />
      ))}

      <Button size="sm" variant="ghost" onClick={onNew}>
        <Plus size={13} />
        Yeni profil
      </Button>
    </div>
  );
}

function Row({
  active,
  onClick,
  title,
  subtitle,
  actions,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
        active
          ? 'border-border-strong bg-surface-2'
          : 'border-border bg-surface hover:border-border-strong',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            'h-3.5 w-3.5 shrink-0 rounded-full border',
            active ? 'border-primary bg-primary' : 'border-border-strong',
          )}
        />
        <span className="min-w-0">
          <span className="block truncate text-sm text-fg">{title}</span>
          <span className="block truncate text-[11px] text-fg-subtle">{subtitle}</span>
        </span>
      </button>
      {actions && <span className="flex shrink-0 items-center gap-0.5">{actions}</span>}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded p-1.5 text-fg-subtle hover:bg-surface hover:text-fg"
    >
      {children}
    </button>
  );
}
