import 'package:finlens_mobile/src/core/config/app_config.dart';
import 'package:finlens_mobile/src/features/search/domain/search_hit.dart';
import 'package:finlens_mobile/src/router/app_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/test_app.dart';

/// Routing tests, not screen tests.
///
/// The M1 gate is "app runs on device, routes deep-link". Pumping the whole app
/// at a starting location is how a cold deep link actually arrives — the OS
/// hands the app a URL before any screen has been built — so that is what these
/// assert, rather than tapping through from the first screen.
Future<void> pumpAppAt(WidgetTester tester, String location) => pumpApp(
  tester,
  location: location,
  searchRepository: FakeSearchRepository(hits: _hits),
);

const List<SearchHit> _hits = [
  SearchHit(
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    price: 71.44,
  ),
];

void main() {
  group('AppRouter paths', () {
    test('detail path is built from a symbol, uppercased', () {
      expect(AppRouter.stockDetailPathFor('aapl'), '/stocks/AAPL');
    });

    test('builds a linkable search path', () {
      expect(AppRouter.searchPathFor('brk.b'), '/?q=brk.b');
      expect(AppRouter.searchPathFor('  '), '/');
      expect(AppRouter.searchPathFor('apple inc'), '/?q=apple+inc');
    });

    test('encodes symbols that would otherwise break the URL', () {
      // Foreign listings carry dots and dashes (BRK.B, 7203.T). An unencoded
      // one would silently resolve to a different route.
      expect(AppRouter.stockDetailPathFor('brk.b'), '/stocks/BRK.B');
      expect(AppRouter.stockDetailPathFor('a b'), '/stocks/A%20B');
    });
  });

  group('normaliseDeepLink', () {
    test('folds a custom-scheme authority back into the path', () {
      // The bug this exists for: iOS/Android deliver the whole URI, so
      // `finlens://stocks/NVDA` reached go_router as an unmatched location and
      // rendered the 404 screen on a real simulator.
      expect(normaliseDeepLink('finlens://stocks/NVDA'), '/stocks/NVDA');
    });

    test('handles the three-slash form without doubling the path', () {
      expect(normaliseDeepLink('finlens:///stocks/NVDA'), '/stocks/NVDA');
    });

    test('an empty custom-scheme link opens search', () {
      expect(normaliseDeepLink('finlens://'), '/');
    });

    test('keeps the query string', () {
      expect(
        normaliseDeepLink('finlens://stocks/NVDA?period=FY'),
        '/stocks/NVDA?period=FY',
      );
    });

    test('accepts our own https links, for M5 app links', () {
      expect(normaliseDeepLink('https://finlens.app/watchlist'), '/watchlist');
    });

    test('leaves a bare in-app path alone', () {
      expect(normaliseDeepLink('/stocks/AAPL'), isNull);
    });

    test('refuses to route someone else\'s host', () {
      // Rewriting any inbound URL would let an arbitrary link steer the app.
      expect(normaliseDeepLink('https://evil.example.com/stocks/AAPL'), isNull);
      expect(
        normaliseDeepLink('https://finlens.app.evil.com/watchlist'),
        isNull,
      );
    });
  });

  group('deep links', () {
    testWidgets('search is the initial location', (tester) async {
      await pumpAppAt(tester, AppRouter.searchPath);
      expect(find.text('Search a company'), findsOneWidget);
    });

    testWidgets('a cold link to a company opens that company', (tester) async {
      await pumpAppAt(tester, '/stocks/MSFT');
      expect(find.widgetWithText(AppBar, 'MSFT'), findsOneWidget);
    });

    testWidgets('a lowercase link is normalised', (tester) async {
      await pumpAppAt(tester, '/stocks/msft');
      expect(find.widgetWithText(AppBar, 'MSFT'), findsOneWidget);
    });

    testWidgets('watchlist deep link renders the empty state', (tester) async {
      await pumpAppAt(tester, AppRouter.watchlistPath);
      expect(find.text('Nothing tracked yet'), findsOneWidget);
    });

    testWidgets('a custom-scheme link routes as the OS delivers it', (
      tester,
    ) async {
      await pumpAppAt(tester, 'finlens://stocks/NVDA');
      expect(find.widgetWithText(AppBar, 'NVDA'), findsOneWidget);
    });

    testWidgets('an unknown link lands on a 404 with a way out', (
      tester,
    ) async {
      await pumpAppAt(tester, '/does/not/exist');
      expect(find.textContaining('No screen for'), findsOneWidget);

      await tester.tap(find.text('Back to search'));
      await tester.pumpAndSettle();
      expect(find.text('Search a company'), findsOneWidget);
    });
  });

  group('AppConfig', () {
    test('dev and prod differ only in what they point at', () {
      final dev = AppConfig.dev();
      final prod = AppConfig.prod();

      expect(dev.isDev, isTrue);
      expect(prod.isDev, isFalse);
      expect(dev.apiBaseUrl, AppConfig.devDefaultBaseUrl);
      expect(prod.apiBaseUrl, AppConfig.prodDefaultBaseUrl);
    });

    test('production never points at localhost', () {
      // A store build talking to a laptop is the failure this asserts against.
      expect(AppConfig.prod().apiBaseUrl, startsWith('https://'));
      expect(AppConfig.prod().apiBaseUrl, isNot(contains('localhost')));
    });
  });
}
