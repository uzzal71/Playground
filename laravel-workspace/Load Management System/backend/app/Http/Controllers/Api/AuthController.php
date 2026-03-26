<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {}

    // ─────────────────────────────────────────────────────────
    //  POST /api/register
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/register",
     *     operationId="registerBorrower",
     *     tags={"Authentication"},
     *     summary="Register a new borrower",
     *     description="Creates a new user in PostgreSQL and returns JWT access + refresh tokens.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/RegisterRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Registration successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string",  example="Registration successful"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="user",          ref="#/components/schemas/User"),
     *                 @OA\Property(property="access_token",  type="string"),
     *                 @OA\Property(property="refresh_token", type="string"),
     *                 @OA\Property(property="token_type",    type="string",  example="bearer"),
     *                 @OA\Property(property="expires_in",    type="integer", example=3600)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->success([
            'user'          => new UserResource($result['user']),
            'access_token'  => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type'    => $result['token_type'],
            'expires_in'    => $result['expires_in'],
        ], 'Registration successful', 201);
    }

    // ─────────────────────────────────────────────────────────
    //  POST /api/login
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/login",
     *     operationId="loginBorrower",
     *     tags={"Authentication"},
     *     summary="Login a borrower",
     *     description="Authenticates against PostgreSQL and returns JWT access + refresh tokens.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/LoginRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string",  example="Login successful"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="user",          ref="#/components/schemas/User"),
     *                 @OA\Property(property="access_token",  type="string"),
     *                 @OA\Property(property="refresh_token", type="string"),
     *                 @OA\Property(property="token_type",    type="string",  example="bearer"),
     *                 @OA\Property(property="expires_in",    type="integer", example=3600)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        if (!$result) {
            return $this->error('Invalid email or password', 401);
        }

        return $this->success([
            'user'          => new UserResource($result['user']),
            'access_token'  => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type'    => $result['token_type'],
            'expires_in'    => $result['expires_in'],
        ], 'Login successful');
    }

    // ─────────────────────────────────────────────────────────
    //  POST /api/refresh
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/refresh",
     *     operationId="refreshToken",
     *     tags={"Authentication"},
     *     summary="Refresh JWT access token",
     *     description="Returns a new access token and refresh token.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Token refreshed",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string",  example="Token refreshed"),
     *             @OA\Property(property="data",    ref="#/components/schemas/TokenResponse")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function refresh(): JsonResponse
    {
        $result = $this->authService->refreshToken();

        return $this->success([
            'user'          => new UserResource($result['user']),
            'access_token'  => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'token_type'    => $result['token_type'],
            'expires_in'    => $result['expires_in'],
        ], 'Token refreshed');
    }

    // ─────────────────────────────────────────────────────────
    //  POST /api/logout
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/logout",
     *     operationId="logoutBorrower",
     *     tags={"Authentication"},
     *     summary="Logout (invalidate token)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Logged out",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string",  example="Successfully logged out")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return $this->success(null, 'Successfully logged out');
    }

    // ─────────────────────────────────────────────────────────
    //  GET /api/me
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/me",
     *     operationId="currentUser",
     *     tags={"Authentication"},
     *     summary="Get authenticated user profile",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="User profile",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data",    ref="#/components/schemas/User")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function me(): JsonResponse
    {
        $user = $this->authService->currentUser();

        return $this->success(new UserResource($user));
    }
}
