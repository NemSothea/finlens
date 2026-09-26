// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'search_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SearchResponseDto {

 String get query; int get count; List<SearchHitDto> get results;
/// Create a copy of SearchResponseDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchResponseDtoCopyWith<SearchResponseDto> get copyWith => _$SearchResponseDtoCopyWithImpl<SearchResponseDto>(this as SearchResponseDto, _$identity);

  /// Serializes this SearchResponseDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchResponseDto&&(identical(other.query, query) || other.query == query)&&(identical(other.count, count) || other.count == count)&&const DeepCollectionEquality().equals(other.results, results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,query,count,const DeepCollectionEquality().hash(results));

@override
String toString() {
  return 'SearchResponseDto(query: $query, count: $count, results: $results)';
}


}

/// @nodoc
abstract mixin class $SearchResponseDtoCopyWith<$Res>  {
  factory $SearchResponseDtoCopyWith(SearchResponseDto value, $Res Function(SearchResponseDto) _then) = _$SearchResponseDtoCopyWithImpl;
@useResult
$Res call({
 String query, int count, List<SearchHitDto> results
});




}
/// @nodoc
class _$SearchResponseDtoCopyWithImpl<$Res>
    implements $SearchResponseDtoCopyWith<$Res> {
  _$SearchResponseDtoCopyWithImpl(this._self, this._then);

  final SearchResponseDto _self;
  final $Res Function(SearchResponseDto) _then;

/// Create a copy of SearchResponseDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? query = null,Object? count = null,Object? results = null,}) {
  return _then(_self.copyWith(
query: null == query ? _self.query : query // ignore: cast_nullable_to_non_nullable
as String,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,results: null == results ? _self.results : results // ignore: cast_nullable_to_non_nullable
as List<SearchHitDto>,
  ));
}

}


/// Adds pattern-matching-related methods to [SearchResponseDto].
extension SearchResponseDtoPatterns on SearchResponseDto {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SearchResponseDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SearchResponseDto() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SearchResponseDto value)  $default,){
final _that = this;
switch (_that) {
case _SearchResponseDto():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SearchResponseDto value)?  $default,){
final _that = this;
switch (_that) {
case _SearchResponseDto() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String query,  int count,  List<SearchHitDto> results)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchResponseDto() when $default != null:
return $default(_that.query,_that.count,_that.results);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String query,  int count,  List<SearchHitDto> results)  $default,) {final _that = this;
switch (_that) {
case _SearchResponseDto():
return $default(_that.query,_that.count,_that.results);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String query,  int count,  List<SearchHitDto> results)?  $default,) {final _that = this;
switch (_that) {
case _SearchResponseDto() when $default != null:
return $default(_that.query,_that.count,_that.results);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SearchResponseDto implements SearchResponseDto {
  const _SearchResponseDto({required this.query, required this.count, required final  List<SearchHitDto> results}): _results = results;
  factory _SearchResponseDto.fromJson(Map<String, dynamic> json) => _$SearchResponseDtoFromJson(json);

@override final  String query;
@override final  int count;
 final  List<SearchHitDto> _results;
@override List<SearchHitDto> get results {
  if (_results is EqualUnmodifiableListView) return _results;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_results);
}


/// Create a copy of SearchResponseDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchResponseDtoCopyWith<_SearchResponseDto> get copyWith => __$SearchResponseDtoCopyWithImpl<_SearchResponseDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchResponseDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchResponseDto&&(identical(other.query, query) || other.query == query)&&(identical(other.count, count) || other.count == count)&&const DeepCollectionEquality().equals(other._results, _results));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,query,count,const DeepCollectionEquality().hash(_results));

@override
String toString() {
  return 'SearchResponseDto(query: $query, count: $count, results: $results)';
}


}

/// @nodoc
abstract mixin class _$SearchResponseDtoCopyWith<$Res> implements $SearchResponseDtoCopyWith<$Res> {
  factory _$SearchResponseDtoCopyWith(_SearchResponseDto value, $Res Function(_SearchResponseDto) _then) = __$SearchResponseDtoCopyWithImpl;
@override @useResult
$Res call({
 String query, int count, List<SearchHitDto> results
});




}
/// @nodoc
class __$SearchResponseDtoCopyWithImpl<$Res>
    implements _$SearchResponseDtoCopyWith<$Res> {
  __$SearchResponseDtoCopyWithImpl(this._self, this._then);

  final _SearchResponseDto _self;
  final $Res Function(_SearchResponseDto) _then;

/// Create a copy of SearchResponseDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? query = null,Object? count = null,Object? results = null,}) {
  return _then(_SearchResponseDto(
query: null == query ? _self.query : query // ignore: cast_nullable_to_non_nullable
as String,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,results: null == results ? _self._results : results // ignore: cast_nullable_to_non_nullable
as List<SearchHitDto>,
  ));
}


}


