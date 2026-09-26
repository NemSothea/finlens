import 'package:dio/dio.dart';

import '../config/app_config.dart';

/// The single HTTP entry point.
///
/// Everything the app fetches goes through one Dio instance, because the things
/// that must be true of every request — base URL, timeouts, and later the auth
/// token (M4) — belong in one place. A second Dio built inside a repository is a
/// request that quietly skips all of them.
class ApiClient {
  ApiClient({required AppConfig config, Dio? dio})
    : _dio = dio ?? Dio(),
      _config = config {
    _dio.options = _dio.options.copyWith(
      baseUrl: config.apiBaseUrl,
      // Mobile networks stall rather than fail. Without an explicit ceiling the
      // default is effectively "forever", and a stalled request shows the user a
      // loading skeleton that never resolves.
      connectTimeout: const Duration(seconds: 8),
      receiveTimeout: const Duration(seconds: 12),
      sendTimeout: const Duration(seconds: 12),
      responseType: ResponseType.json,
      headers: const {'accept': 'application/json'},
      // We translate status codes into typed failures ourselves, so Dio must not
      // throw before we can read the body — our 4xx responses carry `{ error }`
      // messages worth showing.
      validateStatus: (_) => true,
    );

    if (config.isDev) {
      _dio.interceptors.add(
        LogInterceptor(requestBody: false, responseBody: false, request: false),
      );
    }
  }

  final Dio _dio;
  final AppConfig _config;

  String get baseUrl => _config.apiBaseUrl;

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) =>
      _dio.get<dynamic>(path, queryParameters: query, cancelToken: cancelToken);

  Future<Response<dynamic>> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    CancelToken? cancelToken,
  }) => _dio.post<dynamic>(
    path,
    data: body,
    queryParameters: query,
    cancelToken: cancelToken,
  );
}
