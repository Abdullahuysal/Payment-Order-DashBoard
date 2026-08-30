import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Play } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Button, Card, CardBody, CardHeader, CardTitle, Drawer } from '@/components/ui';
import { ENV_LABELS } from '@/services/config';

import { BulkControls } from './components/BulkControls';
import { ErrorHint, LoadingLines, ProdDisabledNotice } from './components/kit';
import { KindBadge } from './components/KindBadge';
import { ProfileForm } from './components/ProfileForm';
import { ProfilePicker } from './components/ProfilePicker';
import { ScenarioInputForm } from './components/ScenarioInputForm';
import { StepTimeline } from './components/StepTimeline';
import {
  useDeleteProfile,
  useProfiles,
  useSaveProfile,
  useScenario,
  useStartRun,
} from './hooks/useTestRuns';
import {
  DEFAULT_BULK_LIMITS,
  defaultInputValues,
  isEnvSupported,
  parsePrefillFromSearch,
  validateInputs,
} from './lib';
import type { InputField, Profile, RepeatConfig } from './types';

type DrawerState = { mode: 'new' } | { mode: 'edit'; profile: Profile } | null;

function pickKnownValues(
  fields: readonly InputField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const names = new Set(fields.map((field) => field.name));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (names.has(key)) out[key] = value;
  }
  return out;
}

export default function ScenarioPage() {
  const { key } = useParams();
  const env = useAppStore((s) => s.environment);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const scenarioQuery = useScenario(key);
  const scenario = scenarioQuery.data;
  const scenarioId = scenario?.id ?? '';

  const profilesQuery = useProfiles(scenario?.id);
  const startRun = useStartRun();
  const saveProfile = useSaveProfile(scenarioId);
  const deleteProfile = useDeleteProfile(scenarioId);

  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [repeat, setRepeat] = useState<RepeatConfig | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const preselectProfile = searchParams.get('profile');
  const search = searchParams.toString();

  const appliedPreselect = useRef(false);
  useEffect(() => {
    if (appliedPreselect.current || !profilesQuery.data) return;
    if (preselectProfile && profilesQuery.data.some((p) => p.id === preselectProfile)) {
      setSelectedProfileId(preselectProfile);
    }
    appliedPreselect.current = true;
  }, [profilesQuery.data, preselectProfile]);

  const selectedProfile = useMemo(
    () => profilesQuery.data?.find((p) => p.id === selectedProfileId),
    [profilesQuery.data, selectedProfileId],
  );

  useEffect(() => {
    if (!scenario) return;
    setValues({
      ...defaultInputValues(scenario.inputs),
      ...(selectedProfile ? pickKnownValues(scenario.inputs, selectedProfile.values) : {}),
      ...parsePrefillFromSearch(scenario.inputs, `?${search}`),
    });
    setErrors({});
  }, [scenario, selectedProfile, search]);

  const limits = scenario?.bulk ?? DEFAULT_BULK_LIMITS;

  const start = () => {
    if (!scenario) return;
    const validation = validateInputs(scenario.inputs, values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setSubmitError(null);
    startRun.mutate(
      {
        scenarioId: scenario.id,
        ...(selectedProfileId ? { profileId: selectedProfileId } : {}),
        runParams: values,
        ...(repeat ? { repeat } : {}),
      },
      {
        onSuccess: (result) => navigate(`/test-runs/runs/${result.runId}`),
        onError: (error) => setSubmitError(error),
      },
    );
  };

  const removeProfile = (profile: Profile) => {
    if (!window.confirm(`“${profile.name}” profili silinsin mi?`)) return;
    deleteProfile.mutate(profile.id, {
      onSuccess: () => {
        if (selectedProfileId === profile.id) setSelectedProfileId(undefined);
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <Link to="/test-runs" className="hover:text-fg-muted">
          Test Koşumları
        </Link>
        <span>/</span>
        <span className="text-fg-muted">{scenario?.name ?? key}</span>
      </div>

      {scenarioQuery.isLoading ? (
        <div className="mt-6">
          <LoadingLines rows={5} />
        </div>
      ) : scenarioQuery.isError ? (
        <div className="mt-6">
          <ErrorHint error={scenarioQuery.error} onRetry={() => void scenarioQuery.refetch()} />
        </div>
      ) : !scenario ? null : !isEnvSupported(env) ? (
        <>
          <h1 className="mt-2 text-lg font-semibold text-fg">{scenario.name}</h1>
          <ProdDisabledNotice />
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-lg font-semibold text-fg">{scenario.name}</h1>
            <KindBadge kind={scenario.kind} />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{scenario.description}</p>

          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <span className="text-[11px] text-fg-subtle">ortam {ENV_LABELS[env]}</span>
              </CardHeader>
              <CardBody>
                <ProfilePicker
                  profiles={profilesQuery.data ?? []}
                  loading={profilesQuery.isLoading}
                  selectedId={selectedProfileId}
                  onSelect={setSelectedProfileId}
                  onNew={() => setDrawer({ mode: 'new' })}
                  onEdit={(profile) => setDrawer({ mode: 'edit', profile })}
                  onDelete={removeProfile}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parametreler</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <ScenarioInputForm
                  fields={scenario.inputs}
                  value={values}
                  onChange={setValues}
                  errors={errors}
                  disabled={startRun.isPending}
                />

                <BulkControls
                  limits={limits}
                  value={repeat}
                  onChange={setRepeat}
                  disabled={startRun.isPending}
                />

                {submitError != null && <ErrorHint error={submitError} />}

                <div className="flex items-center justify-end">
                  <Button variant="primary" onClick={start} disabled={startRun.isPending}>
                    <Play size={13} />
                    {startRun.isPending ? 'Başlatılıyor…' : 'Koşumu başlat'}
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planlanan akış</CardTitle>
                <span className="text-[11px] text-fg-subtle">{scenario.steps.length} adım</span>
              </CardHeader>
              <CardBody>
                <StepTimeline steps={scenario.steps} />
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {drawer && scenario && (
        <Drawer
          open
          onClose={() => setDrawer(null)}
          width="lg"
          title={drawer.mode === 'new' ? 'Yeni profil' : 'Profili düzenle'}
          subtitle={scenario.name}
        >
          <ProfileForm
            scenario={scenario}
            profile={drawer.mode === 'edit' ? drawer.profile : undefined}
            environmentLabel={ENV_LABELS[env]}
            pending={saveProfile.isPending}
            error={saveProfile.error}
            onCancel={() => setDrawer(null)}
            onSubmit={(input) =>
              saveProfile.mutate(
                {
                  input,
                  profileId: drawer.mode === 'edit' ? drawer.profile.id : undefined,
                },
                {
                  onSuccess: (saved) => {
                    setSelectedProfileId(saved.id);
                    setDrawer(null);
                  },
                },
              )
            }
          />
        </Drawer>
      )}
    </div>
  );
}
