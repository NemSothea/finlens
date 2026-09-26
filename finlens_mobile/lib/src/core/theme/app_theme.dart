import 'package:flutter/material.dart';

/// Material 3 theme, both brightnesses from one seed.
///
/// Every colour in the app comes from `Theme.of(context).colorScheme`. A
/// hardcoded `Color(0xFF...)` in a widget is a bug: it survives a theme change,
/// breaks in dark mode, and has to be hunted down by hand later.
class AppTheme {
  const AppTheme._();

  /// Deep teal. Reads as financial without the red/green trading-terminal
  /// cliché — red and green are reserved here for gain and loss, which is the
  /// only place in this product where colour carries meaning.
  static const Color seed = Color(0xFF0F766E);

  /// Numbers are the product. Tabular figures stop columns of prices and
  /// multiples from jittering as digits change, so every numeric cell uses this
  /// rather than the plain body style.
  static TextStyle numeric(TextStyle base) =>
      base.copyWith(fontFeatures: const [FontFeature.tabularFigures()]);

  static ThemeData light() => _base(Brightness.light);
  static ThemeData dark() => _base(Brightness.dark);

  static ThemeData _base(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(
      seedColor: seed,
      brightness: brightness,
    );

    return ThemeData(
      colorScheme: scheme,
      // No textTheme override. `Typography.material2021(...).black` is the
      // palette for LIGHT backgrounds, and forcing it here painted every body
      // string black in dark mode — invisible on a dark surface, while the app
      // bar (which takes its colour from AppBarTheme) still looked fine. Letting
      // ThemeData derive text colours from the scheme is what keeps both
      // brightnesses readable.
      brightness: brightness,
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: scheme.surfaceContainerLow,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
        isDense: true,
      ),
      listTileTheme: const ListTileThemeData(
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}