/// @nodoc
mixin _$SearchHitDto {

 String get symbol; String get name; String? get exchange; String? get sector; double? get price; double? get marketCap;
/// Create a copy of SearchHitDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SearchHitDtoCopyWith<SearchHitDto> get copyWith => _$SearchHitDtoCopyWithImpl<SearchHitDto>(this as SearchHitDto, _$identity);

  /// Serializes this SearchHitDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SearchHitDto&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.name, name) || other.name == name)&&(identical(other.exchange, exchange) || other.exchange == exchange)&&(identical(other.sector, sector) || other.sector == sector)&&(identical(other.price, price) || other.price == price)&&(identical(other.marketCap, marketCap) || other.marketCap == marketCap));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,symbol,name,exchange,sector,price,marketCap);

@override
String toString() {
  return 'SearchHitDto(symbol: $symbol, name: $name, exchange: $exchange, sector: $sector, price: $price, marketCap: $marketCap)';
}


}

/// @nodoc
abstract mixin class $SearchHitDtoCopyWith<$Res>  {
  factory $SearchHitDtoCopyWith(SearchHitDto value, $Res Function(SearchHitDto) _then) = _$SearchHitDtoCopyWithImpl;
@useResult
$Res call({
 String symbol, String name, String? exchange, String? sector, double? price, double? marketCap
});




}
/// @nodoc
class _$SearchHitDtoCopyWithImpl<$Res>
    implements $SearchHitDtoCopyWith<$Res> {
  _$SearchHitDtoCopyWithImpl(this._self, this._then);

  final SearchHitDto _self;
  final $Res Function(SearchHitDto) _then;

/// Create a copy of SearchHitDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? symbol = null,Object? name = null,Object? exchange = freezed,Object? sector = freezed,Object? price = freezed,Object? marketCap = freezed,}) {
  return _then(_self.copyWith(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,exchange: freezed == exchange ? _self.exchange : exchange // ignore: cast_nullable_to_non_nullable
as String?,sector: freezed == sector ? _self.sector : sector // ignore: cast_nullable_to_non_nullable
as String?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,marketCap: freezed == marketCap ? _self.marketCap : marketCap // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [SearchHitDto].
extension SearchHitDtoPatterns on SearchHitDto {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SearchHitDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SearchHitDto() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SearchHitDto value)  $default,){
final _that = this;
switch (_that) {
case _SearchHitDto():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SearchHitDto value)?  $default,){
final _that = this;
switch (_that) {
case _SearchHitDto() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String symbol,  String name,  String? exchange,  String? sector,  double? price,  double? marketCap)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SearchHitDto() when $default != null:
return $default(_that.symbol,_that.name,_that.exchange,_that.sector,_that.price,_that.marketCap);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String symbol,  String name,  String? exchange,  String? sector,  double? price,  double? marketCap)  $default,) {final _that = this;
switch (_that) {
case _SearchHitDto():
return $default(_that.symbol,_that.name,_that.exchange,_that.sector,_that.price,_that.marketCap);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String symbol,  String name,  String? exchange,  String? sector,  double? price,  double? marketCap)?  $default,) {final _that = this;
switch (_that) {
case _SearchHitDto() when $default != null:
return $default(_that.symbol,_that.name,_that.exchange,_that.sector,_that.price,_that.marketCap);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SearchHitDto implements SearchHitDto {
  const _SearchHitDto({required this.symbol, required this.name, this.exchange, this.sector, this.price, this.marketCap});
  factory _SearchHitDto.fromJson(Map<String, dynamic> json) => _$SearchHitDtoFromJson(json);

@override final  String symbol;
@override final  String name;
@override final  String? exchange;
@override final  String? sector;
@override final  double? price;
@override final  double? marketCap;

/// Create a copy of SearchHitDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SearchHitDtoCopyWith<_SearchHitDto> get copyWith => __$SearchHitDtoCopyWithImpl<_SearchHitDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SearchHitDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SearchHitDto&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.name, name) || other.name == name)&&(identical(other.exchange, exchange) || other.exchange == exchange)&&(identical(other.sector, sector) || other.sector == sector)&&(identical(other.price, price) || other.price == price)&&(identical(other.marketCap, marketCap) || other.marketCap == marketCap));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,symbol,name,exchange,sector,price,marketCap);

@override
String toString() {
  return 'SearchHitDto(symbol: $symbol, name: $name, exchange: $exchange, sector: $sector, price: $price, marketCap: $marketCap)';
}


}

/// @nodoc
abstract mixin class _$SearchHitDtoCopyWith<$Res> implements $SearchHitDtoCopyWith<$Res> {
  factory _$SearchHitDtoCopyWith(_SearchHitDto value, $Res Function(_SearchHitDto) _then) = __$SearchHitDtoCopyWithImpl;
@override @useResult
$Res call({
 String symbol, String name, String? exchange, String? sector, double? price, double? marketCap
});




}
/// @nodoc
class __$SearchHitDtoCopyWithImpl<$Res>
    implements _$SearchHitDtoCopyWith<$Res> {
  __$SearchHitDtoCopyWithImpl(this._self, this._then);

  final _SearchHitDto _self;
  final $Res Function(_SearchHitDto) _then;

/// Create a copy of SearchHitDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? symbol = null,Object? name = null,Object? exchange = freezed,Object? sector = freezed,Object? price = freezed,Object? marketCap = freezed,}) {
  return _then(_SearchHitDto(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,exchange: freezed == exchange ? _self.exchange : exchange // ignore: cast_nullable_to_non_nullable
as String?,sector: freezed == sector ? _self.sector : sector // ignore: cast_nullable_to_non_nullable
as String?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,marketCap: freezed == marketCap ? _self.marketCap : marketCap // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}

// dart format on
