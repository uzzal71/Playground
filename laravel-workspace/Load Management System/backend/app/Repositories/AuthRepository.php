<?php

namespace App\Repositories;

use App\Contracts\AuthRepositoryInterface;
use App\Models\User;

class AuthRepository implements AuthRepositoryInterface
{
    /**
     * Create a new user in PostgreSQL.
     */
    public function createUser(array $data): User
    {
        return User::create([
            'full_name' => $data['full_name'],
            'email'     => $data['email'],
            'mobile'    => $data['mobile'],
            'address'   => $data['address'],
            'password'  => $data['password'],   // Hashed automatically via User model cast
        ]);
    }

    /**
     * Find a user by email.
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}
