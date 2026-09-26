// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stock_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(stockRepository)
final stockRepositoryProvider = StockRepositoryProvider._();

final class StockRepositoryProvider
    extends
        $FunctionalProvider<StockRepository, StockRepository, StockRepository>
    with $Provider<StockRepository> {
  StockRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'stockRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$stockRepositoryHash();

  @$internal
  @override
  $ProviderElement<StockRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  StockRepository create(Ref ref) {
    return stockRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(StockRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<StockRepository>(value),
    );
  }
}

String _$stockRepositoryHash() => r'890fa8005f318f8882fd201f57219b92c64eb86c';

@ProviderFor(stockService)
final stockServiceProvider = StockServiceProvider._();

final class StockServiceProvider
    extends $FunctionalProvider<StockService, StockService, StockService>
    with $Provider<StockService> {
  StockServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'stockServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$stockServiceHash();

  @$internal
  @override
  $ProviderElement<StockService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  StockService create(Ref ref) {
    return stockService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(StockService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<StockService>(value),
    );
  }
}

String _$stockServiceHash() => r'1e11344ee5a82a1550304bd4422df9cbb9bd0d13';

/// Keyed by symbol, so two companies are two independent cache entries and
/// navigating back does not refetch what is already loaded.

@ProviderFor(companySnapshot)
final companySnapshotProvider = CompanySnapshotFamily._();

/// Keyed by symbol, so two companies are two independent cache entries and
/// navigating back does not refetch what is already loaded.

final class CompanySnapshotProvider
    extends
        $FunctionalProvider<
          AsyncValue<CompanySnapshot>,
          CompanySnapshot,
          FutureOr<CompanySnapshot>
        >
    with $FutureModifier<CompanySnapshot>, $FutureProvider<CompanySnapshot> {
  /// Keyed by symbol, so two companies are two independent cache entries and
  /// navigating back does not refetch what is already loaded.
  CompanySnapshotProvider._({
    required CompanySnapshotFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'companySnapshotProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$companySnapshotHash();

  @override
  String toString() {
    return r'companySnapshotProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<CompanySnapshot> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<CompanySnapshot> create(Ref ref) {
    final argument = this.argument as String;
    return companySnapshot(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is CompanySnapshotProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$companySnapshotHash() => r'c43d28c33795b1e083354ba16a5309c2288b611a';

/// Keyed by symbol, so two companies are two independent cache entries and
/// navigating back does not refetch what is already loaded.

final class CompanySnapshotFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<CompanySnapshot>, String> {
  CompanySnapshotFamily._()
    : super(
        retry: null,
        name: r'companySnapshotProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Keyed by symbol, so two companies are two independent cache entries and
  /// navigating back does not refetch what is already loaded.

  CompanySnapshotProvider call(String symbol) =>
      CompanySnapshotProvider._(argument: symbol, from: this);

  @override
  String toString() => r'companySnapshotProvider';
}

@ProviderFor(priceSeries)
final priceSeriesProvider = PriceSeriesFamily._();

final class PriceSeriesProvider
    extends
        $FunctionalProvider<
          AsyncValue<PriceSeries>,
          PriceSeries,
          FutureOr<PriceSeries>
        >
    with $FutureModifier<PriceSeries>, $FutureProvider<PriceSeries> {
  PriceSeriesProvider._({
    required PriceSeriesFamily super.from,
    required (String, {int days}) super.argument,
  }) : super(
         retry: null,
         name: r'priceSeriesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$priceSeriesHash();

  @override
  String toString() {
    return r'priceSeriesProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<PriceSeries> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<PriceSeries> create(Ref ref) {
    final argument = this.argument as (String, {int days});
    return priceSeries(ref, argument.$1, days: argument.days);
  }

  @override
  bool operator ==(Object other) {
    return other is PriceSeriesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$priceSeriesHash() => r'080405111c0eb5a4fe951cec0b8cf3d7d8423de9';

final class PriceSeriesFamily extends $Family
    with
        $FunctionalFamilyOverride<FutureOr<PriceSeries>, (String, {int days})> {
  PriceSeriesFamily._()
    : super(
        retry: null,
        name: r'priceSeriesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  PriceSeriesProvider call(
    String symbol, {
    int days = StockService.defaultPriceDays,
  }) => PriceSeriesProvider._(argument: (symbol, days: days), from: this);

  @override
  String toString() => r'priceSeriesProvider';
}
