import 'package:finlens_mobile/src/features/search/data/search_dtos.dart';
import 'package:finlens_mobile/src/features/stock_detail/data/stock_dtos.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fixtures.dart';

/// Parsed against real captured payloads from a running API. A DTO test on
/// hand-written JSON only proves the DTO agrees with itself.
void main() {
  group('SearchResponseDto', () {
    test('parses a real search response', () {
      final dto = SearchResponseDto.fromJson(loadFixture('search_response'));

      expect(dto.count, dto.results.length);
      expect(dto.results.first.symbol, 'AAPL');
      expect(dto.results.first.name, 'Apple Inc.');
      expect(dto.results.first.price, isNotNull);
    });

    test('maps to the domain without losing a field', () {
      final hit = SearchResponseDto.fromJson(
        loadFixture('search_response'),
      ).results.first.toDomain();

      expect(hit.symbol, 'AAPL');
      expect(hit.exchange, 'NASDAQ');
      expect(hit.marketCap, greaterThan(0));
    });

    test('survives the nulls the API really sends', () {
      // A company ingested before its first quote has no price and no market cap.
      // Substituting zero here would render "$0.00" as though it were a price.
      final dto = SearchHitDto.fromJson({'symbol': 'NEWCO', 'name': 'New Co'});

      expect(dto.price, isNull);
      expect(dto.toDomain().marketCap, isNull);
    });
  });

  group('StockSnapshotDto', () {
    test('parses a real snapshot', () {
      final snapshot = StockSnapshotDto.fromJson(
        loadFixture('stock_snapshot'),
      ).toDomain();

      expect(snapshot.company.symbol, 'AAPL');
      expect(snapshot.quote!.price, isNotNull);
      expect(snapshot.valuation!.fairValuePerShare, isNotNull);
      expect(snapshot.latest!.period, 'FY');
      expect(snapshot.metrics.grossMargin, isNotNull);
    });

    test('parses ISO timestamps into DateTime once, in the DTO layer', () {
      final snapshot = StockSnapshotDto.fromJson(
        loadFixture('stock_snapshot'),
      ).toDomain();

      expect(snapshot.quote!.asOf, isA<DateTime>());
      expect(snapshot.valuation!.computedAt, isA<DateTime>());
      expect(snapshot.latest!.periodEnd?.year, 2025);
    });

    test('tolerates a company with no quote, valuation or statements', () {
      // Real state right after the profiles stage runs and before quotes does.
      final snapshot = StockSnapshotDto.fromJson({
        'company': {'symbol': 'NEWCO', 'name': 'New Co'},
        'quote': null,
        'valuation': null,
        'latest': null,
        'metrics': <String, dynamic>{},
      }).toDomain();

      expect(snapshot.quote, isNull);
      expect(snapshot.valuation, isNull);
      expect(snapshot.latest, isNull);
      expect(snapshot.metrics.netMargin, isNull);
    });

    test('an unparseable timestamp becomes null rather than throwing', () {
      final quote = QuoteDto.fromJson({'asOf': 'not-a-date'}).toDomain();
      expect(quote.asOf, isNull);
    });
  });

  group('PriceSeriesDto', () {
    test('parses a real price series', () {
      final series = PriceSeriesDto.fromJson(
        loadFixture('price_series'),
      ).toDomain();

      expect(series.symbol, 'AAPL');
      expect(series.bars, isNotEmpty);
      expect(series.bars.first.tradeDate, isA<DateTime>());
      expect(series.bars.first.close, greaterThan(0));
    });

    test('carries truncatedByPlan into the domain', () {
      // The API clamps rather than rejecting, so the client has to be able to say
      // "one year, because your plan holds one year" instead of implying that is
      // all the data that exists.
      final series = PriceSeriesDto.fromJson({
        'symbol': 'AAPL',
        'days': 365,
        'count': 1,
        'truncatedByPlan': true,
        'bars': [
          {'tradeDate': '2026-07-20', 'close': 134.7, 'volume': 1000.0},
        ],
      }).toDomain();

      expect(series.truncatedByPlan, isTrue);
    });

    test(
      'drops a bar with an unparseable date instead of failing the chart',
      () {
        final series = PriceSeriesDto.fromJson({
          'symbol': 'AAPL',
          'days': 5,
          'count': 2,
          'truncatedByPlan': false,
          'bars': [
            {'tradeDate': 'garbage', 'close': 1.0},
            {'tradeDate': '2026-07-21', 'close': 2.0},
          ],
        }).toDomain();

        expect(series.bars, hasLength(1));
        expect(series.bars.single.close, 2.0);
      },
    );
  });
}
