// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stock_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_StockSnapshotDto _$StockSnapshotDtoFromJson(Map<String, dynamic> json) =>
    _StockSnapshotDto(
      company: CompanyDto.fromJson(json['company'] as Map<String, dynamic>),
      quote: json['quote'] == null
          ? null
          : QuoteDto.fromJson(json['quote'] as Map<String, dynamic>),
      valuation: json['valuation'] == null
          ? null
          : ValuationDto.fromJson(json['valuation'] as Map<String, dynamic>),
      latest: json['latest'] == null
          ? null
          : FinancialPeriodDto.fromJson(json['latest'] as Map<String, dynamic>),
      metrics: MetricsDto.fromJson(json['metrics'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$StockSnapshotDtoToJson(_StockSnapshotDto instance) =>
    <String, dynamic>{
      'company': instance.company,
      'quote': instance.quote,
      'valuation': instance.valuation,
      'latest': instance.latest,
      'metrics': instance.metrics,
    };

_CompanyDto _$CompanyDtoFromJson(Map<String, dynamic> json) => _CompanyDto(
  symbol: json['symbol'] as String,
  name: json['name'] as String,
  exchange: json['exchange'] as String?,
  currency: json['currency'] as String?,
  sector: json['sector'] as String?,
  industry: json['industry'] as String?,
  country: json['country'] as String?,
  website: json['website'] as String?,
  description: json['description'] as String?,
  employees: (json['employees'] as num?)?.toInt(),
);

Map<String, dynamic> _$CompanyDtoToJson(_CompanyDto instance) =>
    <String, dynamic>{
      'symbol': instance.symbol,
      'name': instance.name,
      'exchange': instance.exchange,
      'currency': instance.currency,
      'sector': instance.sector,
      'industry': instance.industry,
      'country': instance.country,
      'website': instance.website,
      'description': instance.description,
      'employees': instance.employees,
    };

_QuoteDto _$QuoteDtoFromJson(Map<String, dynamic> json) => _QuoteDto(
  price: (json['price'] as num?)?.toDouble(),
  previousClose: (json['previousClose'] as num?)?.toDouble(),
  dayChangePct: (json['dayChangePct'] as num?)?.toDouble(),
  marketCap: (json['marketCap'] as num?)?.toDouble(),
  sharesOutstanding: (json['sharesOutstanding'] as num?)?.toDouble(),
  peRatio: (json['peRatio'] as num?)?.toDouble(),
  yearHigh: (json['yearHigh'] as num?)?.toDouble(),
  yearLow: (json['yearLow'] as num?)?.toDouble(),
  asOf: json['asOf'] as String?,
);

Map<String, dynamic> _$QuoteDtoToJson(_QuoteDto instance) => <String, dynamic>{
  'price': instance.price,
  'previousClose': instance.previousClose,
  'dayChangePct': instance.dayChangePct,
  'marketCap': instance.marketCap,
  'sharesOutstanding': instance.sharesOutstanding,
  'peRatio': instance.peRatio,
  'yearHigh': instance.yearHigh,
  'yearLow': instance.yearLow,
  'asOf': instance.asOf,
};

_ValuationDto _$ValuationDtoFromJson(Map<String, dynamic> json) =>
    _ValuationDto(
      fairValuePerShare: (json['fairValuePerShare'] as num?)?.toDouble(),
      marginOfSafetyPct: (json['marginOfSafetyPct'] as num?)?.toDouble(),
      impliedGrowthRate: (json['impliedGrowthRate'] as num?)?.toDouble(),
      computedAt: json['computedAt'] as String?,
    );

Map<String, dynamic> _$ValuationDtoToJson(_ValuationDto instance) =>
    <String, dynamic>{
      'fairValuePerShare': instance.fairValuePerShare,
      'marginOfSafetyPct': instance.marginOfSafetyPct,
      'impliedGrowthRate': instance.impliedGrowthRate,
      'computedAt': instance.computedAt,
    };

_FinancialPeriodDto _$FinancialPeriodDtoFromJson(Map<String, dynamic> json) =>
    _FinancialPeriodDto(
      period: json['period'] as String,
      fiscalYear: (json['fiscalYear'] as num).toInt(),
      periodEnd: json['periodEnd'] as String?,
      revenue: (json['revenue'] as num?)?.toDouble(),
      grossProfit: (json['grossProfit'] as num?)?.toDouble(),
      operatingIncome: (json['operatingIncome'] as num?)?.toDouble(),
      ebitda: (json['ebitda'] as num?)?.toDouble(),
      netIncome: (json['netIncome'] as num?)?.toDouble(),
      eps: (json['eps'] as num?)?.toDouble(),
      epsDiluted: (json['epsDiluted'] as num?)?.toDouble(),
      sharesDiluted: (json['sharesDiluted'] as num?)?.toDouble(),
      totalAssets: (json['totalAssets'] as num?)?.toDouble(),
      totalEquity: (json['totalEquity'] as num?)?.toDouble(),
      totalDebt: (json['totalDebt'] as num?)?.toDouble(),
      totalCurrentAssets: (json['totalCurrentAssets'] as num?)?.toDouble(),
      totalCurrentLiabilities: (json['totalCurrentLiabilities'] as num?)
          ?.toDouble(),
      cashAndEquivalents: (json['cashAndEquivalents'] as num?)?.toDouble(),
      operatingCashFlow: (json['operatingCashFlow'] as num?)?.toDouble(),
      capitalExpenditure: (json['capitalExpenditure'] as num?)?.toDouble(),
      freeCashFlow: (json['freeCashFlow'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$FinancialPeriodDtoToJson(_FinancialPeriodDto instance) =>
    <String, dynamic>{
      'period': instance.period,
      'fiscalYear': instance.fiscalYear,
      'periodEnd': instance.periodEnd,
      'revenue': instance.revenue,
      'grossProfit': instance.grossProfit,
      'operatingIncome': instance.operatingIncome,
      'ebitda': instance.ebitda,
      'netIncome': instance.netIncome,
      'eps': instance.eps,
      'epsDiluted': instance.epsDiluted,
      'sharesDiluted': instance.sharesDiluted,
      'totalAssets': instance.totalAssets,
      'totalEquity': instance.totalEquity,
      'totalDebt': instance.totalDebt,
      'totalCurrentAssets': instance.totalCurrentAssets,
      'totalCurrentLiabilities': instance.totalCurrentLiabilities,
      'cashAndEquivalents': instance.cashAndEquivalents,
      'operatingCashFlow': instance.operatingCashFlow,
      'capitalExpenditure': instance.capitalExpenditure,
      'freeCashFlow': instance.freeCashFlow,
    };

_MetricsDto _$MetricsDtoFromJson(Map<String, dynamic> json) => _MetricsDto(
  grossMargin: (json['grossMargin'] as num?)?.toDouble(),
  operatingMargin: (json['operatingMargin'] as num?)?.toDouble(),
  netMargin: (json['netMargin'] as num?)?.toDouble(),
  fcfMargin: (json['fcfMargin'] as num?)?.toDouble(),
  returnOnEquity: (json['returnOnEquity'] as num?)?.toDouble(),
  returnOnAssets: (json['returnOnAssets'] as num?)?.toDouble(),
  currentRatio: (json['currentRatio'] as num?)?.toDouble(),
  debtToEquity: (json['debtToEquity'] as num?)?.toDouble(),
  netDebt: (json['netDebt'] as num?)?.toDouble(),
  revenueCagr5y: (json['revenueCagr5y'] as num?)?.toDouble(),
  revenueYoy: (json['revenueYoy'] as num?)?.toDouble(),
  netIncomeCagr5y: (json['netIncomeCagr5y'] as num?)?.toDouble(),
  fcfCagr5y: (json['fcfCagr5y'] as num?)?.toDouble(),
);

Map<String, dynamic> _$MetricsDtoToJson(_MetricsDto instance) =>
    <String, dynamic>{
      'grossMargin': instance.grossMargin,
      'operatingMargin': instance.operatingMargin,
      'netMargin': instance.netMargin,
      'fcfMargin': instance.fcfMargin,
      'returnOnEquity': instance.returnOnEquity,
      'returnOnAssets': instance.returnOnAssets,
      'currentRatio': instance.currentRatio,
      'debtToEquity': instance.debtToEquity,
      'netDebt': instance.netDebt,
      'revenueCagr5y': instance.revenueCagr5y,
      'revenueYoy': instance.revenueYoy,
      'netIncomeCagr5y': instance.netIncomeCagr5y,
      'fcfCagr5y': instance.fcfCagr5y,
    };

_PriceSeriesDto _$PriceSeriesDtoFromJson(Map<String, dynamic> json) =>
    _PriceSeriesDto(
      symbol: json['symbol'] as String,
      days: (json['days'] as num).toInt(),
      count: (json['count'] as num).toInt(),
      truncatedByPlan: json['truncatedByPlan'] as bool,
      bars: (json['bars'] as List<dynamic>)
          .map((e) => PriceBarDto.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$PriceSeriesDtoToJson(_PriceSeriesDto instance) =>
    <String, dynamic>{
      'symbol': instance.symbol,
      'days': instance.days,
      'count': instance.count,
      'truncatedByPlan': instance.truncatedByPlan,
      'bars': instance.bars,
    };

_PriceBarDto _$PriceBarDtoFromJson(Map<String, dynamic> json) => _PriceBarDto(
  tradeDate: json['tradeDate'] as String,
  close: (json['close'] as num).toDouble(),
  volume: (json['volume'] as num?)?.toDouble(),
);

Map<String, dynamic> _$PriceBarDtoToJson(_PriceBarDto instance) =>
    <String, dynamic>{
      'tradeDate': instance.tradeDate,
      'close': instance.close,
      'volume': instance.volume,
    };
