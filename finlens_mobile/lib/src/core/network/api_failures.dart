import 'package:dio/dio.dart';

import '../domain/failure.dart';

/// Platform errors die here.
///
/// `DioException` never leaves the data layer: the UI pattern-matches on
/// `Failure` variants, and a screen that had to know about Dio would also have
/// to change the day the HTTP package does.
Failure failureFromDioException(DioException error) {
  return switch (error.type) {
    DioExceptionType.connectionTimeout ||
    DioExceptionType.sendTimeout ||
    DioExceptionType.receiveTimeout => TimeoutFailure(detail: error.message),
    DioExceptionType.connectionError => NetworkFailure(detail: error.message),
    DioExceptionType.cancel => const UnknownFailure(
      detail: 'request cancelled',
    ),
    DioExceptionType.badCertificate => NetworkFailure(
      detail: 'bad certificate',
    ),
    DioExceptionType.badResponse => failureFromStatus(
      error.response?.statusCode,
      messageFromBody(error.response?.data),
    ),
    DioExceptionType.transformTimeout => TimeoutFailure(detail: error.message),
    DioExceptionType.unknown => NetworkFailure(detail: error.message),
  };
}

/// Maps an HTTP status to a typed failure.
///
/// 402 is deliberately its own variant rather than being folded into 403: the API
/// returns it when identity is known and payment is what is missing, which is an
/// upgrade prompt, not a dead end.
Failure failureFromStatus(int? statusCode, [String? message, String? subject]) {
  return switch (statusCode) {
    null => UnknownFailure(detail: message),
    400 => BadRequestFailure(message: message),
    401 || 403 => UnauthorizedFailure(detail: message),
    402 => PaymentRequiredFailure(message: message),
    404 => NotFoundFailure(subject: subject, detail: message),
    422 => BadRequestFailure(message: message),
    >= 500 => ServerFailure(statusCode: statusCode, detail: message),
    _ => UnknownFailure(
      detail: 'HTTP $statusCode${message == null ? '' : ': $message'}',
    ),
  };
}

/// Our own error bodies are `{ "error": "..." }`, written for humans. Anything
/// else is ignored rather than guessed at — an HTML error page rendered as a
/// message is worse than no message.
String? messageFromBody(dynamic body) {
  if (body is Map && body['error'] is String) return body['error'] as String;
  return null;
}
