/// Every way a read can fail, as a closed set.
///
/// Sealed on purpose: the UI pattern-matches on these, so adding a variant is a
/// compile error in every screen that renders errors rather than a silent
/// fall-through to "something went wrong". Each variant carries what a screen
/// needs to write a sentence a user can act on — nothing more.
sealed class Failure {
  const Failure({this.detail});

  /// Developer-facing context. Never rendered raw: it can contain a URL or a
  /// vendor message, and neither belongs in front of a user.
  final String? detail;

  /// Whether retrying the same request could plausibly work. Drives whether a
  /// screen offers a retry button at all.
  bool get isRetryable => switch (this) {
    NetworkFailure() => true,
    ServerFailure() => true,
    TimeoutFailure() => true,
    NotFoundFailure() => false,
    BadRequestFailure() => false,
    UnauthorizedFailure() => false,
    PaymentRequiredFailure() => false,
    ParseFailure() => false,
    UnknownFailure() => true,
  };
}

/// No usable connection, or the host could not be reached at all.
final class NetworkFailure extends Failure {
  const NetworkFailure({super.detail});
}

/// The request was sent but nothing came back in time.
final class TimeoutFailure extends Failure {
  const TimeoutFailure({super.detail});
}

/// 5xx. Ours to fix, not the user's.
final class ServerFailure extends Failure {
  const ServerFailure({this.statusCode, super.detail});
  final int? statusCode;
}

/// 404 — a symbol we do not cover. Carries the symbol so the screen can name it.
final class NotFoundFailure extends Failure {
  const NotFoundFailure({this.subject, super.detail});
  final String? subject;
}

/// 400. The client sent something invalid; the message comes from our own API,
/// which is written for humans.
final class BadRequestFailure extends Failure {
  const BadRequestFailure({this.message, super.detail});
  final String? message;
}

/// 401 — no or expired session. Drives the auth redirect in M4.
final class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.detail});
}

/// 402 — identity is known, payment is what is missing. The API returns this
/// rather than 403 precisely so the client can show an upgrade path instead of
/// a dead end.
final class PaymentRequiredFailure extends Failure {
  const PaymentRequiredFailure({this.message, super.detail});
  final String? message;
}

/// The response arrived but did not match the shape we expect. Treated as a
/// failure rather than papered over with defaults: a silently-null field becomes
/// a wrong number on screen, and wrong numbers are worse than an error.
final class ParseFailure extends Failure {
  const ParseFailure({super.detail});
}

final class UnknownFailure extends Failure {
  const UnknownFailure({super.detail});
}
