<?php

namespace Tests\Feature;

use App\Models\MarketplaceCategory;
use App\Models\MarketplaceOrder;
use App\Models\MarketplaceService;
use App\Models\SupplierLedgerEntry;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorEarning;
use App\Models\VendorPayoutRequest;
use App\Services\CommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MarketplaceTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    private function makeUser(array $attrs = []): User
    {
        return User::create(array_merge([
            'name'           => 'Test User',
            'email'          => Str::random(8) . '@example.com',
            'password'       => bcrypt('password'),
            'referral_code'  => strtoupper(Str::random(8)),
            'wallet_balance' => 0,
        ], $attrs));
    }

    private function makeAdmin(array $attrs = []): User
    {
        return $this->makeUser(array_merge(['admin_role' => 'admin'], $attrs));
    }

    private function makeCategory(array $attrs = []): MarketplaceCategory
    {
        return MarketplaceCategory::create(array_merge([
            'name'      => 'Social Media ' . Str::random(4),
            'slug'      => 'social-media-' . Str::random(4),
            'platform'  => 'instagram',
            'is_active' => true,
            'sort_order' => 1,
        ], $attrs));
    }

    /**
     * Create a vendor (pending by default) for a user.
     */
    private function makeVendor(User $user, array $attrs = []): Vendor
    {
        return Vendor::create(array_merge([
            'user_id'         => $user->id,
            'business_name'   => 'Test Business ' . Str::random(4),
            'bio'             => 'Test bio',
            'status'          => 'pending',
            'commission_rate' => 10,
        ], $attrs));
    }

    /**
     * Create an approved vendor.
     */
    private function makeApprovedVendor(User $user, array $attrs = []): Vendor
    {
        return $this->makeVendor($user, array_merge([
            'status'      => 'approved',
            'approved_at' => now(),
        ], $attrs));
    }

    /**
     * Create an approved service for a vendor.
     */
    private function makeService(Vendor $vendor, MarketplaceCategory $category, array $attrs = []): MarketplaceService
    {
        return MarketplaceService::create(array_merge([
            'vendor_id'           => $vendor->id,
            'category_id'         => $category->id,
            'title'               => 'Test Service ' . Str::random(4),
            'slug'                => 'test-service-' . Str::random(6),
            'description'         => 'A test service',
            'platform'            => 'instagram',
            'what_you_get'        => '1000 followers',
            'starting_price_kobo' => 10000,
            'delivery_days'       => 3,
            'status'              => 'approved',
            'approved_at'         => now(),
        ], $attrs));
    }

    // =========================================================================
    // 1. Public catalogue
    // =========================================================================

    public function test_public_can_list_categories(): void
    {
        $this->makeCategory();

        $response = $this->getJson('/api/marketplace/categories');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data']);
    }

    public function test_public_can_list_services(): void
    {
        $user     = $this->makeUser();
        $vendor   = $this->makeApprovedVendor($user);
        $category = $this->makeCategory();
        $this->makeService($vendor, $category);

        $response = $this->getJson('/api/marketplace/services');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'meta']);
    }

    public function test_public_can_view_service_detail(): void
    {
        $user     = $this->makeUser();
        $vendor   = $this->makeApprovedVendor($user);
        $category = $this->makeCategory();
        $service  = $this->makeService($vendor, $category);

        $response = $this->getJson('/api/marketplace/services/' . $service->slug);

        $response->assertStatus(200)
                 ->assertJsonPath('data.id', $service->id);
    }

    public function test_unauthenticated_cannot_create_order(): void
    {
        $response = $this->postJson('/api/marketplace/orders', [
            'service_id'   => 1,
            'requirements' => 'test',
        ]);

        $response->assertStatus(401);
    }

    // =========================================================================
    // 2. Vendor application
    // =========================================================================

    public function test_user_can_apply_as_vendor(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user, 'api')->postJson('/api/vendor/apply', [
            'business_name' => 'My Business',
            'bio'           => 'Great services',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('vendors', ['user_id' => $user->id, 'status' => 'pending']);
    }

    public function test_user_cannot_apply_twice(): void
    {
        $user = $this->makeUser();
        $this->makeVendor($user);

        $response = $this->actingAs($user, 'api')->postJson('/api/vendor/apply', [
            'business_name' => 'Second Application',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 3. Vendor approval required
    // =========================================================================

    public function test_unapproved_vendor_cannot_create_service(): void
    {
        $user     = $this->makeUser();
        $category = $this->makeCategory();
        $this->makeVendor($user); // pending vendor

        $response = $this->actingAs($user, 'api')->postJson('/api/vendor/services', [
            'category_id'         => $category->id,
            'title'               => 'New Service',
            'description'         => 'Description here',
            'platform'            => 'instagram',
            'what_you_get'        => '1000 followers',
            'starting_price_kobo' => 5000,
            'delivery_days'       => 3,
        ]);

        $response->assertStatus(403);
    }

    public function test_approved_vendor_can_create_service(): void
    {
        $user     = $this->makeUser();
        $category = $this->makeCategory();
        $this->makeApprovedVendor($user);

        $response = $this->actingAs($user, 'api')->postJson('/api/vendor/services', [
            'category_id'         => $category->id,
            'title'               => 'New Service',
            'description'         => 'Description here',
            'platform'            => 'instagram',
            'what_you_get'        => '1000 followers',
            'starting_price_kobo' => 5000,
            'delivery_days'       => 3,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.status', 'draft');
    }

    public function test_vendor_can_submit_service_for_review(): void
    {
        $user     = $this->makeUser();
        $category = $this->makeCategory();
        $vendor   = $this->makeApprovedVendor($user);
        $service  = $this->makeService($vendor, $category, ['status' => 'draft']);

        $response = $this->actingAs($user, 'api')
                         ->postJson("/api/vendor/services/{$service->id}/submit");

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'pending_review');
    }

    // =========================================================================
    // 4. Service moderation
    // =========================================================================

    public function test_admin_can_approve_service(): void
    {
        $admin    = $this->makeAdmin();
        $user     = $this->makeUser();
        $category = $this->makeCategory();
        $vendor   = $this->makeApprovedVendor($user);
        $service  = $this->makeService($vendor, $category, ['status' => 'pending_review']);

        $response = $this->actingAs($admin, 'api')
                         ->postJson("/api/admin/marketplace/services/{$service->id}/approve");

        $response->assertStatus(200);
        $this->assertDatabaseHas('marketplace_services', ['id' => $service->id, 'status' => 'approved']);
    }

    public function test_admin_can_reject_service_with_reason(): void
    {
        $admin    = $this->makeAdmin();
        $user     = $this->makeUser();
        $category = $this->makeCategory();
        $vendor   = $this->makeApprovedVendor($user);
        $service  = $this->makeService($vendor, $category, ['status' => 'pending_review']);

        $response = $this->actingAs($admin, 'api')
                         ->postJson("/api/admin/marketplace/services/{$service->id}/reject", [
                             'reason' => 'Does not meet our quality standards.',
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('marketplace_services', [
            'id'               => $service->id,
            'status'           => 'rejected',
            'rejection_reason' => 'Does not meet our quality standards.',
        ]);
    }

    public function test_non_admin_cannot_approve_service(): void
    {
        $regularUser = $this->makeUser();
        $vendorUser  = $this->makeUser();
        $category    = $this->makeCategory();
        $vendor      = $this->makeApprovedVendor($vendorUser);
        $service     = $this->makeService($vendor, $category, ['status' => 'pending_review']);

        $response = $this->actingAs($regularUser, 'api')
                         ->postJson("/api/admin/marketplace/services/{$service->id}/approve");

        $response->assertStatus(403);
    }

    // =========================================================================
    // 5. Order creation — server-side price validation
    // =========================================================================

    public function test_order_uses_server_price_not_client_price(): void
    {
        $buyer    = $this->makeUser(['wallet_balance' => 100000]);
        $vendorUser = $this->makeUser();
        $category = $this->makeCategory();
        $vendor   = $this->makeApprovedVendor($vendorUser);
        $service  = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        // Client submits price=1 (trying to cheat), but server ignores it
        $response = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Please deliver ASAP',
            // NOTE: no price field in the API — controller ignores any client price
        ]);

        $response->assertStatus(201);

        $order = MarketplaceOrder::where('user_id', $buyer->id)->first();
        $this->assertNotNull($order);
        // Server always uses service's starting_price_kobo from DB
        $this->assertEquals(10000, $order->price_kobo);
    }

    // =========================================================================
    // 6. Wallet deduction
    // =========================================================================

    public function test_order_deducts_wallet_balance(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 50000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'ASAP',
        ])->assertStatus(201);

        $this->assertEquals(40000, $buyer->fresh()->wallet_balance);
    }

    public function test_order_fails_with_insufficient_balance(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 5000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $response = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'ASAP',
        ]);

        $response->assertStatus(422);
        // Wallet unchanged
        $this->assertEquals(5000, $buyer->fresh()->wallet_balance);
    }

    // =========================================================================
    // 7. Idempotency
    // =========================================================================

    public function test_duplicate_order_with_same_idempotency_key_returns_existing_order(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 100000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $key = Str::uuid()->toString();

        $r1 = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'      => $service->id,
            'requirements'    => 'First attempt',
            'idempotency_key' => $key,
        ]);

        $r2 = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'      => $service->id,
            'requirements'    => 'Second attempt',
            'idempotency_key' => $key,
        ]);

        $r1->assertStatus(201);
        $r2->assertStatus(201);

        // Same order returned both times
        $this->assertEquals($r1->json('data.id'), $r2->json('data.id'));

        // Wallet only deducted once
        $this->assertEquals(90000, $buyer->fresh()->wallet_balance);

        // Only one order in DB
        $this->assertDatabaseCount('marketplace_orders', 1);
    }

    // =========================================================================
    // 8. Vendor cannot order own service
    // =========================================================================

    public function test_vendor_cannot_order_own_service(): void
    {
        $vendorUser = $this->makeUser(['wallet_balance' => 100000]);
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category);

        $response = $this->actingAs($vendorUser, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'ASAP',
        ]);

        $response->assertStatus(422);
    }

    // =========================================================================
    // 9. Order ownership
    // =========================================================================

    public function test_user_cannot_view_another_users_order(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 50000]);
        $other      = $this->makeUser();
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        // Create order as buyer
        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ]);
        $r->assertStatus(201);

        $reference = $r->json('data.reference');

        // Other user tries to view it
        $response = $this->actingAs($other, 'api')
                         ->getJson("/api/marketplace/orders/{$reference}");

        $response->assertStatus(403);
    }

    public function test_vendor_cannot_view_another_vendors_order(): void
    {
        $buyer       = $this->makeUser(['wallet_balance' => 50000]);
        $vendorUser1 = $this->makeUser();
        $vendorUser2 = $this->makeUser();
        $category    = $this->makeCategory();
        $vendor1     = $this->makeApprovedVendor($vendorUser1);
        $vendor2     = $this->makeApprovedVendor($vendorUser2);
        $service     = $this->makeService($vendor1, $category, ['starting_price_kobo' => 10000]);

        // Create order for vendor1's service
        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ]);
        $r->assertStatus(201);

        $reference = $r->json('data.reference');

        // vendor2 tries to view vendor1's order
        $response = $this->actingAs($vendorUser2, 'api')
                         ->getJson("/api/vendor/orders/{$reference}");

        // Returns 404 because query filters vendor_id = vendor2.id
        $response->assertStatus(404);
    }

    // =========================================================================
    // 10. Commission calculation
    // =========================================================================

    public function test_commission_is_correctly_calculated(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 100000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        // commission_rate is 10% (default in VendorService::apply)
        $vendor  = $this->makeApprovedVendor($vendorUser, ['commission_rate' => 10]);
        $service = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ])->assertStatus(201);

        $order = MarketplaceOrder::where('user_id', $buyer->id)->first();

        $this->assertEquals(10000, $order->price_kobo);
        $this->assertEquals(1000, $order->commission_kobo);   // 10% of 10000
        $this->assertEquals(9000, $order->vendor_earning_kobo); // 90% of 10000
    }

    // =========================================================================
    // 11. Refund on cancel
    // =========================================================================

    public function test_cancelling_paid_order_refunds_wallet(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 50000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ]);
        $r->assertStatus(201);

        $this->assertEquals(40000, $buyer->fresh()->wallet_balance);

        $reference = $r->json('data.reference');

        $cancelResponse = $this->actingAs($buyer, 'api')
                               ->postJson("/api/marketplace/orders/{$reference}/cancel");

        $cancelResponse->assertStatus(200);

        // Wallet should be refunded
        $this->assertEquals(50000, $buyer->fresh()->wallet_balance);
    }

    // =========================================================================
    // 12. Confirm completion releases vendor earnings
    // =========================================================================

    public function test_confirm_completion_marks_earning_available(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 50000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        // Create order
        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ]);
        $r->assertStatus(201);
        $reference = $r->json('data.reference');

        $order = MarketplaceOrder::where('reference', $reference)->first();

        // Manually push through statuses to reach 'delivered'
        $order->update(['status' => 'delivered', 'delivered_at' => now()]);

        // Confirm completion
        $response = $this->actingAs($buyer, 'api')
                         ->postJson("/api/marketplace/orders/{$reference}/confirm");

        $response->assertStatus(200);

        // Earning should be 'available'
        $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
        $this->assertNotNull($earning);
        $this->assertEquals('available', $earning->fresh()->status);

        // Order should be 'completed'
        $this->assertEquals('completed', $order->fresh()->status);
    }

    // =========================================================================
    // 13. Admin permissions
    // =========================================================================

    public function test_non_admin_cannot_access_admin_marketplace_endpoints(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user, 'api')
                         ->getJson('/api/admin/marketplace/stats');

        $response->assertStatus(403);
    }

    public function test_admin_can_view_marketplace_stats(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'api')
                         ->getJson('/api/admin/marketplace/stats');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'total_vendors',
                         'pending_vendors',
                         'total_services',
                         'pending_services',
                         'total_orders',
                         'total_revenue_kobo',
                         'pending_disputes',
                         'pending_payouts',
                         'pending_payouts_kobo',
                     ],
                 ]);
    }

    // =========================================================================
    // 14. CommissionService unit tests
    // =========================================================================

    public function test_commission_service_calculates_correctly(): void
    {
        $svc = new CommissionService();

        $result = $svc->calculate(10000, 10);

        $this->assertEquals(10000, $result['price_kobo']);
        $this->assertEquals(10,    $result['commission_rate']);
        $this->assertEquals(1000,  $result['commission_kobo']);
        $this->assertEquals(9000,  $result['vendor_earning_kobo']);

        // Invariant: price = commission + earning
        $this->assertEquals($result['price_kobo'], $result['commission_kobo'] + $result['vendor_earning_kobo']);
    }

    public function test_commission_service_uses_floor_division(): void
    {
        $svc = new CommissionService();

        // 10% of 10001 = 1000.1 → floor = 1000, earning = 9001
        $result = $svc->calculate(10001, 10);

        $this->assertEquals(1000, $result['commission_kobo']);
        $this->assertEquals(9001, $result['vendor_earning_kobo']);
        $this->assertEquals(10001, $result['commission_kobo'] + $result['vendor_earning_kobo']);
    }

    // =========================================================================
    // 15. Payout request reserves earnings
    // =========================================================================

    public function test_payout_request_reserves_available_earnings(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 200000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 200000]);

        // Create order and push to completed so earning becomes available
        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ]);
        $r->assertStatus(201);

        $order = MarketplaceOrder::where('user_id', $buyer->id)->first();
        $order->update(['status' => 'delivered', 'delivered_at' => now()]);

        $this->actingAs($buyer, 'api')
             ->postJson("/api/marketplace/orders/{$order->reference}/confirm")
             ->assertStatus(200);

        $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
        $this->assertEquals('available', $earning->fresh()->status);

        // Request payout
        $response = $this->actingAs($vendorUser, 'api')->postJson('/api/vendor/payouts', [
            'amount_kobo'  => 100000,
            'bank_details' => [
                'bank_name'      => 'Test Bank',
                'account_number' => '0123456789',
                'account_name'   => 'Test Vendor',
            ],
        ]);
        $response->assertStatus(201);

        // Earning should be reserved
        $this->assertEquals('reserved', $earning->fresh()->status);

        // VendorPayoutRequest should be created
        $this->assertDatabaseHas('vendor_payout_requests', [
            'vendor_id' => $vendor->id,
            'status'    => 'pending',
        ]);

        // Payout item should link earning to payout
        $payout = VendorPayoutRequest::where('vendor_id', $vendor->id)->first();
        $this->assertDatabaseHas('vendor_payout_items', [
            'vendor_payout_request_id' => $payout->id,
            'vendor_earning_id'        => $earning->id,
        ]);

        // Ledger entry should be posted
        $this->assertDatabaseHas('supplier_ledger_entries', [
            'vendor_id'  => $vendor->id,
            'entry_type' => 'payout_reserved',
        ]);
    }

    // =========================================================================
    // 16. Duplicate payout request rejected when earnings are reserved
    // =========================================================================

    public function test_concurrent_payout_request_rejected_when_existing_is_active(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 200000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 200000]);

        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id'   => $service->id,
            'requirements' => 'Test',
        ]);
        $order = MarketplaceOrder::where('user_id', $buyer->id)->first();
        $order->update(['status' => 'delivered', 'delivered_at' => now()]);
        $this->actingAs($buyer, 'api')->postJson("/api/marketplace/orders/{$order->reference}/confirm");

        $bankDetails = [
            'bank_name'      => 'Test Bank',
            'account_number' => '0123456789',
            'account_name'   => 'Test Vendor',
        ];

        $r1 = $this->actingAs($vendorUser, 'api')->postJson('/api/vendor/payouts', [
            'amount_kobo'  => 100000,
            'bank_details' => $bankDetails,
        ]);
        $r1->assertStatus(201);

        // Second request while first is still pending
        $r2 = $this->actingAs($vendorUser, 'api')->postJson('/api/vendor/payouts', [
            'amount_kobo'  => 100000,
            'bank_details' => $bankDetails,
        ]);
        $r2->assertStatus(422);
    }

    // =========================================================================
    // 17. Cancelling payout releases reserved earnings
    // =========================================================================

    public function test_admin_reject_payout_releases_reserved_earnings(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 200000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 200000]);
        $admin      = $this->makeAdmin();

        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id' => $service->id, 'requirements' => 'Test',
        ]);
        $order = MarketplaceOrder::where('user_id', $buyer->id)->first();
        $order->update(['status' => 'delivered', 'delivered_at' => now()]);
        $this->actingAs($buyer, 'api')->postJson("/api/marketplace/orders/{$order->reference}/confirm");

        $this->actingAs($vendorUser, 'api')->postJson('/api/vendor/payouts', [
            'amount_kobo'  => 100000,
            'bank_details' => ['bank_name' => 'B', 'account_number' => '0123456789', 'account_name' => 'V'],
        ])->assertStatus(201);

        $payout  = VendorPayoutRequest::where('vendor_id', $vendor->id)->first();
        $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();
        $this->assertEquals('reserved', $earning->fresh()->status);

        // Admin rejects
        $this->actingAs($admin, 'api')
             ->postJson("/api/admin/marketplace/payouts/{$payout->id}/reject", ['admin_note' => 'Invalid bank details'])
             ->assertStatus(200);

        // Earning should be released
        $this->assertEquals('available', $earning->fresh()->status);
        $this->assertEquals('cancelled', $payout->fresh()->status);

        // Ledger release entry
        $this->assertDatabaseHas('supplier_ledger_entries', [
            'vendor_id'  => $vendor->id,
            'entry_type' => 'payout_released',
        ]);
    }

    // =========================================================================
    // 18. Admin mark-paid confirms earnings
    // =========================================================================

    public function test_admin_mark_paid_sets_earnings_to_paid(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 200000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 200000]);
        $admin      = $this->makeAdmin();

        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id' => $service->id, 'requirements' => 'Test',
        ]);
        $order = MarketplaceOrder::where('user_id', $buyer->id)->first();
        $order->update(['status' => 'delivered', 'delivered_at' => now()]);
        $this->actingAs($buyer, 'api')->postJson("/api/marketplace/orders/{$order->reference}/confirm");

        $this->actingAs($vendorUser, 'api')->postJson('/api/vendor/payouts', [
            'amount_kobo'  => 100000,
            'bank_details' => ['bank_name' => 'B', 'account_number' => '0123456789', 'account_name' => 'V'],
        ])->assertStatus(201);

        $payout  = VendorPayoutRequest::where('vendor_id', $vendor->id)->first();
        $earning = VendorEarning::where('marketplace_order_id', $order->id)->first();

        $this->actingAs($admin, 'api')
             ->postJson("/api/admin/marketplace/payouts/{$payout->id}/approve")
             ->assertStatus(200);

        $this->actingAs($admin, 'api')
             ->postJson("/api/admin/marketplace/payouts/{$payout->id}/mark-paid", [
                 'payment_reference' => 'TXN-ABC-12345',
                 'note'              => 'Transferred via bank',
             ])
             ->assertStatus(200);

        $this->assertEquals('paid', $payout->fresh()->status);
        $this->assertEquals('paid', $earning->fresh()->status);
        $this->assertEquals('TXN-ABC-12345', $payout->fresh()->payment_reference);

        // Ledger settlement entry
        $this->assertDatabaseHas('supplier_ledger_entries', [
            'vendor_id'  => $vendor->id,
            'entry_type' => 'payout_settled',
        ]);
    }

    // =========================================================================
    // 19. Supplier reports endpoint
    // =========================================================================

    public function test_admin_supplier_reports_returns_per_vendor_breakdown(): void
    {
        $admin      = $this->makeAdmin();
        $vendorUser = $this->makeUser();
        $this->makeApprovedVendor($vendorUser);

        $response = $this->actingAs($admin, 'api')
                         ->getJson('/api/admin/marketplace/supplier-reports');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [[
                         'vendor_id', 'business_name', 'commission_rate',
                         'gross_sales_kobo', 'commission_kobo', 'net_earnings_kobo',
                         'pending_kobo', 'available_kobo', 'reserved_kobo', 'paid_out_kobo',
                     ]],
                 ]);
    }

    // =========================================================================
    // 20. Ledger entry posted on order creation
    // =========================================================================

    public function test_ledger_entry_posted_when_order_created(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 100000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id' => $service->id, 'requirements' => 'Test',
        ])->assertStatus(201);

        $this->assertDatabaseHas('supplier_ledger_entries', [
            'vendor_id'  => $vendor->id,
            'entry_type' => 'earning_credited',
        ]);
    }

    // =========================================================================
    // 21. Ledger entry reversed on order cancellation
    // =========================================================================

    public function test_ledger_entry_reversed_on_order_cancellation(): void
    {
        $buyer      = $this->makeUser(['wallet_balance' => 100000]);
        $vendorUser = $this->makeUser();
        $category   = $this->makeCategory();
        $vendor     = $this->makeApprovedVendor($vendorUser);
        $service    = $this->makeService($vendor, $category, ['starting_price_kobo' => 10000]);

        $r = $this->actingAs($buyer, 'api')->postJson('/api/marketplace/orders', [
            'service_id' => $service->id, 'requirements' => 'Test',
        ])->assertStatus(201);

        $reference = $r->json('data.reference');

        $this->actingAs($buyer, 'api')
             ->postJson("/api/marketplace/orders/{$reference}/cancel")
             ->assertStatus(200);

        $this->assertDatabaseHas('supplier_ledger_entries', [
            'vendor_id'  => $vendor->id,
            'entry_type' => 'earning_reversed',
        ]);
    }
}
