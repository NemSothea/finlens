import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:finlens_mobile/src/core/config/app_config.dart';
import 'package:finlens_mobile/src/core/domain/failure.dart';
import 'package:finlens_mobile/src/core/network/api_client.dart';
import 'package:finlens_mobile/src/core/network/api_failures.dart';
import 'package:finlens_mobile/src/features/search/data/search_repository_dio.dart';
import 'package:finlens_mobile/src/features/stock_detail/data/stock_repository_dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fixtures.dart';

/// Serves canned responses in place of the network. Cheaper and steadier than a
/// mock: the repository under test only needs Dio to answer, and asserting on Dio
/// call arguments would test the HTTP package rather than our error handling.
class StubAdapter implements HttpClientAdapter {
  StubAdapter(this.respond);

  final Future<ResponseBody> Function(RequestOptions options) respond;
  final List<RequestOptions> requests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? stream,
    Future<void>? cancelFuture,
  ) {
    requests.add(options);
    return respond(options);
  }

  @override
  void close({bool force = false}) {}
}

ApiClient clientFor(StubAdapter adapter) {
  final dio = Dio();
  // Prod config here only to keep Dio's dev log interceptor out of the test
  // output; nothing under test depends on which base URL it is.
  final client = ApiClient(config: AppConfig.prod(), dio: dio);
  dio.httpClientAdapter = adapter;
  return client;
}

ResponseBody json(Object body, {int status = 200}) => ResponseBody.fromString(
  jsonEncode(body),
  status,
  headers: {
    Headers.contentTypeHeader: [Headers.jsonContentType],
  },
);

void main() {
  group('failureFromStatus', () {
    test('402 is its own variant, not an authorisation error', () {
      // The API returns 402 when identity is known and payment is missing, so the
      // client can show an upgrade path instead of a dead end.
      expect(
        failureFromStatus(402, 'Pro covers this'),
        isA<PaymentRequiredFailure>(),
      );
      expect(failureFromStatus(401), isA<UnauthorizedFailure>());
    });

    test('maps the statuses our API actually returns', () {
      expect(
        failureFromStatus(400, 'days must be a positive number'),
        isA<BadRequestFailure>(),
      );
      expect(failureFromStatus(404, null, 'ZZZZ'), isA<NotFoundFailure>());
      expect(
        failureFromStatus(422, 'cannot support a DCF'),
        isA<BadRequestFailure>(),
      );
      expect(failureFromStatus(503), isA<ServerFailure>());
    });

    test('carries our own error message through, and nothing else', () {
      final failure = failureFromStatus(400, 'days must be a positive number');
      expect(
        (failure as BadRequestFailure).message,
        'days must be a positive number',
      );
      expect(messageFromBody('<html>500</html>'), isNull);
    });
  });

  group('failureFromDioException', () {
    DioException dioError(DioExceptionType type) => DioException(
      requestOptions: RequestOptions(path: '/x'),
      type: type,
    );

    test('a stalled request is a timeout, not an unknown error', () {
      expect(
        failureFromDioException(dioError(DioExceptionType.receiveTimeout)),
        isA<TimeoutFailure>(),
      );
    });

    test('an unreachable host is a network failure', () {
      expect(
        failureFromDioException(dioError(DioExceptionType.connectionError)),
        isA<NetworkFailure>(),
      );
    });

    test('retryability drives whether a screen offers a retry', () {
      expect(const NetworkFailure().isRetryable, isTrue);
      expect(const NotFoundFailure().isRetryable, isFalse);
      expect(const PaymentRequiredFailure().isRetryable, isFalse);
    });
  });

  group('SearchRepositoryDio', () {
    test('returns domain hits on a real payload', () async {
      final adapter = StubAdapter(
        (_) async => json(loadFixture('search_response')),
      );
      final result = await SearchRepositoryDio(
        clientFor(adapter),
      ).search('AA', limit: 3);

      expect(result.isSuccess, isTrue);
      expect(result.valueOrNull!.first.symbol, 'AAPL');
      expect(adapter.requests.single.path, '/api/stocks/search');
      expect(adapter.requests.single.queryParameters, {'q': 'AA', 'limit': 3});
    });

    test('a 500 becomes a ServerFailure, not an exception', () async {
      final adapter = StubAdapter(
        (_) async => json({'error': 'boom'}, status: 500),
      );
      final result = await SearchRepositoryDio(clientFor(adapter)).search('AA');

      expect(result.failureOrNull, isA<ServerFailure>());
    });

    test('a body of the wrong shape is a ParseFailure', () async {
      // What a proxy or captive portal returns: HTTP 200, HTML body.
      final adapter = StubAdapter(
        (_) async => ResponseBody.fromString('<html>hi</html>', 200),
      );
      final result = await SearchRepositoryDio(clientFor(adapter)).search('AA');

      expect(result.failureOrNull, isA<ParseFailure>());
    });

    test('a dropped connection is a NetworkFailure', () async {
      final adapter = StubAdapter(
        (options) async => throw DioException(
          requestOptions: options,
          type: DioExceptionType.connectionError,
        ),
      );
      final result = await SearchRepositoryDio(clientFor(adapter)).search('AA');

      expect(result.failureOrNull, isA<NetworkFailure>());
    });
  });

  group('StockRepositoryDio', () {
    test('parses a snapshot and normalises the symbol into the path', () async {
      final adapter = StubAdapter(
        (_) async => json(loadFixture('stock_snapshot')),
      );
      final result = await StockRepositoryDio(
        clientFor(adapter),
      ).snapshot('aapl');

      expect(result.valueOrNull!.company.symbol, 'AAPL');
      expect(adapter.requests.single.path, '/api/stocks/AAPL');
    });

    test('a 404 names the symbol so the screen can say which one', () async {
      final adapter = StubAdapter(
        (_) async => json({'error': 'Unknown symbol: ZZZZ'}, status: 404),
      );
      final result = await StockRepositoryDio(
        clientFor(adapter),
      ).snapshot('zzzz');

      final failure = result.failureOrNull;
      expect(failure, isA<NotFoundFailure>());
      expect((failure as NotFoundFailure).subject, 'ZZZZ');
    });

    test('prices pass the day window through', () async {
      final adapter = StubAdapter(
        (_) async => json(loadFixture('price_series')),
      );
      final result = await StockRepositoryDio(
        clientFor(adapter),
      ).prices('AAPL', days: 30);

      expect(result.isSuccess, isTrue);
      expect(adapter.requests.single.queryParameters, {'days': 30});
    });
  });
}
