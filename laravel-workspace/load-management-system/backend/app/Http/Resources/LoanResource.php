<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'user_id'          => $this->user_id,
            'loan_amount'      => (float) $this->loan_amount,
            'loan_term_months' => $this->loan_term_months,
            'purpose'          => $this->purpose,
            'monthly_income'   => (float) $this->monthly_income,
            'requested_date'   => $this->requested_date?->toDateString(),
            'status'           => $this->status,
            'total_interest'   => (float) $this->total_interest,
            'total_payable'    => (float) $this->total_payable,
            'repayment_schedules' => RepaymentResource::collection(
                $this->whenLoaded('repaymentSchedules')
            ),
            'created_at'       => $this->created_at?->toISOString(),
        ];
    }
}
