/// Build-time configuration.
///
/// One object, resolved once at startup, passed down explicitly. The base URL is
/// the only thing that separates dev from prod today, and it must never be read
/// from a widget: a screen that knows which environment it is in will eventually
/// branch on it, and that branch will ship to production untested.
enum Flavor { dev, prod }

class AppConfig {
  const AppConfig({
    required this.flavor,
    required this.apiBaseUrl,
    required this.appName,
  });

  final Flavor flavor;

  /// Root of the finlens JSON API — the same routes the web app renders from.
  /// No vendor host ever appears here; the app talks to our API only.
  final String apiBaseUrl;

  /// Shown in the app bar so a tester can never mistake dev data for real data.
  final String appName;

  bool get isDev => flavor == Flavor.dev;

  /// `--dart-define=FINLENS_API_BASE_URL=...` wins when set, so CI, a staging
  /// deploy or a phone pointed at a laptop needs no code change. The default is
  /// the dev value, never the production one: a forgotten flag must fail loudly
  /// against a dev server, not silently write to production.
  static const String _override = String.fromEnvironment(
    'FINLENS_API_BASE_URL',
  );

  factory AppConfig.dev() => AppConfig(
    flavor: Flavor.dev,
    apiBaseUrl: _override.isEmpty ? devDefaultBaseUrl : _override,
    appName: 'finlens dev',
  );

  factory AppConfig.prod() => AppConfig(
    flavor: Flavor.prod,
    apiBaseUrl: _override.isEmpty ? prodDefaultBaseUrl : _override,
    appName: 'finlens',
  );

  /// The web app runs on 3001 locally (3000 is taken by another project).
  /// `10.0.2.2` is the host loopback as seen from the Android emulator;
  /// `localhost` works on an iOS simulator. A physical phone needs the
  /// dart-define with the laptop's LAN address.
  static const String devDefaultBaseUrl = 'http://localhost:3001';
  static const String prodDefaultBaseUrl = 'https://finlens.app';
}
