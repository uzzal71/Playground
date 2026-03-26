<?php

namespace App\Contracts;

use Illuminate\Database\Eloquent\Collection;

/**
 * Interface Segregation: Only repayment-related data access methods.
 */
interface RepaymentRepositoryInterface
{
    /**
     * Bulk-insert repayment schedule rows for a loan.
     */
    public function createMany(int $loanId, array $schedules): bool;

    /**
     * Get all repayment rows for a given loan.
     */
    public function findByLoanId(int $loanId): Collection;
}
