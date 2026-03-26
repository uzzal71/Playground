<?php

namespace App\Repositories;

use App\Contracts\LoanRepositoryInterface;
use App\Models\Loan;
use Illuminate\Database\Eloquent\Collection;

class LoanRepository implements LoanRepositoryInterface
{
    /**
     * Create a new loan record in MySQL.
     */
    public function create(array $data): Loan
    {
        return Loan::create($data);
    }

    /**
     * Get all loans for a given user (newest first).
     */
    public function findByUserId(int $userId): Collection
    {
        return Loan::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Find a single loan by its primary key.
     */
    public function findById(int $loanId): ?Loan
    {
        return Loan::find($loanId);
    }

    /**
     * Find a loan that belongs to a specific user (authorization check).
     */
    public function findByIdAndUserId(int $loanId, int $userId): ?Loan
    {
        return Loan::where('id', $loanId)
            ->where('user_id', $userId)
            ->first();
    }
}
