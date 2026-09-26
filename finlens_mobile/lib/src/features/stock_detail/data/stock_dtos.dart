import 'package:freezed_annotation/freezed_annotation.dart';

import '../domain/company_snapshot.dart';

part 'stock_dtos.freezed.dart';
part 'stock_dtos.g.dart';

/// Wire shapes for `GET /api/stocks/:symbol` and `.../prices`.
///
/// The DTO layer exists so the domain can hold `DateTime` while the wire holds
/// ISO strings, and so a vendor-driven rename on the server costs one mapping
/// line here rather than a change in every widget.
@freezed
abstract class StockSnapshotDto with _$StockSnapshotDto {
  const factory StockSnapshotDto({
    required CompanyDto company,
    QuoteDto? quote,
    ValuationDto? valuation,
    FinancialPeriodDto? latest,
    required MetricsDto metrics,
  }) = _StockSnapshotDto;

  factory StockSnapshotDto.fromJson(Map<String, dynamic> json) =>
      _$StockSnapshotDtoFromJson(json);
}

@freezed
abstract class CompanyDto with _$CompanyDto {
  const factory CompanyDto({
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
  }) = _CompanyDto;

  factory CompanyDto.fromJson(Map<String, dynamic> json) =>
      _$CompanyDtoFromJson(json);
}

@freezed
abstract class QuoteDto with _$QuoteDto {
  const factory QuoteDto({
    double? price,
    double? previousClose,
    double? dayChangePct,
    double? marketCap,
    double? sharesOutstanding,
    double? peRatio,
    double? yearHigh,
    double? yearLow,
    String? asOf,
  }) = _QuoteDto;

  factory QuoteDto.fromJson(Map<String, dynamic> json) =>
      _$QuoteDtoFromJson(json);
}

@freezed
abstract class ValuationDto with _$ValuationDto {
  const factory ValuationDto({
    double? fairValuePerShare,
    double? marginOfSafetyPct,
    double? impliedGrowthRate,
    String? computedAt,
  }) = _ValuationDto;

  factory ValuationDto.fromJson(Map<String, dynamic> json) =>
      _$ValuationDtoFromJson(json);
}

@freezed
abstract class FinancialPeriodDto with _$FinancialPeriodDto {
  const factory FinancialPeriodDto({
    required String period,
    required int fiscalYear,
    String? periodEnd,
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
  }) = _FinancialPeriodDto;

  factory FinancialPeriodDto.fromJson(Map<String, dynamic> json) =>
      _$FinancialPeriodDtoFromJson(json);
}

@freezed
abstract class MetricsDto with _$MetricsDto {
  const factory MetricsDto({
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
  }) = _MetricsDto;

  factory MetricsDto.fromJson(Map<String, dynamic> json) =>
      _$MetricsDtoFromJson(json);
}

@freezed
abstract class PriceSeriesDto with _$PriceSeriesDto {
  const factory PriceSeriesDto({
    required String symbol,
    required int days,
    required int count,
    required bool truncatedByPlan,
    required List<PriceBarDto> bars,
  }) = _PriceSeriesDto;

  factory PriceSeriesDto.fromJson(Map<String, dynamic> json) =>
      _$PriceSeriesDtoFromJson(json);
}

@freezed
abstract class PriceBarDto with _$PriceBarDto {
  const factory PriceBarDto({
    required String tradeDate,
    required double close,
    double? volume,
  }) = _PriceBarDto;

  factory PriceBarDto.fromJson(Map<String, dynamic> json) =>
      _$PriceBarDtoFromJson(json);
}

/// Wire → domain.
///
/// Dates are parsed here, once. A widget calling `DateTime.parse` would be a
/// second place for a malformed timestamp to throw, and it would throw during a
/// build rather than inside the repository where failures are values.
extension StockSnapshotDtoX on StockSnapshotDto {
  CompanySnapshot toDomain() => CompanySnapshot(
    company: company.toDomain(),
    quote: quote?.toDomain(),
    valuation: valuation?.toDomain(),
    latest: latest?.toDomain(),
    metrics: metrics.toDomain(),
  );
}

extension CompanyDtoX on CompanyDto {
  Company toDomain() => Company(
    symbol: symbol,
    name: name,
    exchange: exchange,
    currency: currency,
    sector: sector,
    industry: industry,
    country: country,
    website: website,
    description: description,
    employees: employees,
  );
}

extension QuoteDtoX on QuoteDto {
  Quote toDomain() => Quote(
    price: price,
    previousClose: previousClose,
    dayChangePct: dayChangePct,
    marketCap: marketCap,
    sharesOutstanding: sharesOutstanding,
    peRatio: peRatio,
    yearHigh: yearHigh,
    yearLow: yearLow,
    asOf: _parseDate(asOf),
  );
}

extension ValuationDtoX on ValuationDto {
  ValuationSummary toDomain() => ValuationSummary(
    fairValuePerShare: fairValuePerShare,
    marginOfSafetyPct: marginOfSafetyPct,
    impliedGrowthRate: impliedGrowthRate,
    computedAt: _parseDate(computedAt),
  );
}

extension FinancialPeriodDtoX on FinancialPeriodDto {
  FinancialPeriod toDomain() => FinancialPeriod(
    period: period,
    fiscalYear: fiscalYear,
    periodEnd: _parseDate(periodEnd),
    revenue: revenue,
    grossProfit: grossProfit,
    operatingIncome: operatingIncome,
    ebitda: ebitda,
    netIncome: netIncome,
    eps: eps,
    epsDiluted: epsDiluted,
    sharesDiluted: sharesDiluted,
    totalAssets: totalAssets,
    totalEquity: totalEquity,
    totalDebt: totalDebt,
    totalCurrentAssets: totalCurrentAssets,
    totalCurrentLiabilities: totalCurrentLiabilities,
    cashAndEquivalents: cashAndEquivalents,
    operatingCashFlow: operatingCashFlow,
    capitalExpenditure: capitalExpenditure,
    freeCashFlow: freeCashFlow,
  );
}

extension MetricsDtoX on MetricsDto {
  KeyMetrics toDomain() => KeyMetrics(
    grossMargin: grossMargin,
    operatingMargin: operatingMargin,
    netMargin: netMargin,
    fcfMargin: fcfMargin,
    returnOnEquity: returnOnEquity,
    returnOnAssets: returnOnAssets,
    currentRatio: currentRatio,
    debtToEquity: debtToEquity,
    netDebt: netDebt,
    revenueCagr5y: revenueCagr5y,
    revenueYoy: revenueYoy,
    netIncomeCagr5y: netIncomeCagr5y,
    fcfCagr5y: fcfCagr5y,
  );
}

extension PriceSeriesDtoX on PriceSeriesDto {
  PriceSeries toDomain() => PriceSeries(
    symbol: symbol,
    days: days,
    truncatedByPlan: truncatedByPlan,
    // A bar with an unparseable date or no close is dropped rather than
    // guessed at — one bad row must not take down the whole chart, and an
    // invented price would silently distort it.
    bars: bars
        .map((bar) {
          final date = _parseDate(bar.tradeDate);
          return date == null
              ? null
              : PriceBar(tradeDate: date, close: bar.close, volume: bar.volume);
        })
        .whereType<PriceBar>()
        .toList(growable: false),
  );
}

DateTime? _parseDate(String? value) {
  if (value == null || value.isEmpty) return null;
  return DateTime.tryParse(value);
}
