import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/domain/result.dart';
import '../../../core/providers.dart';
import '../data/search_repository_dio.dart';
import '../domain/search_hit.dart';
import '../domain/search_repository.dart';
import 'search_service.dart';

part 'search_providers.g.dart';

/// Providers expose abstractions, not implementations, so a widget test can swap
/// in a fake repository without a running server.
@riverpod
SearchRepository searchRepository(Ref ref) =>
    SearchRepositoryDio(ref.watch(apiClientProvider));

@riverpod
SearchService searchService(Ref ref) =>
    SearchService(ref.watch(searchRepositoryProvider));

/// The committed query — set by the search field after its debounce, not on every
/// keystroke, so one word of typing is one request rather than five.
@riverpod
class SearchQuery extends _$SearchQuery {
  @override
  String build() => '';

  void submit(String value) => state = value;
}

/// Results for the current query.
///
/// A `Failure` is thrown into `AsyncValue.error` on purpose: `AsyncValue` already
/// models loading/error/data, and the screen pattern-matches the failure variant
/// out of it. Wrapping `Result` inside `AsyncValue` would give two error channels
/// for one error.
@riverpod
Future<List<SearchHit>> searchResults(Ref ref) async {
  final query = ref.watch(searchQueryProvider);
  final result = await ref.watch(searchServiceProvider).search(query);

  return switch (result) {
    Success<List<SearchHit>>(value: final hits) => hits,
    Failed<List<SearchHit>>(failure: final failure) => throw failure,
  };
}
