/// No automatic provider retries.
///
/// Riverpod 3 retries a failed provider by default — up to ten times with
/// exponential backoff — and keeps the state `loading` while it does. For this
/// app that is wrong in three ways:
///
/// 1. **It hides failures.** A screen shows a loading skeleton for ten seconds
///    and then an error, so "broken" is indistinguishable from "slow".
/// 2. **It retries things that cannot succeed.** A 404 for an uncovered ticker
///    and a response we could not parse are permanent; retrying them ten times
///    just multiplies API calls.
/// 3. **Failures here are already values.** Every repository returns a typed
///    `Failure`, every screen renders it, and retryable ones get an explicit
///    "Try again" button. That is a decision for the user, not a hidden loop.
///
/// Found the hard way: without this, a `NetworkFailure` never reached the error
/// state in a widget test — the provider sat in `AsyncLoading` carrying the error
/// while the retry timer counted down.
/// Pass as `ProviderScope(retry: noAutomaticRetry, ...)` — every entry point and
/// every widget test does, so tests exercise the same behaviour as the app.
Duration? noAutomaticRetry(int retryCount, Object error) => null;
