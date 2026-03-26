<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->renderable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response (JSON only for API).
     */
    public function render($request, Throwable $e)
    {
        // Always return JSON for API requests
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->handleApiException($e);
        }

        return parent::render($request, $e);
    }

    private function handleApiException(Throwable $e)
    {
        // Validation errors → 422
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        }

        // Authentication errors → 401
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login.',
            ], 401);
        }

        // JWT: Token expired → 401
        if ($e instanceof TokenExpiredException) {
            return response()->json([
                'success' => false,
                'message' => 'Token has expired. Please refresh your token.',
            ], 401);
        }

        // JWT: Token invalid → 401
        if ($e instanceof TokenInvalidException) {
            return response()->json([
                'success' => false,
                'message' => 'Token is invalid.',
            ], 401);
        }

        // JWT: General error → 401
        if ($e instanceof JWTException) {
            return response()->json([
                'success' => false,
                'message' => 'Token is missing or could not be parsed.',
            ], 401);
        }

        // 404 Not Found
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        }

        // Everything else → 500
        return response()->json([
            'success' => false,
            'message' => config('app.debug') ? $e->getMessage() : 'Internal server error',
        ], 500);
    }
}
