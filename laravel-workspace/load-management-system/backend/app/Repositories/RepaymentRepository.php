<?php

namespace App\Repositories;

use App\Contracts\RepaymentRepositoryInterface;
use App\Models\RepaymentSchedule;
use Illuminate\Database\Eloquent\Collection;

class RepaymentRepository implements RepaymentRepositoryInterface
{
    /**
     * Bulk-insert repayment schedule rows for a loan.
     */
    public function createMany(int $loanId, array $schedules): bool
    {
        $rows = array_map(function (array $schedule) use ($loanId) {
            return array_merge($schedule, [
                'loan_id'    => $loanId,
                'status'     => 'PENDING',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }, $schedules);

        return RepaymentSchedule::insert($rows);
    }

    /**
     * Get all repayment rows for a given loan, ordered by installment number.
     */
    public function findByLoanId(int $loanId): Collection
    {
        return RepaymentSchedule::where('loan_id', $loanId)
            ->orderBy('installment_number')
            ->get();
    }
}
