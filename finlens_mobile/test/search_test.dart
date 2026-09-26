import 'package:finlens_mobile/src/core/domain/failure.dart';
import 'package:finlens_mobile/src/core/domain/result.dart';
import 'package:finlens_mobile/src/features/search/application/search_service.dart';
import 'package:finlens_mobile/src/features/search/domain/search_hit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/test_app.dart';

const _hits = [
  SearchHit(
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Staples',
    price: 71.44,
    marketCap: 333115932101.47,
  ),
  SearchHit(symbol: 'NEWCO', name: 'New Co'),
];

void main() {
  group('SearchService', () {
    test('an empty query never reaches the network', () async {
      // Clearing the field must not fire a request, and it must not surface as an
      // error either — there is simply nothing to search for.
      final repository = FakeSearchRepository(hits: _hits);
      final result = await SearchService(repository).search('   ');

      expect(result.valueOrNull, isEmpty);
      expect(repository.queries, isEmpty);
    });

    test('trims the query before sending it', () async {
      final repository = FakeSearchRepository(hits: _hits);
      await SearchService(repository).search('  aapl ');

      expect(repository.queries, ['aapl']);
    });

    test('passes a failure through unchanged', () async {
      // The application layer does not translate failures; the data layer already
      // did, and re-mapping here would give two places to get it wrong.
      final repository = FakeSearchRepository(
        result: const Failed<List<SearchHit>>(NetworkFailure()),
      );
      final result = await SearchService(repository).search('AA');

      expect(result.failureOrNull, isA<NetworkFailure>());
    });
  });

  group('search screen states', () {
    testWidgets('prompts before anything has been typed', (tester) async {
      await pumpApp(
        tester,
        searchRepository: FakeSearchRepository(hits: _hits),
      );

      expect(find.text('Search a company'), findsOneWidget);
      expect(find.text('AAPL · Apple Inc.'), findsNothing);
    });

    testWidgets('renders results for a query', (tester) async {
      final repository = FakeSearchRepository(hits: _hits);
      await pumpApp(tester, searchRepository: repository);

      await tester.enterText(find.byType(TextField), 'a');
      await tester.pump(const Duration(milliseconds: 350)); // past the debounce
      await tester.pumpAndSettle();

      expect(find.text('AAPL · Apple Inc.'), findsOneWidget);
      expect(find.text(r'$71.44'), findsOneWidget);
      expect(find.text(r'$333B'), findsOneWidget);
      expect(repository.queries, ['a']);
    });

    testWidgets('a company with no quote shows a dash, not a zero', (
      tester,
    ) async {
      await pumpApp(
        tester,
        searchRepository: FakeSearchRepository(hits: _hits),
      );

      await tester.enterText(find.byType(TextField), 'new');
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      // A fabricated $0.00 would read as a real price.
      expect(find.text('—'), findsNWidgets(2));
    });

    testWidgets('one debounced request per burst of typing', (tester) async {
      final repository = FakeSearchRepository(hits: _hits);
      await pumpApp(tester, searchRepository: repository);

      await tester.enterText(find.byType(TextField), 'a');
      await tester.pump(const Duration(milliseconds: 50));
      await tester.enterText(find.byType(TextField), 'ap');
      await tester.pump(const Duration(milliseconds: 50));
      await tester.enterText(find.byType(TextField), 'aap');
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      expect(repository.queries, ['aap']);
    });

    testWidgets('empty results get their own state, not an empty list', (
      tester,
    ) async {
      await pumpApp(
        tester,
        searchRepository: FakeSearchRepository(hits: const []),
      );

      await tester.enterText(find.byType(TextField), 'zzzz');
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      expect(find.text('Nothing matches "zzzz"'), findsOneWidget);
    });

    testWidgets('a network failure renders a typed error with a retry', (
      tester,
    ) async {
      await pumpApp(
        tester,
        searchRepository: FakeSearchRepository(
          result: const Failed<List<SearchHit>>(NetworkFailure()),
        ),
      );

      await tester.enterText(find.byType(TextField), 'aa');
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      expect(find.text('No connection'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Try again'), findsOneWidget);
    });

    testWidgets('a 404-style failure offers no retry', (tester) async {
      // Retrying a symbol we do not cover just wastes a tap.
      await pumpApp(
        tester,
        searchRepository: FakeSearchRepository(
          result: const Failed<List<SearchHit>>(
            NotFoundFailure(subject: 'ZZZZ'),
          ),
        ),
      );

      await tester.enterText(find.byType(TextField), 'zz');
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      expect(find.text('We do not cover ZZZZ'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Try again'), findsNothing);
    });

    testWidgets('a ?q= link opens already searching', (tester) async {
      final repository = FakeSearchRepository(hits: _hits);
      await pumpApp(tester, location: '/?q=aapl', searchRepository: repository);

      expect(repository.queries, ['aapl']);
      expect(find.text('AAPL · Apple Inc.'), findsOneWidget);
      expect(find.widgetWithText(TextField, 'aapl'), findsOneWidget);
    });

    testWidgets('a custom-scheme link can carry the query too', (tester) async {
      final repository = FakeSearchRepository(hits: _hits);
      await pumpApp(tester, location: 'finlens://?q=aapl', searchRepository: repository);

      expect(repository.queries, ['aapl']);
    });

    testWidgets('tapping a result opens that company', (tester) async {
      await pumpApp(
        tester,
        searchRepository: FakeSearchRepository(hits: _hits),
      );

      await tester.enterText(find.byType(TextField), 'a');
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      await tester.tap(find.text('AAPL · Apple Inc.'));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'AAPL'), findsOneWidget);
    });
  });
}
