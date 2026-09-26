import '../../../core/domain/failure.dart';
import '../../../core/domain/result.dart';
import '../domain/company_snapshot.dart';
import '../domain/stock_repository.dart';

/// Company-screen orchestration.
///
/// Stateless, domain types in and out, no Flutter import. It normalises the
/// symbol in one place: `/stocks/aapl` from a deep link and `AAPL` typed into
/// search must resolve to the same request, or the cache holds two entries for
/// one company.
class StockService {
  const StockService(this._repository);

  final StockRepository _repository;

  /// A year of daily bars is what the free plan allows; the API clamps anything
  /// larger and says so with `truncatedByPlan`.
  static const int defaultPriceDays = 365;

  Future<Result<CompanySnapshot>> snapshot(String symbol) {
    final normalised = _normalise(symbol);
    // An empty symbol is a broken link, not a request worth making: the API
    // would answer 404 anyway, one round trip later.
    if (normalised.isEmpty) {
      return Future.value(
        const Failed(NotFoundFailure(detail: 'empty symbol')),
      );
    }
    return _repository.snapshot(normalised);
  }

  Future<Result<PriceSeries>> prices(
    String symbol, {
    int days = defaultPriceDays,
  }) {
    final normalised = _normalise(symbol);
    if (normalised.isEmpty) {
      return Future.value(
        const Failed(NotFoundFailure(detail: 'empty symbol')),
      );
    }
    return _repository.prices(normalised, days: days);
  }

  String _normalise(String symbol) => symbol.trim().toUpperCase();
}
