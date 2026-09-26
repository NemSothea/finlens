import 'package:freezed_annotation/freezed_annotation.dart';

part 'company_snapshot.freezed.dart';

/// Everything `GET /api/stocks/:symbol` knows about one company.
///
/// Almost every number is nullable, and that is the API telling the truth: a
/// company can be ingested before it has a quote, a valuation can be impossible
/// for a bank, and a fiscal year can be missing a cash flow statement. Defaulting
/// any of these to zero would render a confident wrong number — the one failure
/// mode a research tool cannot have.
@freezed
abstract class CompanySnapshot with _$CompanySnapshot {
  const factory CompanySnapshot({
    required Company company,
    Quote? quote,
    ValuationSummary? valuation,
    FinancialPeriod? latest,
    required KeyMetrics metrics,
  }) = _CompanySnapshot;
}

@freezed
abstract class Company with _$Company {
  const factory Company({
    required String symbol,
    required String name,
    String? exchange,
    String? currency,
    String? sector,
    String? industry,
    String? country,
    String? website,
    String? description,
    int? employees,
  }) = _Company;
}

@freezed
abstract class Quote with _$Quote {
  const factory Quote({
    double? price,
    double? previousClose,
    double? dayChangePct,
    double? marketCap,
    double? sharesOutstanding,
    double? peRatio,
    double? yearHigh,
    double? yearLow,
    DateTime? asOf,
  }) = _Quote;
}

/// The cached DCF output. Computed by the pipeline, never in Dart — two
/// implementations of one formula would eventually disagree, and two fair values
/// for one company is the worst bug this product could ship.
@freezed
abstract class ValuationSummary with _$ValuationSummary {
  const factory ValuationSummary({
    double? fairValuePerShare,
    double? marginOfSafetyPct,
    double? impliedGrowthRate,
    DateTime? computedAt,
  }) = _ValuationSummary;
}

@freezed
abstract class FinancialPeriod with _$FinancialPeriod {
  const factory FinancialPeriod({
    required String period,
    required int fiscalYear,
    DateTime? periodEnd,
    double? revenue,
    double? grossProfit,
    double? operatingIncome,
    double? ebitda,
    double? netIncome,
    double? eps,
    double? epsDiluted,
    double? sharesDiluted,
    double? totalAssets,
    double? totalEquity,
    double? totalDebt,
    double? totalCurrentAssets,
    double? totalCurrentLiabilities,
    double? cashAndEquivalents,
    double? operatingCashFlow,
    double? capitalExpenditure,
    double? freeCashFlow,
  }) = _FinancialPeriod;
}

/// Ratios derived server-side from the statements. Mobile renders them; it does
/// not recompute them, for the same reason it does not recompute the DCF.
@freezed
abstract class KeyMetrics with _$KeyMetrics {
  const factory KeyMetrics({
    double? grossMargin,
    double? operatingMargin,
    double? netMargin,
    double? fcfMargin,
    double? returnOnEquity,
    double? returnOnAssets,
    double? currentRatio,
    double? debtToEquity,
    double? netDebt,
    double? revenueCagr5y,
    double? revenueYoy,
    double? netIncomeCagr5y,
    double? fcfCagr5y,
  }) = _KeyMetrics;
}

/// One daily bar from `GET /api/stocks/:symbol/prices`.
@freezed
abstract class PriceBar with _$PriceBar {
  const factory PriceBar({
    required DateTime tradeDate,
    required double close,
    double? volume,
  }) = _PriceBar;
}

/// A price series plus what the caller's plan allowed.
///
/// `truncatedByPlan` is carried into the domain deliberately: the API clamps
/// rather than rejects, so the client has to be able to say "one year, because
/// your plan holds one year" instead of pretending that is all the data there is.
@freezed
abstract class PriceSeries with _$PriceSeries {
  const factory PriceSeries({
    required String symbol,
    required int days,
    required bool truncatedByPlan,
    required List<PriceBar> bars,
  }) = _PriceSeries;
}
