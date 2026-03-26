<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'loan_id'            => $this->loan_id,
            'installment_number' => $this->installment_number,
            'due_date'           => $this->due_date?->toDateString(),
            'principal_amount'   => (float) $this->principal_amount,
            'interest_amount'    => (float) $this->interest_amount,
            'installment_amount' => (float) $this->installment_amount,
            'remaining_balance'  => (float) $this->remaining_balance,
            'status'             => $this->status,
        ];
    }
}
