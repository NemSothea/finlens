import 'package:freezed_annotation/freezed_annotation.dart';

part 'search_hit.freezed.dart';

/// One row of a ticker search.
///
/// Domain type, not the wire type: the screen depends on this, so a field the API
/// renames is a one-line change in the DTO instead of a change in every widget.
@freezed
abstract class SearchHit with _$SearchHit {
  const factory SearchHit({
    required String symbol,
    required String name,
    String? exchange,
    String? sector,
    // Nullable because a freshly ingested company has a profile before it has a
    // quote. Substituting 0 would render "$0.00" as if it were a real price.
    double? price,
    double? marketCap,
  }) = _SearchHit;
}
