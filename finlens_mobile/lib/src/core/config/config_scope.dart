import 'package:flutter/widgets.dart';

import 'app_config.dart';

/// Makes the resolved [AppConfig] available to the widget tree.
///
/// An `InheritedWidget` rather than a global singleton: a global would be
/// unswappable in a widget test, and every test would then run against whatever
/// the last one left behind. Riverpod takes over dependency wiring in M2 — this
/// keeps M1 free of a state-management dependency it does not need yet.
class ConfigScope extends InheritedWidget {
  const ConfigScope({required this.config, required super.child, super.key});

  final AppConfig config;

  static AppConfig of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ConfigScope>();
    assert(scope != null, 'No ConfigScope found. Wrap the app in ConfigScope.');
    return scope!.config;
  }

  @override
  bool updateShouldNotify(ConfigScope oldWidget) => oldWidget.config != config;
}
