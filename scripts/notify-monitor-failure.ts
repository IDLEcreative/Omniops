import { sendAlert } from '../lib/alerts/notify';

async function main() {
  const workflow = process.env.GITHUB_WORKFLOW ?? 'Nightly Telemetry & GDPR Validation';
  const job = process.env.GITHUB_JOB ?? 'nightly';
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const attempt = process.env.GITHUB_RUN_ATTEMPT;
  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';

  let runUrl: string | undefined;
  if (repo && runId) {
    runUrl = `${serverUrl}/${repo}/actions/runs/${runId}`;
  }

  const details = `GitHub Actions detected a failure in workflow "${workflow}" (job "${job}").`;

  await sendAlert({
    title: 'Nightly telemetry/GDPR workflow failed',
    message: details,
    severity: 'error',
    context: {
      repository: repo ?? 'n/a',
      runUrl: runUrl ?? 'n/a',
      attempt: attempt ?? '1',
    },
  });
}

main().catch((error) => {
  console.error('Failed to dispatch failure notification alert:', error);
  process.exit(1);
});
