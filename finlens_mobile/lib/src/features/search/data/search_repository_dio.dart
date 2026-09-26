import 'package:dio/dio.dart';

import '../../../core/domain/failure.dart';
import '../../../core/domain/result.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_failures.dart';
import '../domain/search_hit.dart';
import '../domain/search_repository.dart';
import 'search_dtos.dart';

/// The only place in the search feature that knows HTTP exists.
///
/// Every exit is a `Result`: `DioException`, a non-2xx status and a malformed
/// body all become `Failed(...)` here, so nothing above this line has to catch.
class SearchRepositoryDio implements SearchRepository {
  const SearchRepositoryDio(this._client);

  final ApiClient _client;

  @override
  Future<Result<List<SearchHit>>> search(String query, {int limit = 10}) async {
    try {
      final response = await _client.get(
        '/api/stocks/search',
        query: {'q': query, 'limit': limit},
      );

      final status = response.statusCode;
      if (status == null || status < 200 || status >= 300) {
        return Failed(
          failureFromStatus(status, messageFromBody(response.data)),
        );
      }

      final data = response.data;
      if (data is! Map<String, dynamic>) {
        return const Failed(
          ParseFailure(detail: 'search body was not a JSON object'),
        );
      }

      final dto = SearchResponseDto.fromJson(data);
      return Success(
        dto.results.map((hit) => hit.toDomain()).toList(growable: false),
      );
    } on DioException catch (error) {
      return Failed(failureFromDioException(error));
    } catch (error) {
      // A parse error is a real failure, not something to smooth over with
      // defaults: a silently-null price renders as a wrong number, and a wrong
      // number on a research tool is worse than an error message.
      return Failed(ParseFailure(detail: error.toString()));
    }
  }
}
