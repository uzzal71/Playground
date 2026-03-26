<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\LoanApplyRequest;
use App\Http\Resources\LoanResource;
use App\Http\Resources\RepaymentResource;
use App\Services\LoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class LoanController extends Controller
{
    public function __construct(
        private readonly LoanService $loanService
    ) {}

    // ─────────────────────────────────────────────────────────
    //  POST /api/loans/apply
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Post(
     *     path="/loans/apply",
     *     operationId="applyForLoan",
     *     tags={"Loans"},
     *     summary="Apply for a new microfinance loan",
     *     description="Creates a loan (auto-APPROVED) in MySQL and generates a monthly repayment schedule with 10% interest.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/LoanApplyRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Loan approved",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string",  example="Loan application approved"),
     *             @OA\Property(property="data",    ref="#/components/schemas/Loan")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function apply(LoanApplyRequest $request): JsonResponse
    {
        $userId = Auth::guard('api')->id();

        $loan = $this->loanService->applyForLoan($userId, $request->validated());

        return $this->success(
            new LoanResource($loan),
            'Loan application approved',
            201
        );
    }

    // ─────────────────────────────────────────────────────────
    //  GET /api/loans
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/loans",
     *     operationId="getUserLoans",
     *     tags={"Loans"},
     *     summary="List all loans for the authenticated user",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Loans retrieved",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/Loan")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function index(): JsonResponse
    {
        $userId = Auth::guard('api')->id();

        $loans = $this->loanService->getUserLoans($userId);

        return $this->success(LoanResource::collection($loans), 'Loans retrieved');
    }

    // ─────────────────────────────────────────────────────────
    //  GET /api/loans/{id}/repayments
    // ─────────────────────────────────────────────────────────

    /**
     * @OA\Get(
     *     path="/loans/{id}/repayments",
     *     operationId="getLoanRepayments",
     *     tags={"Loans"},
     *     summary="Get repayment schedule for a specific loan",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="Loan ID",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Repayment schedule retrieved",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/RepaymentSchedule")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated"),
     *     @OA\Response(response=404, description="Loan not found")
     * )
     */
    public function repayments(int $id): JsonResponse
    {
        $userId = Auth::guard('api')->id();

        $repayments = $this->loanService->getLoanRepayments($id, $userId);

        if ($repayments === null) {
            return $this->error('Loan not found or does not belong to you', 404);
        }

        return $this->success(
            RepaymentResource::collection($repayments),
            'Repayment schedule retrieved'
        );
    }
}
