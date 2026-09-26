# POLIS artifacts

Keep the durable POLIS records for this repository under `.polis/`:

| Record | Repository path |
| --- | --- |
| Project Policy | `.polis/policy.json` |
| Draft and locked Change Contracts | `.polis/contracts/` |
| Contract-bound implementation plans and policy plans | `.polis/plans/` |
| Red proofs and delivery packages | `.polis/artifacts/<change>/` |

Retain the exact contract, plan, regression proof, and `.polis` package used for each change. Do not use a global POLIS cache or another project directory as the durable copy.

## POLIS 6.8.1 producer path constraint

The installed POLIS 6.8.1 producer commands require their policy, contract, plan, proof, and build output outside the target worktree while they run. Use a task-scoped temporary directory for those inputs and outputs, then copy the validated records byte-for-byte into the repository paths above. Keep temporary producer files out of `.polis/` until `capture-red` completes, because that command captures the target worktree delta.

Initialize the configured Vitest gate with:

```bash
polis init --repo . --profile custom --validation-level standard \
  --test-argv npm --test-argv run --test-argv test
```

POLIS runs the configured complete Vitest suite as its project and contract behavior gate. Run `npm run verify` in the repository checkout as the repository-wide validation command; it includes lint, type checking, tests, and the production build.
