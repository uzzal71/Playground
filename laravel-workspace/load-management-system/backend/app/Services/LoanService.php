<?php

namespace App\Services;

use App\Contracts\LoanRepositoryInterface;
use App\Contracts\RepaymentRepositoryInterface;
use App\Models\Loan;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Single Responsibility: All loan & repayment business logic lives here.
 * Dependency Inversion: Depends on repository interfaces, not concrete classes.
 */
class LoanService
{
    private const INTEREST_RATE = 0.10;   // 10% total interest per requirement

    public function __construct(
        private readonly LoanRepositoryInterface      $loanRepository,
        private readonly RepaymentRepositoryInterface  $repaymentRepository,
    ) {}

    /**
     * Apply for a loan:
     *   1. Calculate interest & total payable
     *   2. Store the loan (auto-approved) in MySQL
     *   3. Generate & store the repayment schedule in MySQL
     *
     * Uses a MySQL transaction so loan + schedule are atomic.
     */
    public function applyForLoan(int $userId, array $data): Loan
    {
        $loanAmount     = (float) $data['loan_amount'];
        $termMonths     = (int)   $data['loan_term_months'];
        $totalInterest  = round($loanAmount * self::INTEREST_RATE, 2);
        $totalPayable   = round($loanAmount + $totalInterest, 2);

        return DB::connection('mysql')->transaction(function () use (
            $userId, $data, $loanAmount, $termMonths, $totalInterest, $totalPayable
        ) {
            // 1. Create the loan record (auto-APPROVED)
            $loan = $this->loanRepository->create([
                'user_id'          => $userId,
                'loan_amount'      => $loanAmount,
                'loan_term_months' => $termMonths,
                'purpose'          => $data['purpose'],
                'monthly_income'   => $data['monthly_income'],
                'requested_date'   => $data['requested_date'],
                'status'           => 'APPROVED',
                'total_interest'   => $totalInterest,
                'total_payable'    => $totalPayable,
            ]);

            // 2. Generate and store the repayment schedule
            $schedule = $this->generateRepaymentSchedule(
                $loanAmount,
                $totalInterest,
                $termMonths,
                Carbon::parse($data['requested_date']),
            );

            $this->repaymentRepository->createMany($loan->id, $schedule);

            // 3. Eager-load the schedule before returning
            $loan->load('repaymentSchedules');

            return $loan;
        });
    }

    /**
     * Get all loans for a user.
     */
    public function getUserLoans(int $userId): Collection
    {
        return $this->loanRepository->findByUserId($userId);
    }

    /**
     * Get repayment schedule for a specific loan owned by the user.
     *
     * @return Collection|null  null if loan not found or doesn't belong to user
     */
    public function getLoanRepayments(int $loanId, int $userId): ?Collection
    {
        $loan = $this->loanRepository->findByIdAndUserId($loanId, $userId);

        if (!$loan) {
            return null;
        }

        return $this->repaymentRepository->findByLoanId($loanId);
    }

    // ─── Private Helpers ─────────────────────────────────────

    /**
     * Generate a flat-rate monthly repayment schedule.
     *
     * Interest Calculation (per requirement):
     *   total_interest   = loan_amount × 10%
     *   monthly_interest = total_interest / term_months
     *   monthly_principal = loan_amount / term_months
     *   installment      = monthly_principal + monthly_interest
     *
     * @return array<int, array>
     */
    private function generateRepaymentSchedule(
        float  $loanAmount,
        float  $totalInterest,
        int    $termMonths,
        Carbon $startDate,
    ): array {
        $monthlyPrincipal = round($loanAmount / $termMonths, 2);
        $monthlyInterest  = round($totalInterest / $termMonths, 2);
        $installmentAmount = round($monthlyPrincipal + $monthlyInterest, 2);

        $remainingBalance = round($loanAmount + $totalInterest, 2);
        $schedule = [];

        for ($i = 1; $i <= $termMonths; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);

            // Last installment absorbs any rounding difference
            if ($i === $termMonths) {
                $currentPrincipal  = round($loanAmount - ($monthlyPrincipal * ($termMonths - 1)), 2);
                $currentInterest   = round($totalInterest - ($monthlyInterest * ($termMonths - 1)), 2);
                $currentInstallment = round($currentPrincipal + $currentInterest, 2);
                $remainingBalance   = 0.00;
            } else {
                $currentPrincipal   = $monthlyPrincipal;
                $currentInterest    = $monthlyInterest;
                $currentInstallment = $installmentAmount;
                $remainingBalance   = round($remainingBalance - $currentInstallment, 2);
            }

            $schedule[] = [
                'installment_number' => $i,
                'due_date'           => $dueDate->toDateString(),
                'principal_amount'   => $currentPrincipal,
                'interest_amount'    => $currentInterest,
                'installment_amount' => $currentInstallment,
                'remaining_balance'  => $remainingBalance,
            ];
        }

        return $schedule;
    }
}
