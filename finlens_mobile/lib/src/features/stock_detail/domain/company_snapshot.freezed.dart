// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'company_snapshot.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$CompanySnapshot {

 Company get company; Quote? get quote; ValuationSummary? get valuation; FinancialPeriod? get latest; KeyMetrics get metrics;
/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CompanySnapshotCopyWith<CompanySnapshot> get copyWith => _$CompanySnapshotCopyWithImpl<CompanySnapshot>(this as CompanySnapshot, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CompanySnapshot&&(identical(other.company, company) || other.company == company)&&(identical(other.quote, quote) || other.quote == quote)&&(identical(other.valuation, valuation) || other.valuation == valuation)&&(identical(other.latest, latest) || other.latest == latest)&&(identical(other.metrics, metrics) || other.metrics == metrics));
}


@override
int get hashCode => Object.hash(runtimeType,company,quote,valuation,latest,metrics);

@override
String toString() {
  return 'CompanySnapshot(company: $company, quote: $quote, valuation: $valuation, latest: $latest, metrics: $metrics)';
}


}

/// @nodoc
abstract mixin class $CompanySnapshotCopyWith<$Res>  {
  factory $CompanySnapshotCopyWith(CompanySnapshot value, $Res Function(CompanySnapshot) _then) = _$CompanySnapshotCopyWithImpl;
@useResult
$Res call({
 Company company, Quote? quote, ValuationSummary? valuation, FinancialPeriod? latest, KeyMetrics metrics
});


$CompanyCopyWith<$Res> get company;$QuoteCopyWith<$Res>? get quote;$ValuationSummaryCopyWith<$Res>? get valuation;$FinancialPeriodCopyWith<$Res>? get latest;$KeyMetricsCopyWith<$Res> get metrics;

}
/// @nodoc
class _$CompanySnapshotCopyWithImpl<$Res>
    implements $CompanySnapshotCopyWith<$Res> {
  _$CompanySnapshotCopyWithImpl(this._self, this._then);

  final CompanySnapshot _self;
  final $Res Function(CompanySnapshot) _then;

/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? company = null,Object? quote = freezed,Object? valuation = freezed,Object? latest = freezed,Object? metrics = null,}) {
  return _then(_self.copyWith(
company: null == company ? _self.company : company // ignore: cast_nullable_to_non_nullable
as Company,quote: freezed == quote ? _self.quote : quote // ignore: cast_nullable_to_non_nullable
as Quote?,valuation: freezed == valuation ? _self.valuation : valuation // ignore: cast_nullable_to_non_nullable
as ValuationSummary?,latest: freezed == latest ? _self.latest : latest // ignore: cast_nullable_to_non_nullable
as FinancialPeriod?,metrics: null == metrics ? _self.metrics : metrics // ignore: cast_nullable_to_non_nullable
as KeyMetrics,
  ));
}
/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CompanyCopyWith<$Res> get company {
  
  return $CompanyCopyWith<$Res>(_self.company, (value) {
    return _then(_self.copyWith(company: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$QuoteCopyWith<$Res>? get quote {
    if (_self.quote == null) {
    return null;
  }

  return $QuoteCopyWith<$Res>(_self.quote!, (value) {
    return _then(_self.copyWith(quote: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ValuationSummaryCopyWith<$Res>? get valuation {
    if (_self.valuation == null) {
    return null;
  }

  return $ValuationSummaryCopyWith<$Res>(_self.valuation!, (value) {
    return _then(_self.copyWith(valuation: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FinancialPeriodCopyWith<$Res>? get latest {
    if (_self.latest == null) {
    return null;
  }

  return $FinancialPeriodCopyWith<$Res>(_self.latest!, (value) {
    return _then(_self.copyWith(latest: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KeyMetricsCopyWith<$Res> get metrics {
  
  return $KeyMetricsCopyWith<$Res>(_self.metrics, (value) {
    return _then(_self.copyWith(metrics: value));
  });
}
}


/// Adds pattern-matching-related methods to [CompanySnapshot].
extension CompanySnapshotPatterns on CompanySnapshot {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CompanySnapshot value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CompanySnapshot() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CompanySnapshot value)  $default,){
final _that = this;
switch (_that) {
case _CompanySnapshot():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CompanySnapshot value)?  $default,){
final _that = this;
switch (_that) {
case _CompanySnapshot() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( Company company,  Quote? quote,  ValuationSummary? valuation,  FinancialPeriod? latest,  KeyMetrics metrics)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CompanySnapshot() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( Company company,  Quote? quote,  ValuationSummary? valuation,  FinancialPeriod? latest,  KeyMetrics metrics)  $default,) {final _that = this;
switch (_that) {
case _CompanySnapshot():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( Company company,  Quote? quote,  ValuationSummary? valuation,  FinancialPeriod? latest,  KeyMetrics metrics)?  $default,) {final _that = this;
switch (_that) {
case _CompanySnapshot() when $default != null:
return $default(_that.company,_that.quote,_that.valuation,_that.latest,_that.metrics);case _:
  return null;

}
}

}

/// @nodoc


class _CompanySnapshot implements CompanySnapshot {
  const _CompanySnapshot({required this.company, this.quote, this.valuation, this.latest, required this.metrics});
  

@override final  Company company;
@override final  Quote? quote;
@override final  ValuationSummary? valuation;
@override final  FinancialPeriod? latest;
@override final  KeyMetrics metrics;

/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CompanySnapshotCopyWith<_CompanySnapshot> get copyWith => __$CompanySnapshotCopyWithImpl<_CompanySnapshot>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CompanySnapshot&&(identical(other.company, company) || other.company == company)&&(identical(other.quote, quote) || other.quote == quote)&&(identical(other.valuation, valuation) || other.valuation == valuation)&&(identical(other.latest, latest) || other.latest == latest)&&(identical(other.metrics, metrics) || other.metrics == metrics));
}


@override
int get hashCode => Object.hash(runtimeType,company,quote,valuation,latest,metrics);

@override
String toString() {
  return 'CompanySnapshot(company: $company, quote: $quote, valuation: $valuation, latest: $latest, metrics: $metrics)';
}


}

/// @nodoc
abstract mixin class _$CompanySnapshotCopyWith<$Res> implements $CompanySnapshotCopyWith<$Res> {
  factory _$CompanySnapshotCopyWith(_CompanySnapshot value, $Res Function(_CompanySnapshot) _then) = __$CompanySnapshotCopyWithImpl;
@override @useResult
$Res call({
 Company company, Quote? quote, ValuationSummary? valuation, FinancialPeriod? latest, KeyMetrics metrics
});


@override $CompanyCopyWith<$Res> get company;@override $QuoteCopyWith<$Res>? get quote;@override $ValuationSummaryCopyWith<$Res>? get valuation;@override $FinancialPeriodCopyWith<$Res>? get latest;@override $KeyMetricsCopyWith<$Res> get metrics;

}
/// @nodoc
class __$CompanySnapshotCopyWithImpl<$Res>
    implements _$CompanySnapshotCopyWith<$Res> {
  __$CompanySnapshotCopyWithImpl(this._self, this._then);

  final _CompanySnapshot _self;
  final $Res Function(_CompanySnapshot) _then;

/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? company = null,Object? quote = freezed,Object? valuation = freezed,Object? latest = freezed,Object? metrics = null,}) {
  return _then(_CompanySnapshot(
company: null == company ? _self.company : company // ignore: cast_nullable_to_non_nullable
as Company,quote: freezed == quote ? _self.quote : quote // ignore: cast_nullable_to_non_nullable
as Quote?,valuation: freezed == valuation ? _self.valuation : valuation // ignore: cast_nullable_to_non_nullable
as ValuationSummary?,latest: freezed == latest ? _self.latest : latest // ignore: cast_nullable_to_non_nullable
as FinancialPeriod?,metrics: null == metrics ? _self.metrics : metrics // ignore: cast_nullable_to_non_nullable
as KeyMetrics,
  ));
}

/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$CompanyCopyWith<$Res> get company {
  
  return $CompanyCopyWith<$Res>(_self.company, (value) {
    return _then(_self.copyWith(company: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$QuoteCopyWith<$Res>? get quote {
    if (_self.quote == null) {
    return null;
  }

  return $QuoteCopyWith<$Res>(_self.quote!, (value) {
    return _then(_self.copyWith(quote: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ValuationSummaryCopyWith<$Res>? get valuation {
    if (_self.valuation == null) {
    return null;
  }

  return $ValuationSummaryCopyWith<$Res>(_self.valuation!, (value) {
    return _then(_self.copyWith(valuation: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$FinancialPeriodCopyWith<$Res>? get latest {
    if (_self.latest == null) {
    return null;
  }

  return $FinancialPeriodCopyWith<$Res>(_self.latest!, (value) {
    return _then(_self.copyWith(latest: value));
  });
}/// Create a copy of CompanySnapshot
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$KeyMetricsCopyWith<$Res> get metrics {
  
  return $KeyMetricsCopyWith<$Res>(_self.metrics, (value) {
    return _then(_self.copyWith(metrics: value));
  });
}
}

/// @nodoc
mixin _$Company {

 String get symbol; String get name; String? get exchange; String? get currency; String? get sector; String? get industry; String? get country; String? get website; String? get description; int? get employees;
/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CompanyCopyWith<Company> get copyWith => _$CompanyCopyWithImpl<Company>(this as Company, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Company&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.name, name) || other.name == name)&&(identical(other.exchange, exchange) || other.exchange == exchange)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.sector, sector) || other.sector == sector)&&(identical(other.industry, industry) || other.industry == industry)&&(identical(other.country, country) || other.country == country)&&(identical(other.website, website) || other.website == website)&&(identical(other.description, description) || other.description == description)&&(identical(other.employees, employees) || other.employees == employees));
}


@override
int get hashCode => Object.hash(runtimeType,symbol,name,exchange,currency,sector,industry,country,website,description,employees);

@override
String toString() {
  return 'Company(symbol: $symbol, name: $name, exchange: $exchange, currency: $currency, sector: $sector, industry: $industry, country: $country, website: $website, description: $description, employees: $employees)';
}


}

/// @nodoc
abstract mixin class $CompanyCopyWith<$Res>  {
  factory $CompanyCopyWith(Company value, $Res Function(Company) _then) = _$CompanyCopyWithImpl;
@useResult
$Res call({
 String symbol, String name, String? exchange, String? currency, String? sector, String? industry, String? country, String? website, String? description, int? employees
});




}
/// @nodoc
class _$CompanyCopyWithImpl<$Res>
    implements $CompanyCopyWith<$Res> {
  _$CompanyCopyWithImpl(this._self, this._then);

  final Company _self;
  final $Res Function(Company) _then;

/// Create a copy of Company
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


/// Adds pattern-matching-related methods to [Company].
extension CompanyPatterns on Company {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Company value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Company() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Company value)  $default,){
final _that = this;
switch (_that) {
case _Company():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Company value)?  $default,){
final _that = this;
switch (_that) {
case _Company() when $default != null:
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
case _Company() when $default != null:
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
case _Company():
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
case _Company() when $default != null:
return $default(_that.symbol,_that.name,_that.exchange,_that.currency,_that.sector,_that.industry,_that.country,_that.website,_that.description,_that.employees);case _:
  return null;

}
}

}

/// @nodoc


class _Company implements Company {
  const _Company({required this.symbol, required this.name, this.exchange, this.currency, this.sector, this.industry, this.country, this.website, this.description, this.employees});
  

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

/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CompanyCopyWith<_Company> get copyWith => __$CompanyCopyWithImpl<_Company>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Company&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.name, name) || other.name == name)&&(identical(other.exchange, exchange) || other.exchange == exchange)&&(identical(other.currency, currency) || other.currency == currency)&&(identical(other.sector, sector) || other.sector == sector)&&(identical(other.industry, industry) || other.industry == industry)&&(identical(other.country, country) || other.country == country)&&(identical(other.website, website) || other.website == website)&&(identical(other.description, description) || other.description == description)&&(identical(other.employees, employees) || other.employees == employees));
}


@override
int get hashCode => Object.hash(runtimeType,symbol,name,exchange,currency,sector,industry,country,website,description,employees);

@override
String toString() {
  return 'Company(symbol: $symbol, name: $name, exchange: $exchange, currency: $currency, sector: $sector, industry: $industry, country: $country, website: $website, description: $description, employees: $employees)';
}


}

/// @nodoc
abstract mixin class _$CompanyCopyWith<$Res> implements $CompanyCopyWith<$Res> {
  factory _$CompanyCopyWith(_Company value, $Res Function(_Company) _then) = __$CompanyCopyWithImpl;
@override @useResult
$Res call({
 String symbol, String name, String? exchange, String? currency, String? sector, String? industry, String? country, String? website, String? description, int? employees
});




}
/// @nodoc
class __$CompanyCopyWithImpl<$Res>
    implements _$CompanyCopyWith<$Res> {
  __$CompanyCopyWithImpl(this._self, this._then);

  final _Company _self;
  final $Res Function(_Company) _then;

/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? symbol = null,Object? name = null,Object? exchange = freezed,Object? currency = freezed,Object? sector = freezed,Object? industry = freezed,Object? country = freezed,Object? website = freezed,Object? description = freezed,Object? employees = freezed,}) {
  return _then(_Company(
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
mixin _$Quote {

 double? get price; double? get previousClose; double? get dayChangePct; double? get marketCap; double? get sharesOutstanding; double? get peRatio; double? get yearHigh; double? get yearLow; DateTime? get asOf;
/// Create a copy of Quote
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuoteCopyWith<Quote> get copyWith => _$QuoteCopyWithImpl<Quote>(this as Quote, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Quote&&(identical(other.price, price) || other.price == price)&&(identical(other.previousClose, previousClose) || other.previousClose == previousClose)&&(identical(other.dayChangePct, dayChangePct) || other.dayChangePct == dayChangePct)&&(identical(other.marketCap, marketCap) || other.marketCap == marketCap)&&(identical(other.sharesOutstanding, sharesOutstanding) || other.sharesOutstanding == sharesOutstanding)&&(identical(other.peRatio, peRatio) || other.peRatio == peRatio)&&(identical(other.yearHigh, yearHigh) || other.yearHigh == yearHigh)&&(identical(other.yearLow, yearLow) || other.yearLow == yearLow)&&(identical(other.asOf, asOf) || other.asOf == asOf));
}


@override
int get hashCode => Object.hash(runtimeType,price,previousClose,dayChangePct,marketCap,sharesOutstanding,peRatio,yearHigh,yearLow,asOf);

@override
String toString() {
  return 'Quote(price: $price, previousClose: $previousClose, dayChangePct: $dayChangePct, marketCap: $marketCap, sharesOutstanding: $sharesOutstanding, peRatio: $peRatio, yearHigh: $yearHigh, yearLow: $yearLow, asOf: $asOf)';
}


}

/// @nodoc
abstract mixin class $QuoteCopyWith<$Res>  {
  factory $QuoteCopyWith(Quote value, $Res Function(Quote) _then) = _$QuoteCopyWithImpl;
@useResult
$Res call({
 double? price, double? previousClose, double? dayChangePct, double? marketCap, double? sharesOutstanding, double? peRatio, double? yearHigh, double? yearLow, DateTime? asOf
});




}
/// @nodoc
class _$QuoteCopyWithImpl<$Res>
    implements $QuoteCopyWith<$Res> {
  _$QuoteCopyWithImpl(this._self, this._then);

  final Quote _self;
  final $Res Function(Quote) _then;

/// Create a copy of Quote
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
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [Quote].
extension QuotePatterns on Quote {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Quote value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Quote() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Quote value)  $default,){
final _that = this;
switch (_that) {
case _Quote():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Quote value)?  $default,){
final _that = this;
switch (_that) {
case _Quote() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double? price,  double? previousClose,  double? dayChangePct,  double? marketCap,  double? sharesOutstanding,  double? peRatio,  double? yearHigh,  double? yearLow,  DateTime? asOf)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Quote() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double? price,  double? previousClose,  double? dayChangePct,  double? marketCap,  double? sharesOutstanding,  double? peRatio,  double? yearHigh,  double? yearLow,  DateTime? asOf)  $default,) {final _that = this;
switch (_that) {
case _Quote():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double? price,  double? previousClose,  double? dayChangePct,  double? marketCap,  double? sharesOutstanding,  double? peRatio,  double? yearHigh,  double? yearLow,  DateTime? asOf)?  $default,) {final _that = this;
switch (_that) {
case _Quote() when $default != null:
return $default(_that.price,_that.previousClose,_that.dayChangePct,_that.marketCap,_that.sharesOutstanding,_that.peRatio,_that.yearHigh,_that.yearLow,_that.asOf);case _:
  return null;

}
}

}

/// @nodoc


class _Quote implements Quote {
  const _Quote({this.price, this.previousClose, this.dayChangePct, this.marketCap, this.sharesOutstanding, this.peRatio, this.yearHigh, this.yearLow, this.asOf});
  

@override final  double? price;
@override final  double? previousClose;
@override final  double? dayChangePct;
@override final  double? marketCap;
@override final  double? sharesOutstanding;
@override final  double? peRatio;
@override final  double? yearHigh;
@override final  double? yearLow;
@override final  DateTime? asOf;

/// Create a copy of Quote
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuoteCopyWith<_Quote> get copyWith => __$QuoteCopyWithImpl<_Quote>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Quote&&(identical(other.price, price) || other.price == price)&&(identical(other.previousClose, previousClose) || other.previousClose == previousClose)&&(identical(other.dayChangePct, dayChangePct) || other.dayChangePct == dayChangePct)&&(identical(other.marketCap, marketCap) || other.marketCap == marketCap)&&(identical(other.sharesOutstanding, sharesOutstanding) || other.sharesOutstanding == sharesOutstanding)&&(identical(other.peRatio, peRatio) || other.peRatio == peRatio)&&(identical(other.yearHigh, yearHigh) || other.yearHigh == yearHigh)&&(identical(other.yearLow, yearLow) || other.yearLow == yearLow)&&(identical(other.asOf, asOf) || other.asOf == asOf));
}


@override
int get hashCode => Object.hash(runtimeType,price,previousClose,dayChangePct,marketCap,sharesOutstanding,peRatio,yearHigh,yearLow,asOf);

@override
String toString() {
  return 'Quote(price: $price, previousClose: $previousClose, dayChangePct: $dayChangePct, marketCap: $marketCap, sharesOutstanding: $sharesOutstanding, peRatio: $peRatio, yearHigh: $yearHigh, yearLow: $yearLow, asOf: $asOf)';
}


}

/// @nodoc
abstract mixin class _$QuoteCopyWith<$Res> implements $QuoteCopyWith<$Res> {
  factory _$QuoteCopyWith(_Quote value, $Res Function(_Quote) _then) = __$QuoteCopyWithImpl;
@override @useResult
$Res call({
 double? price, double? previousClose, double? dayChangePct, double? marketCap, double? sharesOutstanding, double? peRatio, double? yearHigh, double? yearLow, DateTime? asOf
});




}
/// @nodoc
class __$QuoteCopyWithImpl<$Res>
    implements _$QuoteCopyWith<$Res> {
  __$QuoteCopyWithImpl(this._self, this._then);

  final _Quote _self;
  final $Res Function(_Quote) _then;

/// Create a copy of Quote
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? price = freezed,Object? previousClose = freezed,Object? dayChangePct = freezed,Object? marketCap = freezed,Object? sharesOutstanding = freezed,Object? peRatio = freezed,Object? yearHigh = freezed,Object? yearLow = freezed,Object? asOf = freezed,}) {
  return _then(_Quote(
price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,previousClose: freezed == previousClose ? _self.previousClose : previousClose // ignore: cast_nullable_to_non_nullable
as double?,dayChangePct: freezed == dayChangePct ? _self.dayChangePct : dayChangePct // ignore: cast_nullable_to_non_nullable
as double?,marketCap: freezed == marketCap ? _self.marketCap : marketCap // ignore: cast_nullable_to_non_nullable
as double?,sharesOutstanding: freezed == sharesOutstanding ? _self.sharesOutstanding : sharesOutstanding // ignore: cast_nullable_to_non_nullable
as double?,peRatio: freezed == peRatio ? _self.peRatio : peRatio // ignore: cast_nullable_to_non_nullable
as double?,yearHigh: freezed == yearHigh ? _self.yearHigh : yearHigh // ignore: cast_nullable_to_non_nullable
as double?,yearLow: freezed == yearLow ? _self.yearLow : yearLow // ignore: cast_nullable_to_non_nullable
as double?,asOf: freezed == asOf ? _self.asOf : asOf // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

/// @nodoc
mixin _$ValuationSummary {

 double? get fairValuePerShare; double? get marginOfSafetyPct; double? get impliedGrowthRate; DateTime? get computedAt;
/// Create a copy of ValuationSummary
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ValuationSummaryCopyWith<ValuationSummary> get copyWith => _$ValuationSummaryCopyWithImpl<ValuationSummary>(this as ValuationSummary, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ValuationSummary&&(identical(other.fairValuePerShare, fairValuePerShare) || other.fairValuePerShare == fairValuePerShare)&&(identical(other.marginOfSafetyPct, marginOfSafetyPct) || other.marginOfSafetyPct == marginOfSafetyPct)&&(identical(other.impliedGrowthRate, impliedGrowthRate) || other.impliedGrowthRate == impliedGrowthRate)&&(identical(other.computedAt, computedAt) || other.computedAt == computedAt));
}


@override
int get hashCode => Object.hash(runtimeType,fairValuePerShare,marginOfSafetyPct,impliedGrowthRate,computedAt);

@override
String toString() {
  return 'ValuationSummary(fairValuePerShare: $fairValuePerShare, marginOfSafetyPct: $marginOfSafetyPct, impliedGrowthRate: $impliedGrowthRate, computedAt: $computedAt)';
}


}

/// @nodoc
abstract mixin class $ValuationSummaryCopyWith<$Res>  {
  factory $ValuationSummaryCopyWith(ValuationSummary value, $Res Function(ValuationSummary) _then) = _$ValuationSummaryCopyWithImpl;
@useResult
$Res call({
 double? fairValuePerShare, double? marginOfSafetyPct, double? impliedGrowthRate, DateTime? computedAt
});




}
/// @nodoc
class _$ValuationSummaryCopyWithImpl<$Res>
    implements $ValuationSummaryCopyWith<$Res> {
  _$ValuationSummaryCopyWithImpl(this._self, this._then);

  final ValuationSummary _self;
  final $Res Function(ValuationSummary) _then;

/// Create a copy of ValuationSummary
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? fairValuePerShare = freezed,Object? marginOfSafetyPct = freezed,Object? impliedGrowthRate = freezed,Object? computedAt = freezed,}) {
  return _then(_self.copyWith(
fairValuePerShare: freezed == fairValuePerShare ? _self.fairValuePerShare : fairValuePerShare // ignore: cast_nullable_to_non_nullable
as double?,marginOfSafetyPct: freezed == marginOfSafetyPct ? _self.marginOfSafetyPct : marginOfSafetyPct // ignore: cast_nullable_to_non_nullable
as double?,impliedGrowthRate: freezed == impliedGrowthRate ? _self.impliedGrowthRate : impliedGrowthRate // ignore: cast_nullable_to_non_nullable
as double?,computedAt: freezed == computedAt ? _self.computedAt : computedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [ValuationSummary].
extension ValuationSummaryPatterns on ValuationSummary {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ValuationSummary value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ValuationSummary() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ValuationSummary value)  $default,){
final _that = this;
switch (_that) {
case _ValuationSummary():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ValuationSummary value)?  $default,){
final _that = this;
switch (_that) {
case _ValuationSummary() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double? fairValuePerShare,  double? marginOfSafetyPct,  double? impliedGrowthRate,  DateTime? computedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ValuationSummary() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double? fairValuePerShare,  double? marginOfSafetyPct,  double? impliedGrowthRate,  DateTime? computedAt)  $default,) {final _that = this;
switch (_that) {
case _ValuationSummary():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double? fairValuePerShare,  double? marginOfSafetyPct,  double? impliedGrowthRate,  DateTime? computedAt)?  $default,) {final _that = this;
switch (_that) {
case _ValuationSummary() when $default != null:
return $default(_that.fairValuePerShare,_that.marginOfSafetyPct,_that.impliedGrowthRate,_that.computedAt);case _:
  return null;

}
}

}

/// @nodoc


class _ValuationSummary implements ValuationSummary {
  const _ValuationSummary({this.fairValuePerShare, this.marginOfSafetyPct, this.impliedGrowthRate, this.computedAt});
  

@override final  double? fairValuePerShare;
@override final  double? marginOfSafetyPct;
@override final  double? impliedGrowthRate;
@override final  DateTime? computedAt;

/// Create a copy of ValuationSummary
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ValuationSummaryCopyWith<_ValuationSummary> get copyWith => __$ValuationSummaryCopyWithImpl<_ValuationSummary>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ValuationSummary&&(identical(other.fairValuePerShare, fairValuePerShare) || other.fairValuePerShare == fairValuePerShare)&&(identical(other.marginOfSafetyPct, marginOfSafetyPct) || other.marginOfSafetyPct == marginOfSafetyPct)&&(identical(other.impliedGrowthRate, impliedGrowthRate) || other.impliedGrowthRate == impliedGrowthRate)&&(identical(other.computedAt, computedAt) || other.computedAt == computedAt));
}


@override
int get hashCode => Object.hash(runtimeType,fairValuePerShare,marginOfSafetyPct,impliedGrowthRate,computedAt);

@override
String toString() {
  return 'ValuationSummary(fairValuePerShare: $fairValuePerShare, marginOfSafetyPct: $marginOfSafetyPct, impliedGrowthRate: $impliedGrowthRate, computedAt: $computedAt)';
}


}

/// @nodoc
abstract mixin class _$ValuationSummaryCopyWith<$Res> implements $ValuationSummaryCopyWith<$Res> {
  factory _$ValuationSummaryCopyWith(_ValuationSummary value, $Res Function(_ValuationSummary) _then) = __$ValuationSummaryCopyWithImpl;
@override @useResult
$Res call({
 double? fairValuePerShare, double? marginOfSafetyPct, double? impliedGrowthRate, DateTime? computedAt
});




}
/// @nodoc
class __$ValuationSummaryCopyWithImpl<$Res>
    implements _$ValuationSummaryCopyWith<$Res> {
  __$ValuationSummaryCopyWithImpl(this._self, this._then);

  final _ValuationSummary _self;
  final $Res Function(_ValuationSummary) _then;

/// Create a copy of ValuationSummary
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? fairValuePerShare = freezed,Object? marginOfSafetyPct = freezed,Object? impliedGrowthRate = freezed,Object? computedAt = freezed,}) {
  return _then(_ValuationSummary(
fairValuePerShare: freezed == fairValuePerShare ? _self.fairValuePerShare : fairValuePerShare // ignore: cast_nullable_to_non_nullable
as double?,marginOfSafetyPct: freezed == marginOfSafetyPct ? _self.marginOfSafetyPct : marginOfSafetyPct // ignore: cast_nullable_to_non_nullable
as double?,impliedGrowthRate: freezed == impliedGrowthRate ? _self.impliedGrowthRate : impliedGrowthRate // ignore: cast_nullable_to_non_nullable
as double?,computedAt: freezed == computedAt ? _self.computedAt : computedAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

/// @nodoc
mixin _$FinancialPeriod {

 String get period; int get fiscalYear; DateTime? get periodEnd; double? get revenue; double? get grossProfit; double? get operatingIncome; double? get ebitda; double? get netIncome; double? get eps; double? get epsDiluted; double? get sharesDiluted; double? get totalAssets; double? get totalEquity; double? get totalDebt; double? get totalCurrentAssets; double? get totalCurrentLiabilities; double? get cashAndEquivalents; double? get operatingCashFlow; double? get capitalExpenditure; double? get freeCashFlow;
/// Create a copy of FinancialPeriod
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FinancialPeriodCopyWith<FinancialPeriod> get copyWith => _$FinancialPeriodCopyWithImpl<FinancialPeriod>(this as FinancialPeriod, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FinancialPeriod&&(identical(other.period, period) || other.period == period)&&(identical(other.fiscalYear, fiscalYear) || other.fiscalYear == fiscalYear)&&(identical(other.periodEnd, periodEnd) || other.periodEnd == periodEnd)&&(identical(other.revenue, revenue) || other.revenue == revenue)&&(identical(other.grossProfit, grossProfit) || other.grossProfit == grossProfit)&&(identical(other.operatingIncome, operatingIncome) || other.operatingIncome == operatingIncome)&&(identical(other.ebitda, ebitda) || other.ebitda == ebitda)&&(identical(other.netIncome, netIncome) || other.netIncome == netIncome)&&(identical(other.eps, eps) || other.eps == eps)&&(identical(other.epsDiluted, epsDiluted) || other.epsDiluted == epsDiluted)&&(identical(other.sharesDiluted, sharesDiluted) || other.sharesDiluted == sharesDiluted)&&(identical(other.totalAssets, totalAssets) || other.totalAssets == totalAssets)&&(identical(other.totalEquity, totalEquity) || other.totalEquity == totalEquity)&&(identical(other.totalDebt, totalDebt) || other.totalDebt == totalDebt)&&(identical(other.totalCurrentAssets, totalCurrentAssets) || other.totalCurrentAssets == totalCurrentAssets)&&(identical(other.totalCurrentLiabilities, totalCurrentLiabilities) || other.totalCurrentLiabilities == totalCurrentLiabilities)&&(identical(other.cashAndEquivalents, cashAndEquivalents) || other.cashAndEquivalents == cashAndEquivalents)&&(identical(other.operatingCashFlow, operatingCashFlow) || other.operatingCashFlow == operatingCashFlow)&&(identical(other.capitalExpenditure, capitalExpenditure) || other.capitalExpenditure == capitalExpenditure)&&(identical(other.freeCashFlow, freeCashFlow) || other.freeCashFlow == freeCashFlow));
}


@override
int get hashCode => Object.hashAll([runtimeType,period,fiscalYear,periodEnd,revenue,grossProfit,operatingIncome,ebitda,netIncome,eps,epsDiluted,sharesDiluted,totalAssets,totalEquity,totalDebt,totalCurrentAssets,totalCurrentLiabilities,cashAndEquivalents,operatingCashFlow,capitalExpenditure,freeCashFlow]);

@override
String toString() {
  return 'FinancialPeriod(period: $period, fiscalYear: $fiscalYear, periodEnd: $periodEnd, revenue: $revenue, grossProfit: $grossProfit, operatingIncome: $operatingIncome, ebitda: $ebitda, netIncome: $netIncome, eps: $eps, epsDiluted: $epsDiluted, sharesDiluted: $sharesDiluted, totalAssets: $totalAssets, totalEquity: $totalEquity, totalDebt: $totalDebt, totalCurrentAssets: $totalCurrentAssets, totalCurrentLiabilities: $totalCurrentLiabilities, cashAndEquivalents: $cashAndEquivalents, operatingCashFlow: $operatingCashFlow, capitalExpenditure: $capitalExpenditure, freeCashFlow: $freeCashFlow)';
}


}

/// @nodoc
abstract mixin class $FinancialPeriodCopyWith<$Res>  {
  factory $FinancialPeriodCopyWith(FinancialPeriod value, $Res Function(FinancialPeriod) _then) = _$FinancialPeriodCopyWithImpl;
@useResult
$Res call({
 String period, int fiscalYear, DateTime? periodEnd, double? revenue, double? grossProfit, double? operatingIncome, double? ebitda, double? netIncome, double? eps, double? epsDiluted, double? sharesDiluted, double? totalAssets, double? totalEquity, double? totalDebt, double? totalCurrentAssets, double? totalCurrentLiabilities, double? cashAndEquivalents, double? operatingCashFlow, double? capitalExpenditure, double? freeCashFlow
});




}
/// @nodoc
class _$FinancialPeriodCopyWithImpl<$Res>
    implements $FinancialPeriodCopyWith<$Res> {
  _$FinancialPeriodCopyWithImpl(this._self, this._then);

  final FinancialPeriod _self;
  final $Res Function(FinancialPeriod) _then;

/// Create a copy of FinancialPeriod
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? period = null,Object? fiscalYear = null,Object? periodEnd = freezed,Object? revenue = freezed,Object? grossProfit = freezed,Object? operatingIncome = freezed,Object? ebitda = freezed,Object? netIncome = freezed,Object? eps = freezed,Object? epsDiluted = freezed,Object? sharesDiluted = freezed,Object? totalAssets = freezed,Object? totalEquity = freezed,Object? totalDebt = freezed,Object? totalCurrentAssets = freezed,Object? totalCurrentLiabilities = freezed,Object? cashAndEquivalents = freezed,Object? operatingCashFlow = freezed,Object? capitalExpenditure = freezed,Object? freeCashFlow = freezed,}) {
  return _then(_self.copyWith(
period: null == period ? _self.period : period // ignore: cast_nullable_to_non_nullable
as String,fiscalYear: null == fiscalYear ? _self.fiscalYear : fiscalYear // ignore: cast_nullable_to_non_nullable
as int,periodEnd: freezed == periodEnd ? _self.periodEnd : periodEnd // ignore: cast_nullable_to_non_nullable
as DateTime?,revenue: freezed == revenue ? _self.revenue : revenue // ignore: cast_nullable_to_non_nullable
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


/// Adds pattern-matching-related methods to [FinancialPeriod].
extension FinancialPeriodPatterns on FinancialPeriod {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FinancialPeriod value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FinancialPeriod() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FinancialPeriod value)  $default,){
final _that = this;
switch (_that) {
case _FinancialPeriod():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FinancialPeriod value)?  $default,){
final _that = this;
switch (_that) {
case _FinancialPeriod() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String period,  int fiscalYear,  DateTime? periodEnd,  double? revenue,  double? grossProfit,  double? operatingIncome,  double? ebitda,  double? netIncome,  double? eps,  double? epsDiluted,  double? sharesDiluted,  double? totalAssets,  double? totalEquity,  double? totalDebt,  double? totalCurrentAssets,  double? totalCurrentLiabilities,  double? cashAndEquivalents,  double? operatingCashFlow,  double? capitalExpenditure,  double? freeCashFlow)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FinancialPeriod() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String period,  int fiscalYear,  DateTime? periodEnd,  double? revenue,  double? grossProfit,  double? operatingIncome,  double? ebitda,  double? netIncome,  double? eps,  double? epsDiluted,  double? sharesDiluted,  double? totalAssets,  double? totalEquity,  double? totalDebt,  double? totalCurrentAssets,  double? totalCurrentLiabilities,  double? cashAndEquivalents,  double? operatingCashFlow,  double? capitalExpenditure,  double? freeCashFlow)  $default,) {final _that = this;
switch (_that) {
case _FinancialPeriod():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String period,  int fiscalYear,  DateTime? periodEnd,  double? revenue,  double? grossProfit,  double? operatingIncome,  double? ebitda,  double? netIncome,  double? eps,  double? epsDiluted,  double? sharesDiluted,  double? totalAssets,  double? totalEquity,  double? totalDebt,  double? totalCurrentAssets,  double? totalCurrentLiabilities,  double? cashAndEquivalents,  double? operatingCashFlow,  double? capitalExpenditure,  double? freeCashFlow)?  $default,) {final _that = this;
switch (_that) {
case _FinancialPeriod() when $default != null:
return $default(_that.period,_that.fiscalYear,_that.periodEnd,_that.revenue,_that.grossProfit,_that.operatingIncome,_that.ebitda,_that.netIncome,_that.eps,_that.epsDiluted,_that.sharesDiluted,_that.totalAssets,_that.totalEquity,_that.totalDebt,_that.totalCurrentAssets,_that.totalCurrentLiabilities,_that.cashAndEquivalents,_that.operatingCashFlow,_that.capitalExpenditure,_that.freeCashFlow);case _:
  return null;

}
}

}

/// @nodoc


class _FinancialPeriod implements FinancialPeriod {
  const _FinancialPeriod({required this.period, required this.fiscalYear, this.periodEnd, this.revenue, this.grossProfit, this.operatingIncome, this.ebitda, this.netIncome, this.eps, this.epsDiluted, this.sharesDiluted, this.totalAssets, this.totalEquity, this.totalDebt, this.totalCurrentAssets, this.totalCurrentLiabilities, this.cashAndEquivalents, this.operatingCashFlow, this.capitalExpenditure, this.freeCashFlow});
  

@override final  String period;
@override final  int fiscalYear;
@override final  DateTime? periodEnd;
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

/// Create a copy of FinancialPeriod
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FinancialPeriodCopyWith<_FinancialPeriod> get copyWith => __$FinancialPeriodCopyWithImpl<_FinancialPeriod>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FinancialPeriod&&(identical(other.period, period) || other.period == period)&&(identical(other.fiscalYear, fiscalYear) || other.fiscalYear == fiscalYear)&&(identical(other.periodEnd, periodEnd) || other.periodEnd == periodEnd)&&(identical(other.revenue, revenue) || other.revenue == revenue)&&(identical(other.grossProfit, grossProfit) || other.grossProfit == grossProfit)&&(identical(other.operatingIncome, operatingIncome) || other.operatingIncome == operatingIncome)&&(identical(other.ebitda, ebitda) || other.ebitda == ebitda)&&(identical(other.netIncome, netIncome) || other.netIncome == netIncome)&&(identical(other.eps, eps) || other.eps == eps)&&(identical(other.epsDiluted, epsDiluted) || other.epsDiluted == epsDiluted)&&(identical(other.sharesDiluted, sharesDiluted) || other.sharesDiluted == sharesDiluted)&&(identical(other.totalAssets, totalAssets) || other.totalAssets == totalAssets)&&(identical(other.totalEquity, totalEquity) || other.totalEquity == totalEquity)&&(identical(other.totalDebt, totalDebt) || other.totalDebt == totalDebt)&&(identical(other.totalCurrentAssets, totalCurrentAssets) || other.totalCurrentAssets == totalCurrentAssets)&&(identical(other.totalCurrentLiabilities, totalCurrentLiabilities) || other.totalCurrentLiabilities == totalCurrentLiabilities)&&(identical(other.cashAndEquivalents, cashAndEquivalents) || other.cashAndEquivalents == cashAndEquivalents)&&(identical(other.operatingCashFlow, operatingCashFlow) || other.operatingCashFlow == operatingCashFlow)&&(identical(other.capitalExpenditure, capitalExpenditure) || other.capitalExpenditure == capitalExpenditure)&&(identical(other.freeCashFlow, freeCashFlow) || other.freeCashFlow == freeCashFlow));
}


@override
int get hashCode => Object.hashAll([runtimeType,period,fiscalYear,periodEnd,revenue,grossProfit,operatingIncome,ebitda,netIncome,eps,epsDiluted,sharesDiluted,totalAssets,totalEquity,totalDebt,totalCurrentAssets,totalCurrentLiabilities,cashAndEquivalents,operatingCashFlow,capitalExpenditure,freeCashFlow]);

@override
String toString() {
  return 'FinancialPeriod(period: $period, fiscalYear: $fiscalYear, periodEnd: $periodEnd, revenue: $revenue, grossProfit: $grossProfit, operatingIncome: $operatingIncome, ebitda: $ebitda, netIncome: $netIncome, eps: $eps, epsDiluted: $epsDiluted, sharesDiluted: $sharesDiluted, totalAssets: $totalAssets, totalEquity: $totalEquity, totalDebt: $totalDebt, totalCurrentAssets: $totalCurrentAssets, totalCurrentLiabilities: $totalCurrentLiabilities, cashAndEquivalents: $cashAndEquivalents, operatingCashFlow: $operatingCashFlow, capitalExpenditure: $capitalExpenditure, freeCashFlow: $freeCashFlow)';
}


}

/// @nodoc
abstract mixin class _$FinancialPeriodCopyWith<$Res> implements $FinancialPeriodCopyWith<$Res> {
  factory _$FinancialPeriodCopyWith(_FinancialPeriod value, $Res Function(_FinancialPeriod) _then) = __$FinancialPeriodCopyWithImpl;
@override @useResult
$Res call({
 String period, int fiscalYear, DateTime? periodEnd, double? revenue, double? grossProfit, double? operatingIncome, double? ebitda, double? netIncome, double? eps, double? epsDiluted, double? sharesDiluted, double? totalAssets, double? totalEquity, double? totalDebt, double? totalCurrentAssets, double? totalCurrentLiabilities, double? cashAndEquivalents, double? operatingCashFlow, double? capitalExpenditure, double? freeCashFlow
});




}
/// @nodoc
class __$FinancialPeriodCopyWithImpl<$Res>
    implements _$FinancialPeriodCopyWith<$Res> {
  __$FinancialPeriodCopyWithImpl(this._self, this._then);

  final _FinancialPeriod _self;
  final $Res Function(_FinancialPeriod) _then;

/// Create a copy of FinancialPeriod
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? period = null,Object? fiscalYear = null,Object? periodEnd = freezed,Object? revenue = freezed,Object? grossProfit = freezed,Object? operatingIncome = freezed,Object? ebitda = freezed,Object? netIncome = freezed,Object? eps = freezed,Object? epsDiluted = freezed,Object? sharesDiluted = freezed,Object? totalAssets = freezed,Object? totalEquity = freezed,Object? totalDebt = freezed,Object? totalCurrentAssets = freezed,Object? totalCurrentLiabilities = freezed,Object? cashAndEquivalents = freezed,Object? operatingCashFlow = freezed,Object? capitalExpenditure = freezed,Object? freeCashFlow = freezed,}) {
  return _then(_FinancialPeriod(
period: null == period ? _self.period : period // ignore: cast_nullable_to_non_nullable
as String,fiscalYear: null == fiscalYear ? _self.fiscalYear : fiscalYear // ignore: cast_nullable_to_non_nullable
as int,periodEnd: freezed == periodEnd ? _self.periodEnd : periodEnd // ignore: cast_nullable_to_non_nullable
as DateTime?,revenue: freezed == revenue ? _self.revenue : revenue // ignore: cast_nullable_to_non_nullable
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
mixin _$KeyMetrics {

 double? get grossMargin; double? get operatingMargin; double? get netMargin; double? get fcfMargin; double? get returnOnEquity; double? get returnOnAssets; double? get currentRatio; double? get debtToEquity; double? get netDebt; double? get revenueCagr5y; double? get revenueYoy; double? get netIncomeCagr5y; double? get fcfCagr5y;
/// Create a copy of KeyMetrics
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KeyMetricsCopyWith<KeyMetrics> get copyWith => _$KeyMetricsCopyWithImpl<KeyMetrics>(this as KeyMetrics, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is KeyMetrics&&(identical(other.grossMargin, grossMargin) || other.grossMargin == grossMargin)&&(identical(other.operatingMargin, operatingMargin) || other.operatingMargin == operatingMargin)&&(identical(other.netMargin, netMargin) || other.netMargin == netMargin)&&(identical(other.fcfMargin, fcfMargin) || other.fcfMargin == fcfMargin)&&(identical(other.returnOnEquity, returnOnEquity) || other.returnOnEquity == returnOnEquity)&&(identical(other.returnOnAssets, returnOnAssets) || other.returnOnAssets == returnOnAssets)&&(identical(other.currentRatio, currentRatio) || other.currentRatio == currentRatio)&&(identical(other.debtToEquity, debtToEquity) || other.debtToEquity == debtToEquity)&&(identical(other.netDebt, netDebt) || other.netDebt == netDebt)&&(identical(other.revenueCagr5y, revenueCagr5y) || other.revenueCagr5y == revenueCagr5y)&&(identical(other.revenueYoy, revenueYoy) || other.revenueYoy == revenueYoy)&&(identical(other.netIncomeCagr5y, netIncomeCagr5y) || other.netIncomeCagr5y == netIncomeCagr5y)&&(identical(other.fcfCagr5y, fcfCagr5y) || other.fcfCagr5y == fcfCagr5y));
}


@override
int get hashCode => Object.hash(runtimeType,grossMargin,operatingMargin,netMargin,fcfMargin,returnOnEquity,returnOnAssets,currentRatio,debtToEquity,netDebt,revenueCagr5y,revenueYoy,netIncomeCagr5y,fcfCagr5y);

@override
String toString() {
  return 'KeyMetrics(grossMargin: $grossMargin, operatingMargin: $operatingMargin, netMargin: $netMargin, fcfMargin: $fcfMargin, returnOnEquity: $returnOnEquity, returnOnAssets: $returnOnAssets, currentRatio: $currentRatio, debtToEquity: $debtToEquity, netDebt: $netDebt, revenueCagr5y: $revenueCagr5y, revenueYoy: $revenueYoy, netIncomeCagr5y: $netIncomeCagr5y, fcfCagr5y: $fcfCagr5y)';
}


}

/// @nodoc
abstract mixin class $KeyMetricsCopyWith<$Res>  {
  factory $KeyMetricsCopyWith(KeyMetrics value, $Res Function(KeyMetrics) _then) = _$KeyMetricsCopyWithImpl;
@useResult
$Res call({
 double? grossMargin, double? operatingMargin, double? netMargin, double? fcfMargin, double? returnOnEquity, double? returnOnAssets, double? currentRatio, double? debtToEquity, double? netDebt, double? revenueCagr5y, double? revenueYoy, double? netIncomeCagr5y, double? fcfCagr5y
});




}
/// @nodoc
class _$KeyMetricsCopyWithImpl<$Res>
    implements $KeyMetricsCopyWith<$Res> {
  _$KeyMetricsCopyWithImpl(this._self, this._then);

  final KeyMetrics _self;
  final $Res Function(KeyMetrics) _then;

/// Create a copy of KeyMetrics
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


/// Adds pattern-matching-related methods to [KeyMetrics].
extension KeyMetricsPatterns on KeyMetrics {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _KeyMetrics value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _KeyMetrics() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _KeyMetrics value)  $default,){
final _that = this;
switch (_that) {
case _KeyMetrics():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _KeyMetrics value)?  $default,){
final _that = this;
switch (_that) {
case _KeyMetrics() when $default != null:
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
case _KeyMetrics() when $default != null:
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
case _KeyMetrics():
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
case _KeyMetrics() when $default != null:
return $default(_that.grossMargin,_that.operatingMargin,_that.netMargin,_that.fcfMargin,_that.returnOnEquity,_that.returnOnAssets,_that.currentRatio,_that.debtToEquity,_that.netDebt,_that.revenueCagr5y,_that.revenueYoy,_that.netIncomeCagr5y,_that.fcfCagr5y);case _:
  return null;

}
}

}

/// @nodoc


class _KeyMetrics implements KeyMetrics {
  const _KeyMetrics({this.grossMargin, this.operatingMargin, this.netMargin, this.fcfMargin, this.returnOnEquity, this.returnOnAssets, this.currentRatio, this.debtToEquity, this.netDebt, this.revenueCagr5y, this.revenueYoy, this.netIncomeCagr5y, this.fcfCagr5y});
  

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

/// Create a copy of KeyMetrics
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KeyMetricsCopyWith<_KeyMetrics> get copyWith => __$KeyMetricsCopyWithImpl<_KeyMetrics>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _KeyMetrics&&(identical(other.grossMargin, grossMargin) || other.grossMargin == grossMargin)&&(identical(other.operatingMargin, operatingMargin) || other.operatingMargin == operatingMargin)&&(identical(other.netMargin, netMargin) || other.netMargin == netMargin)&&(identical(other.fcfMargin, fcfMargin) || other.fcfMargin == fcfMargin)&&(identical(other.returnOnEquity, returnOnEquity) || other.returnOnEquity == returnOnEquity)&&(identical(other.returnOnAssets, returnOnAssets) || other.returnOnAssets == returnOnAssets)&&(identical(other.currentRatio, currentRatio) || other.currentRatio == currentRatio)&&(identical(other.debtToEquity, debtToEquity) || other.debtToEquity == debtToEquity)&&(identical(other.netDebt, netDebt) || other.netDebt == netDebt)&&(identical(other.revenueCagr5y, revenueCagr5y) || other.revenueCagr5y == revenueCagr5y)&&(identical(other.revenueYoy, revenueYoy) || other.revenueYoy == revenueYoy)&&(identical(other.netIncomeCagr5y, netIncomeCagr5y) || other.netIncomeCagr5y == netIncomeCagr5y)&&(identical(other.fcfCagr5y, fcfCagr5y) || other.fcfCagr5y == fcfCagr5y));
}


@override
int get hashCode => Object.hash(runtimeType,grossMargin,operatingMargin,netMargin,fcfMargin,returnOnEquity,returnOnAssets,currentRatio,debtToEquity,netDebt,revenueCagr5y,revenueYoy,netIncomeCagr5y,fcfCagr5y);

@override
String toString() {
  return 'KeyMetrics(grossMargin: $grossMargin, operatingMargin: $operatingMargin, netMargin: $netMargin, fcfMargin: $fcfMargin, returnOnEquity: $returnOnEquity, returnOnAssets: $returnOnAssets, currentRatio: $currentRatio, debtToEquity: $debtToEquity, netDebt: $netDebt, revenueCagr5y: $revenueCagr5y, revenueYoy: $revenueYoy, netIncomeCagr5y: $netIncomeCagr5y, fcfCagr5y: $fcfCagr5y)';
}


}

/// @nodoc
abstract mixin class _$KeyMetricsCopyWith<$Res> implements $KeyMetricsCopyWith<$Res> {
  factory _$KeyMetricsCopyWith(_KeyMetrics value, $Res Function(_KeyMetrics) _then) = __$KeyMetricsCopyWithImpl;
@override @useResult
$Res call({
 double? grossMargin, double? operatingMargin, double? netMargin, double? fcfMargin, double? returnOnEquity, double? returnOnAssets, double? currentRatio, double? debtToEquity, double? netDebt, double? revenueCagr5y, double? revenueYoy, double? netIncomeCagr5y, double? fcfCagr5y
});




}
/// @nodoc
class __$KeyMetricsCopyWithImpl<$Res>
    implements _$KeyMetricsCopyWith<$Res> {
  __$KeyMetricsCopyWithImpl(this._self, this._then);

  final _KeyMetrics _self;
  final $Res Function(_KeyMetrics) _then;

/// Create a copy of KeyMetrics
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? grossMargin = freezed,Object? operatingMargin = freezed,Object? netMargin = freezed,Object? fcfMargin = freezed,Object? returnOnEquity = freezed,Object? returnOnAssets = freezed,Object? currentRatio = freezed,Object? debtToEquity = freezed,Object? netDebt = freezed,Object? revenueCagr5y = freezed,Object? revenueYoy = freezed,Object? netIncomeCagr5y = freezed,Object? fcfCagr5y = freezed,}) {
  return _then(_KeyMetrics(
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
mixin _$PriceBar {

 DateTime get tradeDate; double get close; double? get volume;
/// Create a copy of PriceBar
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PriceBarCopyWith<PriceBar> get copyWith => _$PriceBarCopyWithImpl<PriceBar>(this as PriceBar, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PriceBar&&(identical(other.tradeDate, tradeDate) || other.tradeDate == tradeDate)&&(identical(other.close, close) || other.close == close)&&(identical(other.volume, volume) || other.volume == volume));
}


@override
int get hashCode => Object.hash(runtimeType,tradeDate,close,volume);

@override
String toString() {
  return 'PriceBar(tradeDate: $tradeDate, close: $close, volume: $volume)';
}


}

/// @nodoc
abstract mixin class $PriceBarCopyWith<$Res>  {
  factory $PriceBarCopyWith(PriceBar value, $Res Function(PriceBar) _then) = _$PriceBarCopyWithImpl;
@useResult
$Res call({
 DateTime tradeDate, double close, double? volume
});




}
/// @nodoc
class _$PriceBarCopyWithImpl<$Res>
    implements $PriceBarCopyWith<$Res> {
  _$PriceBarCopyWithImpl(this._self, this._then);

  final PriceBar _self;
  final $Res Function(PriceBar) _then;

/// Create a copy of PriceBar
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? tradeDate = null,Object? close = null,Object? volume = freezed,}) {
  return _then(_self.copyWith(
tradeDate: null == tradeDate ? _self.tradeDate : tradeDate // ignore: cast_nullable_to_non_nullable
as DateTime,close: null == close ? _self.close : close // ignore: cast_nullable_to_non_nullable
as double,volume: freezed == volume ? _self.volume : volume // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}

}


/// Adds pattern-matching-related methods to [PriceBar].
extension PriceBarPatterns on PriceBar {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PriceBar value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PriceBar() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PriceBar value)  $default,){
final _that = this;
switch (_that) {
case _PriceBar():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PriceBar value)?  $default,){
final _that = this;
switch (_that) {
case _PriceBar() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( DateTime tradeDate,  double close,  double? volume)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PriceBar() when $default != null:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( DateTime tradeDate,  double close,  double? volume)  $default,) {final _that = this;
switch (_that) {
case _PriceBar():
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( DateTime tradeDate,  double close,  double? volume)?  $default,) {final _that = this;
switch (_that) {
case _PriceBar() when $default != null:
return $default(_that.tradeDate,_that.close,_that.volume);case _:
  return null;

}
}

}

/// @nodoc


class _PriceBar implements PriceBar {
  const _PriceBar({required this.tradeDate, required this.close, this.volume});
  

@override final  DateTime tradeDate;
@override final  double close;
@override final  double? volume;

/// Create a copy of PriceBar
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PriceBarCopyWith<_PriceBar> get copyWith => __$PriceBarCopyWithImpl<_PriceBar>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PriceBar&&(identical(other.tradeDate, tradeDate) || other.tradeDate == tradeDate)&&(identical(other.close, close) || other.close == close)&&(identical(other.volume, volume) || other.volume == volume));
}


@override
int get hashCode => Object.hash(runtimeType,tradeDate,close,volume);

@override
String toString() {
  return 'PriceBar(tradeDate: $tradeDate, close: $close, volume: $volume)';
}


}

/// @nodoc
abstract mixin class _$PriceBarCopyWith<$Res> implements $PriceBarCopyWith<$Res> {
  factory _$PriceBarCopyWith(_PriceBar value, $Res Function(_PriceBar) _then) = __$PriceBarCopyWithImpl;
@override @useResult
$Res call({
 DateTime tradeDate, double close, double? volume
});




}
/// @nodoc
class __$PriceBarCopyWithImpl<$Res>
    implements _$PriceBarCopyWith<$Res> {
  __$PriceBarCopyWithImpl(this._self, this._then);

  final _PriceBar _self;
  final $Res Function(_PriceBar) _then;

/// Create a copy of PriceBar
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? tradeDate = null,Object? close = null,Object? volume = freezed,}) {
  return _then(_PriceBar(
tradeDate: null == tradeDate ? _self.tradeDate : tradeDate // ignore: cast_nullable_to_non_nullable
as DateTime,close: null == close ? _self.close : close // ignore: cast_nullable_to_non_nullable
as double,volume: freezed == volume ? _self.volume : volume // ignore: cast_nullable_to_non_nullable
as double?,
  ));
}


}

/// @nodoc
mixin _$PriceSeries {

 String get symbol; int get days; bool get truncatedByPlan; List<PriceBar> get bars;
/// Create a copy of PriceSeries
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PriceSeriesCopyWith<PriceSeries> get copyWith => _$PriceSeriesCopyWithImpl<PriceSeries>(this as PriceSeries, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PriceSeries&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.days, days) || other.days == days)&&(identical(other.truncatedByPlan, truncatedByPlan) || other.truncatedByPlan == truncatedByPlan)&&const DeepCollectionEquality().equals(other.bars, bars));
}


@override
int get hashCode => Object.hash(runtimeType,symbol,days,truncatedByPlan,const DeepCollectionEquality().hash(bars));

@override
String toString() {
  return 'PriceSeries(symbol: $symbol, days: $days, truncatedByPlan: $truncatedByPlan, bars: $bars)';
}


}

/// @nodoc
abstract mixin class $PriceSeriesCopyWith<$Res>  {
  factory $PriceSeriesCopyWith(PriceSeries value, $Res Function(PriceSeries) _then) = _$PriceSeriesCopyWithImpl;
@useResult
$Res call({
 String symbol, int days, bool truncatedByPlan, List<PriceBar> bars
});




}
/// @nodoc
class _$PriceSeriesCopyWithImpl<$Res>
    implements $PriceSeriesCopyWith<$Res> {
  _$PriceSeriesCopyWithImpl(this._self, this._then);

  final PriceSeries _self;
  final $Res Function(PriceSeries) _then;

/// Create a copy of PriceSeries
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? symbol = null,Object? days = null,Object? truncatedByPlan = null,Object? bars = null,}) {
  return _then(_self.copyWith(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,truncatedByPlan: null == truncatedByPlan ? _self.truncatedByPlan : truncatedByPlan // ignore: cast_nullable_to_non_nullable
as bool,bars: null == bars ? _self.bars : bars // ignore: cast_nullable_to_non_nullable
as List<PriceBar>,
  ));
}

}


/// Adds pattern-matching-related methods to [PriceSeries].
extension PriceSeriesPatterns on PriceSeries {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PriceSeries value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PriceSeries() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PriceSeries value)  $default,){
final _that = this;
switch (_that) {
case _PriceSeries():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PriceSeries value)?  $default,){
final _that = this;
switch (_that) {
case _PriceSeries() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String symbol,  int days,  bool truncatedByPlan,  List<PriceBar> bars)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PriceSeries() when $default != null:
return $default(_that.symbol,_that.days,_that.truncatedByPlan,_that.bars);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String symbol,  int days,  bool truncatedByPlan,  List<PriceBar> bars)  $default,) {final _that = this;
switch (_that) {
case _PriceSeries():
return $default(_that.symbol,_that.days,_that.truncatedByPlan,_that.bars);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String symbol,  int days,  bool truncatedByPlan,  List<PriceBar> bars)?  $default,) {final _that = this;
switch (_that) {
case _PriceSeries() when $default != null:
return $default(_that.symbol,_that.days,_that.truncatedByPlan,_that.bars);case _:
  return null;

}
}

}

/// @nodoc


class _PriceSeries implements PriceSeries {
  const _PriceSeries({required this.symbol, required this.days, required this.truncatedByPlan, required final  List<PriceBar> bars}): _bars = bars;
  

@override final  String symbol;
@override final  int days;
@override final  bool truncatedByPlan;
 final  List<PriceBar> _bars;
@override List<PriceBar> get bars {
  if (_bars is EqualUnmodifiableListView) return _bars;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_bars);
}


/// Create a copy of PriceSeries
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PriceSeriesCopyWith<_PriceSeries> get copyWith => __$PriceSeriesCopyWithImpl<_PriceSeries>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PriceSeries&&(identical(other.symbol, symbol) || other.symbol == symbol)&&(identical(other.days, days) || other.days == days)&&(identical(other.truncatedByPlan, truncatedByPlan) || other.truncatedByPlan == truncatedByPlan)&&const DeepCollectionEquality().equals(other._bars, _bars));
}


