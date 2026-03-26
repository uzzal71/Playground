<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @OA\Schema(
 *     schema="LoanApplyRequest",
 *     required={"loan_amount","loan_term_months","purpose","monthly_income","requested_date"},
 *     @OA\Property(property="loan_amount",       type="number",  format="double", example=50000.00),
 *     @OA\Property(property="loan_term_months",  type="integer", example=12),
 *     @OA\Property(property="purpose",           type="string",  example="Business Expansion"),
 *     @OA\Property(property="monthly_income",    type="number",  format="double", example=25000.00),
 *     @OA\Property(property="requested_date",    type="string",  format="date",   example="2025-06-01")
 * )
 */
class LoanApplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'loan_amount'      => ['required', 'numeric', 'min:1000'],
            'loan_term_months' => ['required', 'integer', 'min:1', 'max:60'],
            'purpose'          => ['required', 'string', 'max:500'],
            'monthly_income'   => ['required', 'numeric', 'min:0'],
            'requested_date'   => ['required', 'date', 'after_or_equal:today'],
        ];
    }
}
