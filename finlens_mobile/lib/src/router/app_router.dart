import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/search/presentation/search_screen.dart';
import '../features/stock_detail/presentation/stock_detail_screen.dart';
import '../features/watchlist/presentation/watchlist_screen.dart';

/// One router, one file.
///
/// Every path is a constant here, and every navigation goes through go_router.
/// A `Navigator.push(MaterialPageRoute(...))` anywhere else would cost the three
/// things this app needs from routing: deep links, an auth redirect guard
/// (M4), and routes that can be tested without pumping a whole screen.
class AppRouter {
  const AppRouter._();

  static const String searchPath = '/';
  static const String watchlistPath = '/watchlist';

  /// Query parameter carrying a pre-filled search — `/?q=AAPL`. A search is
  /// worth linking to: shared links, and the notification taps that land in M5,
  /// both want to open the app already looking at something.
  static const String searchQueryParam = 'q';

  static String searchPathFor(String query) => query.trim().isEmpty
      ? searchPath
      : '/?$searchQueryParam=${Uri.encodeQueryComponent(query.trim())}';

  /// Templates keep `:symbol` in exactly one place. Callers use the builder
  /// below instead of composing strings.
  static const String stockDetailPath = '/stocks/:symbol';

  static String stockDetailPathFor(String symbol) =>
      '/stocks/${Uri.encodeComponent(symbol.toUpperCase())}';

  /// [initialLocation] exists so a test can start the app where the OS would
  /// hand it a deep link, before any screen has been built. Production callers
  /// leave it at the default.
  static GoRouter build({String initialLocation = searchPath}) => GoRouter(
    initialLocation: initialLocation,
    // Named debugging aid only; navigation uses the paths above.
    debugLogDiagnostics: false,
    // Deep links do NOT arrive as bare paths. The OS hands the app the whole
    // URI — `finlens://stocks/NVDA` — and go_router matches that string
    // against its route patterns, so every custom-scheme link lands on the
    // 404 screen unless it is normalised first. Found on a simulator, not in
    // a unit test: the widget tests all started from a path.
    redirect: (context, state) => normaliseDeepLink(state.uri.toString()),
    routes: <RouteBase>[
      GoRoute(
        path: searchPath,
        name: 'search',
        builder: (context, state) => SearchScreen(
          initialQuery: state.uri.queryParameters[searchQueryParam] ?? '',
        ),
      ),
      GoRoute(
        path: stockDetailPath,
        name: 'stockDetail',
        builder: (context, state) {
          // A symbol is the whole point of this route, so a missing one is
          // a routing error, not a screen that renders empty. `redirect`
          // below turns it into the 404 rather than letting a blank detail
          // page pretend the ticker exists.
          final symbol = state.pathParameters['symbol']!;
          return StockDetailScreen(symbol: symbol.toUpperCase());
        },
        redirect: (context, state) {
          final symbol = state.pathParameters['symbol'];
          return (symbol == null || symbol.trim().isEmpty) ? searchPath : null;
        },
      ),
      GoRoute(
        path: watchlistPath,
        name: 'watchlist',
        builder: (context, state) => const WatchlistScreen(),
      ),
    ],
    errorBuilder: (context, state) =>
        RouteNotFoundScreen(location: state.uri.toString()),
  );
}

/// Hosts whose `https://` links belong to this app. Verified app links ship in
/// M5; the list exists now so the normalisation rule has one home.
const Set<String> _webHosts = {'finlens.app', 'www.finlens.app'};

/// Custom scheme registered on both platforms.
const String _appScheme = 'finlens';

/// Turn an incoming link into an in-app path, or null when it already is one.
///
/// Pure and tested, because the failure mode is silent: a link that does not
/// normalise renders the 404 screen, which looks like a broken app rather than a
/// broken URL.
///
/// `finlens://stocks/NVDA` parses with host `stocks` and path `/NVDA`, so the
/// host has to be folded back into the path. `finlens:///stocks/NVDA` (three
/// slashes, empty authority) already carries the full path and must not be
/// doubled.
String? normaliseDeepLink(String location) {
  final uri = Uri.tryParse(location);
  if (uri == null) return null;

  final isAppScheme = uri.scheme == _appScheme;
  final isOwnWebLink =
      (uri.scheme == 'https' || uri.scheme == 'http') &&
      _webHosts.contains(uri.host.toLowerCase());

  // A bare path (the in-app case) has no scheme: leave it alone. A link to
  // someone else's host is not ours to route, and rewriting it would let any
  // URL steer the app.
  if (!isAppScheme && !isOwnWebLink) return null;

  final segments = <String>[
    // For the custom scheme the authority is really the first path segment.
    if (isAppScheme && uri.host.isNotEmpty) uri.host,
    ...uri.pathSegments,
  ].where((s) => s.isNotEmpty);

  final path = '/${segments.join('/')}';
  final query = uri.hasQuery ? '?${uri.query}' : '';

  return '$path$query';
}

/// Shown for any URL the app does not know. A deep link is attacker-adjacent
/// input — anything can be pasted into it — so an unknown one gets an explicit
/// screen with a way out, never a crash or a blank page.
class RouteNotFoundScreen extends StatelessWidget {
  const RouteNotFoundScreen({required this.location, super.key});

  final String location;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Not found')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.explore_off_outlined,
                size: 40,
                color: colors.onSurfaceVariant,
              ),
              const SizedBox(height: 12),
              Text('No screen for $location', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go(AppRouter.searchPath),
                child: const Text('Back to search'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
