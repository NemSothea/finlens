import '../../../core/domain/result.dart';
import 'company_snapshot.dart';

abstract interface class StockRepository {
  Future<Result<CompanySnapshot>> snapshot(String symbol);

  Future<Result<PriceSeries>> prices(String symbol, {int days});
}
