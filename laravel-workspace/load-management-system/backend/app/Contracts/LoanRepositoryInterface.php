<?php

namespace App\Contracts;

use App\Models\Loan;
use Illuminate\Database\Eloquent\Collection;

/**
 * Interface Segregation: Only loan-related data access methods.
 */
interface LoanRepositoryInterface
{
    /**
     * Create a new loan record in MySQL.
     */
    public function create(array $data): Loan;

    /**
     * Get all loans for a given user.
     */
    public function findByUserId(int $userId): Collection;

    /**
     * Find a single loan by ID.
     */
    public function findById(int $loanId): ?Loan;

    /**
     * Find a loan that belongs to a specific user.
     */
    public function findByIdAndUserId(int $loanId, int $userId): ?Loan;
}
