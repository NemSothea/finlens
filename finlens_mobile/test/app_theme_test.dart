import 'package:finlens_mobile/src/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Regression tests for a bug found on a simulator, not in a test: the theme
/// pinned Material's light-background typography in both brightnesses, so every
/// body string rendered black on a dark surface. The app bar still looked
/// correct — it takes its colour from `AppBarTheme` — which is exactly why the
/// bug survived a light-mode-only review.
void main() {
  group('AppTheme', () {
    test('body text is readable against the surface in both brightnesses', () {
      for (final theme in [AppTheme.light(), AppTheme.dark()]) {
        final body = theme.textTheme.bodyMedium!.color!;
        final surface = theme.colorScheme.surface;

        // "Readable" here means the text and its background sit on opposite
        // sides of mid-luminance. Full contrast ratios come with the
        // accessibility pass; this catches the catastrophic case.
        expect(
          (body.computeLuminance() - surface.computeLuminance()).abs(),
          greaterThan(0.3),
          reason:
              'body text must contrast with the surface in ${theme.brightness}',
        );
      }
    });

    test('each theme reports the brightness it was built for', () {
      expect(AppTheme.light().brightness, Brightness.light);
      expect(AppTheme.dark().brightness, Brightness.dark);
    });

    test('numeric style asks for tabular figures', () {
      final style = AppTheme.numeric(const TextStyle());
      expect(style.fontFeatures, contains(const FontFeature.tabularFigures()));
    });
  });
}
