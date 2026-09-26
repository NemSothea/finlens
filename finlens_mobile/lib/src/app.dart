import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/config/app_config.dart';
import 'core/config/config_scope.dart';
import 'core/theme/app_theme.dart';
import 'router/app_router.dart';

/// The app shell: config, theme, router. Nothing else belongs here.
///
/// The router is built once and held in `State` — rebuilding a `GoRouter` on
/// every widget rebuild would reset navigation history and break deep links in
/// ways that only show up on a real device.
class FinlensApp extends StatefulWidget {
  const FinlensApp({required this.config, this.router, super.key});

  final AppConfig config;

  /// Injected only by tests, which need to start at an arbitrary location.
  /// Production builds let the app own its router.
  final GoRouter? router;

  @override
  State<FinlensApp> createState() => _FinlensAppState();
}

class _FinlensAppState extends State<FinlensApp> {
  late final GoRouter _router = widget.router ?? AppRouter.build();

  @override
  Widget build(BuildContext context) {
    // The ProviderScope lives in the entry points, not here: a test needs to
    // override providers around this widget, and a scope created inside it would
    // shadow the test's overrides.
    return ConfigScope(
      config: widget.config,
      child: MaterialApp.router(
        title: widget.config.appName,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        // Follow the OS. An in-app theme switch is a setting nobody asks a
        // research tool for.
        themeMode: ThemeMode.system,
        routerConfig: _router,
        debugShowCheckedModeBanner: widget.config.isDev,
      ),
    );
  }
}
