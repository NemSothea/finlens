// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'stock_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$StockSnapshotDto {

 CompanyDto get company; QuoteDto? get quote; ValuationDto? get valuation; FinancialPeriodDto? get latest; MetricsDto get metrics;
/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StockSnapshotDtoCopyWith<StockSnapshotDto> get copyWith => _$StockSnapshotDtoCopyWithImpl<StockSnapshotDto>(this as StockSnapshotDto, _$identity);

  /// Serializes this StockSnapshotDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is StockSnapshotDto&&(identical(other.company, company) || other.company == company)&&(identical(other.quote, quote) || other.quote == quote)&&(identical(other.valuation, valuation) || other.valuation == valuation)&&(identical(other.latest, latest) || other.latest == latest)&&(identical(other.metrics, metrics) || other.metrics == metrics));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,company,quote,valuation,latest,metrics);

@override
String toString() {
  return 'StockSnapshotDto(company: $company, quote: $quote, valuation: $valuation, latest: $latest, metrics: $metrics)';
}


}

/// @nodoc
abstract mixin class $StockSnapshotDtoCopyWith<$Res>  {
  factory $StockSnapshotDtoCopyWith(StockSnapshotDto value, $Res Function(StockSnapshotDto) _then) = _$StockSnapshotDtoCopyWithImpl;
@useResult
$Res call({
 CompanyDto company, QuoteDto? quote, ValuationDto? valuation, FinancialPeriodDto? latest, MetricsDto metrics
});


$CompanyDtoCopyWith<$Res> get company;$QuoteDtoCopyWith<$Res>? get quote;$ValuationDtoCopyWith<$Res>? get valuation;$FinancialPeriodDtoCopyWith<$Res>? get latest;$MetricsDtoCopyWith<$Res> get metrics;

}
/// @nodoc
class _$StockSnapshotDtoCopyWithImpl<$Res>
    implements $StockSnapshotDtoCopyWith<$Res> {
  _$StockSnapshotDtoCopyWithImpl(this._self, this._then);

  final StockSnapshotDto _self;
  final $Res Function(StockSnapshotDto) _then;

/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? company = null,Object? quote = freezed,Object? valuation = freezed,Object? latest = freezed,Object? metrics = null,}) {
  return _then(_self.copyWith(
company: null == company ? _self.company : company // ignore: cast_nullable_to_non_nullable
as CompanyDto,quote: freezed == quote ? _self.quote : quote // ignore: cast_nullable_to_non_nullable
as QuoteDto?,valuation: freezed == valuation ? _self.valuation : valuation // ignore: cast_nullable_to_non_nullable
as ValuationDto?,latest: freezed == latest ? _self.latest : latest // ignore: cast_nullable_to_non_nullable
as FinancialPeriodDto?,metrics: null == metrics ? _self.metrics : metrics // ignore: cast_nullable_to_non_nullable
as MetricsDto,
  ));
}
/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CompanyDtoCopyWith<$Res> get company {
  
  return $CompanyDtoCopyWith<$Res>(_self.company, (value) {
    return _then(_self.copyWith(company: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$QuoteDtoCopyWith<$Res>? get quote {
    if (_self.quote == null) {
    return null;
  }

  return $QuoteDtoCopyWith<$Res>(_self.quote!, (value) {
    return _then(_self.copyWith(quote: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ValuationDtoCopyWith<$Res>? get valuation {
    if (_self.valuation == null) {
    return null;
  }

  return $ValuationDtoCopyWith<$Res>(_self.valuation!, (value) {
    return _then(_self.copyWith(valuation: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FinancialPeriodDtoCopyWith<$Res>? get latest {
    if (_self.latest == null) {
    return null;
  }

  return $FinancialPeriodDtoCopyWith<$Res>(_self.latest!, (value) {
    return _then(_self.copyWith(latest: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MetricsDtoCopyWith<$Res> get metrics {
  
  return $MetricsDtoCopyWith<$Res>(_self.metrics, (value) {
    return _then(_self.copyWith(metrics: value));
  });
}
}


/// Adds pattern-matching-related methods to [StockSnapshotDto].
extension StockSnapshotDtoPatterns on StockSnapshotDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _StockSnapshotDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _StockSnapshotDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _StockSnapshotDto value)  $default,){
final _that = this;
switch (_that) {
case _StockSnapshotDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _StockSnapshotDto value)?  $default,){
final _that = this;
switch (_that) {
case _StockSnapshotDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( CompanyDto company,  QuoteDto? quote,  ValuationDto? valuation,  FinancialPeriodDto? latest,  MetricsDto metrics)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _StockSnapshotDto() when $default != null:
return $default(_that.company,_that.quote,_that.valuation,_that.latest,_that.metrics);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( CompanyDto company,  QuoteDto? quote,  ValuationDto? valuation,  FinancialPeriodDto? latest,  MetricsDto metrics)  $default,) {final _that = this;
switch (_that) {
case _StockSnapshotDto():
return $default(_that.company,_that.quote,_that.valuation,_that.latest,_that.metrics);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( CompanyDto company,  QuoteDto? quote,  ValuationDto? valuation,  FinancialPeriodDto? latest,  MetricsDto metrics)?  $default,) {final _that = this;
switch (_that) {
case _StockSnapshotDto() when $default != null:
return $default(_that.company,_that.quote,_that.valuation,_that.latest,_that.metrics);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _StockSnapshotDto implements StockSnapshotDto {
  const _StockSnapshotDto({required this.company, this.quote, this.valuation, this.latest, required this.metrics});
  factory _StockSnapshotDto.fromJson(Map<String, dynamic> json) => _$StockSnapshotDtoFromJson(json);

@override final  CompanyDto company;
@override final  QuoteDto? quote;
@override final  ValuationDto? valuation;
@override final  FinancialPeriodDto? latest;
@override final  MetricsDto metrics;

/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StockSnapshotDtoCopyWith<_StockSnapshotDto> get copyWith => __$StockSnapshotDtoCopyWithImpl<_StockSnapshotDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StockSnapshotDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _StockSnapshotDto&&(identical(other.company, company) || other.company == company)&&(identical(other.quote, quote) || other.quote == quote)&&(identical(other.valuation, valuation) || other.valuation == valuation)&&(identical(other.latest, latest) || other.latest == latest)&&(identical(other.metrics, metrics) || other.metrics == metrics));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,company,quote,valuation,latest,metrics);

@override
String toString() {
  return 'StockSnapshotDto(company: $company, quote: $quote, valuation: $valuation, latest: $latest, metrics: $metrics)';
}


}

/// @nodoc
abstract mixin class _$StockSnapshotDtoCopyWith<$Res> implements $StockSnapshotDtoCopyWith<$Res> {
  factory _$StockSnapshotDtoCopyWith(_StockSnapshotDto value, $Res Function(_StockSnapshotDto) _then) = __$StockSnapshotDtoCopyWithImpl;
@override @useResult
$Res call({
 CompanyDto company, QuoteDto? quote, ValuationDto? valuation, FinancialPeriodDto? latest, MetricsDto metrics
});


@override $CompanyDtoCopyWith<$Res> get company;@override $QuoteDtoCopyWith<$Res>? get quote;@override $ValuationDtoCopyWith<$Res>? get valuation;@override $FinancialPeriodDtoCopyWith<$Res>? get latest;@override $MetricsDtoCopyWith<$Res> get metrics;

}
/// @nodoc
class __$StockSnapshotDtoCopyWithImpl<$Res>
    implements _$StockSnapshotDtoCopyWith<$Res> {
  __$StockSnapshotDtoCopyWithImpl(this._self, this._then);

  final _StockSnapshotDto _self;
  final $Res Function(_StockSnapshotDto) _then;

/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? company = null,Object? quote = freezed,Object? valuation = freezed,Object? latest = freezed,Object? metrics = null,}) {
  return _then(_StockSnapshotDto(
company: null == company ? _self.company : company // ignore: cast_nullable_to_non_nullable
as CompanyDto,quote: freezed == quote ? _self.quote : quote // ignore: cast_nullable_to_non_nullable
as QuoteDto?,valuation: freezed == valuation ? _self.valuation : valuation // ignore: cast_nullable_to_non_nullable
as ValuationDto?,latest: freezed == latest ? _self.latest : latest // ignore: cast_nullable_to_non_nullable
as FinancialPeriodDto?,metrics: null == metrics ? _self.metrics : metrics // ignore: cast_nullable_to_non_nullable
as MetricsDto,
  ));
}

/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CompanyDtoCopyWith<$Res> get company {
  
  return $CompanyDtoCopyWith<$Res>(_self.company, (value) {
    return _then(_self.copyWith(company: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$QuoteDtoCopyWith<$Res>? get quote {
    if (_self.quote == null) {
    return null;
  }

  return $QuoteDtoCopyWith<$Res>(_self.quote!, (value) {
    return _then(_self.copyWith(quote: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ValuationDtoCopyWith<$Res>? get valuation {
    if (_self.valuation == null) {
    return null;
  }

  return $ValuationDtoCopyWith<$Res>(_self.valuation!, (value) {
    return _then(_self.copyWith(valuation: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FinancialPeriodDtoCopyWith<$Res>? get latest {
    if (_self.latest == null) {
    return null;
  }

  return $FinancialPeriodDtoCopyWith<$Res>(_self.latest!, (value) {
    return _then(_self.copyWith(latest: value));
  });
}/// Create a copy of StockSnapshotDto
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MetricsDtoCopyWith<$Res> get metrics {
  
  return $MetricsDtoCopyWith<$Res>(_self.metrics, (value) {
    return _then(_self.copyWith(metrics: value));
  });
}
}


/// @nodoc
mixin _$CompanyDto {

 String get symbol; String get name; String? get exchange; String? get currency; String? get sector; String? get industry; String? get country; String? get website; String? get description; int? get employees;
/// Create a copy of CompanyDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CompanyDtoCopyWith<CompanyDto> get copyWith => _$CompanyDtoCopyWithImpl<CompanyDto>(this as CompanyDto, _$identity);

  /// Serializes this CompanyDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CompanyDto&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.name, name) || other.name == name)&&(identical(other.exchange, exchange) || other.exchange == exchange)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.sector, sector) || other.sector == sector)&&(identical(other.industry, industry) || other.industry == industry)&&(identical(other.country, country) || other.country == country)&&(identical(other.website, website) || other.website == website)&&(identical(other.description, description) || other.description == description)&&(identical(other.employees, employees) || other.employees == employees));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,symbol,name,exchange,currency,sector,industry,country,website,description,employees);

@override
String toString() {
  return 'CompanyDto(symbol: $symbol, name: $name, exchange: $exchange, currency: $currency, sector: $sector, industry: $industry, country: $country, website: $website, description: $description, employees: $employees)';
}


}

/// @nodoc
abstract mixin class $CompanyDtoCopyWith<$Res>  {
  factory $CompanyDtoCopyWith(CompanyDto value, $Res Function(CompanyDto) _then) = _$CompanyDtoCopyWithImpl;
@useResult
$Res call({
 String symbol, String name, String? exchange, String? currency, String? sector, String? industry, String? country, String? website, String? description, int? employees
});




}
/// @nodoc
class _$CompanyDtoCopyWithImpl<$Res>
    implements $CompanyDtoCopyWith<$Res> {
  _$CompanyDtoCopyWithImpl(this._self, this._then);

  final CompanyDto _self;
  final $Res Function(CompanyDto) _then;

/// Create a copy of CompanyDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? symbol = null,Object? name = null,Object? exchange = freezed,Object? currency = freezed,Object? sector = freezed,Object? industry = freezed,Object? country = freezed,Object? website = freezed,Object? description = freezed,Object? employees = freezed,}) {
  return _then(_self.copyWith(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,exchange: freezed == exchange ? _self.exchange : exchange // ignore: cast_nullable_to_non_nullable
as String?,currency: freezed == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String?,sector: freezed == sector ? _self.sector : sector // ignore: cast_nullable_to_non_nullable
as String?,industry: freezed == industry ? _self.industry : industry // ignore: cast_nullable_to_non_nullable
as String?,country: freezed == country ? _self.country : country // ignore: cast_nullable_to_non_nullable
as String?,website: freezed == website ? _self.website : website // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,employees: freezed == employees ? _self.employees : employees // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}

}


/// Adds pattern-matching-related methods to [CompanyDto].
extension CompanyDtoPatterns on CompanyDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CompanyDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CompanyDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CompanyDto value)  $default,){
final _that = this;
switch (_that) {
case _CompanyDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CompanyDto value)?  $default,){
final _that = this;
switch (_that) {
case _CompanyDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String symbol,  String name,  String? exchange,  String? currency,  String? sector,  String? industry,  String? country,  String? website,  String? description,  int? employees)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CompanyDto() when $default != null:
return $default(_that.symbol,_that.name,_that.exchange,_that.currency,_that.sector,_that.industry,_that.country,_that.website,_that.description,_that.employees);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String symbol,  String name,  String? exchange,  String? currency,  String? sector,  String? industry,  String? country,  String? website,  String? description,  int? employees)  $default,) {final _that = this;
switch (_that) {
case _CompanyDto():
return $default(_that.symbol,_that.name,_that.exchange,_that.currency,_that.sector,_that.industry,_that.country,_that.website,_that.description,_that.employees);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String symbol,  String name,  String? exchange,  String? currency,  String? sector,  String? industry,  String? country,  String? website,  String? description,  int? employees)?  $default,) {final _that = this;
switch (_that) {
case _CompanyDto() when $default != null:
return $default(_that.symbol,_that.name,_that.exchange,_that.currency,_that.sector,_that.industry,_that.country,_that.website,_that.description,_that.employees);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CompanyDto implements CompanyDto {
  const _CompanyDto({required this.symbol, required this.name, this.exchange, this.currency, this.sector, this.industry, this.country, this.website, this.description, this.employees});
  factory _CompanyDto.fromJson(Map<String, dynamic> json) => _$CompanyDtoFromJson(json);

@override final  String symbol;
@override final  String name;
@override final  String? exchange;
@override final  String? currency;
@override final  String? sector;
@override final  String? industry;
@override final  String? country;
@override final  String? website;
@override final  String? description;
@override final  int? employees;

/// Create a copy of CompanyDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CompanyDtoCopyWith<_CompanyDto> get copyWith => __$CompanyDtoCopyWithImpl<_CompanyDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CompanyDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CompanyDto&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.name, name) || other.name == name)&&(identical(other.exchange, exchange) || other.exchange == exchange)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.sector, sector) || other.sector == sector)&&(identical(other.industry, industry) || other.industry == industry)&&(identical(other.country, country) || other.country == country)&&(identical(other.website, website) || other.website == website)&&(identical(other.description, description) || other.description == description)&&(identical(other.employees, employees) || other.employees == employees));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,symbol,name,exchange,currency,sector,industry,country,website,description,employees);

@override
String toString() {
  return 'CompanyDto(symbol: $symbol, name: $name, exchange: $exchange, currency: $currency, sector: $sector, industry: $industry, country: $country, website: $website, description: $description, employees: $employees)';
}


}

/// @nodoc
abstract mixin class _$CompanyDtoCopyWith<$Res> implements $CompanyDtoCopyWith<$Res> {
  factory _$CompanyDtoCopyWith(_CompanyDto value, $Res Function(_CompanyDto) _then) = __$CompanyDtoCopyWithImpl;
@override @useResult
$Res call({
 String symbol, String name, String? exchange, String? currency, String? sector, String? industry, String? country, String? website, String? description, int? employees
});




}
/// @nodoc
class __$CompanyDtoCopyWithImpl<$Res>
    implements _$CompanyDtoCopyWith<$Res> {
  __$CompanyDtoCopyWithImpl(this._self, this._then);

  final _CompanyDto _self;
  final $Res Function(_CompanyDto) _then;

/// Create a copy of CompanyDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? symbol = null,Object? name = null,Object? exchange = freezed,Object? currency = freezed,Object? sector = freezed,Object? industry = freezed,Object? country = freezed,Object? website = freezed,Object? description = freezed,Object? employees = freezed,}) {
  return _then(_CompanyDto(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,exchange: freezed == exchange ? _self.exchange : exchange // ignore: cast_nullable_to_non_nullable
as String?,currency: freezed == currency ? _self.currency : currency // ignore: cast_nullable_to_non_nullable
as String?,sector: freezed == sector ? _self.sector : sector // ignore: cast_nullable_to_non_nullable
as String?,industry: freezed == industry ? _self.industry : industry // ignore: cast_nullable_to_non_nullable
as String?,country: freezed == country ? _self.country : country // ignore: cast_nullable_to_non_nullable
as String?,website: freezed == website ? _self.website : website // ignore: cast_nullable_to_non_nullable
as String?,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,employees: freezed == employees ? _self.employees : employees // ignore: cast_nullable_to_non_nullable
as int?,
  ));
}


}


/// @nodoc
mixin _$QuoteDto {

 double? get price; double? get previousClose; double? get dayChangePct; double? get marketCap; double? get sharesOutstanding; double? get peRatio; double? get yearHigh; double? get yearLow; String? get asOf;
/// Create a copy of QuoteDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuoteDtoCopyWith<QuoteDto> get copyWith => _$QuoteDtoCopyWithImpl<QuoteDto>(this as QuoteDto, _$identity);

  /// Serializes this QuoteDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is QuoteDto&&(identical(other.price, price) || other.price == price)&&(identical(other.previousClose, previousClose) || other.previousClose == previousClose)&&(identical(other.dayChangePct, dayChangePct) || other.dayChangePct == dayChangePct)&&(identical(other.marketCap, marketCap) || other.marketCap == marketCap)&&(identical(other.sharesOutstanding, sharesOutstanding) || other.sharesOutstanding == sharesOutstanding)&&(identical(other.peRatio, peRatio) || other.peRatio == peRatio)&&(identical(other.yearHigh, yearHigh) || other.yearHigh == yearHigh)&&(identical(other.yearLow, yearLow) || other.yearLow == yearLow)&&(identical(other.asOf, asOf) || other.asOf == asOf));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,price,previousClose,dayChangePct,marketCap,sharesOutstanding,peRatio,yearHigh,yearLow,asOf);

@override
String toString() {
  return 'QuoteDto(price: $price, previousClose: $previousClose, dayChangePct: $dayChangePct, marketCap: $marketCap, sharesOutstanding: $sharesOutstanding, peRatio: $peRatio, yearHigh: $yearHigh, yearLow: $yearLow, asOf: $asOf)';
}


}

/// @nodoc
abstract mixin class $QuoteDtoCopyWith<$Res>  {
  factory $QuoteDtoCopyWith(QuoteDto value, $Res Function(QuoteDto) _then) = _$QuoteDtoCopyWithImpl;
@useResult
$Res call({
 double? price, double? previousClose, double? dayChangePct, double? marketCap, double? sharesOutstanding, double? peRatio, double? yearHigh, double? yearLow, String? asOf
});




}
/// @nodoc
class _$QuoteDtoCopyWithImpl<$Res>
    implements $QuoteDtoCopyWith<$Res> {
  _$QuoteDtoCopyWithImpl(this._self, this._then);

  final QuoteDto _self;
  final $Res Function(QuoteDto) _then;

/// Create a copy of QuoteDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? price = freezed,Object? previousClose = freezed,Object? dayChangePct = freezed,Object? marketCap = freezed,Object? sharesOutstanding = freezed,Object? peRatio = freezed,Object? yearHigh = freezed,Object? yearLow = freezed,Object? asOf = freezed,}) {
  return _then(_self.copyWith(
price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,previousClose: freezed == previousClose ? _self.previousClose : previousClose // ignore: cast_nullable_to_non_nullable
as double?,dayChangePct: freezed == dayChangePct ? _self.dayChangePct : dayChangePct // ignore: cast_nullable_to_non_nullable
as double?,marketCap: freezed == marketCap ? _self.marketCap : marketCap // ignore: cast_nullable_to_non_nullable
as double?,sharesOutstanding: freezed == sharesOutstanding ? _self.sharesOutstanding : sharesOutstanding // ignore: cast_nullable_to_non_nullable
as double?,peRatio: freezed == peRatio ? _self.peRatio : peRatio // ignore: cast_nullable_to_non_nullable
as double?,yearHigh: freezed == yearHigh ? _self.yearHigh : yearHigh // ignore: cast_nullable_to_non_nullable
as double?,yearLow: freezed == yearLow ? _self.yearLow : yearLow // ignore: cast_nullable_to_non_nullable
as double?,asOf: freezed == asOf ? _self.asOf : asOf // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [QuoteDto].
extension QuoteDtoPatterns on QuoteDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _QuoteDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _QuoteDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _QuoteDto value)  $default,){
final _that = this;
switch (_that) {
case _QuoteDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _QuoteDto value)?  $default,){
final _that = this;
switch (_that) {
case _QuoteDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double? price,  double? previousClose,  double? dayChangePct,  double? marketCap,  double? sharesOutstanding,  double? peRatio,  double? yearHigh,  double? yearLow,  String? asOf)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _QuoteDto() when $default != null:
return $default(_that.price,_that.previousClose,_that.dayChangePct,_that.marketCap,_that.sharesOutstanding,_that.peRatio,_that.yearHigh,_that.yearLow,_that.asOf);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double? price,  double? previousClose,  double? dayChangePct,  double? marketCap,  double? sharesOutstanding,  double? peRatio,  double? yearHigh,  double? yearLow,  String? asOf)  $default,) {final _that = this;
switch (_that) {
case _QuoteDto():
return $default(_that.price,_that.previousClose,_that.dayChangePct,_that.marketCap,_that.sharesOutstanding,_that.peRatio,_that.yearHigh,_that.yearLow,_that.asOf);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double? price,  double? previousClose,  double? dayChangePct,  double? marketCap,  double? sharesOutstanding,  double? peRatio,  double? yearHigh,  double? yearLow,  String? asOf)?  $default,) {final _that = this;
switch (_that) {
case _QuoteDto() when $default != null:
return $default(_that.price,_that.previousClose,_that.dayChangePct,_that.marketCap,_that.sharesOutstanding,_that.peRatio,_that.yearHigh,_that.yearLow,_that.asOf);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _QuoteDto implements QuoteDto {
  const _QuoteDto({this.price, this.previousClose, this.dayChangePct, this.marketCap, this.sharesOutstanding, this.peRatio, this.yearHigh, this.yearLow, this.asOf});
  factory _QuoteDto.fromJson(Map<String, dynamic> json) => _$QuoteDtoFromJson(json);

@override final  double? price;
@override final  double? previousClose;
@override final  double? dayChangePct;
@override final  double? marketCap;
@override final  double? sharesOutstanding;
@override final  double? peRatio;
@override final  double? yearHigh;
@override final  double? yearLow;
@override final  String? asOf;

/// Create a copy of QuoteDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuoteDtoCopyWith<_QuoteDto> get copyWith => __$QuoteDtoCopyWithImpl<_QuoteDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$QuoteDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _QuoteDto&&(identical(other.price, price) || other.price == price)&&(identical(other.previousClose, previousClose) || other.previousClose == previousClose)&&(identical(other.dayChangePct, dayChangePct) || other.dayChangePct == dayChangePct)&&(identical(other.marketCap, marketCap) || other.marketCap == marketCap)&&(identical(other.sharesOutstanding, sharesOutstanding) || other.sharesOutstanding == sharesOutstanding)&&(identical(other.peRatio, peRatio) || other.peRatio == peRatio)&&(identical(other.yearHigh, yearHigh) || other.yearHigh == yearHigh)&&(identical(other.yearLow, yearLow) || other.yearLow == yearLow)&&(identical(other.asOf, asOf) || other.asOf == asOf));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,price,previousClose,dayChangePct,marketCap,sharesOutstanding,peRatio,yearHigh,yearLow,asOf);

@override
String toString() {
  return 'QuoteDto(price: $price, previousClose: $previousClose, dayChangePct: $dayChangePct, marketCap: $marketCap, sharesOutstanding: $sharesOutstanding, peRatio: $peRatio, yearHigh: $yearHigh, yearLow: $yearLow, asOf: $asOf)';
}


}

/// @nodoc
abstract mixin class _$QuoteDtoCopyWith<$Res> implements $QuoteDtoCopyWith<$Res> {
  factory _$QuoteDtoCopyWith(_QuoteDto value, $Res Function(_QuoteDto) _then) = __$QuoteDtoCopyWithImpl;
@override @useResult
$Res call({
 double? price, double? previousClose, double? dayChangePct, double? marketCap, double? sharesOutstanding, double? peRatio, double? yearHigh, double? yearLow, String? asOf
});




}
/// @nodoc
class __$QuoteDtoCopyWithImpl<$Res>
    implements _$QuoteDtoCopyWith<$Res> {
  __$QuoteDtoCopyWithImpl(this._self, this._then);

  final _QuoteDto _self;
  final $Res Function(_QuoteDto) _then;

/// Create a copy of QuoteDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? price = freezed,Object? previousClose = freezed,Object? dayChangePct = freezed,Object? marketCap = freezed,Object? sharesOutstanding = freezed,Object? peRatio = freezed,Object? yearHigh = freezed,Object? yearLow = freezed,Object? asOf = freezed,}) {
  return _then(_QuoteDto(
price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,previousClose: freezed == previousClose ? _self.previousClose : previousClose // ignore: cast_nullable_to_non_nullable
as double?,dayChangePct: freezed == dayChangePct ? _self.dayChangePct : dayChangePct // ignore: cast_nullable_to_non_nullable
as double?,marketCap: freezed == marketCap ? _self.marketCap : marketCap // ignore: cast_nullable_to_non_nullable
as double?,sharesOutstanding: freezed == sharesOutstanding ? _self.sharesOutstanding : sharesOutstanding // ignore: cast_nullable_to_non_nullable
as double?,peRatio: freezed == peRatio ? _self.peRatio : peRatio // ignore: cast_nullable_to_non_nullable
as double?,yearHigh: freezed == yearHigh ? _self.yearHigh : yearHigh // ignore: cast_nullable_to_non_nullable
as double?,yearLow: freezed == yearLow ? _self.yearLow : yearLow // ignore: cast_nullable_to_non_nullable
as double?,asOf: freezed == asOf ? _self.asOf : asOf // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$ValuationDto {

 double? get fairValuePerShare; double? get marginOfSafetyPct; double? get impliedGrowthRate; String? get computedAt;
/// Create a copy of ValuationDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ValuationDtoCopyWith<ValuationDto> get copyWith => _$ValuationDtoCopyWithImpl<ValuationDto>(this as ValuationDto, _$identity);

  /// Serializes this ValuationDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValuationDto&&(identical(other.fairValuePerShare, fairValuePerShare) || other.fairValuePerShare == fairValuePerShare)&&(identical(other.marginOfSafetyPct, marginOfSafetyPct) || other.marginOfSafetyPct == marginOfSafetyPct)&&(identical(other.impliedGrowthRate, impliedGrowthRate) || other.impliedGrowthRate == impliedGrowthRate)&&(identical(other.computedAt, computedAt) || other.computedAt == computedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,fairValuePerShare,marginOfSafetyPct,impliedGrowthRate,computedAt);

@override
String toString() {
  return 'ValuationDto(fairValuePerShare: $fairValuePerShare, marginOfSafetyPct: $marginOfSafetyPct, impliedGrowthRate: $impliedGrowthRate, computedAt: $computedAt)';
}


}

/// @nodoc
abstract mixin class $ValuationDtoCopyWith<$Res>  {
  factory $ValuationDtoCopyWith(ValuationDto value, $Res Function(ValuationDto) _then) = _$ValuationDtoCopyWithImpl;
@useResult
$Res call({
 double? fairValuePerShare, double? marginOfSafetyPct, double? impliedGrowthRate, String? computedAt
});




}
/// @nodoc
class _$ValuationDtoCopyWithImpl<$Res>
    implements $ValuationDtoCopyWith<$Res> {
  _$ValuationDtoCopyWithImpl(this._self, this._then);

  final ValuationDto _self;
  final $Res Function(ValuationDto) _then;

/// Create a copy of ValuationDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? fairValuePerShare = freezed,Object? marginOfSafetyPct = freezed,Object? impliedGrowthRate = freezed,Object? computedAt = freezed,}) {
  return _then(_self.copyWith(
fairValuePerShare: freezed == fairValuePerShare ? _self.fairValuePerShare : fairValuePerShare // ignore: cast_nullable_to_non_nullable
as double?,marginOfSafetyPct: freezed == marginOfSafetyPct ? _self.marginOfSafetyPct : marginOfSafetyPct // ignore: cast_nullable_to_non_nullable
as double?,impliedGrowthRate: freezed == impliedGrowthRate ? _self.impliedGrowthRate : impliedGrowthRate // ignore: cast_nullable_to_non_nullable
as double?,computedAt: freezed == computedAt ? _self.computedAt : computedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ValuationDto].
extension ValuationDtoPatterns on ValuationDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ValuationDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ValuationDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ValuationDto value)  $default,){
final _that = this;
switch (_that) {
case _ValuationDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ValuationDto value)?  $default,){
final _that = this;
switch (_that) {
case _ValuationDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double? fairValuePerShare,  double? marginOfSafetyPct,  double? impliedGrowthRate,  String? computedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValuationDto() when $default != null:
return $default(_that.fairValuePerShare,_that.marginOfSafetyPct,_that.impliedGrowthRate,_that.computedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double? fairValuePerShare,  double? marginOfSafetyPct,  double? impliedGrowthRate,  String? computedAt)  $default,) {final _that = this;
switch (_that) {
case _ValuationDto():
return $default(_that.fairValuePerShare,_that.marginOfSafetyPct,_that.impliedGrowthRate,_that.computedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double? fairValuePerShare,  double? marginOfSafetyPct,  double? impliedGrowthRate,  String? computedAt)?  $default,) {final _that = this;
switch (_that) {
case _ValuationDto() when $default != null:
return $default(_that.fairValuePerShare,_that.marginOfSafetyPct,_that.impliedGrowthRate,_that.computedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ValuationDto implements ValuationDto {
  const _ValuationDto({this.fairValuePerShare, this.marginOfSafetyPct, this.impliedGrowthRate, this.computedAt});
  factory _ValuationDto.fromJson(Map<String, dynamic> json) => _$ValuationDtoFromJson(json);

@override final  double? fairValuePerShare;
@override final  double? marginOfSafetyPct;
@override final  double? impliedGrowthRate;
@override final  String? computedAt;

/// Create a copy of ValuationDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ValuationDtoCopyWith<_ValuationDto> get copyWith => __$ValuationDtoCopyWithImpl<_ValuationDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ValuationDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValuationDto&&(identical(other.fairValuePerShare, fairValuePerShare) || other.fairValuePerShare == fairValuePerShare)&&(identical(other.marginOfSafetyPct, marginOfSafetyPct) || other.marginOfSafetyPct == marginOfSafetyPct)&&(identical(other.impliedGrowthRate, impliedGrowthRate) || other.impliedGrowthRate == impliedGrowthRate)&&(identical(other.computedAt, computedAt) || other.computedAt == computedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,fairValuePerShare,marginOfSafetyPct,impliedGrowthRate,computedAt);

@override
String toString() {
  return 'ValuationDto(fairValuePerShare: $fairValuePerShare, marginOfSafetyPct: $marginOfSafetyPct, impliedGrowthRate: $impliedGrowthRate, computedAt: $computedAt)';
}


}

/// @nodoc
abstract mixin class _$ValuationDtoCopyWith<$Res> implements $ValuationDtoCopyWith<$Res> {
  factory _$ValuationDtoCopyWith(_ValuationDto value, $Res Function(_ValuationDto) _then) = __$ValuationDtoCopyWithImpl;
@override @useResult
$Res call({
 double? fairValuePerShare, double? marginOfSafetyPct, double? impliedGrowthRate, String? computedAt
});




}
/// @nodoc
class __$ValuationDtoCopyWithImpl<$Res>
    implements _$ValuationDtoCopyWith<$Res> {
  __$ValuationDtoCopyWithImpl(this._self, this._then);

  final _ValuationDto _self;
  final $Res Function(_ValuationDto) _then;

/// Create a copy of ValuationDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? fairValuePerShare = freezed,Object? marginOfSafetyPct = freezed,Object? impliedGrowthRate = freezed,Object? computedAt = freezed,}) {
  return _then(_ValuationDto(
fairValuePerShare: freezed == fairValuePerShare ? _self.fairValuePerShare : fairValuePerShare // ignore: cast_nullable_to_non_nullable
as double?,marginOfSafetyPct: freezed == marginOfSafetyPct ? _self.marginOfSafetyPct : marginOfSafetyPct // ignore: cast_nullable_to_non_nullable
as double?,impliedGrowthRate: freezed == impliedGrowthRate ? _self.impliedGrowthRate : impliedGrowthRate // ignore: cast_nullable_to_non_nullable
as double?,computedAt: freezed == computedAt ? _self.computedAt : computedAt // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$FinancialPeriodDto {

 String get period; int get fiscalYear; String? get periodEnd; double? get revenue; double? get grossProfit; double? get operatingIncome; double? get ebitda; double? get netIncome; double? get eps; double? get epsDiluted; double? get sharesDiluted; double? get totalAssets; double? get totalEquity; double? get totalDebt; double? get totalCurrentAssets; double? get totalCurrentLiabilities; double? get cashAndEquivalents; double? get operatingCashFlow; double? get capitalExpenditure; double? get freeCashFlow;
/// Create a copy of FinancialPeriodDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FinancialPeriodDtoCopyWith<FinancialPeriodDto> get copyWith => _$FinancialPeriodDtoCopyWithImpl<FinancialPeriodDto>(this as FinancialPeriodDto, _$identity);

  /// Serializes this FinancialPeriodDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FinancialPeriodDto&&(identical(other.period, period) || other.period == period)&&(identical(other.fiscalYear, fiscalYear) || other.fiscalYear == fiscalYear)&&(identical(other.periodEnd, periodEnd) || other.periodEnd == periodEnd)&&(identical(other.revenue, revenue) || other.revenue == revenue)&&(identical(other.grossProfit, grossProfit) || other.grossProfit == grossProfit)&&(identical(other.operatingIncome, operatingIncome) || other.operatingIncome == operatingIncome)&&(identical(other.ebitda, ebitda) || other.ebitda == ebitda)&&(identical(other.netIncome, netIncome) || other.netIncome == netIncome)&&(identical(other.eps, eps) || other.eps == eps)&&(identical(other.epsDiluted, epsDiluted) || other.epsDiluted == epsDiluted)&&(identical(other.sharesDiluted, sharesDiluted) || other.sharesDiluted == sharesDiluted)&&(identical(other.totalAssets, totalAssets) || other.totalAssets == totalAssets)&&(identical(other.totalEquity, totalEquity) || other.totalEquity == totalEquity)&&(identical(other.totalDebt, totalDebt) || other.totalDebt == totalDebt)&&(identical(other.totalCurrentAssets, totalCurrentAssets) || other.totalCurrentAssets == totalCurrentAssets)&&(identical(other.totalCurrentLiabilities, totalCurrentLiabilities) || other.totalCurrentLiabilities == totalCurrentLiabilities)&&(identical(other.cashAndEquivalents, cashAndEquivalents) || other.cashAndEquivalents == cashAndEquivalents)&&(identical(other.operatingCashFlow, operatingCashFlow) || other.operatingCashFlow == operatingCashFlow)&&(identical(other.capitalExpenditure, capitalExpenditure) || other.capitalExpenditure == capitalExpenditure)&&(identical(other.freeCashFlow, freeCashFlow) || other.freeCashFlow == freeCashFlow));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,period,fiscalYear,periodEnd,revenue,grossProfit,operatingIncome,ebitda,netIncome,eps,epsDiluted,sharesDiluted,totalAssets,totalEquity,totalDebt,totalCurrentAssets,totalCurrentLiabilities,cashAndEquivalents,operatingCashFlow,capitalExpenditure,freeCashFlow]);

@override
String toString() {
  return 'FinancialPeriodDto(period: $period, fiscalYear: $fiscalYear, periodEnd: $periodEnd, revenue: $revenue, grossProfit: $grossProfit, operatingIncome: $operatingIncome, ebitda: $ebitda, netIncome: $netIncome, eps: $eps, epsDiluted: $epsDiluted, sharesDiluted: $sharesDiluted, totalAssets: $totalAssets, totalEquity: $totalEquity, totalDebt: $totalDebt, totalCurrentAssets: $totalCurrentAssets, totalCurrentLiabilities: $totalCurrentLiabilities, cashAndEquivalents: $cashAndEquivalents, operatingCashFlow: $operatingCashFlow, capitalExpenditure: $capitalExpenditure, freeCashFlow: $freeCashFlow)';
}


}

/// @nodoc
abstract mixin class $FinancialPeriodDtoCopyWith<$Res>  {
  factory $FinancialPeriodDtoCopyWith(FinancialPeriodDto value, $Res Function(FinancialPeriodDto) _then) = _$FinancialPeriodDtoCopyWithImpl;
@useResult
$Res call({
 String period, int fiscalYear, String? periodEnd, double? revenue, double? grossProfit, double? operatingIncome, double? ebitda, double? netIncome, double? eps, double? epsDiluted, double? sharesDiluted, double? totalAssets, double? totalEquity, double? totalDebt, double? totalCurrentAssets, double? totalCurrentLiabilities, double? cashAndEquivalents, double? operatingCashFlow, double? capitalExpenditure, double? freeCashFlow
});




}
/// @nodoc
class _$FinancialPeriodDtoCopyWithImpl<$Res>
    implements $FinancialPeriodDtoCopyWith<$Res> {
  _$FinancialPeriodDtoCopyWithImpl(this._self, this._then);

  final FinancialPeriodDto _self;
  final $Res Function(FinancialPeriodDto) _then;

/// Create a copy of FinancialPeriodDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? period = null,Object? fiscalYear = null,Object? periodEnd = freezed,Object? revenue = freezed,Object? grossProfit = freezed,Object? operatingIncome = freezed,Object? ebitda = freezed,Object? netIncome = freezed,Object? eps = freezed,Object? epsDiluted = freezed,Object? sharesDiluted = freezed,Object? totalAssets = freezed,Object? totalEquity = freezed,Object? totalDebt = freezed,Object? totalCurrentAssets = freezed,Object? totalCurrentLiabilities = freezed,Object? cashAndEquivalents = freezed,Object? operatingCashFlow = freezed,Object? capitalExpenditure = freezed,Object? freeCashFlow = freezed,}) {
  return _then(_self.copyWith(
period: null == period ? _self.period : period // ignore: cast_nullable_to_non_nullable
as String,fiscalYear: null == fiscalYear ? _self.fiscalYear : fiscalYear // ignore: cast_nullable_to_non_nullable
as int,periodEnd: freezed == periodEnd ? _self.periodEnd : periodEnd // ignore: cast_nullable_to_non_nullable
as String?,revenue: freezed == revenue ? _self.revenue : revenue // ignore: cast_nullable_to_non_nullable
as double?,grossProfit: freezed == grossProfit ? _self.grossProfit : grossProfit // ignore: cast_nullable_to_non_nullable
as double?,operatingIncome: freezed == operatingIncome ? _self.operatingIncome : operatingIncome // ignore: cast_nullable_to_non_nullable
as double?,ebitda: freezed == ebitda ? _self.ebitda : ebitda // ignore: cast_nullable_to_non_nullable
as double?,netIncome: freezed == netIncome ? _self.netIncome : netIncome // ignore: cast_nullable_to_non_nullable
as double?,eps: freezed == eps ? _self.eps : eps // ignore: cast_nullable_to_non_nullable
as double?,epsDiluted: freezed == epsDiluted ? _self.epsDiluted : epsDiluted // ignore: cast_nullable_to_non_nullable
as double?,sharesDiluted: freezed == sharesDiluted ? _self.sharesDiluted : sharesDiluted // ignore: cast_nullable_to_non_nullable
as double?,totalAssets: freezed == totalAssets ? _self.totalAssets : totalAssets // ignore: cast_nullable_to_non_nullable
as double?,totalEquity: freezed == totalEquity ? _self.totalEquity : totalEquity // ignore: cast_nullable_to_non_nullable
as double?,totalDebt: freezed == totalDebt ? _self.totalDebt : totalDebt // ignore: cast_nullable_to_non_nullable
as double?,totalCurrentAssets: freezed == totalCurrentAssets ? _self.totalCurrentAssets : totalCurrentAssets // ignore: cast_nullable_to_non_nullable
as double?,totalCurrentLiabilities: freezed == totalCurrentLiabilities ? _self.totalCurrentLiabilities : totalCurrentLiabilities // ignore: cast_nullable_to_non_nullable
as double?,cashAndEquivalents: freezed == cashAndEquivalents ? _self.cashAndEquivalents : cashAndEquivalents // ignore: cast_nullable_to_non_nullable
as double?,operatingCashFlow: freezed == operatingCashFlow ? _self.operatingCashFlow : operatingCashFlow // ignore: cast_nullable_to_non_nullable
as double?,capitalExpenditure: freezed == capitalExpenditure ? _self.capitalExpenditure : capitalExpenditure // ignore: cast_nullable_to_non_nullable
as double?,freeCashFlow: freezed == freeCashFlow ? _self.freeCashFlow : freeCashFlow // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [FinancialPeriodDto].
extension FinancialPeriodDtoPatterns on FinancialPeriodDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FinancialPeriodDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FinancialPeriodDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FinancialPeriodDto value)  $default,){
final _that = this;
switch (_that) {
case _FinancialPeriodDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FinancialPeriodDto value)?  $default,){
final _that = this;
switch (_that) {
case _FinancialPeriodDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String period,  int fiscalYear,  String? periodEnd,  double? revenue,  double? grossProfit,  double? operatingIncome,  double? ebitda,  double? netIncome,  double? eps,  double? epsDiluted,  double? sharesDiluted,  double? totalAssets,  double? totalEquity,  double? totalDebt,  double? totalCurrentAssets,  double? totalCurrentLiabilities,  double? cashAndEquivalents,  double? operatingCashFlow,  double? capitalExpenditure,  double? freeCashFlow)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FinancialPeriodDto() when $default != null:
return $default(_that.period,_that.fiscalYear,_that.periodEnd,_that.revenue,_that.grossProfit,_that.operatingIncome,_that.ebitda,_that.netIncome,_that.eps,_that.epsDiluted,_that.sharesDiluted,_that.totalAssets,_that.totalEquity,_that.totalDebt,_that.totalCurrentAssets,_that.totalCurrentLiabilities,_that.cashAndEquivalents,_that.operatingCashFlow,_that.capitalExpenditure,_that.freeCashFlow);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String period,  int fiscalYear,  String? periodEnd,  double? revenue,  double? grossProfit,  double? operatingIncome,  double? ebitda,  double? netIncome,  double? eps,  double? epsDiluted,  double? sharesDiluted,  double? totalAssets,  double? totalEquity,  double? totalDebt,  double? totalCurrentAssets,  double? totalCurrentLiabilities,  double? cashAndEquivalents,  double? operatingCashFlow,  double? capitalExpenditure,  double? freeCashFlow)  $default,) {final _that = this;
switch (_that) {
case _FinancialPeriodDto():
return $default(_that.period,_that.fiscalYear,_that.periodEnd,_that.revenue,_that.grossProfit,_that.operatingIncome,_that.ebitda,_that.netIncome,_that.eps,_that.epsDiluted,_that.sharesDiluted,_that.totalAssets,_that.totalEquity,_that.totalDebt,_that.totalCurrentAssets,_that.totalCurrentLiabilities,_that.cashAndEquivalents,_that.operatingCashFlow,_that.capitalExpenditure,_that.freeCashFlow);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String period,  int fiscalYear,  String? periodEnd,  double? revenue,  double? grossProfit,  double? operatingIncome,  double? ebitda,  double? netIncome,  double? eps,  double? epsDiluted,  double? sharesDiluted,  double? totalAssets,  double? totalEquity,  double? totalDebt,  double? totalCurrentAssets,  double? totalCurrentLiabilities,  double? cashAndEquivalents,  double? operatingCashFlow,  double? capitalExpenditure,  double? freeCashFlow)?  $default,) {final _that = this;
switch (_that) {
case _FinancialPeriodDto() when $default != null:
return $default(_that.period,_that.fiscalYear,_that.periodEnd,_that.revenue,_that.grossProfit,_that.operatingIncome,_that.ebitda,_that.netIncome,_that.eps,_that.epsDiluted,_that.sharesDiluted,_that.totalAssets,_that.totalEquity,_that.totalDebt,_that.totalCurrentAssets,_that.totalCurrentLiabilities,_that.cashAndEquivalents,_that.operatingCashFlow,_that.capitalExpenditure,_that.freeCashFlow);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FinancialPeriodDto implements FinancialPeriodDto {
  const _FinancialPeriodDto({required this.period, required this.fiscalYear, this.periodEnd, this.revenue, this.grossProfit, this.operatingIncome, this.ebitda, this.netIncome, this.eps, this.epsDiluted, this.sharesDiluted, this.totalAssets, this.totalEquity, this.totalDebt, this.totalCurrentAssets, this.totalCurrentLiabilities, this.cashAndEquivalents, this.operatingCashFlow, this.capitalExpenditure, this.freeCashFlow});
  factory _FinancialPeriodDto.fromJson(Map<String, dynamic> json) => _$FinancialPeriodDtoFromJson(json);

@override final  String period;
@override final  int fiscalYear;
@override final  String? periodEnd;
@override final  double? revenue;
@override final  double? grossProfit;
@override final  double? operatingIncome;
@override final  double? ebitda;
@override final  double? netIncome;
@override final  double? eps;
@override final  double? epsDiluted;
@override final  double? sharesDiluted;
@override final  double? totalAssets;
@override final  double? totalEquity;
@override final  double? totalDebt;
@override final  double? totalCurrentAssets;
@override final  double? totalCurrentLiabilities;
@override final  double? cashAndEquivalents;
@override final  double? operatingCashFlow;
@override final  double? capitalExpenditure;
@override final  double? freeCashFlow;

/// Create a copy of FinancialPeriodDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FinancialPeriodDtoCopyWith<_FinancialPeriodDto> get copyWith => __$FinancialPeriodDtoCopyWithImpl<_FinancialPeriodDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FinancialPeriodDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FinancialPeriodDto&&(identical(other.period, period) || other.period == period)&&(identical(other.fiscalYear, fiscalYear) || other.fiscalYear == fiscalYear)&&(identical(other.periodEnd, periodEnd) || other.periodEnd == periodEnd)&&(identical(other.revenue, revenue) || other.revenue == revenue)&&(identical(other.grossProfit, grossProfit) || other.grossProfit == grossProfit)&&(identical(other.operatingIncome, operatingIncome) || other.operatingIncome == operatingIncome)&&(identical(other.ebitda, ebitda) || other.ebitda == ebitda)&&(identical(other.netIncome, netIncome) || other.netIncome == netIncome)&&(identical(other.eps, eps) || other.eps == eps)&&(identical(other.epsDiluted, epsDiluted) || other.epsDiluted == epsDiluted)&&(identical(other.sharesDiluted, sharesDiluted) || other.sharesDiluted == sharesDiluted)&&(identical(other.totalAssets, totalAssets) || other.totalAssets == totalAssets)&&(identical(other.totalEquity, totalEquity) || other.totalEquity == totalEquity)&&(identical(other.totalDebt, totalDebt) || other.totalDebt == totalDebt)&&(identical(other.totalCurrentAssets, totalCurrentAssets) || other.totalCurrentAssets == totalCurrentAssets)&&(identical(other.totalCurrentLiabilities, totalCurrentLiabilities) || other.totalCurrentLiabilities == totalCurrentLiabilities)&&(identical(other.cashAndEquivalents, cashAndEquivalents) || other.cashAndEquivalents == cashAndEquivalents)&&(identical(other.operatingCashFlow, operatingCashFlow) || other.operatingCashFlow == operatingCashFlow)&&(identical(other.capitalExpenditure, capitalExpenditure) || other.capitalExpenditure == capitalExpenditure)&&(identical(other.freeCashFlow, freeCashFlow) || other.freeCashFlow == freeCashFlow));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,period,fiscalYear,periodEnd,revenue,grossProfit,operatingIncome,ebitda,netIncome,eps,epsDiluted,sharesDiluted,totalAssets,totalEquity,totalDebt,totalCurrentAssets,totalCurrentLiabilities,cashAndEquivalents,operatingCashFlow,capitalExpenditure,freeCashFlow]);

@override
String toString() {
  return 'FinancialPeriodDto(period: $period, fiscalYear: $fiscalYear, periodEnd: $periodEnd, revenue: $revenue, grossProfit: $grossProfit, operatingIncome: $operatingIncome, ebitda: $ebitda, netIncome: $netIncome, eps: $eps, epsDiluted: $epsDiluted, sharesDiluted: $sharesDiluted, totalAssets: $totalAssets, totalEquity: $totalEquity, totalDebt: $totalDebt, totalCurrentAssets: $totalCurrentAssets, totalCurrentLiabilities: $totalCurrentLiabilities, cashAndEquivalents: $cashAndEquivalents, operatingCashFlow: $operatingCashFlow, capitalExpenditure: $capitalExpenditure, freeCashFlow: $freeCashFlow)';
}


}

/// @nodoc
abstract mixin class _$FinancialPeriodDtoCopyWith<$Res> implements $FinancialPeriodDtoCopyWith<$Res> {
  factory _$FinancialPeriodDtoCopyWith(_FinancialPeriodDto value, $Res Function(_FinancialPeriodDto) _then) = __$FinancialPeriodDtoCopyWithImpl;
@override @useResult
$Res call({
 String period, int fiscalYear, String? periodEnd, double? revenue, double? grossProfit, double? operatingIncome, double? ebitda, double? netIncome, double? eps, double? epsDiluted, double? sharesDiluted, double? totalAssets, double? totalEquity, double? totalDebt, double? totalCurrentAssets, double? totalCurrentLiabilities, double? cashAndEquivalents, double? operatingCashFlow, double? capitalExpenditure, double? freeCashFlow
});




}
/// @nodoc
class __$FinancialPeriodDtoCopyWithImpl<$Res>
    implements _$FinancialPeriodDtoCopyWith<$Res> {
  __$FinancialPeriodDtoCopyWithImpl(this._self, this._then);

  final _FinancialPeriodDto _self;
  final $Res Function(_FinancialPeriodDto) _then;

/// Create a copy of FinancialPeriodDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? period = null,Object? fiscalYear = null,Object? periodEnd = freezed,Object? revenue = freezed,Object? grossProfit = freezed,Object? operatingIncome = freezed,Object? ebitda = freezed,Object? netIncome = freezed,Object? eps = freezed,Object? epsDiluted = freezed,Object? sharesDiluted = freezed,Object? totalAssets = freezed,Object? totalEquity = freezed,Object? totalDebt = freezed,Object? totalCurrentAssets = freezed,Object? totalCurrentLiabilities = freezed,Object? cashAndEquivalents = freezed,Object? operatingCashFlow = freezed,Object? capitalExpenditure = freezed,Object? freeCashFlow = freezed,}) {
  return _then(_FinancialPeriodDto(
period: null == period ? _self.period : period // ignore: cast_nullable_to_non_nullable
as String,fiscalYear: null == fiscalYear ? _self.fiscalYear : fiscalYear // ignore: cast_nullable_to_non_nullable
as int,periodEnd: freezed == periodEnd ? _self.periodEnd : periodEnd // ignore: cast_nullable_to_non_nullable
as String?,revenue: freezed == revenue ? _self.revenue : revenue // ignore: cast_nullable_to_non_nullable
as double?,grossProfit: freezed == grossProfit ? _self.grossProfit : grossProfit // ignore: cast_nullable_to_non_nullable
as double?,operatingIncome: freezed == operatingIncome ? _self.operatingIncome : operatingIncome // ignore: cast_nullable_to_non_nullable
as double?,ebitda: freezed == ebitda ? _self.ebitda : ebitda // ignore: cast_nullable_to_non_nullable
as double?,netIncome: freezed == netIncome ? _self.netIncome : netIncome // ignore: cast_nullable_to_non_nullable
as double?,eps: freezed == eps ? _self.eps : eps // ignore: cast_nullable_to_non_nullable
as double?,epsDiluted: freezed == epsDiluted ? _self.epsDiluted : epsDiluted // ignore: cast_nullable_to_non_nullable
as double?,sharesDiluted: freezed == sharesDiluted ? _self.sharesDiluted : sharesDiluted // ignore: cast_nullable_to_non_nullable
as double?,totalAssets: freezed == totalAssets ? _self.totalAssets : totalAssets // ignore: cast_nullable_to_non_nullable
as double?,totalEquity: freezed == totalEquity ? _self.totalEquity : totalEquity // ignore: cast_nullable_to_non_nullable
as double?,totalDebt: freezed == totalDebt ? _self.totalDebt : totalDebt // ignore: cast_nullable_to_non_nullable
as double?,totalCurrentAssets: freezed == totalCurrentAssets ? _self.totalCurrentAssets : totalCurrentAssets // ignore: cast_nullable_to_non_nullable
as double?,totalCurrentLiabilities: freezed == totalCurrentLiabilities ? _self.totalCurrentLiabilities : totalCurrentLiabilities // ignore: cast_nullable_to_non_nullable
as double?,cashAndEquivalents: freezed == cashAndEquivalents ? _self.cashAndEquivalents : cashAndEquivalents // ignore: cast_nullable_to_non_nullable
as double?,operatingCashFlow: freezed == operatingCashFlow ? _self.operatingCashFlow : operatingCashFlow // ignore: cast_nullable_to_non_nullable
as double?,capitalExpenditure: freezed == capitalExpenditure ? _self.capitalExpenditure : capitalExpenditure // ignore: cast_nullable_to_non_nullable
as double?,freeCashFlow: freezed == freeCashFlow ? _self.freeCashFlow : freeCashFlow // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}


/// @nodoc
mixin _$MetricsDto {

 double? get grossMargin; double? get operatingMargin; double? get netMargin; double? get fcfMargin; double? get returnOnEquity; double? get returnOnAssets; double? get currentRatio; double? get debtToEquity; double? get netDebt; double? get revenueCagr5y; double? get revenueYoy; double? get netIncomeCagr5y; double? get fcfCagr5y;
/// Create a copy of MetricsDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MetricsDtoCopyWith<MetricsDto> get copyWith => _$MetricsDtoCopyWithImpl<MetricsDto>(this as MetricsDto, _$identity);

  /// Serializes this MetricsDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MetricsDto&&(identical(other.grossMargin, grossMargin) || other.grossMargin == grossMargin)&&(identical(other.operatingMargin, operatingMargin) || other.operatingMargin == operatingMargin)&&(identical(other.netMargin, netMargin) || other.netMargin == netMargin)&&(identical(other.fcfMargin, fcfMargin) || other.fcfMargin == fcfMargin)&&(identical(other.returnOnEquity, returnOnEquity) || other.returnOnEquity == returnOnEquity)&&(identical(other.returnOnAssets, returnOnAssets) || other.returnOnAssets == returnOnAssets)&&(identical(other.currentRatio, currentRatio) || other.currentRatio == currentRatio)&&(identical(other.debtToEquity, debtToEquity) || other.debtToEquity == debtToEquity)&&(identical(other.netDebt, netDebt) || other.netDebt == netDebt)&&(identical(other.revenueCagr5y, revenueCagr5y) || other.revenueCagr5y == revenueCagr5y)&&(identical(other.revenueYoy, revenueYoy) || other.revenueYoy == revenueYoy)&&(identical(other.netIncomeCagr5y, netIncomeCagr5y) || other.netIncomeCagr5y == netIncomeCagr5y)&&(identical(other.fcfCagr5y, fcfCagr5y) || other.fcfCagr5y == fcfCagr5y));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,grossMargin,operatingMargin,netMargin,fcfMargin,returnOnEquity,returnOnAssets,currentRatio,debtToEquity,netDebt,revenueCagr5y,revenueYoy,netIncomeCagr5y,fcfCagr5y);

@override
String toString() {
  return 'MetricsDto(grossMargin: $grossMargin, operatingMargin: $operatingMargin, netMargin: $netMargin, fcfMargin: $fcfMargin, returnOnEquity: $returnOnEquity, returnOnAssets: $returnOnAssets, currentRatio: $currentRatio, debtToEquity: $debtToEquity, netDebt: $netDebt, revenueCagr5y: $revenueCagr5y, revenueYoy: $revenueYoy, netIncomeCagr5y: $netIncomeCagr5y, fcfCagr5y: $fcfCagr5y)';
}


}

/// @nodoc
abstract mixin class $MetricsDtoCopyWith<$Res>  {
  factory $MetricsDtoCopyWith(MetricsDto value, $Res Function(MetricsDto) _then) = _$MetricsDtoCopyWithImpl;
@useResult
$Res call({
 double? grossMargin, double? operatingMargin, double? netMargin, double? fcfMargin, double? returnOnEquity, double? returnOnAssets, double? currentRatio, double? debtToEquity, double? netDebt, double? revenueCagr5y, double? revenueYoy, double? netIncomeCagr5y, double? fcfCagr5y
});




}
/// @nodoc
class _$MetricsDtoCopyWithImpl<$Res>
    implements $MetricsDtoCopyWith<$Res> {
  _$MetricsDtoCopyWithImpl(this._self, this._then);

  final MetricsDto _self;
  final $Res Function(MetricsDto) _then;

/// Create a copy of MetricsDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? grossMargin = freezed,Object? operatingMargin = freezed,Object? netMargin = freezed,Object? fcfMargin = freezed,Object? returnOnEquity = freezed,Object? returnOnAssets = freezed,Object? currentRatio = freezed,Object? debtToEquity = freezed,Object? netDebt = freezed,Object? revenueCagr5y = freezed,Object? revenueYoy = freezed,Object? netIncomeCagr5y = freezed,Object? fcfCagr5y = freezed,}) {
  return _then(_self.copyWith(
grossMargin: freezed == grossMargin ? _self.grossMargin : grossMargin // ignore: cast_nullable_to_non_nullable
as double?,operatingMargin: freezed == operatingMargin ? _self.operatingMargin : operatingMargin // ignore: cast_nullable_to_non_nullable
as double?,netMargin: freezed == netMargin ? _self.netMargin : netMargin // ignore: cast_nullable_to_non_nullable
as double?,fcfMargin: freezed == fcfMargin ? _self.fcfMargin : fcfMargin // ignore: cast_nullable_to_non_nullable
as double?,returnOnEquity: freezed == returnOnEquity ? _self.returnOnEquity : returnOnEquity // ignore: cast_nullable_to_non_nullable
as double?,returnOnAssets: freezed == returnOnAssets ? _self.returnOnAssets : returnOnAssets // ignore: cast_nullable_to_non_nullable
as double?,currentRatio: freezed == currentRatio ? _self.currentRatio : currentRatio // ignore: cast_nullable_to_non_nullable
as double?,debtToEquity: freezed == debtToEquity ? _self.debtToEquity : debtToEquity // ignore: cast_nullable_to_non_nullable
as double?,netDebt: freezed == netDebt ? _self.netDebt : netDebt // ignore: cast_nullable_to_non_nullable
as double?,revenueCagr5y: freezed == revenueCagr5y ? _self.revenueCagr5y : revenueCagr5y // ignore: cast_nullable_to_non_nullable
as double?,revenueYoy: freezed == revenueYoy ? _self.revenueYoy : revenueYoy // ignore: cast_nullable_to_non_nullable
as double?,netIncomeCagr5y: freezed == netIncomeCagr5y ? _self.netIncomeCagr5y : netIncomeCagr5y // ignore: cast_nullable_to_non_nullable
as double?,fcfCagr5y: freezed == fcfCagr5y ? _self.fcfCagr5y : fcfCagr5y // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [MetricsDto].
extension MetricsDtoPatterns on MetricsDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MetricsDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MetricsDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MetricsDto value)  $default,){
final _that = this;
switch (_that) {
case _MetricsDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MetricsDto value)?  $default,){
final _that = this;
switch (_that) {
case _MetricsDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double? grossMargin,  double? operatingMargin,  double? netMargin,  double? fcfMargin,  double? returnOnEquity,  double? returnOnAssets,  double? currentRatio,  double? debtToEquity,  double? netDebt,  double? revenueCagr5y,  double? revenueYoy,  double? netIncomeCagr5y,  double? fcfCagr5y)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MetricsDto() when $default != null:
return $default(_that.grossMargin,_that.operatingMargin,_that.netMargin,_that.fcfMargin,_that.returnOnEquity,_that.returnOnAssets,_that.currentRatio,_that.debtToEquity,_that.netDebt,_that.revenueCagr5y,_that.revenueYoy,_that.netIncomeCagr5y,_that.fcfCagr5y);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double? grossMargin,  double? operatingMargin,  double? netMargin,  double? fcfMargin,  double? returnOnEquity,  double? returnOnAssets,  double? currentRatio,  double? debtToEquity,  double? netDebt,  double? revenueCagr5y,  double? revenueYoy,  double? netIncomeCagr5y,  double? fcfCagr5y)  $default,) {final _that = this;
switch (_that) {
case _MetricsDto():
return $default(_that.grossMargin,_that.operatingMargin,_that.netMargin,_that.fcfMargin,_that.returnOnEquity,_that.returnOnAssets,_that.currentRatio,_that.debtToEquity,_that.netDebt,_that.revenueCagr5y,_that.revenueYoy,_that.netIncomeCagr5y,_that.fcfCagr5y);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double? grossMargin,  double? operatingMargin,  double? netMargin,  double? fcfMargin,  double? returnOnEquity,  double? returnOnAssets,  double? currentRatio,  double? debtToEquity,  double? netDebt,  double? revenueCagr5y,  double? revenueYoy,  double? netIncomeCagr5y,  double? fcfCagr5y)?  $default,) {final _that = this;
switch (_that) {
case _MetricsDto() when $default != null:
return $default(_that.grossMargin,_that.operatingMargin,_that.netMargin,_that.fcfMargin,_that.returnOnEquity,_that.returnOnAssets,_that.currentRatio,_that.debtToEquity,_that.netDebt,_that.revenueCagr5y,_that.revenueYoy,_that.netIncomeCagr5y,_that.fcfCagr5y);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MetricsDto implements MetricsDto {
  const _MetricsDto({this.grossMargin, this.operatingMargin, this.netMargin, this.fcfMargin, this.returnOnEquity, this.returnOnAssets, this.currentRatio, this.debtToEquity, this.netDebt, this.revenueCagr5y, this.revenueYoy, this.netIncomeCagr5y, this.fcfCagr5y});
  factory _MetricsDto.fromJson(Map<String, dynamic> json) => _$MetricsDtoFromJson(json);

@override final  double? grossMargin;
@override final  double? operatingMargin;
@override final  double? netMargin;
@override final  double? fcfMargin;
@override final  double? returnOnEquity;
@override final  double? returnOnAssets;
@override final  double? currentRatio;
@override final  double? debtToEquity;
@override final  double? netDebt;
@override final  double? revenueCagr5y;
@override final  double? revenueYoy;
@override final  double? netIncomeCagr5y;
@override final  double? fcfCagr5y;

/// Create a copy of MetricsDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MetricsDtoCopyWith<_MetricsDto> get copyWith => __$MetricsDtoCopyWithImpl<_MetricsDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MetricsDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MetricsDto&&(identical(other.grossMargin, grossMargin) || other.grossMargin == grossMargin)&&(identical(other.operatingMargin, operatingMargin) || other.operatingMargin == operatingMargin)&&(identical(other.netMargin, netMargin) || other.netMargin == netMargin)&&(identical(other.fcfMargin, fcfMargin) || other.fcfMargin == fcfMargin)&&(identical(other.returnOnEquity, returnOnEquity) || other.returnOnEquity == returnOnEquity)&&(identical(other.returnOnAssets, returnOnAssets) || other.returnOnAssets == returnOnAssets)&&(identical(other.currentRatio, currentRatio) || other.currentRatio == currentRatio)&&(identical(other.debtToEquity, debtToEquity) || other.debtToEquity == debtToEquity)&&(identical(other.netDebt, netDebt) || other.netDebt == netDebt)&&(identical(other.revenueCagr5y, revenueCagr5y) || other.revenueCagr5y == revenueCagr5y)&&(identical(other.revenueYoy, revenueYoy) || other.revenueYoy == revenueYoy)&&(identical(other.netIncomeCagr5y, netIncomeCagr5y) || other.netIncomeCagr5y == netIncomeCagr5y)&&(identical(other.fcfCagr5y, fcfCagr5y) || other.fcfCagr5y == fcfCagr5y));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,grossMargin,operatingMargin,netMargin,fcfMargin,returnOnEquity,returnOnAssets,currentRatio,debtToEquity,netDebt,revenueCagr5y,revenueYoy,netIncomeCagr5y,fcfCagr5y);

@override
String toString() {
  return 'MetricsDto(grossMargin: $grossMargin, operatingMargin: $operatingMargin, netMargin: $netMargin, fcfMargin: $fcfMargin, returnOnEquity: $returnOnEquity, returnOnAssets: $returnOnAssets, currentRatio: $currentRatio, debtToEquity: $debtToEquity, netDebt: $netDebt, revenueCagr5y: $revenueCagr5y, revenueYoy: $revenueYoy, netIncomeCagr5y: $netIncomeCagr5y, fcfCagr5y: $fcfCagr5y)';
}


}

/// @nodoc
abstract mixin class _$MetricsDtoCopyWith<$Res> implements $MetricsDtoCopyWith<$Res> {
  factory _$MetricsDtoCopyWith(_MetricsDto value, $Res Function(_MetricsDto) _then) = __$MetricsDtoCopyWithImpl;
@override @useResult
$Res call({
 double? grossMargin, double? operatingMargin, double? netMargin, double? fcfMargin, double? returnOnEquity, double? returnOnAssets, double? currentRatio, double? debtToEquity, double? netDebt, double? revenueCagr5y, double? revenueYoy, double? netIncomeCagr5y, double? fcfCagr5y
});




}
/// @nodoc
class __$MetricsDtoCopyWithImpl<$Res>
    implements _$MetricsDtoCopyWith<$Res> {
  __$MetricsDtoCopyWithImpl(this._self, this._then);

  final _MetricsDto _self;
  final $Res Function(_MetricsDto) _then;

/// Create a copy of MetricsDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? grossMargin = freezed,Object? operatingMargin = freezed,Object? netMargin = freezed,Object? fcfMargin = freezed,Object? returnOnEquity = freezed,Object? returnOnAssets = freezed,Object? currentRatio = freezed,Object? debtToEquity = freezed,Object? netDebt = freezed,Object? revenueCagr5y = freezed,Object? revenueYoy = freezed,Object? netIncomeCagr5y = freezed,Object? fcfCagr5y = freezed,}) {
  return _then(_MetricsDto(
grossMargin: freezed == grossMargin ? _self.grossMargin : grossMargin // ignore: cast_nullable_to_non_nullable
as double?,operatingMargin: freezed == operatingMargin ? _self.operatingMargin : operatingMargin // ignore: cast_nullable_to_non_nullable
as double?,netMargin: freezed == netMargin ? _self.netMargin : netMargin // ignore: cast_nullable_to_non_nullable
as double?,fcfMargin: freezed == fcfMargin ? _self.fcfMargin : fcfMargin // ignore: cast_nullable_to_non_nullable
as double?,returnOnEquity: freezed == returnOnEquity ? _self.returnOnEquity : returnOnEquity // ignore: cast_nullable_to_non_nullable
as double?,returnOnAssets: freezed == returnOnAssets ? _self.returnOnAssets : returnOnAssets // ignore: cast_nullable_to_non_nullable
as double?,currentRatio: freezed == currentRatio ? _self.currentRatio : currentRatio // ignore: cast_nullable_to_non_nullable
as double?,debtToEquity: freezed == debtToEquity ? _self.debtToEquity : debtToEquity // ignore: cast_nullable_to_non_nullable
as double?,netDebt: freezed == netDebt ? _self.netDebt : netDebt // ignore: cast_nullable_to_non_nullable
as double?,revenueCagr5y: freezed == revenueCagr5y ? _self.revenueCagr5y : revenueCagr5y // ignore: cast_nullable_to_non_nullable
as double?,revenueYoy: freezed == revenueYoy ? _self.revenueYoy : revenueYoy // ignore: cast_nullable_to_non_nullable
as double?,netIncomeCagr5y: freezed == netIncomeCagr5y ? _self.netIncomeCagr5y : netIncomeCagr5y // ignore: cast_nullable_to_non_nullable
as double?,fcfCagr5y: freezed == fcfCagr5y ? _self.fcfCagr5y : fcfCagr5y // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}


/// @nodoc
mixin _$PriceSeriesDto {

 String get symbol; int get days; int get count; bool get truncatedByPlan; List<PriceBarDto> get bars;
/// Create a copy of PriceSeriesDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PriceSeriesDtoCopyWith<PriceSeriesDto> get copyWith => _$PriceSeriesDtoCopyWithImpl<PriceSeriesDto>(this as PriceSeriesDto, _$identity);

  /// Serializes this PriceSeriesDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PriceSeriesDto&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.days, days) || other.days == days)&&(identical(other.count, count) || other.count == count)&&(identical(other.truncatedByPlan, truncatedByPlan) || other.truncatedByPlan == truncatedByPlan)&&const DeepCollectionEquality().equals(other.bars, bars));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,symbol,days,count,truncatedByPlan,const DeepCollectionEquality().hash(bars));

@override
String toString() {
  return 'PriceSeriesDto(symbol: $symbol, days: $days, count: $count, truncatedByPlan: $truncatedByPlan, bars: $bars)';
}


}

/// @nodoc
abstract mixin class $PriceSeriesDtoCopyWith<$Res>  {
  factory $PriceSeriesDtoCopyWith(PriceSeriesDto value, $Res Function(PriceSeriesDto) _then) = _$PriceSeriesDtoCopyWithImpl;
@useResult
$Res call({
 String symbol, int days, int count, bool truncatedByPlan, List<PriceBarDto> bars
});




}
/// @nodoc
class _$PriceSeriesDtoCopyWithImpl<$Res>
    implements $PriceSeriesDtoCopyWith<$Res> {
  _$PriceSeriesDtoCopyWithImpl(this._self, this._then);

  final PriceSeriesDto _self;
  final $Res Function(PriceSeriesDto) _then;

/// Create a copy of PriceSeriesDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? symbol = null,Object? days = null,Object? count = null,Object? truncatedByPlan = null,Object? bars = null,}) {
  return _then(_self.copyWith(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,truncatedByPlan: null == truncatedByPlan ? _self.truncatedByPlan : truncatedByPlan // ignore: cast_nullable_to_non_nullable
as bool,bars: null == bars ? _self.bars : bars // ignore: cast_nullable_to_non_nullable
as List<PriceBarDto>,
  ));
}

}


/// Adds pattern-matching-related methods to [PriceSeriesDto].
extension PriceSeriesDtoPatterns on PriceSeriesDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PriceSeriesDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PriceSeriesDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PriceSeriesDto value)  $default,){
final _that = this;
switch (_that) {
case _PriceSeriesDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PriceSeriesDto value)?  $default,){
final _that = this;
switch (_that) {
case _PriceSeriesDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String symbol,  int days,  int count,  bool truncatedByPlan,  List<PriceBarDto> bars)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PriceSeriesDto() when $default != null:
return $default(_that.symbol,_that.days,_that.count,_that.truncatedByPlan,_that.bars);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String symbol,  int days,  int count,  bool truncatedByPlan,  List<PriceBarDto> bars)  $default,) {final _that = this;
switch (_that) {
case _PriceSeriesDto():
return $default(_that.symbol,_that.days,_that.count,_that.truncatedByPlan,_that.bars);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String symbol,  int days,  int count,  bool truncatedByPlan,  List<PriceBarDto> bars)?  $default,) {final _that = this;
switch (_that) {
case _PriceSeriesDto() when $default != null:
return $default(_that.symbol,_that.days,_that.count,_that.truncatedByPlan,_that.bars);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PriceSeriesDto implements PriceSeriesDto {
  const _PriceSeriesDto({required this.symbol, required this.days, required this.count, required this.truncatedByPlan, required final  List<PriceBarDto> bars}): _bars = bars;
  factory _PriceSeriesDto.fromJson(Map<String, dynamic> json) => _$PriceSeriesDtoFromJson(json);

@override final  String symbol;
@override final  int days;
@override final  int count;
@override final  bool truncatedByPlan;
 final  List<PriceBarDto> _bars;
@override List<PriceBarDto> get bars {
  if (_bars is EqualUnmodifiableListView) return _bars;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_bars);
}


/// Create a copy of PriceSeriesDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PriceSeriesDtoCopyWith<_PriceSeriesDto> get copyWith => __$PriceSeriesDtoCopyWithImpl<_PriceSeriesDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PriceSeriesDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PriceSeriesDto&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.days, days) || other.days == days)&&(identical(other.count, count) || other.count == count)&&(identical(other.truncatedByPlan, truncatedByPlan) || other.truncatedByPlan == truncatedByPlan)&&const DeepCollectionEquality().equals(other._bars, _bars));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,symbol,days,count,truncatedByPlan,const DeepCollectionEquality().hash(_bars));

@override
String toString() {
  return 'PriceSeriesDto(symbol: $symbol, days: $days, count: $count, truncatedByPlan: $truncatedByPlan, bars: $bars)';
}


}

/// @nodoc
abstract mixin class _$PriceSeriesDtoCopyWith<$Res> implements $PriceSeriesDtoCopyWith<$Res> {
  factory _$PriceSeriesDtoCopyWith(_PriceSeriesDto value, $Res Function(_PriceSeriesDto) _then) = __$PriceSeriesDtoCopyWithImpl;
@override @useResult
$Res call({
 String symbol, int days, int count, bool truncatedByPlan, List<PriceBarDto> bars
});




}
/// @nodoc
class __$PriceSeriesDtoCopyWithImpl<$Res>
    implements _$PriceSeriesDtoCopyWith<$Res> {
  __$PriceSeriesDtoCopyWithImpl(this._self, this._then);

  final _PriceSeriesDto _self;
  final $Res Function(_PriceSeriesDto) _then;

/// Create a copy of PriceSeriesDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? symbol = null,Object? days = null,Object? count = null,Object? truncatedByPlan = null,Object? bars = null,}) {
  return _then(_PriceSeriesDto(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,count: null == count ? _self.count : count // ignore: cast_nullable_to_non_nullable
as int,truncatedByPlan: null == truncatedByPlan ? _self.truncatedByPlan : truncatedByPlan // ignore: cast_nullable_to_non_nullable
as bool,bars: null == bars ? _self._bars : bars // ignore: cast_nullable_to_non_nullable
as List<PriceBarDto>,
  ));
}


}


/// @nodoc
mixin _$PriceBarDto {

 String get tradeDate; double get close; double? get volume;
/// Create a copy of PriceBarDto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PriceBarDtoCopyWith<PriceBarDto> get copyWith => _$PriceBarDtoCopyWithImpl<PriceBarDto>(this as PriceBarDto, _$identity);

  /// Serializes this PriceBarDto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PriceBarDto&&(identical(other.tradeDate, tradeDate) || other.tradeDate == tradeDate)&&(identical(other.close, close) || other.close == close)&&(identical(other.volume, volume) || other.volume == volume));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,tradeDate,close,volume);

@override
String toString() {
  return 'PriceBarDto(tradeDate: $tradeDate, close: $close, volume: $volume)';
}


}

/// @nodoc
abstract mixin class $PriceBarDtoCopyWith<$Res>  {
  factory $PriceBarDtoCopyWith(PriceBarDto value, $Res Function(PriceBarDto) _then) = _$PriceBarDtoCopyWithImpl;
@useResult
$Res call({
 String tradeDate, double close, double? volume
});




}
/// @nodoc
class _$PriceBarDtoCopyWithImpl<$Res>
    implements $PriceBarDtoCopyWith<$Res> {
  _$PriceBarDtoCopyWithImpl(this._self, this._then);

  final PriceBarDto _self;
  final $Res Function(PriceBarDto) _then;

/// Create a copy of PriceBarDto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tradeDate = null,Object? close = null,Object? volume = freezed,}) {
  return _then(_self.copyWith(
tradeDate: null == tradeDate ? _self.tradeDate : tradeDate // ignore: cast_nullable_to_non_nullable
as String,close: null == close ? _self.close : close // ignore: cast_nullable_to_non_nullable
as double,volume: freezed == volume ? _self.volume : volume // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [PriceBarDto].
extension PriceBarDtoPatterns on PriceBarDto {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PriceBarDto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PriceBarDto() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PriceBarDto value)  $default,){
final _that = this;
switch (_that) {
case _PriceBarDto():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PriceBarDto value)?  $default,){
final _that = this;
switch (_that) {
case _PriceBarDto() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String tradeDate,  double close,  double? volume)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PriceBarDto() when $default != null:
return $default(_that.tradeDate,_that.close,_that.volume);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String tradeDate,  double close,  double? volume)  $default,) {final _that = this;
switch (_that) {
case _PriceBarDto():
return $default(_that.tradeDate,_that.close,_that.volume);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String tradeDate,  double close,  double? volume)?  $default,) {final _that = this;
switch (_that) {
case _PriceBarDto() when $default != null:
return $default(_that.tradeDate,_that.close,_that.volume);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PriceBarDto implements PriceBarDto {
  const _PriceBarDto({required this.tradeDate, required this.close, this.volume});
  factory _PriceBarDto.fromJson(Map<String, dynamic> json) => _$PriceBarDtoFromJson(json);

@override final  String tradeDate;
@override final  double close;
@override final  double? volume;

/// Create a copy of PriceBarDto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PriceBarDtoCopyWith<_PriceBarDto> get copyWith => __$PriceBarDtoCopyWithImpl<_PriceBarDto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PriceBarDtoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PriceBarDto&&(identical(other.tradeDate, tradeDate) || other.tradeDate == tradeDate)&&(identical(other.close, close) || other.close == close)&&(identical(other.volume, volume) || other.volume == volume));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,tradeDate,close,volume);

@override
String toString() {
  return 'PriceBarDto(tradeDate: $tradeDate, close: $close, volume: $volume)';
}


}

/// @nodoc
abstract mixin class _$PriceBarDtoCopyWith<$Res> implements $PriceBarDtoCopyWith<$Res> {
  factory _$PriceBarDtoCopyWith(_PriceBarDto value, $Res Function(_PriceBarDto) _then) = __$PriceBarDtoCopyWithImpl;
@override @useResult
$Res call({
 String tradeDate, double close, double? volume
});




}
/// @nodoc
class __$PriceBarDtoCopyWithImpl<$Res>
    implements _$PriceBarDtoCopyWith<$Res> {
  __$PriceBarDtoCopyWithImpl(this._self, this._then);

  final _PriceBarDto _self;
  final $Res Function(_PriceBarDto) _then;

/// Create a copy of PriceBarDto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tradeDate = null,Object? close = null,Object? volume = freezed,}) {
  return _then(_PriceBarDto(
tradeDate: null == tradeDate ? _self.tradeDate : tradeDate // ignore: cast_nullable_to_non_nullable
as String,close: null == close ? _self.close : close // ignore: cast_nullable_to_non_nullable
as double,volume: freezed == volume ? _self.volume : volume // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}

// dart format on
