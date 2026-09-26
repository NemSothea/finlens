# finlens_mobile

Flutter client for finlens. It consumes the same JSON API the web app renders
from (`PLAN.md` §9) and adds no backend of its own.

**Status: M2 (core) complete** — M1's skeleton plus the Dio client, `Result`/
`Failure`, generated DTOs for the §9 responses, Riverpod wiring, and a search
screen running on live API data with all four states. The company screen, charts
and compare land in M3.

## Run

```bash
flutter run -t lib/main_dev.dart                       # dev: http://localhost:3001
flutter run -t lib/main_dev.dart \
  --dart-define=FINLENS_API_BASE_URL=http://192.168.1.8:3001   # physical phone
flutter run -t lib/main_prod.dart                      # prod: https://finlens.app

flutter test
flutter analyze
dart run build_runner build     # after touching a freezed/riverpod annotated file
```

Deterministic way to see live data without typing on a simulator:

```bash
flutter run -t lib/main_dev.dart --route "/?q=a"
```

`localhost` on a handset is the handset. A physical device needs the laptop's LAN
address via `--dart-define`; the Android emulator reaches the host as `10.0.2.2`.

The web app must be running for M2 onward: `npm run dev -- -p 3001` in the repo root.

## Deep links

Scheme `finlens://`, registered in `ios/Runner/Info.plist` and
`android/app/src/main/AndroidManifest.xml`, with Flutter's own deep-link handling
enabled on both so `go_router` receives the path.

```bash
xcrun simctl openurl booted "finlens://stocks/NVDA"     # iOS simulator
xcrun simctl openurl booted "finlens://?q=AAPL"         # opens already searching
adb shell am start -a android.intent.action.VIEW -d "finlens://watchlist"
```

The OS delivers the **whole URI**, not a path — `finlens://stocks/NVDA` parses
with host `stocks` and path `/NVDA`, which matches no route. `normaliseDeepLink`
in `lib/src/router/app_router.dart` folds the authority back into the path, and
refuses to rewrite links to hosts that are not ours. Verified app links
(`https://finlens.app/...`) are normalised by the same function; the domain
association files ship with the store builds in M5.

## Layout

```
lib/main.dart                    runApp only
lib/main_dev.dart                dev entry point
lib/main_prod.dart               prod entry point
lib/src/app.dart                 MaterialApp.router, theme, ConfigScope
lib/src/router/app_router.dart   every path, one file, plus link normalisation
lib/src/core/config/             AppConfig (flavor + base URL), ConfigScope
lib/src/core/theme/              Material 3 theme, both brightnesses from one seed
lib/src/features/<f>/            domain / data / application / presentation
```

## M2 shape

```
core/domain/result.dart      Result<T> = Success | Failed — errors are values
core/domain/failure.dart     sealed Failure: network/timeout/server/404/400/401/402/parse
core/network/api_client.dart one Dio instance: base URL, timeouts, dev logging
core/network/api_failures.dart  DioException + status code → Failure. Platform errors die here
core/retry_policy.dart       Riverpod 3 auto-retry switched OFF — see the file for why
core/presentation/           FailureView (per-variant copy), loading skeleton
features/<f>/domain          entities + abstract repository
features/<f>/data            DTOs (freezed + json_serializable) + Dio repository
features/<f>/application     service (Six Rules) + Riverpod providers
```

Repository tests stub Dio's `HttpClientAdapter`; DTO tests parse **real captured
payloads** in `test/fixtures/`, refreshed by curling a running `next dev`.

## Rules this client holds to

- **No valuation math in Dart.** DCF stays server-side. Two implementations of one
  formula diverge, and the divergence shows up as two different fair values for
  one company.
- **No vendor calls.** The app talks to the finlens API only, same as the web.
- **Errors are values.** Repositories return `Result<T>`; `DioException` dies in
  `data/` (M2).
- **Four states, always.** Loading, error, empty, data — empty is its own widget
  with a next action, not a special case of data.
- **go_router only.** `grep -r 'Navigator.push' lib/` must stay empty, or deep
  links, auth guards and route tests all break.
- **`StatefulWidget` for controllers only**, disposed in `State.dispose()`.
  Business state lives in a Notifier from M2.
- **No automatic retries.** A failure renders as a typed error with an explicit
  "Try again" where retrying can help. Riverpod 3 would otherwise retry ten times
  with backoff while the screen shows a skeleton — failures invisible, API calls
  multiplied.
- **Colours come from `Theme.of(context).colorScheme`.** A hardcoded colour
  survives a theme switch — that is how the M1 dark-mode bug shipped: pinning
  Material's light typography made every body string black on a dark surface.
