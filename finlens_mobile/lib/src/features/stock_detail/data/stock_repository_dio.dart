import 'package:dio/dio.dart';

import '../../../core/domain/failure.dart';
import '../../../core/domain/result.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_failures.dart';
import '../domain/company_snapshot.dart';
import '../domain/stock_repository.dart';
import 'stock_dtos.dart';

/// HTTP for the company screen. Same discipline as search: no throw escapes.
class StockRepositoryDio implements StockRepository {
  const StockRepositoryDio(this._client);

  final ApiClient _client;

  @override
  Future<Result<CompanySnapshot>> snapshot(String symbol) => _read(
    '/api/stocks/${Uri.encodeComponent(symbol.toUpperCase())}',
    subject: symbol.toUpperCase(),
    parse: (json) => StockSnapshotDto.fromJson(json).toDomain(),
  );

  @override
  Future<Result<PriceSeries>> prices(String symbol, {int days = 365}) => _read(
    '/api/stocks/${Uri.encodeComponent(symbol.toUpperCase())}/prices',
    query: {'days': days},
    subject: symbol.toUpperCase(),
    parse: (json) => PriceSeriesDto.fromJson(json).toDomain(),
  );

  /// One request shape, one error path.
  ///
  /// Written once because every extra copy of "check the status, then parse" is
  /// another place to forget the status check — and a forgotten check turns a 404
  /// body into a parse error, which sends the user a confusing message about
  /// malformed data instead of "we do not cover that ticker".
  Future<Result<T>> _read<T>(
    String path, {
    required T Function(Map<String, dynamic> json) parse,
    Map<String, dynamic>? query,
    String? subject,
  }) async {
    try {
      final response = await _client.get(path, query: query);

      final status = response.statusCode;
      if (status == null || status < 200 || status >= 300) {
        return Failed(
          failureFromStatus(status, messageFromBody(response.data), subject),
        );
      }

      final data = response.data;
      if (data is! Map<String, dynamic>) {
        return Failed(
          ParseFailure(
            detail: '$path returned ${data.runtimeType}, not an object',
          ),
        );
      }

      return Success(parse(data));
    } on DioException catch (error) {
      return Failed(failureFromDioException(error));
    } catch (error) {
      return Failed(ParseFailure(detail: error.toString()));
    }
  }
}
