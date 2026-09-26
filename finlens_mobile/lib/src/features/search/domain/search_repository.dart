import '../../../core/domain/result.dart';
import 'search_hit.dart';

/// The contract the application layer depends on.
///
/// Abstract so the service can be tested against a fake, and so swapping Dio for
/// something else later touches one file in `data/`.
abstract interface class SearchRepository {
  Future<Result<List<SearchHit>>> search(String query, {int limit});
}
