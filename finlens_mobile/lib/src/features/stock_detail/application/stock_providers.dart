import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/domain/result.dart';
import '../../../core/providers.dart';
import '../data/stock_repository_dio.dart';
import '../domain/company_snapshot.dart';
import '../domain/stock_repository.dart';
import 'stock_service.dart';

part 'stock_providers.g.dart';

@riverpod
StockRepository stockRepository(Ref ref) =>
    StockRepositoryDio(ref.watch(apiClientProvider));

@riverpod
StockService stockService(Ref ref) =>
    StockService(ref.watch(stockRepositoryProvider));

/// Keyed by symbol, so two companies are two independent cache entries and
/// navigating back does not refetch what is already loaded.
@riverpod
Future<CompanySnapshot> companySnapshot(Ref ref, String symbol) async {
  final result = await ref.watch(stockServiceProvider).snapshot(symbol);

  return switch (result) {
    Success<CompanySnapshot>(value: final snapshot) => snapshot,
    Failed<CompanySnapshot>(failure: final failure) => throw failure,
  };
}

@riverpod
Future<PriceSeries> priceSeries(
  Ref ref,
  String symbol, {
  int days = StockService.defaultPriceDays,
}) async {
  final result = await ref
      .watch(stockServiceProvider)
      .prices(symbol, days: days);

  return switch (result) {
    Success<PriceSeries>(value: final series) => series,
    Failed<PriceSeries>(failure: final failure) => throw failure,
  };
}
