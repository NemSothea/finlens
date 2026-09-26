import '../../../core/domain/result.dart';
import '../domain/search_hit.dart';
import '../domain/search_repository.dart';

/// Search orchestration.
///
/// Stateless, returns domain types, depends on the abstract repository, and never
/// imports Flutter. The only judgement it holds is what counts as a query worth
/// sending — which is business logic, not UI, and is therefore testable without
/// pumping a widget.
class SearchService {
  const SearchService(this._repository);

  final SearchRepository _repository;

  /// Below this, results are noise and every keystroke is a round trip.
  static const int minQueryLength = 1;
  static const int defaultLimit = 12;

  /// Empty and whitespace-only queries resolve to an empty list without touching
  /// the network — clearing the field must not fire a request.
  Future<Result<List<SearchHit>>> search(
    String rawQuery, {
    int limit = defaultLimit,
  }) async {
    final query = rawQuery.trim();
    if (query.length < minQueryLength) return const Success(<SearchHit>[]);

    return _repository.search(query, limit: limit);
  }
}
