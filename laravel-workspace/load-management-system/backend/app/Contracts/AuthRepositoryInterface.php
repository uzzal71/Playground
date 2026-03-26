<?php

namespace App\Contracts;

use App\Models\User;

/**
 * Interface Segregation: Only auth-related data access methods.
 */
interface AuthRepositoryInterface
{
    /**
     * Create a new user in PostgreSQL.
     */
    public function createUser(array $data): User;

    /**
     * Find a user by email.
     */
    public function findByEmail(string $email): ?User;
}
