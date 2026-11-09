<?php

namespace App\Services;

use App\Models\User;
use App\Models\Vendor;

class VendorService
{
    /**
     * Apply to become a vendor.
     */
    public function apply(User $user, string $businessName, ?string $bio): Vendor
    {
        if ($user->vendor()->exists()) {
            throw new \InvalidArgumentException('You already have a vendor profile.');
        }

        return Vendor::create([
            'user_id'         => $user->id,
            'business_name'   => $businessName,
            'bio'             => $bio,
            'status'          => 'approved',
            'approved_at'     => now(),
            'commission_rate' => 8,
        ]);
    }

    /**
     * Admin approves a vendor.
     */
    public function approveVendor(Vendor $vendor, User $admin): void
    {
        $vendor->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);
    }

    /**
     * Admin suspends a vendor and their active services.
     */
    public function suspendVendor(Vendor $vendor, User $admin, string $reason): void
    {
        $vendor->update([
            'status'           => 'suspended',
            'rejection_reason' => $reason,
        ]);

        // Suspend all approved services
        $vendor->services()->where('status', 'approved')->update(['status' => 'suspended']);
    }

    /**
     * Admin rejects a vendor application.
     */
    public function rejectVendor(Vendor $vendor, User $admin, string $reason): void
    {
        $vendor->update([
            'status'           => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }
}
