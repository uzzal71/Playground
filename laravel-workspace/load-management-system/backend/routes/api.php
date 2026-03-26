<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LoanController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| POST /api/register              — Borrower registration
| POST /api/login                 — Borrower login
|
| (Authenticated — JWT required)
| POST /api/logout                — Invalidate token
| POST /api/refresh               — Refresh access token
| GET  /api/me                    — Current user profile
| POST /api/loans/apply           — Apply for a loan
| GET  /api/loans                 — List user's loans
| GET  /api/loans/{id}/repayments — Repayment schedule for a loan
|
*/

// ─── Public Routes ───────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ─── Protected Routes (JWT Auth) ─────────────────────────────
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me',       [AuthController::class, 'me']);

    // Loans
    Route::post('/loans/apply',            [LoanController::class, 'apply']);
    Route::get('/loans',                   [LoanController::class, 'index']);
    Route::get('/loans/{id}/repayments',   [LoanController::class, 'repayments']);
});
