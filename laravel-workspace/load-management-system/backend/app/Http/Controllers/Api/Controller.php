<?php

namespace App\Http\Controllers\Api;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="Microfinance Loan Management API",
 *     description="REST API for borrower registration, authentication (JWT), loan application, and repayment schedule management. Uses dual-database architecture: PostgreSQL for auth, MySQL for loan data.",
 *     @OA\Contact(email="admin@microfinance.test")
 * )
 *
 * @OA\Server(
 *     url="/api",
 *     description="Local API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Enter your JWT access token"
 * )
 *
 * @OA\Schema(
 *     schema="SuccessResponse",
 *     @OA\Property(property="success", type="boolean", example=true),
 *     @OA\Property(property="message", type="string",  example="Operation successful"),
 *     @OA\Property(property="data",    type="object")
 * )
 *
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     @OA\Property(property="success", type="boolean", example=false),
 *     @OA\Property(property="message", type="string",  example="Something went wrong"),
 *     @OA\Property(property="errors",  type="object")
 * )
 *
 * @OA\Schema(
 *     schema="TokenResponse",
 *     @OA\Property(property="access_token",  type="string",  example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUz..."),
 *     @OA\Property(property="refresh_token", type="string",  example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUz..."),
 *     @OA\Property(property="token_type",    type="string",  example="bearer"),
 *     @OA\Property(property="expires_in",    type="integer", example=3600)
 * )
 */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Return a standardised JSON success response.
     */
    protected function success(mixed $data = null, string $message = 'Success', int $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    /**
     * Return a standardised JSON error response.
     */
    protected function error(string $message = 'Error', int $code = 400, mixed $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $code);
    }
}
