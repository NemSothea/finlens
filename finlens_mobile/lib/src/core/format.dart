import 'package:intl/intl.dart';

/// Number formatting, shared.
///
/// The dash is what a missing number looks like — never 0, never "N/A". A zero
/// reads as a real value, and on a research tool a fabricated zero is worse than
/// an obvious blank.
const String missing = '—';

final NumberFormat _price = NumberFormat.currency(
  symbol: r'$',
  decimalDigits: 2,
);
final NumberFormat _percent = NumberFormat.decimalPercentPattern(
  decimalDigits: 1,
);

String formatPrice(double? value) =>
    value == null ? missing : _price.format(value);

String formatPercent(double? fraction) =>
    fraction == null ? missing : _percent.format(fraction);

String formatSignedPercent(double? fraction) {
  if (fraction == null) return missing;
  final formatted = _percent.format(fraction.abs());
  return fraction >= 0 ? '+$formatted' : '-$formatted';
}

/// Market caps are read at a glance, so they are abbreviated rather than printed
/// in full — nobody compares 3,331,159,321,014 against 2,981,004,118,772.
String formatCompact(double? value) {
  if (value == null) return missing;

  final abs = value.abs();
  final (divisor, suffix) = switch (abs) {
    >= 1e12 => (1e12, 'T'),
    >= 1e9 => (1e9, 'B'),
    >= 1e6 => (1e6, 'M'),
    >= 1e3 => (1e3, 'K'),
    _ => (1.0, ''),
  };

  final scaled = value / divisor;
  final digits = scaled.abs() >= 100 ? 0 : 1;
  return '\$${scaled.toStringAsFixed(digits)}$suffix';
}
