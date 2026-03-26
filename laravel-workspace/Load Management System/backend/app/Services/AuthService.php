<?php

namespace App\Services;

use App\Contracts\AuthRepositoryInterface;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTFactory;

class AuthService
{
    public function __construct(
        private readonly AuthRepositoryInterface $authRepository
    ) {}

    public function register(array $data): array
    {
        $user = $this->authRepository->createUser($data);

        $accessToken  = Auth::guard('api')->login($user);
        $refreshToken = $this->generateRefreshToken($user);

        return [
            'user'          => $user,
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'bearer',
            'expires_in'    => Auth::guard('api')->factory()->getTTL() * 60,
        ];
    }

    public function login(array $credentials): ?array
    {
        $accessToken = Auth::guard('api')->attempt($credentials);

        if (!$accessToken) {
            return null;
        }

        $user         = Auth::guard('api')->user();
        $refreshToken = $this->generateRefreshToken($user);

        return [
            'user'          => $user,
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'bearer',
            'expires_in'    => Auth::guard('api')->factory()->getTTL() * 60,
        ];
    }

    public function refreshToken(): array
    {
        $newAccessToken = Auth::guard('api')->refresh();
        $user           = Auth::guard('api')->user();
        $refreshToken   = $this->generateRefreshToken($user);

        return [
            'user'          => $user,
            'access_token'  => $newAccessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'bearer',
            'expires_in'    => Auth::guard('api')->factory()->getTTL() * 60,
        ];
    }

    public function logout(): void
    {
        Auth::guard('api')->logout();
    }

    public function currentUser(): ?User
    {
        return Auth::guard('api')->user();
    }

    private function generateRefreshToken(User $user): string
    {
        $customClaims = JWTFactory::customClaims([
            'sub'  => $user->getJWTIdentifier(),
            'type' => 'refresh',
            'exp'  => now()->addMinutes(config('jwt.refresh_ttl', 20160))->timestamp,
        ]);

        $payload = JWTFactory::make($customClaims);

        return JWTAuth::encode($payload)->get();
    }
}