import 'package:freezed_annotation/freezed_annotation.dart';

import '../domain/search_hit.dart';

part 'search_dtos.freezed.dart';
part 'search_dtos.g.dart';

/// Wire shape of `GET /api/stocks/search`.
///
/// Mirrors the JSON exactly — including `count`, which the app does not render
/// but which is worth parsing rather than silently dropping, because a mismatch
/// between it and `results.length` would mean a truncated response.
@freezed
abstract class SearchResponseDto with _$SearchResponseDto {
  const factory SearchResponseDto({
    required String query,
    required int count,
    required List<SearchHitDto> results,
  }) = _SearchResponseDto;

  factory SearchResponseDto.fromJson(Map<String, dynamic> json) =>
      _$SearchResponseDtoFromJson(json);
}

@freezed
abstract class SearchHitDto with _$SearchHitDto {
  const factory SearchHitDto({
    required String symbol,
    required String name,
    String? exchange,
    String? sector,
    double? price,
    double? marketCap,
  }) = _SearchHitDto;

  factory SearchHitDto.fromJson(Map<String, dynamic> json) =>
      _$SearchHitDtoFromJson(json);
}

extension SearchHitDtoX on SearchHitDto {
  SearchHit toDomain() => SearchHit(
    symbol: symbol,
    name: name,
    exchange: exchange,
    sector: sector,
    price: price,
    marketCap: marketCap,
  );
}
