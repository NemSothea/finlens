// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SearchResponseDto _$SearchResponseDtoFromJson(Map<String, dynamic> json) =>
    _SearchResponseDto(
      query: json['query'] as String,
      count: (json['count'] as num).toInt(),
      results: (json['results'] as List<dynamic>)
          .map((e) => SearchHitDto.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SearchResponseDtoToJson(_SearchResponseDto instance) =>
    <String, dynamic>{
      'query': instance.query,
      'count': instance.count,
      'results': instance.results,
    };

_SearchHitDto _$SearchHitDtoFromJson(Map<String, dynamic> json) =>
    _SearchHitDto(
      symbol: json['symbol'] as String,
      name: json['name'] as String,
      exchange: json['exchange'] as String?,
      sector: json['sector'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      marketCap: (json['marketCap'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$SearchHitDtoToJson(_SearchHitDto instance) =>
    <String, dynamic>{
      'symbol': instance.symbol,
      'name': instance.name,
      'exchange': instance.exchange,
      'sector': instance.sector,
      'price': instance.price,
      'marketCap': instance.marketCap,
    };