@override
int get hashCode => Object.hash(runtimeType,symbol,days,truncatedByPlan,const DeepCollectionEquality().hash(_bars));

@override
String toString() {
  return 'PriceSeries(symbol: $symbol, days: $days, truncatedByPlan: $truncatedByPlan, bars: $bars)';
}


}

/// @nodoc
abstract mixin class _$PriceSeriesCopyWith<$Res> implements $PriceSeriesCopyWith<$Res> {
  factory _$PriceSeriesCopyWith(_PriceSeries value, $Res Function(_PriceSeries) _then) = __$PriceSeriesCopyWithImpl;
@override @useResult
$Res call({
 String symbol, int days, bool truncatedByPlan, List<PriceBar> bars
});




}
/// @nodoc
class __$PriceSeriesCopyWithImpl<$Res>
    implements _$PriceSeriesCopyWith<$Res> {
  __$PriceSeriesCopyWithImpl(this._self, this._then);

  final _PriceSeries _self;
  final $Res Function(_PriceSeries) _then;

/// Create a copy of PriceSeries
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? symbol = null,Object? days = null,Object? truncatedByPlan = null,Object? bars = null,}) {
  return _then(_PriceSeries(
symbol: null == symbol ? _self.symbol : symbol // ignore: cast_nullable_to_non_nullable
as String,days: null == days ? _self.days : days // ignore: cast_nullable_to_non_nullable
as int,truncatedByPlan: null == truncatedByPlan ? _self.truncatedByPlan : truncatedByPlan // ignore: cast_nullable_to_non_nullable
as bool,bars: null == bars ? _self._bars : bars // ignore: cast_nullable_to_non_nullable
as List<PriceBar>,
  ));
}


}

// dart format on
